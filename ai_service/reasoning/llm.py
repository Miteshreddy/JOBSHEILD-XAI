"""Second-opinion reasoning with a local open-source LLM served by Ollama.

The model is given the posting plus every fact the deterministic layers
established (classifier score, rule-based red flags, source & employer
verification results) and asked to reason step by step to a verdict. It is
told to rely only on those facts — it must not "remember" whether a company
is hiring — and its output is validated and clamped before the fusion step
weighs it. If Ollama is not running, analysis proceeds without it.
"""
from __future__ import annotations

import base64
import json
import logging
import os
from functools import lru_cache

import httpx

logger = logging.getLogger("ai_service.reasoning")

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.5:4b")
LLM_TIMEOUT = float(os.environ.get("LLM_TIMEOUT_SECONDS", "120"))
MAX_POSTING_CHARS = 2400

SYSTEM_PROMPT = """You are a meticulous recruitment-fraud investigator protecting job seekers.
You receive a job posting and FACTS produced by verification tools. Rules:
- Base every conclusion on the posting text and the FACTS. Never invent facts about the company, its website, or its hiring.
- A well-known employer's name alone proves nothing: scammers impersonate famous brands. What matters is whether the channel, emails and links belong to that employer.
- A posting on the employer's official site, or on an established job board under the employer's own company page, with no payment requests and no off-platform contact, is strong evidence of legitimacy.
- Requests for money (fees, deposits, equipment purchases, "training kits"), checks to deposit, crypto, moving funds, sensitive IDs/bank details before an interview, Telegram/WhatsApp-only contact, free-mail recruiters for big brands, look-alike domains and pay that is unrealistic for the effort are strong fraud evidence.
- Short or informal text is not fraud by itself.
- If a listed red flag is clearly not supported by the posting, ignore it rather than repeating it.
- Write for the job seeker in plain language. Never mention "facts", "tools", "lists", "SHAP" or "models"; just state the evidence.
Respond with JSON only."""

USER_TEMPLATE = """POSTING ({input_type}):
\"\"\"{posting}\"\"\"

FACTS:
{facts}

Return JSON with exactly these keys:
{{"verdict": "legitimate" | "suspicious" | "fraudulent",
  "confidence": integer 0-100 (how sure you are of the verdict),
  "summary": one plain-English sentence for the job seeker,
  "reasoning": 3-5 short steps, each one sentence, citing specific evidence from the posting,
  "red_flags": list of short phrases (may be empty),
  "green_flags": list of short phrases (may be empty),
  "advice": 2-4 concrete next steps for the job seeker}}"""


def _chat(messages: list[dict], num_predict: int, timeout: float, fmt: str | dict = "json") -> str:
    resp = httpx.post(
        f"{OLLAMA_URL}/api/chat",
        json={
            "model": OLLAMA_MODEL,
            "messages": messages,
            "stream": False,
            "think": False,
            "format": fmt,
            "keep_alive": "30m",
            "options": {"temperature": 0.1, "num_predict": num_predict, "num_ctx": 4096},
        },
        timeout=timeout,
    )
    resp.raise_for_status()
    return resp.json()["message"]["content"]


@lru_cache(maxsize=1)
def _model_installed() -> bool:
    try:
        tags = httpx.get(f"{OLLAMA_URL}/api/tags", timeout=2).json().get("models", [])
        return any(m.get("name") == OLLAMA_MODEL or m.get("model") == OLLAMA_MODEL for m in tags)
    except (httpx.HTTPError, ValueError):
        return False


def is_available() -> bool:
    try:
        httpx.get(f"{OLLAMA_URL}/api/version", timeout=2)
    except httpx.HTTPError:
        _model_installed.cache_clear()
        return False
    return _model_installed()


def status() -> dict:
    return {"available": is_available(), "model": OLLAMA_MODEL}


def _as_list(value, limit: int) -> list[str]:
    if isinstance(value, str):
        value = [value]
    if not isinstance(value, list):
        return []
    return [str(v).strip() for v in value if str(v).strip()][:limit]


def _validate(raw: dict) -> dict:
    verdict = str(raw.get("verdict", "")).lower().strip()
    if verdict not in ("legitimate", "suspicious", "fraudulent"):
        raise ValueError(f"invalid verdict {verdict!r}")
    try:
        confidence = int(float(raw.get("confidence", 50)))
    except (TypeError, ValueError):
        confidence = 50
    return {
        "verdict": verdict,
        "confidence": max(0, min(100, confidence)),
        "summary": str(raw.get("summary") or "").strip()[:400],
        "reasoning": _as_list(raw.get("reasoning"), 6),
        "red_flags": _as_list(raw.get("red_flags"), 8),
        "green_flags": _as_list(raw.get("green_flags"), 8),
        "advice": _as_list(raw.get("advice"), 4),
    }


def format_facts(facts: dict) -> str:
    lines = []
    for key, value in facts.items():
        if value in (None, [], {}, ""):
            continue
        if isinstance(value, list):
            value = "; ".join(str(v) for v in value)
        lines.append(f"- {key}: {value}")
    return "\n".join(lines)


def reason_about_posting(posting: str, input_type: str, facts: dict) -> dict | None:
    """Returns the validated reasoning dict, or None if the LLM is unavailable
    or produced unusable output (never raises into the pipeline)."""
    if not is_available():
        return None
    prompt = USER_TEMPLATE.format(input_type=input_type, posting=posting[:MAX_POSTING_CHARS], facts=format_facts(facts))
    messages = [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}]
    for attempt in range(2):
        try:
            return _validate(json.loads(_chat(messages, num_predict=650, timeout=LLM_TIMEOUT)))
        except (httpx.HTTPError, json.JSONDecodeError, ValueError, KeyError) as exc:
            logger.warning(f"LLM reasoning attempt {attempt + 1} failed: {exc}")
            if isinstance(exc, httpx.TimeoutException):
                break
    return None


def extract_company_name(posting: str) -> str | None:
    """Fallback employer extraction when heuristics find no name."""
    if not is_available():
        return None
    messages = [{
        "role": "user",
        "content": "Which company or organisation is hiring in this job message? Use only the text. "
                   'Return JSON {"company": "<name>" or null}.\n\n"""' + posting[:1500] + '"""',
    }]
    try:
        name = json.loads(_chat(messages, num_predict=40, timeout=45)).get("company")
    except (httpx.HTTPError, json.JSONDecodeError, ValueError, KeyError, AttributeError):
        return None
    if isinstance(name, str) and 2 <= len(name.strip()) <= 80 and name.strip().lower() not in ("null", "none", "unknown"):
        return name.strip()
    return None


def transcribe_image(image_bytes: bytes) -> str | None:
    """Vision fallback for screenshots OCR could not read (requires a
    vision-capable model such as qwen3.5)."""
    if not is_available():
        return None
    messages = [{
        "role": "user",
        "content": "Transcribe all text in this job-related screenshot exactly, preserving line breaks. Output only the text.",
        "images": [base64.b64encode(image_bytes).decode()],
    }]
    try:
        text = _chat(messages, num_predict=900, timeout=LLM_TIMEOUT, fmt="")
    except (httpx.HTTPError, KeyError):
        return None
    return text.strip() or None
