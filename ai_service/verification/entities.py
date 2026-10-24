"""Heuristic employer-name extraction from free text (the reasoning model is
asked as a fallback when nothing here matches)."""
from __future__ import annotations

import re

from ai_service.verification.registry import KNOWN_EMPLOYERS

_NAME = r"([A-Z][A-Za-z0-9&.\-']+(?:\s+(?:&\s+)?[A-Z][A-Za-z0-9&.\-']+){0,4})"
_PATTERNS = [
    re.compile(rf"\b(?:company|employer|organi[sz]ation|hiring company)\s*[:\-]\s*{_NAME}"),
    re.compile(rf"{_NAME}\s+(?:is|are)\s+(?:hiring|looking|seeking|recruiting)\b"),
    re.compile(rf"\b(?:join|joining)\s+(?:the\s+team\s+at\s+)?{_NAME}"),
    re.compile(rf"\b(?:at|with|from)\s+{_NAME}\s*(?:[,.!]|\bis\b|\bas\b|\bin\b)"),
    re.compile(rf"\bon behalf of\s+{_NAME}"),
    re.compile(rf"\bwelcome to\s+{_NAME}"),
]
_STOP = {"The", "Our", "We", "You", "This", "Apply", "Job", "Hiring", "Remote", "Work", "Dear", "Hello", "Hi", "Team", "Position", "Role", "Please", "Kindly", "Congratulations", "Urgent", "Greetings", "Home"}


def _known_brand_mentions(text: str) -> list[str]:
    found = []
    lower = text.lower()
    for canonical, (_domains, aliases) in KNOWN_EMPLOYERS.items():
        for name in (canonical, *aliases):
            # Very short aliases ("ge", "un", "who") match ordinary words.
            if len(name) < 4 and name.upper() != name:
                continue
            if len(name) <= 3 and not re.search(rf"\b{re.escape(name)}\b", text):
                continue
            if re.search(rf"(?<![a-z0-9]){re.escape(name.lower())}(?![a-z0-9])", lower):
                found.append(canonical)
                break
    return found


def extract_company_candidates(text: str, hint: str | None = None) -> list[str]:
    """Ordered, de-duplicated candidates: explicit hint (scraped employer),
    then well-known brands named in the text, then pattern matches."""
    candidates: list[str] = []
    if hint:
        candidates.append(hint.strip())
    candidates.extend(_known_brand_mentions(text[:6000]))
    for pattern in _PATTERNS:
        for match in pattern.finditer(text[:4000]):
            name = match.group(1).strip(" .,-")
            first = name.split()[0]
            if first in _STOP or len(name) < 3:
                continue
            candidates.append(name)
    seen, ordered = set(), []
    for c in candidates:
        key = c.lower()
        if key not in seen:
            seen.add(key)
            ordered.append(c)
    return ordered[:5]
