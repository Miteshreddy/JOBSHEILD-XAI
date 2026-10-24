"""Evidence fusion: turns every independent signal into one reasoned verdict.

Method — an auditable log-odds ledger (the same idea as a naive-Bayes
evidence sum): each piece of evidence adds or subtracts "fraud log-odds" with
a stated weight and a plain-language reason. Starting point is the text
classifier's score (re-centred on its tuned threshold). Then three hard rules
encode things a careful human investigator would never trade off:

  1. Proven-fraud evidence (fee requests, money-movement schemes, look-alike
     domains, a free-mail "recruiter" for a big brand, ID harvesting) sets a
     fraud floor — no amount of polished wording can make it "safe".
  2. An accountable, employer-verified channel with zero red flags
     (the employer's own site, or the employer's own page on an established
     job board) caps fraud probability so legitimacy is >= 95%.
  3. When the evidence is thin (pasted text, unknown employer, no
     verification possible) the verdict can't be "high confidence".

Weights were set from the relative reliability of each signal and checked on
the held-out scenario suite in ai_service/tests/test_fusion.py.
"""
from __future__ import annotations

import math

# Fraud log-odds per piece of evidence (positive = toward scam).
WEIGHTS = {
    "registration_fee_requested": 3.0,
    "money_movement_request": 2.8,
    "impersonation": 3.5,
    "free_email_for_brand": 2.2,
    "sensitive_info_request": 1.6,
    "task_based_scam": 2.4,
    "chat_app_interview": 1.6,
    "messaging_channel": 0.8,
    "anonymous_source": 1.5,
    "new_domain": 1.6,
    "young_domain": 0.6,
    "free_email": 0.6,
    "unrealistic_salary": 1.2,
    "urgent_or_spam_wording": 0.4,
    "unknown_employer": 0.3,
    # toward legitimate
    "official_source": -4.0,
    "platform_company_match": -2.6,
    "trusted_platform": -0.8,
    "email_matches_company": -1.3,
    "links_match_company": -0.9,
    "verified_employer": -0.4,
}
CLASSIFIER_SCALE = 0.85
CLASSIFIER_CLIP = 3.5
LLM_SCALE = 2.4

HARD_FRAUD = ("registration_fee_requested", "money_movement_request", "impersonation", "free_email_for_brand", "task_based_scam")
FRAUD_FLOOR = 0.88
TRUSTED_CAP = 0.04  # => legitimacy >= 96

LABELS = {
    "registration_fee_requested": ("Asks for a fee or deposit", "Legitimate employers never charge candidates to apply, train or start."),
    "money_movement_request": ("Money-handling scheme", "Asks you to deposit a check, buy equipment from their vendor, move funds, reship parcels or use crypto."),
    "impersonation": ("Look-alike domain", "An email or link imitates the employer's real domain."),
    "free_email_for_brand": ("Free-mail recruiter for a big brand", "A major employer would contact you from its own corporate domain."),
    "sensitive_info_request": ("Asks for sensitive data", "Requests ID, bank, SSN or similar details before a real hiring process."),
    "task_based_scam": ("Pay-per-task scheme", "Paid 'tasks' like rating products are a common bait for deposit scams."),
    "chat_app_interview": ("Interview over a chat app", "Interviews or onboarding conducted over Telegram/WhatsApp are a common scam pattern."),
    "messaging_channel": ("Off-platform chat contact", "Pushes the conversation to WhatsApp, Telegram or similar."),
    "anonymous_source": ("Anonymous hosting", "Published where anyone can post without an employer identity."),
    "new_domain": ("Newly registered domain", "A domain involved is only a few months old."),
    "young_domain": ("Young domain", "A domain involved is less than a year old."),
    "free_email": ("Personal email address", "Uses a free mailbox instead of a company domain."),
    "unrealistic_salary": ("Unrealistic pay", "Pay is implausibly high for the effort or experience required."),
    "urgent_or_spam_wording": ("Pressure tactics", "Urgent or spam-like wording pushes you to act before verifying."),
    "unknown_employer": ("Employer can't be verified", "No official website or public record was found for the named employer."),
    "official_source": ("Employer's official website", "The posting is hosted on the employer's own domain."),
    "platform_company_match": ("Employer's own job-board page", "Published under the employer's own account on an established job board."),
    "trusted_platform": ("Established job platform", "Listed on a job board or hiring system that requires employer accounts."),
    "email_matches_company": ("Corporate email matches", "Contact email belongs to the employer's domain."),
    "links_match_company": ("Links point to the employer", "Links go to the employer's site or a recognised hiring platform."),
    "verified_employer": ("Employer has a public record", "The employer and its official website were identified."),
}


def _logit(p: float) -> float:
    p = min(max(p, 1e-4), 1 - 1e-4)
    return math.log(p / (1 - p))


def _sigmoid(z: float) -> float:
    return 1 / (1 + math.exp(-z))


