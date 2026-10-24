"""SHAP explanations for the text classifier.

Local (per posting, used in every report): Shapley-value attribution of the
classifier's fraud probability to the words of the posting, computed with
SHAP's Partition explainer over a word-level text masker. The values are
additive — base rate + sum(word contributions) = the classifier's score — so
the report can say exactly how far each word moved the prediction.

Global (precomputed once per model version):
`python -m ai_service.xai.shap_explainer` averages local SHAP values over a
balanced sample of held-out postings and caches the words the model relies
on most, overall, next to the model artifact.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict

import numpy as np

from ai_service.bert_model.predict import predict_proba_batch, resolve_current_model_dir

CACHE_FILENAME = "shap_global_importance.json"
DEFAULT_MAX_EVALS = 300
WORD_RE = re.compile(r"[a-z][a-z'\-]{2,}")
# Function words carry no meaning on their own; attributions to them are
# real but unhelpful to a reader.
STOPWORDS = set(
    "the and for with you your our are was were this that from have has had will would can could should into onto "
    "about over under than then them they their there here what when where which while who whom why how all any "
    "each few more most other some such only own same very just also not but nor its it's we're you'll you're per "
    "been being does did doing out off again further once both too".split()
)


def _fraud_prob(texts) -> np.ndarray:
    return predict_proba_batch(texts)[:, 1]


def _masker():
    import shap

    # Split on non-word characters so attributions are whole words, not
    # WordPiece fragments like "##ing".
    return shap.maskers.Text(r"\W+")


def _aggregate(tokens, values) -> dict[str, float]:
    scores: dict[str, float] = defaultdict(float)
    for token, value in zip(tokens, values):
        word = str(token).strip().strip("-'").lower()
        if WORD_RE.fullmatch(word) and word not in STOPWORDS:
            scores[word] += float(value)
    return scores


def explain_prediction(text: str, max_evals: int = DEFAULT_MAX_EVALS, top_k: int = 12) -> dict:
    """Per-posting SHAP explanation: base rate, final score, and the words
    that moved the score the most (positive = toward scam)."""
    import shap

    explainer = shap.Explainer(_fraud_prob, _masker())
    explanation = explainer([text], max_evals=max_evals, batch_size=32, silent=True)
    tokens = explanation.data[0]
    values = np.asarray(explanation.values[0]).reshape(len(tokens), -1)[:, 0]
    base = float(np.asarray(explanation.base_values).reshape(-1)[0])

    scores = _aggregate(tokens, values)
    ranked = sorted(scores.items(), key=lambda kv: abs(kv[1]), reverse=True)
    words = [{"term": w, "weight": round(v, 4)} for w, v in ranked if abs(v) >= 0.002][:top_k]
    return {
        "method": "shap",
        "baseValue": round(base, 4),
        "outputValue": round(base + float(values.sum()), 4),
        "words": words,
    }


# --- Global ------------------------------------------------------------------

def compute_global_importance(texts: list[str], top_n: int = 25, max_evals: int = 200) -> dict:
    per_word: dict[str, list[float]] = defaultdict(list)
    for text in texts:
        local = explain_prediction(text, max_evals=max_evals, top_k=60)
        for item in local["words"]:
            per_word[item["term"]].append(item["weight"])
    recurring = {w: v for w, v in per_word.items() if len(v) >= 2} or per_word
    ranked = sorted(
        ({"term": w, "meanImpact": float(np.mean(v)), "occurrences": len(v)} for w, v in recurring.items()),
        key=lambda r: abs(r["meanImpact"]) * np.log1p(r["occurrences"]),
        reverse=True,
    )[:top_n]
    return {"method": "shap_global", "sampleSize": len(texts), "words": ranked}


def precompute_and_cache(sample_size: int = 40) -> str:
    import pandas as pd

    from ai_service.dataset.build_training_corpus import OUT_DIR

    df = pd.read_csv(OUT_DIR / "test.csv").dropna(subset=["text"])
    half = sample_size // 2
    sample = pd.concat([
        df[df.label == 1].sample(n=min(half, int(df.label.sum())), random_state=42),
        df[df.label == 0].sample(n=half, random_state=42),
    ])
    importance = compute_global_importance(sample.text.astype(str).tolist())
    path = resolve_current_model_dir() / CACHE_FILENAME
    path.write_text(json.dumps(importance, indent=2))
    return str(path)


def get_cached_global_explanation() -> dict | None:
    path = resolve_current_model_dir() / CACHE_FILENAME
    return json.loads(path.read_text()) if path.exists() else None


if __name__ == "__main__":
    print(f"Cached global SHAP importance to {precompute_and_cache()}")
