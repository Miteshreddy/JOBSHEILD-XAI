"""Module 5 — Fraud Severity Assessment (SRS FR-6.1-6.7, Section 7.3).

Independent of the raw fraud probability by design (FR-6.x note): a posting
can score high fraud probability from the classifier while this engine
separately quantifies *how dangerous* it is via concrete high-harm patterns
(registration fees, unrealistic salary, etc.), each carrying its own point
value from Section 7.3's table.
"""
from __future__ import annotations

from ai_service.config.business_rules import SEVERITY_BANDS, SEVERITY_POINTS
from ai_service.signals.detectors import detect_all_signals


def _band_for_score(score: int) -> str:
    for min_inclusive, max_inclusive, label in SEVERITY_BANDS:
        if min_inclusive <= score <= max_inclusive:
            return label
    raise ValueError(f"Severity score {score} did not match any band — check SEVERITY_BANDS coverage")


def compute_severity_score(fields: dict, signals: dict[str, bool] | None = None) -> dict:
    if signals is None:
        signals = detect_all_signals(fields)

    flags_triggered = []
    total_points = 0
    for condition, points in SEVERITY_POINTS.items():
        if signals.get(condition):
            flags_triggered.append(condition)
            total_points += points

    score = min(100, total_points)
    return {
        "score": score,
        "band": _band_for_score(score),
        "flags": flags_triggered,
    }