def collect_evidence(signals: dict[str, bool], verification: dict) -> dict[str, bool]:
    ev = verification["evidence"]
    company = verification["company"]
    out = {
        "registration_fee_requested": signals.get("registration_fee_requested", False),
        "money_movement_request": signals.get("money_movement_request", False),
        "sensitive_info_request": signals.get("sensitive_info_request", False),
        "task_based_scam": signals.get("task_based_scam", False),
        "chat_app_interview": signals.get("chat_app_interview", False),
        "unrealistic_salary": signals.get("unrealistic_salary", False),
        "urgent_or_spam_wording": signals.get("urgent_or_spam_wording", False),
        "impersonation": ev["impersonation"],
        "free_email_for_brand": ev["free_email_for_brand"] and company.get("wellKnown", False),
        "messaging_channel": (ev["messaging_channel"] or signals.get("whatsapp_only_contact", False)) and not signals.get("chat_app_interview", False),
        "anonymous_source": ev["anonymous_source"],
        "new_domain": ev["new_domain"],
        "young_domain": ev["young_domain"] and not ev["new_domain"],
        "official_source": ev["official_source"],
        "platform_company_match": ev["platform_company_match"] and not ev["official_source"],
        "trusted_platform": ev["trusted_platform"] and not ev["platform_company_match"],
        "email_matches_company": ev["email_matches_company"],
        "links_match_company": ev["links_match_company"],
        "verified_employer": company.get("verified", False),
        "unknown_employer": bool(company.get("name")) and not ev["company_resolved"],
    }
    # A free mailbox from a big brand is already counted (more heavily).
    out["free_email"] = ev["free_email"] and not out["free_email_for_brand"]
    return out


def fuse(
    classifier: dict | None,
    signals: dict[str, bool],
    verification: dict,
    llm: dict | None,
    input_type: str,
) -> dict:
    evidence = collect_evidence(signals, verification)
    factors: list[dict] = []

    z = 0.0
    if classifier is not None:
        centred = _logit(classifier["fraud_probability"]) - _logit(classifier["threshold"])
        contribution = max(-CLASSIFIER_CLIP, min(CLASSIFIER_CLIP, centred * CLASSIFIER_SCALE))
        z += contribution
        pct = round(classifier["fraud_probability"] * 100)
        factors.append({
            "label": "Language analysis",
            "impact": round(contribution, 2),
            "detail": f"Wording {'resembles known scams' if contribution > 0 else 'resembles genuine postings'} ({pct}% scam-like).",
        })

    for key, present in evidence.items():
        if present:
            weight = WEIGHTS[key]
            z += weight
            label, detail = LABELS[key]
            factors.append({"label": label, "impact": weight, "detail": detail})

    if llm is not None:
        direction = {"fraudulent": 1.0, "suspicious": 0.35, "legitimate": -1.0}[llm["verdict"]]
        contribution = direction * LLM_SCALE * llm["confidence"] / 100
        z += contribution
        factors.append({
            "label": "Reasoning engine",
            "impact": round(contribution, 2),
            "detail": f"Independent review judged it {llm['verdict']} with {llm['confidence']}% confidence.",
        })

    p = _sigmoid(z)
    hard_fraud = [k for k in HARD_FRAUD if evidence.get(k)]
    red_flag_present = bool(hard_fraud) or any(
        evidence[k] for k in ("sensitive_info_request", "chat_app_interview", "messaging_channel", "anonymous_source", "new_domain", "free_email")
    )
    trusted_channel = evidence["official_source"] or evidence["platform_company_match"] or (
        evidence["trusted_platform"] and verification["company"].get("wellKnown") and evidence["verified_employer"]
    ) or (
        # Pasted text whose contacts AND links resolve to a verified, well-known employer.
        input_type != "url" and evidence["verified_employer"] and verification["company"].get("wellKnown")
        and (evidence["email_matches_company"] or evidence["links_match_company"])
        and (evidence["email_matches_company"] or not verification["contacts"]["emailDomains"])
    )

    rule = None
    if hard_fraud:
        p = max(p, FRAUD_FLOOR)
        rule = "fraud_floor"
    elif trusted_channel and not red_flag_present:
        p = min(p, TRUSTED_CAP)
        rule = "trusted_channel"

    verdict = "fraudulent" if p >= 0.6 else "suspicious" if p >= 0.3 else "legitimate"
    risk = "Critical" if p >= 0.85 else "High" if p >= 0.6 else "Medium" if p >= 0.3 else "Low"

    # Confidence: strength of the evidence, reduced when sources disagree or
    # when there was little to verify.
    margin = abs(z)
    strong_support = rule is not None or len([f for f in factors if abs(f["impact"]) >= 1.5]) >= 2
    if llm is not None and classifier is not None:
        llm_fraud = llm["verdict"] == "fraudulent"
        clf_fraud = classifier["fraud_probability"] >= classifier["threshold"]
        disagree = llm["verdict"] != "suspicious" and llm_fraud != clf_fraud
    else:
        disagree = False
    if (margin >= 3 or rule) and strong_support and not disagree:
        confidence = "high"
    elif margin >= 1.2 and not (disagree and rule is None):
        confidence = "medium"
    else:
        confidence = "low"
    if verdict == "suspicious" and confidence == "high":
        confidence = "medium"

    factors.sort(key=lambda f: abs(f["impact"]), reverse=True)
    return {
        "fraud_probability": round(p, 4),
        # 0 and 100 would claim certainty no evidence can give.
        "legitimacy_score": max(1, min(99, int(round(100 * (1 - p))))),
        "verdict": verdict,
        "risk_category": risk,
        "confidence": confidence,
        "factors": factors[:8],
        "evidence": evidence,
        "rule_applied": rule,
        "log_odds": round(z, 3),
    }
