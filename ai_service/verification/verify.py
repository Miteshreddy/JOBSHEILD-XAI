"""Source & employer verification.

Answers the questions a careful job seeker would ask, each as an explicit
check with a pass / warn / fail status and a plain-language detail:
  * Where was this posting published, and is that channel accountable?
  * Who is the employer, and what is their official website?
  * Do the posting's emails and links belong to that employer?
  * Are any domains brand look-alikes or only days old?

Returns the structured evidence the fusion step reasons over.
"""
from __future__ import annotations

import logging
import re
from concurrent.futures import ThreadPoolExecutor

from ai_service.verification.company_resolver import company_for_domain, normalize_company, resolve_company
from ai_service.verification.domains import (
    classify_host,
    domain_age_days,
    domain_matches,
    extract_email_domains,
    extract_urls,
    host_of,
    is_free_email,
    looks_like_impersonation,
    registrable_domain,
)
from ai_service.verification.entities import extract_company_candidates

logger = logging.getLogger("ai_service.verification")

NEW_DOMAIN_DAYS = 180
YOUNG_DOMAIN_DAYS = 365


def _check(check_id: str, label: str, status: str, detail: str) -> dict:
    return {"id": check_id, "label": label, "status": status, "detail": detail}


def _logo_url(domain: str | None) -> str | None:
    return f"https://www.google.com/s2/favicons?domain={domain}&sz=128" if domain else None


def _slug_matches(url: str | None, company: str) -> bool:
    if not url:
        return False
    slug = re.sub(r"[^a-z0-9]", "", url.lower().rstrip("/").rsplit("/", 1)[-1])
    token = re.sub(r"[^a-z0-9]", "", normalize_company(company))
    return bool(token) and (token in slug or slug in token) and len(slug) >= 3


def _resolve(candidates: list[str]) -> tuple[dict | None, str | None]:
    for name in candidates:
        resolved = resolve_company(name)
        if resolved:
            return resolved, name
    return None, candidates[0] if candidates else None


