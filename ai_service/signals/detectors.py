"""Fraud-pattern signal detectors shared by the Trust, Severity, and Decision
Support engines (SRS Sections 3.4-3.7, 7.1-7.4).

Every detector is a pure function over the raw input fields (the same shape
used throughout the pipeline: title, company_profile, description,
requirements, benefits, location, salary_range, employment_type) and returns a
plain bool — this is what makes every score reproducible and auditable
(SRS Appendix A intent): given the same input, you get the same flags, and you
can point at the exact regex/threshold that fired.

Design note on two fields the SRS scoring tables don't fully specify how to
detect:
- "Unrealistic salary" (Trust -20 / Severity +20): the SRS does not define a
  real salary-benchmark data source (no market-rate API is in scope), so this
  is a deliberately conservative heuristic — extreme numeric salary claims
  combined with "no experience required" wording — not a claim of true
  market-rate comparison. Documented here so the limitation is explicit
  rather than silently implied to be more rigorous than it is.
- "Unverified website/email" (Severity +10, mapped from FR-6.6's "vague,
  missing, or untraceable... contact information"): implemented as "no company
  website mention AND no non-free email domain found" — i.e. no verifiable
  official channel exists at all.
"""
from __future__ import annotations

import re

from ai_service.signals.lexicons import (
    EMAIL_RE,
    FREE_EMAIL_DOMAINS,
    NO_EXPERIENCE_PHRASES,
    REGISTRATION_FEE_PHRASES,
    SPAM_WORDING_KEYWORDS,
    URGENCY_KEYWORDS,
    WEBSITE_MENTION_RE,
    WHATSAPP_KEYWORDS,
)

_REGISTRATION_FEE_RE = re.compile("|".join(REGISTRATION_FEE_PHRASES), re.IGNORECASE)
_WHATSAPP_RE = re.compile("|".join(WHATSAPP_KEYWORDS), re.IGNORECASE)
_URGENCY_RE = re.compile("|".join(URGENCY_KEYWORDS), re.IGNORECASE)
_SPAM_RE = re.compile("|".join(SPAM_WORDING_KEYWORDS), re.IGNORECASE)
_NO_EXPERIENCE_RE = re.compile("|".join(NO_EXPERIENCE_PHRASES), re.IGNORECASE)
_WEBSITE_RE = re.compile(WEBSITE_MENTION_RE, re.IGNORECASE)
_EMAIL_RE = re.compile(EMAIL_RE)
_HIGH_SALARY_FIGURE_RE = re.compile(r"(?:rs\.?|inr|₹|\$|usd)\s?([\d,]{4,})", re.IGNORECASE)
_CAPS_WORD_RE = re.compile(r"\b[A-Z]{3,}\b")
_REPEATED_PUNCT_RE = re.compile(r"[!?]{2,}")

# A per-month figure at or above this is implausible for an entry-level role
# with no stated experience requirement (heuristic threshold, not a market API).
_IMPLAUSIBLE_MONTHLY_FIGURE = 150_000


def _full_text(fields: dict) -> str:
    return " ".join(str(fields.get(k) or "") for k in
                     ("title", "company_profile", "description", "requirements", "benefits"))


def detect_registration_fee_requested(fields: dict) -> bool:
    return _positive_mentions(_REGISTRATION_FEE_RE, _full_text(fields))


def extract_email_domain(fields: dict) -> str | None:
    match = _EMAIL_RE.search(_full_text(fields))
    return match.group(1).lower() if match else None


def detect_personal_email_domain(fields: dict) -> bool:
    domain = extract_email_domain(fields)
    return domain in FREE_EMAIL_DOMAINS if domain else False


_UNSTRUCTURED_SUBSTANTIAL_LENGTH = 150


