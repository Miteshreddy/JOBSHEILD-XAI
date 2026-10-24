"""End-to-end analysis pipeline every input channel routes through.

    fields ──► text classifier (ONNX DistilBERT + lexical ensemble)
           ──► rule-based scam-pattern detectors
           ──► source & employer verification (web lookups)
           ──► local LLM reasoning over all of the above (if Ollama is running)
           ──► evidence fusion  ──► verdict, score, reasoning, explanations

Each stage degrades gracefully: no trained classifier, no Ollama, or no
internet still yields a verdict from whatever evidence remains, and the
report says which signals were unavailable.
"""
from __future__ import annotations

import logging

from ai_service.bert_model.predict import ModelNotTrainedError, predict_fraud_probability
from ai_service.fusion.fuse import HARD_FRAUD, LABELS, WEIGHTS, fuse
from ai_service.preprocessing.text_cleaning import FIELD_ORDER, build_combined_text
from ai_service.reasoning import llm
from ai_service.signals.detectors import detect_all_signals
from ai_service.verification.verify import verify_posting
from ai_service.xai.lime_explainer import generate_local_explanation
from ai_service.xai.shap_explainer import explain_prediction

logger = logging.getLogger("ai_service.pipeline")

MAX_STORED_TEXT = 20000


class EmptyContentError(ValueError):
    """Raised when a fields dict has no usable text after cleaning."""


def _raw_text(fields: dict) -> str:
    """Original text (with URLs and emails intact) for verification and the LLM —
    the classifier's cleaned text deliberately strips those."""
    return "\n".join(str(fields[k]) for k in FIELD_ORDER if isinstance(fields.get(k), str) and fields[k].strip())


def _role(fields: dict) -> str | None:
    title = fields.get("title")
    if isinstance(title, str) and 2 < len(title) <= 80:
        return title.strip()
    return None


def _scam_pattern_check(signals: dict) -> dict:
    found = [LABELS[k][0].lower() for k in ("registration_fee_requested", "money_movement_request", "task_based_scam", "sensitive_info_request", "chat_app_interview") if signals.get(k)]
    if found:
        return {"id": "patterns", "label": "Scam patterns", "status": "fail", "detail": "Found: " + "; ".join(found) + "."}
    return {"id": "patterns", "label": "Scam patterns", "status": "pass", "detail": "No fees, check deposits, crypto pay, task schemes or chat-app interviews."}


def _summary(verdict: str, fused: dict, verification: dict, role: str | None) -> str:
    company = verification["company"]["name"]
    what = f"{role} role" if role else "job"
    at = f" at {company}" if company else ""
    reds = [f["label"].lower() for f in fused["factors"] if f["impact"] > 0 and f["label"] not in ("Language analysis", "Reasoning engine")]
    greens = [f["label"].lower() for f in fused["factors"] if f["impact"] < 0 and f["label"] not in ("Language analysis", "Reasoning engine")]
    if verdict == "fraudulent":
        reason = ", ".join(reds[:2]) if reds else "it closely matches known scam postings"
        return f"This {what}{at} shows strong signs of a scam: {reason}."
    if verdict == "suspicious":
        return f"Parts of this {what}{at} can’t be verified — confirm it directly with the employer before sharing personal details."
    reason = greens[0] if greens else "no red flags were found"
    return f"This {what}{at} appears legitimate — {reason}, with no signs of a scam."


def _explain_language(cleaned_text: str) -> dict | None:
    """SHAP word attributions for the classifier score; LIME if SHAP fails."""
    try:
        return explain_prediction(cleaned_text)
    except Exception as exc:  # explanations are valuable but never fatal
        logger.warning(f"SHAP explanation failed, falling back to LIME: {exc}")
    try:
        lime = generate_local_explanation(cleaned_text)
        words = [{"term": str(f["feature"]), "weight": round(float(f["weight"]), 4)} for f in lime["features"]]
        return {"method": "lime", "baseValue": None, "outputValue": None, "words": words}
    except Exception as exc:
        logger.warning(f"LIME explanation failed: {exc}")
        return None


def _word_list(words: list[dict], positive: bool, n: int = 4) -> str:
    picked = [f"“{w['term']}”" for w in words if (w["weight"] > 0) == positive][:n]
    return ", ".join(picked)


