import pytest

from ai_service.decision_support.recommendation import generate_decision_support


def test_low_risk_suppresses_warnings_per_fr_7_4():
    result = generate_decision_support("Low", {"flags": ["registration_fee_requested"]})
    assert result["warnings"] == []
    assert result["verification_suggestions"] == []
    assert result["recommendation"] == "Appears trustworthy — perform normal verification."


def test_critical_risk_includes_prefixed_warnings():
    severity_result = {"flags": ["registration_fee_requested", "whatsapp_only_contact"]}
    result = generate_decision_support("Critical", severity_result)
    assert result["recommendation"] == "Do NOT apply."
    assert len(result["warnings"]) == 2
    assert all(w.startswith("Critical warning: ") for w in result["warnings"])
    assert len(result["verification_suggestions"]) > 0


def test_medium_risk_uses_note_prefix():
    result = generate_decision_support("Medium", {"flags": ["unrealistic_salary"]})
    assert result["warnings"][0].startswith("Note: ")


def test_unknown_risk_category_raises():
    with pytest.raises(ValueError):
        generate_decision_support("Unknown", {"flags": []})


def test_flags_with_no_matching_message_are_silently_skipped():
    result = generate_decision_support("High", {"flags": ["not_a_real_flag"]})
    assert result["warnings"] == []
