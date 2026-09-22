"""End-to-end walk-throughs of Modules 3-6 using the SRS's own worked examples
(Appendix B), so the rule engines are validated against the SRS's stated
intent, not just isolated unit assumptions.

Note: the SRS gives the *system's* final expected trust score (e.g. 18/100
for Example 2) but not the underlying field text needed to reproduce that
exact number — the classifier's fraud probability is treated here as a given
external input, since Module 2 (BERT) isn't built until Phase 4. These tests
assert *directional* correctness against the SRS narrative (severe fraud
signals -> very low trust -> critical risk -> "do not apply"), not exact
score equality.
"""
from ai_service.decision_support.recommendation import generate_decision_support
from ai_service.risk_engine.risk_category import categorize_risk
from ai_service.severity_engine.severity_score import compute_severity_score
from ai_service.signals.detectors import detect_all_signals
from ai_service.trust_engine.trust_score import compute_trust_score

# SRS Appendix B, Example 2 — Suspicious/Fraudulent Advertisement
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
# SRS states fraud probability 0.92 for this example; Module 2 isn't built
# yet in this phase, so it's supplied directly here.
FRAUDULENT_AD_FRAUD_PROBABILITY = 0.92

# SRS Appendix B, Example 1 — Legitimate Advertisement (KMIT)
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
LEGITIMATE_AD_FRAUD_PROBABILITY = 0.05


def _run_pipeline(fields: dict, fraud_probability: float) -> dict:
    signals = detect_all_signals(fields)
    trust_result = compute_trust_score(fields, signals=signals)
    severity_result = compute_severity_score(fields, signals=signals)
    risk_category = categorize_risk(fraud_probability, trust_result["score"])
    decision = generate_decision_support(risk_category, severity_result)
    return {
        "trust": trust_result,
        "severity": severity_result,
        "risk_category": risk_category,
        "decision": decision,
    }


def test_fraudulent_worked_example_reaches_critical_do_not_apply():
    result = _run_pipeline(FRAUDULENT_AD_FIELDS, FRAUDULENT_AD_FRAUD_PROBABILITY)

    assert result["trust"]["band"] in {"Very Low Trust", "Suspicious"}
    assert result["severity"]["band"] in {"High", "Critical"}
    assert result["risk_category"] == "Critical"
    assert result["decision"]["recommendation"] == "Do NOT apply."
    assert len(result["decision"]["warnings"]) > 0
    assert any("registration" in w.lower() for w in result["decision"]["warnings"])


def test_legitimate_worked_example_reaches_low_risk_trustworthy():
    result = _run_pipeline(LEGITIMATE_AD_FIELDS, LEGITIMATE_AD_FRAUD_PROBABILITY)

    assert result["trust"]["band"] == "Highly Trustworthy"
    assert result["severity"]["band"] == "Low"
    assert result["risk_category"] == "Low"
    assert result["decision"]["recommendation"] == "Appears trustworthy — perform normal verification."
    assert result["decision"]["warnings"] == []
