import numpy as np
import pytest

from ai_service.xai import shap_explainer

FRAUD_KEYWORDS = {"urgent", "fee", "whatsapp"}


def fake_predict_proba(texts) -> np.ndarray:
    probs = []
    for text in texts:
        hits = sum(1 for word in str(text).lower().split() if word.strip(".,!") in FRAUD_KEYWORDS)
        fraud_p = min(0.95, 0.05 + 0.3 * hits)
        probs.append([1 - fraud_p, fraud_p])
    return np.array(probs)


@pytest.fixture(autouse=True)
def patch_predict(monkeypatch):
    monkeypatch.setattr(shap_explainer, "predict_proba_batch", fake_predict_proba)


def test_local_explanation_attributes_score_to_fraud_words():
    result = shap_explainer.explain_prediction("urgent hiring please pay the registration fee on whatsapp today", max_evals=200)
    assert result["method"] == "shap"
    top = [w["term"] for w in result["words"][:3]]
    assert set(top) == FRAUD_KEYWORDS
    assert all(w["weight"] > 0 for w in result["words"][:3])


def test_local_explanation_is_additive():
    """Shapley values sum to (score - baseline)."""
    text = "urgent fee whatsapp"
    result = shap_explainer.explain_prediction(text, max_evals=200)
    total = sum(w["weight"] for w in result["words"])
    assert result["outputValue"] == pytest.approx(fake_predict_proba([text])[0, 1], abs=0.01)
    assert result["baseValue"] + total == pytest.approx(result["outputValue"], abs=0.02)


def test_stopwords_are_not_reported():
    result = shap_explainer.explain_prediction("the and for with urgent", max_evals=100)
    assert {w["term"] for w in result["words"]} <= {"urgent"}


def test_global_importance_ranks_fraud_keywords_highest():
    texts = [
        "urgent hiring pay a registration fee now",
        "contact us on whatsapp only for urgent processing",
        "a normal job posting with clear requirements",
        "we are hiring a software engineer for our team",
    ]
    result = shap_explainer.compute_global_importance(texts, top_n=10, max_evals=100)
    assert result["method"] == "shap_global"
    assert result["sampleSize"] == len(texts)
    assert {row["term"] for row in result["words"][:3]} & FRAUD_KEYWORDS


def test_cached_global_explanation_round_trip(tmp_path, monkeypatch):
    monkeypatch.setattr(shap_explainer, "resolve_current_model_dir", lambda: tmp_path)
    assert shap_explainer.get_cached_global_explanation() is None
    (tmp_path / shap_explainer.CACHE_FILENAME).write_text('{"method": "shap_global", "words": []}')
    assert shap_explainer.get_cached_global_explanation()["method"] == "shap_global"
