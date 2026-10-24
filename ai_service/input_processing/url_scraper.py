"""URL channel: fetch a job posting and extract its fields plus source metadata.

Extraction strategy, most structured first:
  1. LinkedIn job URLs -> LinkedIn's public guest job endpoint (no login)
  2. schema.org JobPosting JSON-LD (Indeed, Greenhouse, Lever, Workday, most
     company career sites embed it)
  3. trafilatura main-content extraction (github.com/adbar/trafilatura)
  4. Headless Chromium via Playwright for JavaScript-rendered pages, if the
     browser is installed (setup installs it; it's optional at runtime)

SSRF hardening (unchanged from v1): http(s) only; every hop's resolved IPs
must be public; redirects followed manually and re-validated; body size and
time are capped.
"""
from __future__ import annotations

import ipaddress
import json
import logging
import os
import re
import socket
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from ai_service.verification.domains import classify_host, registrable_domain

logger = logging.getLogger("ai_service.scraper")

REQUEST_TIMEOUT_SECONDS = int(os.environ.get("SCRAPER_REQUEST_TIMEOUT_SECONDS", "12"))
MAX_RESPONSE_BYTES = int(os.environ.get("SCRAPER_MAX_RESPONSE_BYTES", str(5 * 1024 * 1024)))
MAX_REDIRECTS = 5
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/128.0 Safari/537.36 JobShieldVerifier/2.0"
)
_LINKEDIN_ID_RE = re.compile(r"(\d{8,12})(?:/|$|\?)")


class UnsafeUrlError(ValueError):
    """Raised when a URL fails SSRF-safety validation."""


class ScrapingFailedError(RuntimeError):
    """Raised when the page could not be fetched or had no usable content."""


def _is_safe_ip(ip_str: str) -> bool:
    ip = ipaddress.ip_address(ip_str)
    return not (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified)


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
    for _family, _type, _proto, _canonname, sockaddr in resolved:
        if not _is_safe_ip(sockaddr[0]):
            raise UnsafeUrlError(f"URL resolves to a non-public address ({sockaddr[0]}) and cannot be scraped.")


def _fetch(url: str) -> tuple[str, str]:
    """Returns (final_url, html)."""
    current_url = url
    for _ in range(MAX_REDIRECTS + 1):
        _validate_url_is_safe(current_url)
        try:
            response = requests.get(
                current_url,
                headers={"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"},
                timeout=REQUEST_TIMEOUT_SECONDS,
                allow_redirects=False,
                stream=True,
            )
        except requests.RequestException as exc:
            raise ScrapingFailedError(f"Could not reach the page ({exc.__class__.__name__}).") from exc
        if response.is_redirect or response.is_permanent_redirect:
            location = response.headers.get("Location")
            if not location:
                raise ScrapingFailedError("Redirect response had no Location header.")
            current_url = urljoin(current_url, location)
            continue
        if response.status_code != 200:
            raise ScrapingFailedError(f"The page returned HTTP {response.status_code}.")
        chunks, total = [], 0
        for chunk in response.iter_content(chunk_size=8192):
            total += len(chunk)
            if total > MAX_RESPONSE_BYTES:
                raise ScrapingFailedError("Page content exceeded the maximum allowed size.")
            chunks.append(chunk)
        return current_url, b"".join(chunks).decode(response.encoding or "utf-8", errors="replace")
    raise ScrapingFailedError("Too many redirects.")


def _empty_fields() -> dict:
    return {k: None for k in ("title", "company_profile", "description", "requirements", "benefits", "location", "salary_range", "employment_type")}


def _text(node) -> str | None:
    return node.get_text(" ", strip=True) if node else None


# --- LinkedIn ---------------------------------------------------------------

def _linkedin_job_id(url: str) -> str | None:
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    for key in ("currentJobId", "jobId"):
        if query.get(key):
            return query[key][0]
    if "/jobs/view/" in parsed.path:
        match = _LINKEDIN_ID_RE.search(parsed.path.rstrip("/") + "/")
        return match.group(1) if match else None
    return None


def _scrape_linkedin(job_id: str) -> tuple[dict, dict]:
    _, html = _fetch(f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}")
    soup = BeautifulSoup(html, "html.parser")
    org = soup.select_one("a.topcard__org-name-link")
    fields = _empty_fields()
    fields.update(
        title=_text(soup.select_one(".topcard__title")),
        company_profile=_text(org),
        description=_text(soup.select_one(".description__text")) or _text(soup.select_one(".show-more-less-html__markup")),
        location=_text(soup.select_one(".topcard__flavor--bullet")),
    )
    criteria = {
        _text(h).lower(): _text(h.find_next("span"))
        for h in soup.select(".description__job-criteria-subheader")
    }
    fields["employment_type"] = criteria.get("employment type")
    company_page = org["href"].split("?")[0] if org and org.has_attr("href") else None
    apply_link = soup.select_one("a[data-tracking-control-name*='apply'], a.apply-button")
    apply_url = apply_link["href"] if apply_link and apply_link.has_attr("href") else None
    if apply_url and "linkedin.com/signup" in apply_url:
        apply_url = None  # logged-out visitors get a sign-up link, not the real one
    meta = {
        "company_name": fields["company_profile"],
        "company_page": company_page,
        "apply_url": apply_url,
        "posted": _text(soup.select_one(".posted-time-ago__text")),
        "extractor": "linkedin_guest",
    }
    return fields, meta


# --- Generic ----------------------------------------------------------------

def _jsonld_job_posting(soup: BeautifulSoup) -> dict | None:
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except (json.JSONDecodeError, TypeError):
            continue
        stack = data if isinstance(data, list) else [data]
        while stack:
            item = stack.pop()
            if isinstance(item, dict):
                kind = item.get("@type")
                if kind == "JobPosting" or (isinstance(kind, list) and "JobPosting" in kind):
                    return item
                stack.extend(v for v in item.values() if isinstance(v, (list, dict)))
            elif isinstance(item, list):
                stack.extend(item)
    return None


