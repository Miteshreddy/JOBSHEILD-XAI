"""Module 3 — Trust Assessment Engine (SRS FR-4.1-4.8, Section 7.1).

Deterministic, rule-based, reproducible: Trust Score = 100 - sum(penalties for
detected conditions). No ML model here by design (a second black box would
defeat the point of an *explainable* trust signal) — every point deducted
traces to one named, testable detector in ai_service/signals/detectors.py.
"""
from __future__ import annotations

from ai_service.config.business_rules import TRUST_BANDS, TRUST_PENALTIES, TRUST_SCORE_START
from ai_service.signals.detectors import detect_all_signals


def _band_for_score(score: int) -> str:
    for min_inclusive, max_inclusive, label in TRUST_BANDS:
        if min_inclusive <= score <= max_inclusive:
            return label
    raise ValueError(f"Trust score {score} did not match any band — check TRUST_BANDS coverage")


def compute_trust_score(fields: dict, signals: dict[str, bool] | None = None) -> dict:
    """Compute the Trust Score for one advertisement's raw fields.

    `signals` may be passed in (already computed once for Severity too) to
    avoid re-running the same regex detectors twice per request; if omitted,
    they're computed here.
    """
    if signals is None:
        signals = detect_all_signals(fields)

    penalties_applied = []
    total_penalty = 0
    for condition, penalty in TRUST_PENALTIES.items():
        if signals.get(condition):
            penalties_applied.append({"condition": condition, "penalty": -penalty})
            total_penalty += penalty

    score = max(0, min(TRUST_SCORE_START, TRUST_SCORE_START - total_penalty))
    return {
        "score": score,
        "band": _band_for_score(score),
        "penalties_applied": penalties_applied,
    }
