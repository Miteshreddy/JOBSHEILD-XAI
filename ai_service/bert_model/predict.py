"""Serving-time inference for the text classifier.

Runs the ONNX-exported, int8-quantised DistilBERT with onnxruntime and blends
it with the TF-IDF lexical model, using the ensemble weight and threshold
tuned on the validation set (models_store/classifier/metadata.json).
No PyTorch is needed at serving time.
"""
from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path

import numpy as np

MODELS_STORE_DIR = Path(__file__).resolve().parents[1] / "models_store"
CLASSIFIER_DIR = Path(os.environ.get("CLASSIFIER_DIR", MODELS_STORE_DIR / "classifier"))


class ModelNotTrainedError(RuntimeError):
    """Raised when no trained classifier artifact is available."""


def resolve_current_model_dir() -> Path:
    if not (CLASSIFIER_DIR / "model.onnx").exists():
        raise ModelNotTrainedError(
            f"No trained classifier found in {CLASSIFIER_DIR}. "
            "Run `python -m ai_service.bert_model.train_model` first."
        )
    return CLASSIFIER_DIR


@lru_cache(maxsize=1)
def get_metadata() -> dict:
    return json.loads((resolve_current_model_dir() / "metadata.json").read_text())


@lru_cache(maxsize=1)
def get_model():
    """Loads (session, tokenizer, lexical_model) once per process."""
    import joblib
    import onnxruntime as ort
    from tokenizers import Tokenizer

    model_dir = resolve_current_model_dir()
    options = ort.SessionOptions()
    options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    session = ort.InferenceSession(str(model_dir / "model.onnx"), options, providers=["CPUExecutionProvider"])
    tokenizer = Tokenizer.from_file(str(model_dir / "tokenizer.json"))
    tokenizer.enable_truncation(max_length=get_metadata().get("max_length", 256))
    tokenizer.enable_padding(pad_id=0, pad_token="[PAD]")
    lexical_path = model_dir / "lexical.joblib"
    lexical = joblib.load(lexical_path) if lexical_path.exists() else None
    return session, tokenizer, lexical


def _transformer_probs(texts: list[str], batch_size: int = 16) -> np.ndarray:
    session, tokenizer, _ = get_model()
    out = []
    for start in range(0, len(texts), batch_size):
        encodings = tokenizer.encode_batch(texts[start : start + batch_size])
        ids = np.array([e.ids for e in encodings], dtype=np.int64)
        mask = np.array([e.attention_mask for e in encodings], dtype=np.int64)
        logits = session.run(["logits"], {"input_ids": ids, "attention_mask": mask})[0]
        e = np.exp(logits - logits.max(axis=1, keepdims=True))
        out.append((e / e.sum(axis=1, keepdims=True))[:, 1])
    return np.concatenate(out) if out else np.array([])


def _component_probs(texts: list[str]) -> tuple[np.ndarray, np.ndarray | None]:
    _, _, lexical = get_model()
    p_t = _transformer_probs(texts)
    p_l = lexical.predict_proba(texts)[:, 1] if lexical is not None else None
    return p_t, p_l


def _blend(p_t: np.ndarray, p_l: np.ndarray | None) -> np.ndarray:
    if p_l is None:
        return p_t
    w = float(get_metadata().get("ensemble_weight_transformer", 0.5))
    return w * p_t + (1 - w) * p_l


def predict_fraud_probability(text: str, decision_threshold: float | None = None) -> dict:
    threshold = decision_threshold if decision_threshold is not None else float(get_metadata().get("decision_threshold", 0.5))
    p_t, p_l = _component_probs([text])
    p = float(_blend(p_t, p_l)[0])
    return {
        "fraud_probability": p,
        "prediction_label": "fraudulent" if p >= threshold else "legitimate",
        "threshold": threshold,
        "components": {"transformer": float(p_t[0]), "lexical": float(p_l[0]) if p_l is not None else None},
    }


def predict_proba_batch(texts) -> np.ndarray:
    """(n, 2) class probabilities — the `texts -> probs` function LIME/SHAP perturb."""
    texts = [str(t) for t in texts]
    p = _blend(*_component_probs(texts))
    return np.stack([1 - p, p], axis=1)