def _deterministic_reasoning(fused: dict, verification: dict, signals: dict, classifier: dict | None, explanation: dict | None = None) -> list[str]:
    steps = []
    src = verification["source"]
    company = verification["company"]
    if src["inputType"] == "url" and src["domain"]:
        where = {"official": "the employer’s official website", "job_board": src["platform"] or "a job board", "ats": f"{src['platform']}, an employer hiring portal", "anonymous": "an anonymous hosting service", "messaging": "a messaging app link"}.get(src["platformType"], src["domain"])
        steps.append(f"The posting was published on {where}.")
    if company["name"]:
        steps.append(
            f"{company['name']} was identified as the employer; official website: {company['website']}."
            if company["website"]
            else f"The posting names {company['name']}, but no official website or public record could be found."
        )
    else:
        steps.append("The posting does not clearly identify who is hiring.")
    reds = [k for k, v in fused["evidence"].items() if v and WEIGHTS.get(k, 0) > 0 and k != "unknown_employer"]
    if reds:
        steps.append("Red flags: " + "; ".join(LABELS[k][1].rstrip(".").lower() for k in reds[:3]) + ".")
    else:
        steps.append("No requests for money, sensitive data or off-platform chat were found.")
    if classifier is not None:
        pct = round(classifier["fraud_probability"] * 100)
        step = f"The wording scored {pct}% similar to known scam postings"
        if explanation and explanation["words"]:
            up, down = _word_list(explanation["words"], True), _word_list(explanation["words"], False)
            if up:
                step += f"; words such as {up} pushed it toward scam"
            if down:
                step += f"{' while' if up else '; words such as'} {down} pushed it toward legitimate"
        steps.append(step + ".")
    return steps


def _final_step(fused: dict) -> str:
    if fused["rule_applied"] == "fraud_floor":
        reasons = [LABELS[k][0].lower() for k in HARD_FRAUD if fused["evidence"].get(k)]
        return f"Because of decisive scam evidence ({', '.join(reasons)}), it is rated a likely scam however professional it looks."
    if fused["rule_applied"] == "trusted_channel":
        return "Because it comes through a channel the employer controls and shows no red flags, it is rated legitimate."
    return {
        "fraudulent": "Taken together, the evidence points to a scam.",
        "suspicious": "The evidence is mixed, so it needs independent verification.",
        "legitimate": "Taken together, the evidence points to a genuine posting.",
    }[fused["verdict"]]


def _advice(verdict: str, verification: dict) -> list[str]:
    site = verification["company"]["website"]
    if verdict == "fraudulent":
        return [
            "Don’t pay anything, deposit checks, or share ID, bank or login details.",
            "Stop replying through the contact details in this posting.",
            f"If you’re interested in this employer, apply only via {site}." if site else "Search for the employer independently before engaging further.",
            "Report the posting to the platform where you found it.",
        ]
    if verdict == "suspicious":
        return [
            f"Find the same role on {site} or the employer’s official careers page." if site else "Look for the same role on the employer’s official careers page.",
            "Confirm the recruiter’s identity through the company’s official contact channels.",
            "Don’t pay fees or share ID or bank details until the offer is confirmed.",
        ]
    return [
        f"Apply through {site} or the original listing." if site else "Apply through the original listing.",
        "Expect interview invitations from the employer’s own email domain.",
        "Stay alert: never pay for equipment, training or onboarding.",
    ]


def _dedupe(items: list[str], limit: int) -> list[str]:
    seen, out = set(), []
    for item in items:
        key = item.lower().strip(" .")
        if key and key not in seen:
            seen.add(key)
            out.append(item.strip())
    return out[:limit]


