"""Module 7 orchestrator: combines the cached SHAP global explanation with a
freshly-computed LIME local explanation (SRS 7.5, NFR-19 — every prediction
gets both, never just one)."""
from __future__ import annotations

from ai_service.xai.lime_explainer import generate_local_explanation
from ai_service.xai.shap_explainer import get_cached_global_explanation


def generate_explanations(text: str) -> dict:
    return {
        "shap_global": get_cached_global_explanation(),
        "lime_local": generate_local_explanation(text),
    }
