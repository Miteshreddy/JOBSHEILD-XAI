"""Module 4 — Risk Categorization (SRS FR-5.1-5.3, Section 7.2).

SRS Section 7.2 gives four anchor rows, not full coverage of the
fraud-probability x trust-score grid (e.g. probability=0.45, trust=45 matches
no row literally, and the High/Critical rows overlap in probability space for
p > 0.85, differentiated only by trust). This is a real gap in the SRS as
written (flagged in Phase 1, approved 2026-07-29) — this module resolves it
with a documented, deterministic tier-combination function that reduces to
the SRS's exact four anchors at those points and provides full, auditable
coverage everywhere else.

Method: decompose each axis into 4 ordered tiers (matching the SRS's own
breakpoints), sum the two tier indices into a single 0-6 "combined index", and
map ranges of that index to a category. This exactly reproduces all four SRS
anchor rows (verified in the docstring below and in tests) while remaining
monotonic: more suspicious on either axis never decreases risk.

Fraud-probability tiers (breakpoints from SRS Section 7.2):
    0: p < 0.30
    1: 0.30 <= p <= 0.60
    2: 0.60 <  p <= 0.85
    3: p > 0.85

Trust-score tiers (breakpoints from SRS Section 7.2; the SRS's own "60-80" and
"30-60" rows overlap at exactly 60 — resolved here by keeping 60 in the
higher-trust tier):
    0: trust > 80
    1: 60 <= trust <= 80
    2: 30 <= trust < 60
    3: trust < 30

Combined index (fraud tier + trust tier, range 0-6) -> category:
    0-1: Low       (reproduces SRS row: p<0.30, trust>80 -> combined 0)
    2-3: Medium     (reproduces SRS row: 0.30<=p<=0.60, 60<=trust<=80 -> combined 2)
    4-5: High       (reproduces SRS row: p>0.60, 30<=trust<60 -> combined 4 or 5)
    6:   Critical   (reproduces SRS row: p>0.85, trust<30 -> combined 6, the
                      only cell where both axes are simultaneously worst-case)
"""
from __future__ import annotations

_COMBINED_INDEX_TO_CATEGORY = {
    0: "Low", 1: "Low",
    2: "Medium", 3: "Medium",
    4: "High", 5: "High",
    6: "Critical",
}


def _probability_tier(fraud_probability: float) -> int:
    if fraud_probability < 0.30:
        return 0
    if fraud_probability <= 0.60:
        return 1
    if fraud_probability <= 0.85:
        return 2
    return 3


def _trust_tier(trust_score: float) -> int:
    if trust_score > 80:
        return 0
    if trust_score >= 60:
        return 1
    if trust_score >= 30:
        return 2
    return 3


def categorize_risk(fraud_probability: float, trust_score: float) -> str:
    """FR-5.1/5.2: exactly one risk category from fraud probability + trust score."""
    if not 0.0 <= fraud_probability <= 1.0:
        raise ValueError(f"fraud_probability must be in [0, 1], got {fraud_probability}")
    if not 0 <= trust_score <= 100:
        raise ValueError(f"trust_score must be in [0, 100], got {trust_score}")

    combined_index = _probability_tier(fraud_probability) + _trust_tier(trust_score)
    return _COMBINED_INDEX_TO_CATEGORY[combined_index]
