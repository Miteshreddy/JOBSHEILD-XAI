"""Real end-to-end run of the full pipeline with the shipped classifier — no
mocking of the model. The reasoning LLM is switched off so the test is
deterministic and runs without Ollama; network lookups are stubbed."""
import pytest

from ai_service import pipeline
from ai_service.verification import company_resolver, verify

pytestmark = pytest.mark.slow


@pytest.fixture(autouse=True)
def offline(monkeypatch):
    monkeypatch.setattr(verify, "domain_age_days", lambda d, timeout=6.0: None)
    monkeypatch.setattr(company_resolver, "_from_wikidata", lambda name: None)
    monkeypatch.setattr(company_resolver, "_from_web_search", lambda name: None)
    company_resolver.resolve_company.cache_clear()


FRAUDULENT = {
    "description": (
        "URGENT FACULTY REQUIREMENT!!! Salary: Rs 2,00,000 per month. No experience required. "
        "Registration Fee: Rs 500. Contact through WhatsApp only."
    )
}

LEGITIMATE_MICROSOFT_ON_LINKEDIN = {
    "title": "Software Engineer",
    "company_profile": "Microsoft",
    "description": (
        "Our team builds client and service components within Intune. You will design, build and "
        "operate services used by millions of users. Required: 3+ years of experience with C#, C++ "
        "or Java, and a BS in Computer Science or related field."
    ),
    "location": "Cambridge, MA",
    "employment_type": "Full-time",
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


def test_fraudulent_example_end_to_end():
    result = pipeline.run_analysis_pipeline(FRAUDULENT, input_type="text", use_llm=False)
    assert result["verdict"] == "fraudulent"
    assert result["legitimacyScore"] <= 15
    assert result["signals"]["language"]["available"] is True
    assert result["explanation"]["method"] == "shap"
    assert any("fee" in r.lower() for r in result["redFlags"])
    assert len(result["reasoning"]) >= 3


def test_legitimate_example_end_to_end():
    result = pipeline.run_analysis_pipeline(LEGITIMATE_MICROSOFT_ON_LINKEDIN, input_type="url", use_llm=False)
    assert result["verdict"] == "legitimate"
    assert result["legitimacyScore"] >= 95
    assert result["company"]["website"] == "https://microsoft.com"
    assert result["source"]["platform"] == "LinkedIn"
    assert result["redFlags"] == []
