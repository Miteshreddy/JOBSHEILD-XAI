"""Scenario suite for verification + fusion: the logical guarantees the
verdict must satisfy regardless of what the text classifier or the LLM say.
Network lookups are stubbed; known employers resolve from the offline registry."""
import pytest

from ai_service.fusion.fuse import fuse
from ai_service.signals.detectors import detect_all_signals
from ai_service.verification import company_resolver, domains, verify


@pytest.fixture(autouse=True)
def offline(monkeypatch):
    monkeypatch.setattr(domains, "domain_age_days", lambda d, timeout=6.0: None)
    monkeypatch.setattr(verify, "domain_age_days", lambda d, timeout=6.0: None)
    monkeypatch.setattr(company_resolver, "_from_wikidata", lambda name: None)
    monkeypatch.setattr(company_resolver, "_from_web_search", lambda name: None)
    company_resolver.resolve_company.cache_clear()


def clf(p, threshold=0.5):
    return {"fraud_probability": p, "threshold": threshold, "prediction_label": "fraudulent" if p >= threshold else "legitimate"}


def run(fields, input_type, classifier=None, llm=None):
    text = "\n".join(str(v) for k, v in fields.items() if k != "_source" and isinstance(v, str))
    signals = detect_all_signals(fields)
    verification = verify.verify_posting(fields, text, input_type)
    return fuse(classifier, signals, verification, llm, input_type), verification


LINKEDIN_MSFT = {
    "title": "Software Engineer",
    "company_profile": "Microsoft",
    "description": "Overview: our team builds client and service components within Intune. Required: 3+ years of C# or C++.",
    "location": "Cambridge, MA",
    "_source": {
        "url": "https://www.linkedin.com/jobs/view/4480367579",
        "host": "www.linkedin.com",
        "domain": "linkedin.com",
        "type": "job_board",
        "platform": "LinkedIn",
        "company_name": "Microsoft",
        "company_page": "https://www.linkedin.com/company/microsoft",
    },
}


def test_microsoft_on_linkedin_is_at_least_95_even_if_classifier_unsure():
    result, verification = run(LINKEDIN_MSFT, "url", classifier=clf(0.45))
    assert verification["company"]["name"] == "Microsoft"
    assert verification["company"]["website"] == "https://microsoft.com"
    assert verification["source"]["platform"] == "LinkedIn"
    assert result["verdict"] == "legitimate"
    assert result["legitimacy_score"] >= 95
    assert result["rule_applied"] == "trusted_channel"


def test_official_careers_site_is_legitimate():
    fields = {
        "title": "Applied Scientist",
        "description": "Join Amazon's team building recommendation systems. Apply on this page.",
        "_source": {"url": "https://www.amazon.jobs/en/jobs/123", "host": "www.amazon.jobs", "domain": "amazon.jobs", "type": "web", "platform": None},
    }
    result, verification = run(fields, "url", classifier=clf(0.3))
    assert verification["source"]["platformType"] == "official"
    assert result["legitimacy_score"] >= 95


def test_brand_impersonation_is_a_scam_even_with_benign_wording():
    text = (
        "Microsoft HR is hiring remote assistants. Contact hr.microsoft.jobs@gmail.com "
        "and complete onboarding at micros0ft-careers.com."
    )
    result, verification = run({"description": text}, "text", classifier=clf(0.05), llm={"verdict": "legitimate", "confidence": 90})
    assert verification["evidence"]["impersonation"] is True
    assert result["verdict"] == "fraudulent"
    assert result["legitimacy_score"] <= 12


def test_fee_request_sets_fraud_floor():
    text = "Data entry job at Acme Ltd. Earn weekly. Pay a registration fee of $49 to get your login."
    result, _ = run({"description": text}, "text", classifier=clf(0.1))
    assert result["rule_applied"] == "fraud_floor"
    assert result["verdict"] == "fraudulent"


def test_fake_check_equipment_scam_without_fee_keywords():
    text = (
        "Welcome aboard at Nimbus Data Solutions! Our finance team will mail you a check for your home office. "
        "Deposit the check and purchase your equipment from our vendor. Interview will be held on Telegram."
    )
    result, _ = run({"description": text}, "text", classifier=clf(0.2))
    assert result["verdict"] == "fraudulent"


def test_text_with_matching_corporate_email_for_known_brand_is_legitimate():
    text = "Google is hiring a Site Reliability Engineer in Zurich. Questions: recruiting@google.com. Apply at https://careers.google.com/jobs/123."
    result, _ = run({"description": text}, "text", classifier=clf(0.2), llm={"verdict": "legitimate", "confidence": 85})
    assert result["verdict"] == "legitimate"
    assert result["legitimacy_score"] >= 95


def test_unverifiable_short_message_is_not_high_confidence_legitimate():
    text = "Hi, we have an opening for an office assistant. Interested candidates reply with your CV."
    result, _ = run({"description": text}, "text", classifier=clf(0.35))
    assert not (result["verdict"] == "legitimate" and result["confidence"] == "high")


def test_anonymous_google_form_host_is_penalised():
    fields = {
        "description": "Hiring part-time remote workers, fill this form to get selected immediately.",
        "_source": {"url": "https://forms.gle/abc", "host": "forms.gle", "domain": "forms.gle", "type": "anonymous", "platform": "forms.gle"},
    }
    result, verification = run(fields, "url", classifier=clf(0.5))
    assert verification["evidence"]["anonymous_source"] is True
    assert result["verdict"] != "legitimate"


def test_red_flag_on_trusted_platform_blocks_the_legitimacy_cap():
    fields = dict(LINKEDIN_MSFT)
    fields["description"] = LINKEDIN_MSFT["description"] + " Message our recruiter on WhatsApp only to schedule."
    result, _ = run(fields, "url", classifier=clf(0.4))
    assert result["rule_applied"] != "trusted_channel"


def test_works_without_classifier_or_llm():
    result, _ = run({"description": "Pay a registration fee of Rs 2000 for the training kit. WhatsApp only."}, "text")
    assert result["verdict"] == "fraudulent"
    assert all(f["label"] not in ("Language analysis", "Reasoning engine") for f in result["factors"])