def detect_missing_company_profile(fields: dict) -> bool:
    """A dedicated `company_profile` field only exists for URL-scraped input
    with JSON-LD data (SRS 6.1.1's field list assumes EMSCAD-style structured
    records). The text/PDF/OCR channels put everything into `description`
    with no field separation at all — checking the `company_profile` field
    alone would flag it "missing" on *every* text/PDF/image submission
    regardless of content, unfairly penalizing detailed, legitimate
    unstructured postings (found by testing a real legitimate posting through
    the text channel and seeing an unwarranted -20 penalty).

    Distinguishes "the field key is present but empty" (a structured channel
    genuinely found no company profile — a real miss) from "the field key
    was never set at all" (the channel has no field concept — fall back to
    overall text substance as a weaker, non-systematically-biased proxy).
    """
    if "company_profile" in fields:
        return len(str(fields.get("company_profile") or "").strip()) < 20
    return len(_full_text(fields).strip()) < _UNSTRUCTURED_SUBSTANTIAL_LENGTH


def detect_missing_company_website(fields: dict) -> bool:
    return not bool(_WEBSITE_RE.search(_full_text(fields)))


def detect_unrealistic_salary(fields: dict) -> bool:
    text = _full_text(fields) + " " + str(fields.get("salary_range") or "")
    figures = [int(m.replace(",", "")) for m in _HIGH_SALARY_FIGURE_RE.findall(text)]
    mentions_monthly = bool(re.search(r"per\s*month|/\s*month|monthly", text, re.IGNORECASE))
    no_experience = bool(_NO_EXPERIENCE_RE.search(text))
    if not figures:
        return False
    implausible_figure = max(figures) >= _IMPLAUSIBLE_MONTHLY_FIGURE and mentions_monthly
    return implausible_figure and no_experience


def detect_whatsapp_only_contact(fields: dict) -> bool:
    text = _full_text(fields)
    if not _WHATSAPP_RE.search(text):
        return False
    # "only" if no verifiable email/website is present alongside the WhatsApp mention
    return extract_email_domain(fields) is None and not _WEBSITE_RE.search(text)


def detect_missing_location(fields: dict) -> bool:
    return not str(fields.get("location") or "").strip()


def _caps_ratio(text: str) -> float:
    words = text.split()
    if not words:
        return 0.0
    caps_words = _CAPS_WORD_RE.findall(text)
    return len(caps_words) / len(words)


def detect_poor_grammar_or_spam_wording(fields: dict) -> bool:
    text = _full_text(fields)
    if not text.strip():
        return False
    spam_hits = len(_SPAM_RE.findall(text))
    repeated_punct_hits = len(_REPEATED_PUNCT_RE.findall(text))
    return spam_hits >= 1 or repeated_punct_hits >= 2 or _caps_ratio(text) > 0.15


def detect_urgent_or_spam_wording(fields: dict) -> bool:
    """FR-6.5: excessive capitalization/exclamation, artificial urgency."""
    text = _full_text(fields)
    if not text.strip():
        return False
    return bool(_URGENCY_RE.search(text)) or _caps_ratio(text) > 0.15 or \
        len(_REPEATED_PUNCT_RE.findall(text)) >= 2


def detect_unverified_website_or_email(fields: dict) -> bool:
    """FR-6.6 (mapped): no verifiable official channel (website or non-free email)."""
    has_website = bool(_WEBSITE_RE.search(_full_text(fields)))
    domain = extract_email_domain(fields)
    has_official_email = domain is not None and domain not in FREE_EMAIL_DOMAINS
    return not has_website and not has_official_email


# --- Modern scam patterns (post-2020 formats EMSCAD predates) -----------------

