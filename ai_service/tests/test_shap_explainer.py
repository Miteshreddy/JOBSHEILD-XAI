import numpy as np
import pytest

from ai_service.xai import shap_explainer

FRAUD_KEYWORDS = {"urgent", "fee", "whatsapp"}


def fake_predict_proba(texts: list[str]) -> np.ndarray:
    probs = []
    for text in texts:
        hits = sum(1 for word in text.lower().split() if word.strip(".,!") in FRAUD_KEYWORDS)
        fraud_p = min(0.95, 0.05 + 0.3 * hits)
        probs.append([1 - fraud_p, fraud_p])
    return np.array(probs)


@pytest.fixture(autouse=True)
def patch_predict(monkeypatch):
    monkeypatch.setattr(shap_explainer, "predict_proba_batch", fake_predict_proba)


def test_compute_global_shap_importance_ranks_fraud_keywords_highest():
    sample_texts = [
        "urgent hiring pay a registration fee now",
        "contact us on whatsapp only for urgent processing",
        "a normal job posting with clear requirements",
        "we are hiring a software engineer for our team",
    ]
    result = shap_explainer.compute_global_shap_importance(sample_texts, top_n=10)

    assert result["type"] == "shap_global"
    assert result["target_class"] == "fraudulent"
    assert result["sample_size"] == len(sample_texts)
    assert len(result["features"]) > 0

    top_words = {row["feature"] for row in result["features"][:5]}
    assert top_words & FRAUD_KEYWORDS

    # Ranked descending by mean absolute impact
    impacts = [row["mean_abs_impact"] for row in result["features"]]
    assert impacts == sorted(impacts, reverse=True)


def test_precompute_and_cache_writes_and_reloads(tmp_path, monkeypatch):
    monkeypatch.setattr(shap_explainer, "resolve_current_model_dir", lambda: tmp_path)
    monkeypatch.setattr(
        shap_explainer,
        "_sample_texts",
        lambda n: ["urgent fee whatsapp"] * (n // 2) + ["normal legitimate posting"] * (n - n // 2),
    )

    cache_path = shap_explainer.precompute_and_cache(sample_size=4, top_n=5)
    assert cache_path.exists()

    loaded = shap_explainer.get_cached_global_explanation()
    assert loaded["type"] == "shap_global"
