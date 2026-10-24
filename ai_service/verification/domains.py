"""Domain helpers: registrable-domain parsing, platform classification,
brand-impersonation (lookalike) detection and domain-age lookup via RDAP."""
from __future__ import annotations

import re
from datetime import datetime, timezone
from functools import lru_cache
from urllib.parse import urlparse

import httpx
import tldextract
from rapidfuzz import fuzz

from ai_service.verification.registry import (
    ANONYMOUS_HOSTS,
    ATS_HOSTS,
    FREE_EMAIL_PROVIDERS,
    JOB_BOARDS,
    MESSAGING_HOSTS,
)

# Offline public-suffix snapshot bundled with tldextract — no network at runtime.
_extract = tldextract.TLDExtract(suffix_list_urls=())

URL_RE = re.compile(r"(?:https?://|www\.)[^\s<>\"')\]]+|\b(?:[a-z0-9-]+\.)+(?:com|org|net|io|co|in|ai|jobs|careers|xyz|info|biz|online|site|top|us|uk|me)\b(?:/[^\s<>\"')\]]*)?", re.IGNORECASE)
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})")
EMAIL_FULL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_HOMOGLYPHS = str.maketrans({"0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s"})


def registrable_domain(host_or_url: str) -> str | None:
    host = host_or_url
    if "://" in host_or_url or host_or_url.startswith("www."):
        host = urlparse(host_or_url if "://" in host_or_url else f"http://{host_or_url}").hostname or ""
    parts = _extract(host.lower().strip("."))
    if not parts.domain or not parts.suffix:
        return None
    return f"{parts.domain}.{parts.suffix}"


def host_of(url: str) -> str | None:
    parsed = urlparse(url if "://" in url else f"http://{url}")
    return parsed.hostname.lower() if parsed.hostname else None


def domain_matches(domain: str | None, official: str | None) -> bool:
    """True when `domain` is the official domain or one of its subdomains."""
    if not domain or not official:
        return False
    domain, official = domain.lower(), official.lower()
    return domain == official or domain.endswith("." + official)


def classify_host(host: str | None) -> dict:
    """Returns {"type": official|job_board|ats|anonymous|messaging|web, "platform": str|None}."""
    if not host:
        return {"type": "none", "platform": None}
    reg = registrable_domain(host) or host
    for table, kind in ((MESSAGING_HOSTS, "messaging"), (JOB_BOARDS, "job_board"), (ATS_HOSTS, "ats")):
        for key, name in table.items():
            if domain_matches(host, key) or reg == key:
                return {"type": kind, "platform": name}
    if reg in ANONYMOUS_HOSTS or any(domain_matches(host, h) for h in ANONYMOUS_HOSTS):
        return {"type": "anonymous", "platform": reg}
    return {"type": "web", "platform": None}


def is_free_email(domain: str) -> bool:
    return domain.lower() in FREE_EMAIL_PROVIDERS


def extract_urls(text: str) -> list[str]:
    seen, out = set(), []
    # Drop email addresses first so "hr.brand.jobs@gmail.com" isn't read as a link.
    for match in URL_RE.findall(EMAIL_FULL_RE.sub(" ", text or "")):
        url = match.rstrip(".,;:!?")
        if "@" in url:
            continue
        key = url.lower()
        if key not in seen:
            seen.add(key)
            out.append(url)
    return out[:20]


def extract_email_domains(text: str) -> list[str]:
    return sorted({d.lower().rstrip(".") for d in EMAIL_RE.findall(text or "")})


def _brand_token(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())


def looks_like_impersonation(domain: str, brand: str, official_domains: list[str]) -> bool:
    """Flags domains that borrow a brand without belonging to it, e.g.
    micros0ft-careers.com, amazon-jobs-hr.net, careers-google.co."""
    if not domain or any(domain_matches(domain, o) for o in official_domains):
        return False
    label = (_extract(domain).domain or "").lower()
    label_norm = label.translate(_HOMOGLYPHS).replace("-", "")
    brand_tok = _brand_token(brand)
    if len(brand_tok) < 3:
        return False
    if brand_tok in label_norm:
        return True
    official_labels = [(_extract(o).domain or "").lower() for o in official_domains]
    return any(len(o) >= 4 and fuzz.ratio(label_norm, o) >= 85 for o in official_labels)


@lru_cache(maxsize=512)
def domain_age_days(domain: str, timeout: float = 6.0) -> int | None:
    """Registration age from RDAP (the IETF successor to WHOIS). None when
    unknown — absence of data is never itself treated as a red flag."""
    try:
        resp = httpx.get(f"https://rdap.org/domain/{domain}", timeout=timeout, follow_redirects=True)
        if resp.status_code != 200:
            return None
        for event in resp.json().get("events", []):
            if event.get("eventAction") == "registration":
                created = datetime.fromisoformat(event["eventDate"].replace("Z", "+00:00"))
                return (datetime.now(timezone.utc) - created).days
    except (httpx.HTTPError, ValueError, KeyError):
        return None
    return None
