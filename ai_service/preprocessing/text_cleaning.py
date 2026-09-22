"""Text cleaning and normalization (SRS FR-2.1-2.6).

Pure functions, no heavyweight imports at module scope besides `re`/`html`/
`unicodedata`, so this module is fast to import and trivially unit-testable.
NLTK-backed stopword removal / lemmatization live in `linguistic.py` since they
require corpus downloads.
"""
from __future__ import annotations

import html
import re
import unicodedata

_HTML_TAG_RE = re.compile(r"<[^>]+>")
_URL_RE = re.compile(r"(https?://\S+|www\.\S+)", re.IGNORECASE)
_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
# Matches common phone formats: optional +country code, groups separated by
# space/dot/dash/parentheses, 7-15 digits total.
_PHONE_RE = re.compile(
    r"(?:\+?\d{1,3}[\s.\-]?)?(?:\(\d{2,4}\)[\s.\-]?)?\d{2,4}[\s.\-]?\d{2,4}[\s.\-]?\d{2,6}"
)
_EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001FAFF"  # symbols & pictographs, supplemental symbols
    "\U00002600-\U000027BF"  # misc symbols & dingbats
    "\U0001F1E6-\U0001F1FF"  # regional indicators (flags)
    "\U00002700-\U000027BF"
    "\U0001F900-\U0001F9FF"
    "]+",
    flags=re.UNICODE,
)
_NON_ALNUM_RE = re.compile(r"[^a-z0-9\s.,!?'\-]")
_MULTI_SPACE_RE = re.compile(r"\s+")

# Boilerplate phrases common in scraped/pasted job postings that carry no
# discriminative signal for fraud classification.
_BOILERPLATE_PATTERNS = [
    re.compile(r"equal opportunity employer[^.]*\.", re.IGNORECASE),
    re.compile(r"click (here|below) to apply[^.]*\.?", re.IGNORECASE),
    re.compile(r"all rights reserved\.?", re.IGNORECASE),
    re.compile(r"powered by [a-z0-9 ]+\.?", re.IGNORECASE),
]


def strip_html(text: str) -> str:
    """Unescape HTML entities and remove tags (FR-2.2)."""
    unescaped = html.unescape(text)
    return _HTML_TAG_RE.sub(" ", unescaped)


def normalize_unicode(text: str) -> str:
    """NFKC-normalize unicode so visually-identical characters compare equal."""
    return unicodedata.normalize("NFKC", text)


def remove_emoji(text: str) -> str:
    return _EMOJI_RE.sub(" ", text)


def remove_urls(text: str) -> str:
    return _URL_RE.sub(" ", text)


def remove_emails(text: str) -> str:
    return _EMAIL_RE.sub(" ", text)


def remove_phone_numbers(text: str) -> str:
    return _PHONE_RE.sub(" ", text)


def remove_boilerplate(text: str) -> str:
    for pattern in _BOILERPLATE_PATTERNS:
        text = pattern.sub(" ", text)
    return text


def collapse_whitespace(text: str) -> str:
    return _MULTI_SPACE_RE.sub(" ", text).strip()


def to_lowercase(text: str) -> str:
    return text.lower()


def strip_special_characters(text: str) -> str:
    """Remove characters outside basic alphanumerics/punctuation (FR-2.2).

    Applied only after URL/email/phone stripping, since those regexes rely on
    characters (@, /, .) this step would otherwise remove.
    """
    return _NON_ALNUM_RE.sub(" ", text)


def clean_text(text) -> str:
    """Full cleaning pipeline for one field (FR-2.1, FR-2.2, FR-2.6).

    Order matters: structural noise (HTML, URLs, emails, phones, emoji) is
    removed before lowercasing/character-stripping, since those regexes key
    off characters that character-stripping would otherwise destroy.
    Missing/empty input returns "" rather than raising (FR-2.6). Accepts
    anything, not just `str | None` — pandas represents a missing CSV cell as
    `float('nan')`, which is truthy in Python and would otherwise slip past a
    plain `if not text` guard and crash `unicodedata.normalize`.
    """
    if not isinstance(text, str) or not text:
        return ""
    text = normalize_unicode(text)
    text = strip_html(text)
    text = remove_urls(text)
    text = remove_emails(text)
    text = remove_phone_numbers(text)
    text = remove_emoji(text)
    text = remove_boilerplate(text)
    text = to_lowercase(text)
    text = strip_special_characters(text)
    text = collapse_whitespace(text)
    return text


FIELD_ORDER = [
    "title",
    "company_profile",
    "description",
    "requirements",
    "benefits",
    "location",
    "salary_range",
    "employment_type",
]


def build_combined_text(fields: dict[str, str | None]) -> str:
    """Concatenate the EMSCAD input fields (SRS 6.1.1) into one BERT input.

    Missing fields are simply omitted rather than causing a failure (FR-2.6) —
    this is itself a fraud signal downstream (missing company profile, missing
    salary, etc.), which the Trust/Severity engines pick up separately; the
    classifier just sees whatever text genuinely exists.
    """
    parts = []
    for field in FIELD_ORDER:
        value = fields.get(field)
        cleaned = clean_text(value)
        if cleaned:
            parts.append(cleaned)
    return " [SEP] ".join(parts)
