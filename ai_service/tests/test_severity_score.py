from ai_service.severity_engine.severity_score import compute_severity_score


def test_no_signals_gives_zero_low():
    result = compute_severity_score({}, signals={})
    assert result["score"] == 0
    assert result["band"] == "Low"
    assert result["flags"] == []


def test_registration_fee_alone_is_medium():
    result = compute_severity_score({}, signals={"registration_fee_requested": True})
    assert result["score"] == 30
    assert result["band"] == "Medium"
    assert result["flags"] == ["registration_fee_requested"]


def test_all_flags_capped_at_100_and_critical():
    signals = {
        "registration_fee_requested": True, "unrealistic_salary": True,
        "missing_company_profile": True, "whatsapp_only_contact": True,
        "urgent_or_spam_wording": True, "unverified_website_or_email": True,
    }
    result = compute_severity_score({}, signals=signals)
    assert result["score"] == 100
    assert result["band"] == "Critical"
    assert len(result["flags"]) == 6


def test_band_boundaries():
    assert compute_severity_score({}, signals={"unverified_website_or_email": True})["band"] == "Low"  # 10
    assert compute_severity_score(
        {}, signals={"unverified_website_or_email": True, "urgent_or_spam_wording": True}
    )["band"] == "Low"  # 20, inclusive upper bound of the Low band
    assert compute_severity_score({}, signals={"registration_fee_requested": True})["band"] == "Medium"  # 30
    assert compute_severity_score(
        {}, signals={"registration_fee_requested": True, "unrealistic_salary": True}
    )["band"] == "High"  # 50