def verify_posting(fields: dict, text: str, input_type: str, extra_company_hint: str | None = None) -> dict:
    source_meta = fields.get("_source") or {}
    source_url = source_meta.get("url")
    source_host = source_meta.get("host") or (host_of(source_url) if source_url else None)
    source_domain = source_meta.get("domain") or (registrable_domain(source_host) if source_host else None)
    source_class = classify_host(source_host) if source_host else {"type": "none", "platform": None}

    hint = source_meta.get("company_name")
    profile = fields.get("company_profile")
    if not hint and isinstance(profile, str) and len(profile) < 80:
        hint = profile  # short "company_profile" values are names, long ones are blurbs
    candidates = extract_company_candidates(text, hint)
    if extra_company_hint and extra_company_hint.lower() not in {c.lower() for c in candidates}:
        candidates.append(extra_company_hint)

    company, claimed_name = _resolve(candidates)
    # A posting on a company's own domain identifies the employer by itself.
    if not company and source_domain:
        company = company_for_domain(source_domain)
    official = company["official_domains"] if company else []

    urls = extract_urls(text)
    link_domains = []
    for u in urls:
        host = host_of(u)
        d = registrable_domain(host) if host else None
        if d and d not in link_domains:
            link_domains.append(d)
    email_domains = extract_email_domains(text)

    checks: list[dict] = []
    evidence = {
        "official_source": False,
        "trusted_platform": False,
        "platform_company_match": False,
        "anonymous_source": False,
        "messaging_channel": False,
        "impersonation": False,
        "free_email": False,
        "free_email_for_brand": False,
        "email_matches_company": False,
        "links_match_company": False,
        "new_domain": False,
        "young_domain": False,
        "company_resolved": bool(company),
        "well_known_company": bool(company and company.get("well_known")),
    }

    # 1. Where the posting lives
    platform = source_class.get("platform")
    if input_type != "url":
        checks.append(_check("source", "Posting source", "info", f"Submitted as {input_type}; there is no page to trace, so the employer, contacts and links are checked instead."))
    elif company and any(domain_matches(source_host, o) for o in official):
        evidence["official_source"] = True
        checks.append(_check("source", "Posting source", "pass", f"Published on {company['name']}'s official website ({source_domain})."))
    elif source_class["type"] == "job_board":
        evidence["trusted_platform"] = True
        page = source_meta.get("company_page")
        if company and _slug_matches(page, company["name"]):
            evidence["platform_company_match"] = True
            checks.append(_check("source", "Posting source", "pass", f"Listed on {platform} by the employer's verified company page ({page})."))
        else:
            checks.append(_check("source", "Posting source", "pass", f"Listed on {platform}, an established job board with employer accounts."))
    elif source_class["type"] == "ats":
        evidence["trusted_platform"] = True
        if company and _slug_matches(source_url.split("?")[0].rstrip("/").rsplit("/jobs", 1)[0], company["name"]):
            evidence["platform_company_match"] = True
        checks.append(_check("source", "Posting source", "pass", f"Hosted on {platform}, an applicant-tracking system employers use for their own career pages."))
    elif source_class["type"] in ("anonymous", "messaging"):
        evidence["anonymous_source"] = True
        checks.append(_check("source", "Posting source", "fail", f"Hosted on {source_domain}, where anyone can publish anonymously — this says nothing about who the employer is."))
    else:
        checks.append(_check("source", "Posting source", "warn", f"Published on {source_domain}, which is not a recognised job board or the employer's official domain."))

    # 2. Who the employer is
    if company:
        how = {"registry": "a widely recognised employer", "wikidata": "a registered organisation with a public record", "web_search": "found via web search"}[company["source"]]
        checks.append(_check("employer", "Employer identified", "pass", f"{company['name']} — {how}. Official site: {company['website']}"))
    elif claimed_name:
        checks.append(_check("employer", "Employer identified", "warn", f"The posting names “{claimed_name}”, but no official website or public record could be found for it."))
    else:
        checks.append(_check("employer", "Employer identified", "warn", "The posting does not clearly name a hiring company."))

    # 3. Contact emails
    for d in email_domains:
        if any(domain_matches(d, o) for o in official):
            evidence["email_matches_company"] = True
        elif is_free_email(d):
            evidence["free_email"] = True
            if company:
                evidence["free_email_for_brand"] = True
        elif company and looks_like_impersonation(d, company["name"], official):
            evidence["impersonation"] = True
    if email_domains:
        if evidence["impersonation"]:
            checks.append(_check("email", "Recruiter email", "fail", f"Email domain imitates {company['name']} but is not one of its domains ({', '.join(email_domains)})."))
        elif evidence["free_email_for_brand"]:
            checks.append(_check("email", "Recruiter email", "fail", f"Uses a free personal mailbox ({', '.join(d for d in email_domains if is_free_email(d))}) instead of {company['name']}'s corporate domain."))
        elif evidence["free_email"]:
            checks.append(_check("email", "Recruiter email", "warn", "Uses a free personal mailbox rather than a company domain."))
        elif evidence["email_matches_company"]:
            checks.append(_check("email", "Recruiter email", "pass", f"Email domain matches the employer ({', '.join(email_domains)})."))
        else:
            checks.append(_check("email", "Recruiter email", "warn", f"Email domain {', '.join(email_domains)} could not be linked to the employer."))

    # 4. Links in the posting
    bad_links, good_links = [], []
    for d in link_domains:
        cls = classify_host(d)
        if any(domain_matches(d, o) for o in official):
            good_links.append(d)
        elif cls["type"] in ("job_board", "ats"):
            good_links.append(d)
        elif cls["type"] == "messaging":
            evidence["messaging_channel"] = True
            bad_links.append(f"{d} ({cls['platform']})")
        elif cls["type"] == "anonymous":
            bad_links.append(f"{d} (anonymous host / link shortener)")
        elif company and looks_like_impersonation(d, company["name"], official):
            evidence["impersonation"] = True
            bad_links.append(f"{d} (imitates {company['name']})")
    if good_links and not bad_links:
        evidence["links_match_company"] = True
    if link_domains:
        if bad_links:
            checks.append(_check("links", "Links in the posting", "fail", "Suspicious links: " + "; ".join(bad_links)))
        elif good_links:
            checks.append(_check("links", "Links in the posting", "pass", "Links point to the employer or a recognised hiring platform."))
        else:
            checks.append(_check("links", "Links in the posting", "warn", f"Links point to {', '.join(link_domains[:3])}, which could not be tied to the employer."))
    if re.search(r"\b(telegram|whats\s?app|signal app|wechat)\b", text, re.IGNORECASE) and not evidence["official_source"]:
        evidence["messaging_channel"] = True

    # 5. Domain age for unfamiliar domains (run in parallel, network-bound)
    unfamiliar = [
        d for d in {source_domain, *link_domains, *(e for e in email_domains if not is_free_email(e))}
        if d and classify_host(d)["type"] == "web" and not any(domain_matches(d, o) for o in official) and not company_for_domain(d)
    ][:4]
    if company and company["source"] != "registry" and official:
        unfamiliar.append(official[0])
    if unfamiliar:
        with ThreadPoolExecutor(max_workers=4) as pool:
            ages = dict(zip(unfamiliar, pool.map(domain_age_days, unfamiliar)))
        young = {d: a for d, a in ages.items() if a is not None and a < YOUNG_DOMAIN_DAYS}
        if young:
            newest = min(young.values())
            evidence["new_domain"] = newest < NEW_DOMAIN_DAYS
            evidence["young_domain"] = True
            checks.append(_check("domain_age", "Domain age", "fail" if evidence["new_domain"] else "warn", "Recently registered: " + ", ".join(f"{d} ({a} days old)" for d, a in young.items())))
        elif any(a is not None for a in ages.values()):
            oldest = max(a for a in ages.values() if a is not None)
            checks.append(_check("domain_age", "Domain age", "pass", f"Domains involved have been registered for {oldest // 365}+ years."))

    domain_for_logo = official[0] if official else None
    return {
        "company": {
            "name": company["name"] if company else claimed_name,
            "website": company["website"] if company else None,
            "officialDomains": official,
            # A web-search hit is only a likely match; registry/Wikidata are verified records.
            "verified": bool(company and company["source"] in ("registry", "wikidata")),
            "lookupSource": company["source"] if company else None,
            "wellKnown": bool(company and company.get("well_known")),
            "logo": _logo_url(domain_for_logo),
            "description": company.get("description") if company else None,
        },
        "source": {
            "inputType": input_type,
            "url": source_url,
            "domain": source_domain,
            "platform": platform or (company["name"] if evidence["official_source"] and company else None),
            "platformType": "official" if evidence["official_source"] else source_class["type"],
            "companyPage": source_meta.get("company_page"),
            "applyUrl": source_meta.get("apply_url"),
            "posted": source_meta.get("posted"),
        },
        "contacts": {"emailDomains": email_domains, "linkDomains": link_domains},
        "checks": checks,
        "evidence": evidence,
    }
