from ai_service.trust_engine.trust_score import compute_trust_score


def test_no_signals_gives_perfect_score():
    result = compute_trust_score({}, signals={})
    assert result["score"] == 100
    assert result["band"] == "Highly Trustworthy"
    assert result["penalties_applied"] == []


def test_single_penalty_applied():
    signals = {"registration_fee_requested": True}
    result = compute_trust_score({}, signals=signals)
    assert result["score"] == 70
    assert result["band"] == "Moderately Trustworthy"
    assert result["penalties_applied"] == [{"condition": "registration_fee_requested", "penalty": -30}]


def test_score_clamped_at_zero():
    signals = {
        "registration_fee_requested": True, "personal_email_domain": True,
        "missing_company_profile": True, "missing_company_website": True,
        "unrealistic_salary": True, "whatsapp_only_contact": True,
        "missing_location": True, "poor_grammar_or_spam_wording": True,
    }
    result = compute_trust_score({}, signals=signals)
    assert result["score"] == 0
    assert result["band"] == "Very Low Trust"


def test_band_boundaries():
    assert compute_trust_score({}, signals={})["band"] == "Highly Trustworthy"  # 100
    # 100 - 20 (missing_company_profile) = 80 -> Highly Trustworthy (80-100)
    assert compute_trust_score({}, signals={"missing_company_profile": True})["band"] == "Highly Trustworthy"
    # 100 - 30 (registration_fee) = 70 -> Moderately Trustworthy (60-79)
    assert compute_trust_score({}, signals={"registration_fee_requested": True})["band"] == "Moderately Trustworthy"
    # 100 - 30 - 20 = 50 -> Suspicious (30-59)
    assert compute_trust_score(
        {}, signals={"registration_fee_requested": True, "unrealistic_salary": True}
    )["band"] == "Suspicious"
