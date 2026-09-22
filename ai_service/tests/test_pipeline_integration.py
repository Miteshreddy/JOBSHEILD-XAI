"""Real end-to-end run of the full pipeline (Modules 1-7) against the SRS's
own worked examples (Appendix B) — no mocking. Requires a trained model
(models_store/) and a precomputed SHAP cache to exist; these are the only
tests in the suite that depend on both being present.
"""
import pytest

from ai_service.pipeline import run_analysis_pipeline

pytestmark = pytest.mark.slow

FRAUDULENT_AD_FIELDS = {
    "title": "",
    "company_profile": "",
    "description": ("URGENT FACULTY REQUIREMENT!!! Salary: Rs 2,00,000 per month. "
                     "No experience required. Registration Fee: Rs 500. "
                     "Contact through WhatsApp only."),
    "requirements": "",
    "benefits": "",
    "location": "",
    "salary_range": "",
    "employment_type": "",
}

LEGITIMATE_AD_FIELDS = {
    "title": "Assistant Professor",
    "company_profile": "Keshav Memorial Institute of Technology (KMIT) is an established "
                        "engineering college in Hyderabad, affiliated to Osmania University.",
    "description": "KMIT invites applications for the post of Assistant Professor in "
                    "Computer Science. Visit https://kmit.in/careers for details.",
    "requirements": "M.Tech or Ph.D in Computer Science or a related discipline.",
    "benefits": "Health insurance, provident fund, and research support.",
    "location": "Hyderabad, India",
    "salary_range": "",
    "employment_type": "Full-time",
}


def test_fraudulent_worked_example_end_to_end():
    result = run_analysis_pipeline(FRAUDULENT_AD_FIELDS)

    assert result["predictionLabel"] == "fraudulent"
    assert result["fraudProbability"] > 0.5
    assert result["riskCategory"] in {"High", "Critical"}
    assert result["decision"]["recommendation"] in {
        "Do NOT apply.",
        "Manual verification required before proceeding.",
    }
    assert len(result["decision"]["warnings"]) > 0

    # NFR-19: every prediction gets both a global and local explanation
    assert result["shapExplanation"]["type"] == "shap_global"
    assert len(result["shapExplanation"]["features"]) > 0
    assert result["limeExplanation"]["type"] == "lime_local"
    assert len(result["limeExplanation"]["features"]) > 0


def test_legitimate_worked_example_end_to_end():
    result = run_analysis_pipeline(LEGITIMATE_AD_FIELDS)

    assert result["predictionLabel"] == "legitimate"
    assert result["fraudProbability"] < 0.5
    assert result["riskCategory"] == "Low"
    assert result["trustBand"] == "Highly Trustworthy"
    assert result["decision"]["warnings"] == []
