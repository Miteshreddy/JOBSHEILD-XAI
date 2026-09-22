"""Word lists / regex vocabularies used by the fraud-pattern signal detectors.

Centralized here (separate from the numeric thresholds in
ai_service/config/business_rules.py) so the *vocabulary* of what counts as a
"registration fee mention" or "urgent wording" can be tuned/extended without
touching detection logic, per NFR-14's spirit of isolating tunable constants.
"""

FREE_EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
    "rediffmail.com", "protonmail.com", "icloud.com", "live.com", "gmx.com",
    "mail.com", "yandex.com", "zoho.com", "ymail.com", "msn.com",
}

REGISTRATION_FEE_PHRASES = [
    r"registration\s*fee",
    r"processing\s*fee",
    r"application\s*fee",
    r"security\s*deposit",
    r"refundable\s*deposit",
    r"pay\s+(?:a|an|the)?\s*fee",
    r"training\s*fee",
    r"joining\s*fee",
    r"advance\s*payment",
    r"one[\s-]?time\s*payment\s*required",
]

WHATSAPP_KEYWORDS = [
    r"whatsapp\s*only",
    r"contact\s*(?:us\s*)?(?:via|on|through)\s*whatsapp",
    r"whatsapp\s*number",
    r"message\s*(?:us\s*)?on\s*whatsapp",
]

URGENCY_KEYWORDS = [
    r"\burgent\b", r"\burgently\b", r"immediate\s*joining", r"apply\s*now",
    r"hurry\s*up", r"limited\s*seats", r"act\s*fast", r"only\s*\d+\s*seats?\s*left",
    r"don'?t\s*miss\s*(?:this|out)",
]

SPAM_WORDING_KEYWORDS = [
    r"\$\$\$", r"100%\s*guaranteed", r"no\s*experience\s*needed",
    r"work\s*from\s*home\s*and\s*earn", r"easy\s*money", r"click\s*here",
    r"be\s*your\s*own\s*boss",
]

NO_EXPERIENCE_PHRASES = [
    r"no\s*experience\s*(?:required|needed)",
    r"freshers?\s*(?:welcome|can\s*apply)",
]

WEBSITE_MENTION_RE = r"(https?://\S+|www\.[a-z0-9\-]+\.[a-z]{2,}|\b[a-z0-9\-]+\.(?:com|in|org|net|co)\b)"
EMAIL_RE = r"[a-zA-Z0-9._%+\-]+@([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})"
