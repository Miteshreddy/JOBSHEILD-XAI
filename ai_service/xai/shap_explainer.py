"""Module 7 (global half) — SHAP global feature importance (SRS FR-8.1, FR-8.3,
FR-8.4, NFR-2).

NFR-2: SHAP is markedly more expensive than LIME, so this is precomputed once
(`python -m ai_service.xai.shap_explainer`) against a sample of held-out
advertisements and cached to disk alongside the model version that produced
it — never recomputed synchronously inside a request. `get_cached_global_explanation`
is what the FastAPI service actually calls at serving time.

Word-level (not WordPiece-subtoken) masking is used deliberately: shap's
default `Text` masker splits on word boundaries, which keeps the ranked
features human-readable words per FR-8.4 rather than BERT subword pieces
like "##ing".
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd

from ai_service.bert_model.predict import resolve_current_model_dir, predict_proba_batch
from ai_service.preprocessing.text_cleaning import FIELD_ORDER, build_combined_text

CLASS_NAMES = ["legitimate", "fraudulent"]
DEFAULT_SAMPLE_SIZE = 40
DEFAULT_TOP_N = 25
CACHE_FILENAME = "shap_global_importance.json"

# A word/token that appears in only one sampled advertisement can still get a
# large SHAP magnitude (e.g. a rare identifier or a data-quality artifact
# from an individual posting) without being a genuine *global* pattern —
# discovered by inspecting real cached output, where every top-ranked
# "feature" had occurrences=1 (nonsense tokens like raw hex-looking strings,
# not words that actually recur across postings). Requiring a minimum repeat
# count is what makes this a population-level explanation (FR-8.1) rather
# than an accidental per-instance outlier.
MIN_OCCURRENCES_FOR_GLOBAL_RANKING = 2

PROCESSED_DIR = Path(__file__).resolve().parents[1] / "dataset" / "processed"


def _sample_texts(n: int) -> list[str]:
    df = pd.read_csv(PROCESSED_DIR / "test.csv")
    # Balanced sample: fraud is only ~4.85% of the data (docs/eda/eda_report.md);
    # an unstratified sample would barely include any fraudulent examples, and
    # "which words drive *fraud* predictions" needs enough fraudulent examples
    # to say anything meaningful.
    half = n // 2
    fraud_sample = df[df.fraudulent == 1].sample(n=min(half, (df.fraudulent == 1).sum()), random_state=42)
    legit_sample = df[df.fraudulent == 0].sample(n=n - len(fraud_sample), random_state=42)
    combined = pd.concat([fraud_sample, legit_sample])

    return [
        build_combined_text({field: record.get(field) for field in FIELD_ORDER})
        for record in combined.to_dict(orient="records")
    ]


def compute_global_shap_importance(sample_texts: list[str], top_n: int = DEFAULT_TOP_N) -> dict:
    import shap

    masker = shap.maskers.Text()
    explainer = shap.Explainer(predict_proba_batch, masker, output_names=CLASS_NAMES)
    shap_values = explainer(sample_texts)

    word_scores: dict[str, list[float]] = defaultdict(list)
    for i in range(len(sample_texts)):
        words = shap_values.data[i]
        fraud_contribs = shap_values.values[i][:, 1]
        for word, value in zip(words, fraud_contribs):
            normalized = word.strip().lower()
            if normalized:
                word_scores[normalized].append(float(value))

    min_occurrences = MIN_OCCURRENCES_FOR_GLOBAL_RANKING
    qualifying = {w: v for w, v in word_scores.items() if len(v) >= min_occurrences}
    if not qualifying:
        # Tiny sample (e.g. a handful of texts in a test) — fall back rather
        # than returning an empty explanation.
        qualifying = word_scores

    ranked = sorted(
        (
            {
                "feature": word,
                "mean_impact": float(np.mean(values)),
                "mean_abs_impact": float(np.mean(np.abs(values))),
                "occurrences": len(values),
            }
            for word, values in qualifying.items()
        ),
        key=lambda row: row["mean_abs_impact"],
        reverse=True,
    )[:top_n]

    return {
        "type": "shap_global",
        "target_class": "fraudulent",
        "features": ranked,
        "sample_size": len(sample_texts),
    }


def precompute_and_cache(sample_size: int = DEFAULT_SAMPLE_SIZE, top_n: int = DEFAULT_TOP_N) -> Path:
    version_dir = resolve_current_model_dir()
    texts = _sample_texts(sample_size)
    importance = compute_global_shap_importance(texts, top_n=top_n)

    cache_path = version_dir / CACHE_FILENAME
    cache_path.write_text(json.dumps(importance, indent=2))
    return cache_path


def get_cached_global_explanation() -> dict:
    version_dir = resolve_current_model_dir()
    cache_path = version_dir / CACHE_FILENAME
    if not cache_path.exists():
        raise FileNotFoundError(
            f"No cached SHAP global explanation at {cache_path}. "
            "Run `python -m ai_service.xai.shap_explainer` after training."
        )
    return json.loads(cache_path.read_text())


if __name__ == "__main__":
    path = precompute_and_cache()
    print(f"Cached global SHAP importance to {path}")