def run_analysis_pipeline(fields: dict, input_type: str = "text", use_llm: bool = True) -> dict:
    cleaned_text = build_combined_text(fields)
    if not cleaned_text or len(cleaned_text.split()) < 3:
        raise EmptyContentError("No usable text content found in the submitted advertisement.")
    raw_text = _raw_text(fields)

    try:
        classifier = predict_fraud_probability(cleaned_text)
    except ModelNotTrainedError as exc:
        logger.warning(f"Classifier unavailable: {exc}")
        classifier = None

    signals = detect_all_signals(fields)
    verification = verify_posting(fields, raw_text, input_type)

    explanation = _explain_language(cleaned_text) if classifier is not None else None

    llm_on = use_llm and llm.is_available()
    if llm_on and not verification["company"]["name"]:
        hint = llm.extract_company_name(raw_text)
        if hint:
            verification = verify_posting(fields, raw_text, input_type, extra_company_hint=hint)

    llm_result = None
    if llm_on:
        checks_text = [f"{c['label']}: {c['status'].upper()} — {c['detail']}" for c in verification["checks"]]
        facts = {
            "Where it was found": verification["source"]["platform"] or verification["source"]["domain"] or f"submitted as {input_type}",
            "Employer": verification["company"]["name"],
            "Employer's official website": verification["company"]["website"],
            "Verification checks": checks_text,
            "Rule-based red flags": [LABELS[k][0] for k, v in signals.items() if v and k in LABELS],
            "Language model scam-likeness": f"{round(classifier['fraud_probability'] * 100)}%" if classifier else "unavailable",
            "Words that raised scam-likeness (SHAP)": _word_list(explanation["words"], True, 6) if explanation else None,
            "Words that lowered scam-likeness (SHAP)": _word_list(explanation["words"], False, 6) if explanation else None,
        }
        llm_result = llm.reason_about_posting(raw_text, input_type, facts)

    fused = fuse(classifier, signals, verification, llm_result, input_type)
    verdict = fused["verdict"]
    llm_agrees = llm_result is not None and llm_result["verdict"] == verdict

    # Reasoning: the LLM's steps when it agrees with the final verdict,
    # otherwise the deterministic evidence trail — then the deciding step.
    if llm_agrees and len(llm_result["reasoning"]) >= 2:
        reasoning = list(llm_result["reasoning"])
    else:
        reasoning = _deterministic_reasoning(fused, verification, signals, classifier, explanation)
    reasoning.append(_final_step(fused))

    summary = llm_result["summary"] if llm_agrees and llm_result["summary"] else _summary(verdict, fused, verification, _role(fields))

    red = [LABELS[k][0] for k, v in fused["evidence"].items() if v and WEIGHTS.get(k, 0) > 0]
    green = [LABELS[k][0] for k, v in fused["evidence"].items() if v and WEIGHTS.get(k, 0) < 0]
    if llm_result:
        red += llm_result["red_flags"] if verdict != "legitimate" else []
        green += llm_result["green_flags"] if verdict != "fraudulent" else []

    advice = _advice(verdict, verification)
    if llm_agrees and llm_result["advice"]:
        advice = _dedupe(advice[:2] + llm_result["advice"], 4)

    highlights = explanation["words"] if explanation else []
    if explanation and explanation["words"]:
        for factor in fused["factors"]:
            if factor["label"] == "Language analysis":
                up = _word_list(explanation["words"], factor["impact"] > 0, 3)
                if up:
                    factor["detail"] += f" Most influential words: {up}."

    checks = verification["checks"] + [_scam_pattern_check(signals)]
    return {
        "extractedText": raw_text[:MAX_STORED_TEXT],
        "verdict": verdict,
        "legitimacyScore": fused["legitimacy_score"],
        "fraudProbability": fused["fraud_probability"],
        "riskCategory": fused["risk_category"],
        "confidence": fused["confidence"],
        "summary": summary,
        "reasoning": reasoning,
        "redFlags": _dedupe(red, 8),
        "greenFlags": _dedupe(green, 8),
        "advice": advice,
        "company": verification["company"],
        "source": verification["source"],
        "checks": checks,
        "factors": fused["factors"],
        "highlights": highlights,
        "explanation": explanation,
        "signals": {
            "language": {"available": classifier is not None, "score": round(classifier["fraud_probability"], 4) if classifier else None},
            "reasoning": {
                "available": llm_result is not None,
                "verdict": llm_result["verdict"] if llm_result else None,
                "confidence": llm_result["confidence"] if llm_result else None,
            },
            "verification": {
                "checksPassed": sum(c["status"] == "pass" for c in checks),
                "checksFailed": sum(c["status"] == "fail" for c in checks),
                "checksTotal": len(checks),
            },
        },
        "engine": {"rule": fused["rule_applied"], "logOdds": fused["log_odds"], "llmModel": llm.OLLAMA_MODEL if llm_result else None},
    }
