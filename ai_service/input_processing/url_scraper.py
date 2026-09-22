"""Module 0 (URL channel) — FR-1.2, UC-2, NFR-7 (SSRF mitigation).

SSRF hardening (NFR-7 says "sanitize and validate the target URL... to
mitigate SSRF risk" but doesn't specify how — resolved here, Phase 1
gap-resolution approved 2026-07-29):
  1. Only http(s) schemes are accepted.
  2. The hostname is resolved and every resolved IP is checked against
     private/loopback/link-local/reserved/multicast ranges — this also
     covers the cloud metadata address (169.254.169.254 is link-local).
  3. Redirects are followed manually (not by `requests`) up to a small cap,
     re-validating the target IP at every hop — otherwise a public URL that
     redirects to an internal address after the initial check would bypass
     it entirely.
  4. The response body is capped in size and the request is time-bounded.
"""
from __future__ import annotations

import ipaddress
import os
import socket
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

REQUEST_TIMEOUT_SECONDS = int(os.environ.get("SCRAPER_REQUEST_TIMEOUT_SECONDS", "10"))
MAX_RESPONSE_BYTES = int(os.environ.get("SCRAPER_MAX_RESPONSE_BYTES", str(5 * 1024 * 1024)))
MAX_REDIRECTS = 3
USER_AGENT = "FakeJobDetectionBot/1.0 (+job-advertisement-analysis)"


class UnsafeUrlError(ValueError):
    """Raised when a URL fails SSRF-safety validation."""


class ScrapingFailedError(RuntimeError):
    """Raised when the page could not be fetched or had no usable content (UC-2)."""


def _is_safe_ip(ip_str: str) -> bool:
    ip = ipaddress.ip_address(ip_str)
    return not (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def _validate_url_is_safe(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise UnsafeUrlError("Only http/https URLs are supported.")
    if not parsed.hostname:
        raise UnsafeUrlError("URL has no hostname.")

    try:
        resolved = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror as exc:
        raise UnsafeUrlError(f"Could not resolve hostname: {parsed.hostname}") from exc

    for family, _type, _proto, _canonname, sockaddr in resolved:
        ip_str = sockaddr[0]
        if not _is_safe_ip(ip_str):
            raise UnsafeUrlError(
                f"URL resolves to a non-public address ({ip_str}) and cannot be scraped."
            )


def _fetch_with_validated_redirects(url: str) -> requests.Response:
    current_url = url
    for _ in range(MAX_REDIRECTS + 1):
        _validate_url_is_safe(current_url)
        response = requests.get(
            current_url,
            headers={"User-Agent": USER_AGENT},
            timeout=REQUEST_TIMEOUT_SECONDS,
            allow_redirects=False,
            stream=True,
        )
        if response.is_redirect or response.is_permanent_redirect:
            next_url = response.headers.get("Location")
            if not next_url:
                raise ScrapingFailedError("Redirect response had no Location header.")
            current_url = urljoin(current_url, next_url)
            continue
        return response

    raise ScrapingFailedError("Too many redirects.")


def _read_body_capped(response: requests.Response) -> str:
    chunks = []
    total = 0
    for chunk in response.iter_content(chunk_size=8192, decode_unicode=False):
        total += len(chunk)
        if total > MAX_RESPONSE_BYTES:
            raise ScrapingFailedError("Page content exceeded the maximum allowed size.")
        chunks.append(chunk)
    return b"".join(chunks).decode(response.encoding or "utf-8", errors="replace")


def _extract_job_posting_jsonld(soup: BeautifulSoup) -> dict | None:
    """Many job boards embed a schema.org JobPosting JSON-LD block — when
    present, this is far more reliable than guessing at page structure."""
    import json

    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except (json.JSONDecodeError, TypeError):
            continue
        candidates = data if isinstance(data, list) else [data]
        for candidate in candidates:
            if isinstance(candidate, dict) and candidate.get("@type") == "JobPosting":
                return candidate
    return None


def _fields_from_jsonld(posting: dict) -> dict:
    hiring_org = posting.get("hiringOrganization")
    company_name = hiring_org.get("name") if isinstance(hiring_org, dict) else None

    location = posting.get("jobLocation")
    location_str = None
    if isinstance(location, dict):
        address = location.get("address", {})
        if isinstance(address, dict):
            location_str = ", ".join(
                filter(None, [address.get("addressLocality"), address.get("addressRegion"), address.get("addressCountry")])
            )

    salary = posting.get("baseSalary")
    salary_str = None
    if isinstance(salary, dict):
        value = salary.get("value")
        if isinstance(value, dict):
            salary_str = f"{value.get('minValue', '')}-{value.get('maxValue', '')} {salary.get('currency', '')}".strip()

    return {
        "title": posting.get("title"),
        "company_profile": company_name,
        "description": BeautifulSoup(posting.get("description") or "", "html.parser").get_text(" "),
        "requirements": posting.get("qualifications") or posting.get("experienceRequirements"),
        "benefits": posting.get("jobBenefits"),
        "location": location_str,
        "salary_range": salary_str,
        "employment_type": posting.get("employmentType"),
    }


def _fields_from_generic_page(soup: BeautifulSoup) -> dict:
    title = soup.title.string.strip() if soup.title and soup.title.string else None
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    body_text = soup.get_text(separator=" ", strip=True)
    return {
        "title": title,
        "company_profile": None,
        "description": body_text,
        "requirements": None,
        "benefits": None,
        "location": None,
        "salary_range": None,
        "employment_type": None,
    }


def scrape_job_posting(url: str) -> dict:
    """FR-1.2: returns fields in the standard shape (FIELD_ORDER-compatible)
    so the result flows through the identical downstream pipeline as any
    other input channel (FR-1.6)."""
    response = _fetch_with_validated_redirects(url)
    if response.status_code != 200:
        raise ScrapingFailedError(f"The page returned HTTP {response.status_code}.")

    html = _read_body_capped(response)
    soup = BeautifulSoup(html, "html.parser")

    posting = _extract_job_posting_jsonld(soup)
    fields = _fields_from_jsonld(posting) if posting else _fields_from_generic_page(soup)

    if not fields.get("description") or len(fields["description"]) < 50:
        raise ScrapingFailedError(
            "Could not extract sufficient content from this page (it may be JavaScript-rendered "
            "or access-restricted). Try the Text or PDF/Image input mode instead."
        )
    return fields
