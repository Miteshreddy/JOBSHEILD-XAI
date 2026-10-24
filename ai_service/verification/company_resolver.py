"""Resolve an employer name to its official website.

Lookup order, cheapest and most reliable first:
  1. KNOWN_EMPLOYERS registry (offline)
  2. Wikidata "official website" (P856) property
  3. Web search (ddgs, several engines) — first result whose domain carries
     the company's name and isn't a job board / encyclopedia / social network
Results are cached per process.
"""
from __future__ import annotations

import logging
import os
import re
from functools import lru_cache

import requests
from rapidfuzz import fuzz

from ai_service.verification.domains import classify_host, registrable_domain
from ai_service.verification.registry import KNOWN_EMPLOYERS

logger = logging.getLogger("ai_service.verification")

# Wikimedia's bot policy requires an identifying User-Agent with contact info.
WIKIDATA_USER_AGENT = "JobShieldVerifier/2.0 (https://github.com/miteshreddy/jobsheild-xai)"
NETWORK_TIMEOUT = float(os.environ.get("VERIFICATION_TIMEOUT_SECONDS", "6"))
SEARCH_BACKENDS = [b.strip() for b in os.environ.get("SEARCH_BACKENDS", "duckduckgo,google,brave,bing").split(",") if b.strip()]

_CORP_SUFFIX_RE = re.compile(
    r"\b(inc|inc\.|llc|ltd|ltd\.|limited|corp|corp\.|corporation|co\.|company|plc|gmbh|pvt|private|group|holdings|technologies|technology|solutions|services)\b",
    re.IGNORECASE,
)
_NOT_COMPANY_SITES = {
    "wikipedia.org", "wikidata.org", "linkedin.com", "facebook.com", "instagram.com", "x.com",
    "twitter.com", "youtube.com", "crunchbase.com", "bloomberg.com", "glassdoor.com", "indeed.com",
    "zoominfo.com", "ambitionbox.com", "reddit.com", "quora.com", "medium.com", "naukri.com",
    "craft.co", "pitchbook.com", "dnb.com", "owler.com", "tracxn.com", "google.com",
}


def normalize_company(name: str) -> str:
    return " ".join(_CORP_SUFFIX_RE.sub(" ", name.lower()).replace(",", " ").split())


def _from_registry(name: str) -> dict | None:
    norm = normalize_company(name)
    if not norm:
        return None
    for canonical, (domains, aliases) in KNOWN_EMPLOYERS.items():
        keys = {normalize_company(canonical), *(normalize_company(a) for a in aliases)}
        if norm in keys or any(len(k) >= 4 and fuzz.ratio(norm, k) >= 92 for k in keys):
            return {
                "name": canonical,
                "website": f"https://{domains[0]}",
                "official_domains": list(domains),
                "source": "registry",
                "confidence": 0.99,
                "well_known": True,
            }
    return None


def _from_wikidata(name: str) -> dict | None:
    headers = {"User-Agent": WIKIDATA_USER_AGENT}
    try:
        search = requests.get(
            "https://www.wikidata.org/w/api.php",
            params={"action": "wbsearchentities", "search": name, "language": "en", "format": "json", "limit": 3, "type": "item"},
            headers=headers,
            timeout=NETWORK_TIMEOUT,
        ).json()
        for hit in search.get("search", []):
            label = hit.get("label") or ""
            if fuzz.token_set_ratio(normalize_company(label), normalize_company(name)) < 88:
                continue
            entity = requests.get(
                "https://www.wikidata.org/w/api.php",
                params={"action": "wbgetentities", "ids": hit["id"], "props": "claims", "format": "json"},
                headers=headers,
                timeout=NETWORK_TIMEOUT,
            ).json()
            claims = entity["entities"][hit["id"]].get("claims", {})
            sites = [c["mainsnak"]["datavalue"]["value"] for c in claims.get("P856", []) if "datavalue" in c["mainsnak"]]
            if sites:
                domain = registrable_domain(sites[0])
                return {
                    "name": label,
                    "website": sites[0],
                    "official_domains": [domain] if domain else [],
                    "source": "wikidata",
                    "confidence": 0.93,
                    "description": hit.get("description"),
                    # A Wikidata entry with an official site and an
                    # employee/industry-scale description is a notable org.
                    "well_known": True,
                }
    except (requests.RequestException, ValueError, KeyError) as exc:
        logger.info(f"Wikidata lookup failed for {name!r}: {exc}")
    return None


def _from_web_search(name: str) -> dict | None:
    try:
        from ddgs import DDGS
    except ImportError:
        return None
    tokens = [t for t in re.sub(r"[^a-z0-9 ]", " ", normalize_company(name)).split() if len(t) >= 3]
    if not tokens:
        return None
    for backend in SEARCH_BACKENDS:
        try:
            results = DDGS(timeout=int(NETWORK_TIMEOUT)).text(f"{name} official website", max_results=6, backend=backend)
        except Exception as exc:  # ddgs raises its own exception types per engine
            logger.info(f"search backend {backend} failed: {exc}")
            continue
        for result in results:
            url = result.get("href") or ""
            domain = registrable_domain(url)
            if not domain or domain in _NOT_COMPANY_SITES or classify_host(domain)["type"] != "web":
                continue
            label = domain.split(".")[0].replace("-", "")
            if any(t in label for t in tokens) or fuzz.partial_ratio("".join(tokens), label) >= 85:
                return {
                    "name": name,
                    "website": f"https://{domain}",
                    "official_domains": [domain],
                    "source": "web_search",
                    "confidence": 0.75,
                    "well_known": False,
                }
        if results:
            break
    return None


@lru_cache(maxsize=256)
def resolve_company(name: str) -> dict | None:
    name = (name or "").strip()
    if len(name) < 2:
        return None
    return _from_registry(name) or _from_wikidata(name) or _from_web_search(name)


def company_for_domain(domain: str | None) -> dict | None:
    """Reverse lookup: is this domain one of the registry's official domains?"""
    if not domain:
        return None
    for canonical, (domains, _aliases) in KNOWN_EMPLOYERS.items():
        if any(domain == d or domain.endswith("." + d) for d in domains):
            return _from_registry(canonical)
    return None
