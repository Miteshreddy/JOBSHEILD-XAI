import pytest

from ai_service.risk_engine.risk_category import categorize_risk


def test_srs_anchor_low():
    # SRS 7.2 row 1: prob < 0.30, trust > 80 -> Low
    assert categorize_risk(0.10, 95) == "Low"
    assert categorize_risk(0.29, 81) == "Low"


def test_srs_anchor_medium():
    # SRS 7.2 row 2: 0.30 <= prob <= 0.60, 60 <= trust <= 80 -> Medium
    assert categorize_risk(0.30, 60) == "Medium"
    assert categorize_risk(0.45, 70) == "Medium"
    assert categorize_risk(0.60, 80) == "Medium"


def test_srs_anchor_high():
    # SRS 7.2 row 3: prob > 0.60, 30 <= trust < 60 -> High
    assert categorize_risk(0.70, 45) == "High"
    assert categorize_risk(0.90, 30) == "High"  # high prob but not lowest trust tier -> still High, not Critical


def test_srs_anchor_critical():
    # SRS 7.2 row 4: prob > 0.85, trust < 30 -> Critical, the joint-extreme cell
    assert categorize_risk(0.92, 18) == "Critical"
    assert categorize_risk(0.99, 0) == "Critical"


def test_previously_uncovered_gap_cell_resolves_without_error():
    # prob=0.45, trust=45 matched no literal row in SRS Section 7.2
    result = categorize_risk(0.45, 45)
    assert result in {"Low", "Medium", "High", "Critical"}
    assert result == "Medium"  # prob tier1 (1) + trust tier2 (2) = combined 3 -> Medium


def test_monotonic_worse_trust_never_reduces_risk():
    # Holding probability fixed, decreasing trust should never move risk down a tier
    order = ["Low", "Medium", "High", "Critical"]
    categories = [categorize_risk(0.5, t) for t in (95, 70, 45, 10)]
    indices = [order.index(c) for c in categories]
    assert indices == sorted(indices)


def test_rejects_out_of_range_inputs():
    with pytest.raises(ValueError):
        categorize_risk(1.5, 50)
    with pytest.raises(ValueError):
        categorize_risk(0.5, 150)