_NEGATION_RE = re.compile(r"\b(no|never|not|without|zero|free of|don'?t|doesn'?t|won'?t)\b[^.!?\n]{0,40}$", re.IGNORECASE)
_MONEY_MOVEMENT_RE = re.compile(
    r"(deposit (?:the |a |this )?(?:check|cheque)|(?:check|cheque) (?:will be |to be )?(?:mailed|sent|issued)"
    r"|purchase (?:your |the )?(?:equipment|laptop|devices?) (?:from|through|via) (?:our|the) (?:vendor|supplier|merchant)"
    r"|buy (?:gift ?cards?|itunes|google play cards?)|(?:usdt|bitcoin|btc|crypto(?:currency)?) (?:wallet|deposit|payment|salary|payroll)"
    r"|(?:receive|transfer|move|forward|process) (?:funds|payments|money) (?:through|via|using|into|from) your (?:own |personal )?(?:bank )?account"
    r"|reship|re-ship|parcels? (?:to|at) your (?:home|residence|address)|package (?:forwarding|inspector)"
    r"|top[- ]?up (?:your|the) (?:account|wallet)|prepaid tasks?|commission (?:per|for each) task|recharge (?:your|the) account)",
    re.IGNORECASE,
)
_SENSITIVE_INFO_RE = re.compile(
    r"(social security (?:number)?|\bssn\b|bank (?:account )?(?:details|login|password|credentials)|online banking (?:login|password)"
    r"|copy of (?:your )?(?:passport|driver'?s licen[cs]e|id card)|aadhaar|pan card|otp|one[- ]time password|credit card (?:number|details))",
    re.IGNORECASE,
)
_TASK_SCAM_RE = re.compile(
    r"((?:like|rate|review|subscribe to)\s+(?:youtube )?(?:videos|products|hotels|apps|restaurants)\b.{0,60}(?:earn|paid|commission|\$|₹|rs)"
    r"|(?:earn|make) .{0,30}(?:per|a|each) (?:task|like|review|click))",
    re.IGNORECASE,
)
_CHAT_INTERVIEW_RE = re.compile(r"(interview|onboarding|hr|recruiter|manager)[^.\n]{0,60}\b(telegram|whats\s?app|signal|wechat|google hangouts|wire app)\b|\b(telegram|whats\s?app|signal)\b[^.\n]{0,60}(interview|onboarding|hr|recruiter|manager)", re.IGNORECASE)


def _positive_mentions(regex: re.Pattern, text: str) -> bool:
    """True if any match is not immediately negated ("we never charge a fee")."""
    for match in regex.finditer(text):
        if not _NEGATION_RE.search(text[max(0, match.start() - 60) : match.start()]):
            return True
    return False


def detect_money_movement_request(fields: dict) -> bool:
    return _positive_mentions(_MONEY_MOVEMENT_RE, _full_text(fields))


def detect_sensitive_info_request(fields: dict) -> bool:
    text = _full_text(fields)
    asks = re.search(r"\b(send|provide|share|submit|upload|enter|need|require)\b", text, re.IGNORECASE)
    return bool(asks) and _positive_mentions(_SENSITIVE_INFO_RE, text)


def detect_task_based_scam(fields: dict) -> bool:
    return bool(_TASK_SCAM_RE.search(_full_text(fields)))


def detect_chat_app_interview(fields: dict) -> bool:
    return bool(_CHAT_INTERVIEW_RE.search(_full_text(fields)))


def detect_all_signals(fields: dict) -> dict[str, bool]:
    """Compute every detector once; both Trust and Severity engines consume
    this same dict so the two scores are always derived from identical
    evidence, even though they weight it differently (SRS 7.1 vs 7.3)."""
    return {
        "registration_fee_requested": detect_registration_fee_requested(fields),
        "personal_email_domain": detect_personal_email_domain(fields),
        "missing_company_profile": detect_missing_company_profile(fields),
        "missing_company_website": detect_missing_company_website(fields),
        "unrealistic_salary": detect_unrealistic_salary(fields),
        "whatsapp_only_contact": detect_whatsapp_only_contact(fields),
        "missing_location": detect_missing_location(fields),
        "poor_grammar_or_spam_wording": detect_poor_grammar_or_spam_wording(fields),
        "urgent_or_spam_wording": detect_urgent_or_spam_wording(fields),
        "unverified_website_or_email": detect_unverified_website_or_email(fields),
        "money_movement_request": detect_money_movement_request(fields),
        "sensitive_info_request": detect_sensitive_info_request(fields),
        "task_based_scam": detect_task_based_scam(fields),
        "chat_app_interview": detect_chat_app_interview(fields),
    }