def _fields_from_jsonld(posting: dict) -> tuple[dict, dict]:
    org = posting.get("hiringOrganization") if isinstance(posting.get("hiringOrganization"), dict) else {}
    location = posting.get("jobLocation")
    if isinstance(location, list):
        location = location[0] if location else None
    location_str = None
    if isinstance(location, dict) and isinstance(location.get("address"), dict):
        a = location["address"]
        location_str = ", ".join(filter(None, [a.get("addressLocality"), a.get("addressRegion"), str(a.get("addressCountry") or "") or None]))
    salary = posting.get("baseSalary")
    salary_str = None
    if isinstance(salary, dict) and isinstance(salary.get("value"), dict):
        v = salary["value"]
        salary_str = f"{v.get('minValue', '')}-{v.get('maxValue', '')} {salary.get('currency', '')} {v.get('unitText', '')}".strip()
    requirements = posting.get("qualifications") or posting.get("experienceRequirements")
    fields = _empty_fields()
    fields.update(
        title=posting.get("title"),
        company_profile=org.get("name"),
        description=BeautifulSoup(posting.get("description") or "", "html.parser").get_text(" ", strip=True),
        requirements=requirements if isinstance(requirements, str) else None,
        benefits=posting.get("jobBenefits") if isinstance(posting.get("jobBenefits"), str) else None,
        location=location_str,
        salary_range=salary_str,
        employment_type=posting.get("employmentType") if isinstance(posting.get("employmentType"), str) else None,
    )
    meta = {
        "company_name": org.get("name"),
        "company_page": org.get("sameAs") or org.get("url"),
        "apply_url": posting.get("url"),
        "posted": posting.get("datePosted"),
        "extractor": "json_ld",
    }
    return fields, meta


def _fields_from_main_content(html: str, url: str, soup: BeautifulSoup) -> tuple[dict, dict]:
    import trafilatura

    body = trafilatura.extract(html, url=url, include_comments=False, include_tables=True, favor_recall=True)
    if not body:
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            tag.decompose()
        body = soup.get_text(" ", strip=True)
    og_site = soup.find("meta", property="og:site_name")
    page_title = soup.title.string.strip() if soup.title and soup.title.string else None
    company = og_site["content"] if og_site and og_site.has_attr("content") else None
    # Job boards title pages "<Company> hiring <Role> in <Place> | <Board>".
    hiring = re.match(r"^(.+?) hiring (.+?)(?: in (.+?))? \|", page_title or "")
    fields = _empty_fields()
    fields.update(title=hiring.group(2) if hiring else page_title, description=body)
    if hiring:
        company = hiring.group(1)
        fields["company_profile"] = company
        fields["location"] = hiring.group(3)
    meta = {
        "company_name": company,
        "company_page": None,
        "apply_url": None,
        "posted": None,
        "extractor": "main_content",
    }
    return fields, meta


def _render_with_browser(url: str) -> str | None:
    """JS-rendered pages. Optional: returns None if Playwright/Chromium is
    unavailable rather than failing the whole request."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(user_agent=USER_AGENT)
            # Re-check every request the page makes, not only the first URL.
            page.route("**/*", lambda route: route.abort() if _unsafe(route.request.url) else route.continue_())
            page.goto(url, wait_until="networkidle", timeout=REQUEST_TIMEOUT_SECONDS * 1000)
            html = page.content()
            browser.close()
            return html
    except Exception as exc:  # browser missing, timeout, navigation error
        logger.info(f"Browser render failed for {url}: {exc}")
        return None


def _unsafe(url: str) -> bool:
    try:
        _validate_url_is_safe(url)
        return False
    except UnsafeUrlError:
        return True


def _extract(html: str, url: str) -> tuple[dict, dict]:
    soup = BeautifulSoup(html, "html.parser")
    posting = _jsonld_job_posting(soup)
    if posting:
        return _fields_from_jsonld(posting)
    return _fields_from_main_content(html, url, soup)


def scrape_job_posting(url: str) -> dict:
    """Returns the standard fields dict plus a `_source` key describing where
    the posting was found (platform, domain, company page, apply link)."""
    url = url.strip()
    if "://" not in url:
        url = "https://" + url
    _validate_url_is_safe(url)

    job_id = _linkedin_job_id(url) if registrable_domain(url) == "linkedin.com" else None
    fields = None
    if job_id:
        final_url = url
        try:
            fields, meta = _scrape_linkedin(job_id)
        except ScrapingFailedError as exc:
            # The guest endpoint is rate-limited; the public job page carries
            # the same posting as JSON-LD.
            logger.info(f"LinkedIn guest endpoint failed ({exc}); trying the public job page")
            final_url, html = _fetch(f"https://www.linkedin.com/jobs/view/{job_id}")
            fields, meta = _extract(html, final_url)
    if fields is None:
        final_url, html = _fetch(url)
        fields, meta = _extract(html, final_url)
        if not fields.get("description") or len(fields["description"]) < 200:
            rendered = _render_with_browser(final_url)
            if rendered:
                fields, meta = _extract(rendered, final_url)
                meta["extractor"] += "+browser"

    if not fields.get("description") or len(fields["description"]) < 50:
        raise ScrapingFailedError(
            "Could not extract the job description from this page (it may require a login). "
            "Paste the text or upload a screenshot instead."
        )

    host = urlparse(final_url).hostname or ""
    fields["_source"] = {
        "url": final_url,
        "host": host,
        "domain": registrable_domain(host),
        **classify_host(host),
        **meta,
    }
    return fields
