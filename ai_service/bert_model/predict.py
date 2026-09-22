"""Serving-time inference for the fine-tuned fraud classifier (SRS FR-3.2-3.4).

Loads whichever model version `models_store/latest.json` currently points at.
Every downstream module (trust/risk/severity/decision/XAI) treats the output
of `predict_fraud_probability` as one input signal, never a final answer
(FR-3.4).
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

import numpy as np
import torch

from ai_service.config.business_rules import BERT_MAX_SEQUENCE_LENGTH, DEFAULT_FRAUD_DECISION_THRESHOLD
from ai_service.preprocessing.preprocess import get_tokenizer, tokenize_for_bert

MODELS_STORE_DIR = Path(__file__).resolve().parents[1] / "models_store"


class ModelNotTrainedError(RuntimeError):
    """Raised when no trained model artifact is available yet."""


def resolve_current_model_dir() -> Path:
    latest_pointer = MODELS_STORE_DIR / "latest.json"
    if not latest_pointer.exists():
        raise ModelNotTrainedError(
            "No trained model found (models_store/latest.json missing). "
            "Run `python -m ai_service.bert_model.train_model` first."
        )
    pointer = json.loads(latest_pointer.read_text())
    version_dir = MODELS_STORE_DIR / "bert_fraud_classifier" / pointer["current_version"]
    if not version_dir.exists():
        raise ModelNotTrainedError(f"Pointed-at model version not found: {version_dir}")
    return version_dir


@lru_cache(maxsize=1)
def get_model():
    from transformers import AutoModelForSequenceClassification

    version_dir = resolve_current_model_dir()
    model = AutoModelForSequenceClassification.from_pretrained(str(version_dir))
    model.eval()
    if torch.cuda.is_available():
        model = model.to("cuda")
    return model


def predict_fraud_probability(
    text: str, decision_threshold: float = DEFAULT_FRAUD_DECISION_THRESHOLD
) -> dict:
    """FR-3.2/3.3: continuous fraud probability + thresholded discrete label."""
    model = get_model()
    tokens = tokenize_for_bert(text)
    device = next(model.parameters()).device
    input_ids = torch.tensor([tokens["input_ids"]], device=device)
    attention_mask = torch.tensor([tokens["attention_mask"]], device=device)

    with torch.no_grad():
        logits = model(input_ids=input_ids, attention_mask=attention_mask).logits
        probs = torch.softmax(logits, dim=1)[0]

    fraud_probability = probs[1].item()
    label = "fraudulent" if fraud_probability >= decision_threshold else "legitimate"
    return {"fraud_probability": fraud_probability, "prediction_label": label}


def predict_proba_batch(texts, batch_size: int = 16) -> np.ndarray:
    """Batch class-probability prediction, shape (len(texts), 2).

    Used by the XAI layer (SHAP/LIME need a model-agnostic `texts -> probs`
    function to perturb inputs against), not by the main single-instance
    request path. Accepts anything iterable of strings — SHAP's masker calls
    this with a numpy array of dtype=object rather than a plain list, whose
    slices the tokenizer rejects unless coerced to `list[str]` first.
    """
    texts = [str(t) for t in texts]
    model = get_model()
    tokenizer = get_tokenizer()
    device = next(model.parameters()).device

    all_probs = []
    for start in range(0, len(texts), batch_size):
        batch = texts[start : start + batch_size]
        encoded = tokenizer(
            batch,
            truncation=True,
            padding="max_length",
            max_length=BERT_MAX_SEQUENCE_LENGTH,
            return_tensors="pt",
        ).to(device)
        with torch.no_grad():
            logits = model(**encoded).logits
            probs = torch.softmax(logits, dim=1).cpu().numpy()
        all_probs.append(probs)
    return np.concatenate(all_probs, axis=0)
