"""Module 6 — Decision Support Engine (SRS FR-7.1-7.4, Section 7.4).

Converts risk category + severity flags into human-readable guidance. Every
warning/suggestion below is deterministic — same flags in, same messages out
— which is what NFR-12/FR-8.4 mean by "human-readable, not a black box."
"""
from __future__ import annotations

from ai_service.config.business_rules import RISK_RECOMMENDATIONS

WARNING_MESSAGES = {
    "registration_fee_requested": (
        "This posting asks for a registration fee, deposit, or advance payment. "
        "Legitimate employers never charge candidates to apply or to be hired — do not pay."
    ),
    "unrealistic_salary": (
        "The advertised salary looks unrealistically high for the stated role and "
        "requirements. Treat implausible pay offers as a warning sign."
    ),
    "missing_company_profile": (
        "No company background or profile is provided, so this employer cannot "
        "be independently verified from the posting alone."
    ),
    "whatsapp_only_contact": (
        "Only a WhatsApp contact is given, with no verifiable email or company "
        "website. Legitimate employers provide official communication channels."
    ),
    "urgent_or_spam_wording": (
        "This posting uses urgent or high-pressure language. Artificial urgency is "
        "a common pressure tactic used to stop candidates from verifying an offer."
    ),
    "unverified_website_or_email": (
        "No verifiable company website or official email domain could be found "
        "for this posting."
    ),
}

VERIFICATION_SUGGESTIONS = [
    "Verify the company's official website independently — do not use links provided in the posting.",
    "Check whether the recruiter's email domain matches the company's official domain.",
    "Search the company name together with terms like \"scam\" or \"reviews\" before proceeding.",
    "Confirm the opening exists on the company's official careers page or LinkedIn.",
    "Never pay a registration fee, deposit, or \"training charge\" before or during hiring.",
    "Contact the company's official HR channel directly rather than replying through the posting.",
]

_TONE_PREFIX = {
    "Critical": "Critical warning: ",
    "High": "Warning: ",
    "Medium": "Note: ",
}


def generate_decision_support(risk_category: str, severity_result: dict) -> dict:
    """FR-7.1-7.4: recommendation + severity-tied warnings + verification suggestions.

    FR-7.4 (scale tone/count to risk) is implemented by suppressing warnings
    entirely for Low risk — by construction a Low-risk analysis has low fraud
    probability and high trust, so surfacing alarming per-flag language here
    would contradict the category the user was just given — and by prefixing
    remaining tiers with an escalating tone marker.
    """
    if risk_category not in RISK_RECOMMENDATIONS:
        raise ValueError(f"Unknown risk_category: {risk_category}")

    recommendation = RISK_RECOMMENDATIONS[risk_category]

    if risk_category == "Low":
        warnings: list[str] = []
    else:
        prefix = _TONE_PREFIX.get(risk_category, "")
        warnings = [
            prefix + WARNING_MESSAGES[flag]
            for flag in severity_result.get("flags", [])
            if flag in WARNING_MESSAGES
        ]

    verification_suggestions = [] if risk_category == "Low" else list(VERIFICATION_SUGGESTIONS)

    return {
        "recommendation": recommendation,
        "warnings": warnings,
        "verification_suggestions": verification_suggestions,
    }
