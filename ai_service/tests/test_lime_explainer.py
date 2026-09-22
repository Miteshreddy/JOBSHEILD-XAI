import numpy as np

from ai_service.xai import lime_explainer

FRAUD_KEYWORDS = {"urgent", "fee", "whatsapp"}


def fake_predict_proba(texts: list[str]) -> np.ndarray:
    """Deterministic stand-in for the real BERT model: fraud probability
    scales with how many fraud-keyword hits a text contains. Lets us verify
    LIME correctly attributes those exact words without needing trained
    model weights."""
    probs = []
    for text in texts:
        hits = sum(1 for word in text.lower().split() if word.strip(".,!") in FRAUD_KEYWORDS)
        fraud_p = min(0.95, 0.05 + 0.3 * hits)
        probs.append([1 - fraud_p, fraud_p])
    return np.array(probs)


def test_local_explanation_surfaces_fraud_keywords(monkeypatch):
    monkeypatch.setattr(lime_explainer, "predict_proba_batch", fake_predict_proba)

    text = "urgent hiring pay a fee now contact whatsapp only"
    result = lime_explainer.generate_local_explanation(text, num_features=5, num_samples=200)

    assert result["type"] == "lime_local"
    assert result["target_class"] == "fraudulent"
    top_features = {row["feature"].lower() for row in result["features"]}
    assert top_features & FRAUD_KEYWORDS  # at least one fraud keyword surfaced


def test_local_explanation_returns_ranked_weight_pairs(monkeypatch):
    monkeypatch.setattr(lime_explainer, "predict_proba_batch", fake_predict_proba)

    result = lime_explainer.generate_local_explanation(
        "a normal job posting with no red flags at all", num_features=5, num_samples=200
    )
    for row in result["features"]:
        assert "feature" in row
        assert isinstance(row["weight"], float)
