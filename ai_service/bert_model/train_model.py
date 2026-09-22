"""Fine-tune bert-base-uncased on EMSCAD (SRS FR-3.1, FR-3.5).

Run as a script: `python -m ai_service.bert_model.train_model`

Production-training features present here (per project requirements):
tokenizer (shared with inference), train/val split, checkpoint saving,
early stopping, linear-warmup LR scheduler, mixed precision (fp16 on CUDA),
gradient clipping, TensorBoard logging, automatic resume from the last
checkpoint, best-model selection by validation F1, and versioned model
artifacts with a pointer file recording which version is "current".

Class-imbalance handling (not explicit in the SRS, added per Phase 1
gap-resolution, approved 2026-07-29): EMSCAD is ~4.85% positive class
(docs/eda/eda_report.md). Training with unweighted cross-entropy on data this
skewed lets a model reach high accuracy by simply predicting "legitimate"
every time, which would fail NFR-20's actual intent (parity with Fraud-BERT's
reported 0.93 F1 / 99% accuracy) even while accuracy looks fine. `WeightedTrainer`
below applies inverse-frequency class weights to the loss to counter this.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from transformers import (
    AutoModelForSequenceClassification,
    EarlyStoppingCallback,
    Trainer,
    TrainingArguments,
)

from ai_service.bert_model.dataset import EmscadDataset
from ai_service.config.business_rules import BERT_MODEL_NAME

PROCESSED_DIR = Path(__file__).resolve().parents[1] / "dataset" / "processed"
MODELS_STORE_DIR = Path(__file__).resolve().parents[1] / "models_store"
RUNS_DIR = MODELS_STORE_DIR / "runs"

# Fraud-BERT baseline (Taneja, Vashishtha & Ratnoo, 2025): F1 0.93, accuracy 99%
# on EMSCAD — https://link.springer.com/article/10.1007/s10791-025-09502-8
BASELINE_F1 = 0.93
BASELINE_ACCURACY = 0.99


class WeightedTrainer(Trainer):
    """Overrides Trainer's loss to apply class weights (imbalance handling)."""

    def __init__(self, *args, class_weights: torch.Tensor, **kwargs):
        super().__init__(*args, **kwargs)
        self.class_weights = class_weights

    def compute_loss(self, model, inputs, return_outputs=False, num_items_in_batch=None):
        labels = inputs.pop("labels")
        outputs = model(**inputs)
        logits = outputs.logits
        loss_fct = nn.CrossEntropyLoss(weight=self.class_weights.to(logits.device))
        loss = loss_fct(logits, labels)
        return (loss, outputs) if return_outputs else loss


def compute_metrics(eval_pred) -> dict:
    logits, labels = eval_pred
    probs = torch.softmax(torch.tensor(logits), dim=1)[:, 1].numpy()
    preds = np.argmax(logits, axis=1)
    return {
        "accuracy": accuracy_score(labels, preds),
        "precision": precision_score(labels, preds, zero_division=0),
        "recall": recall_score(labels, preds, zero_division=0),
        "f1": f1_score(labels, preds, zero_division=0),
        "roc_auc": roc_auc_score(labels, probs),
    }


def compute_class_weights(train_dataset: EmscadDataset) -> torch.Tensor:
    counts = train_dataset.class_counts()
    total = counts[0] + counts[1]
    # Inverse-frequency weighting, normalized so weights average to ~1.
    weight_0 = total / (2 * counts[0])
    weight_1 = total / (2 * counts[1])
    return torch.tensor([weight_0, weight_1], dtype=torch.float)


def find_last_checkpoint() -> str | None:
    if not RUNS_DIR.exists():
        return None
    checkpoints = sorted(
        RUNS_DIR.glob("checkpoint-*"),
        key=lambda p: int(p.name.split("-")[-1]),
    )
    return str(checkpoints[-1]) if checkpoints else None


def save_versioned_artifact(trainer: Trainer, eval_metrics: dict) -> Path:
    """Model versioning: each training run gets its own timestamped
    directory; models_store/latest.json points at whichever version is
    "current" for the AI service to load at startup."""
    version = datetime.now(timezone.utc).strftime("v%Y%m%dT%H%M%SZ")
    version_dir = MODELS_STORE_DIR / "bert_fraud_classifier" / version
    version_dir.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(version_dir))

    metadata = {
        "version": version,
        "base_model": BERT_MODEL_NAME,
        "eval_metrics": eval_metrics,
        "baseline_comparison": {
            "fraud_bert_f1": BASELINE_F1,
            "fraud_bert_accuracy": BASELINE_ACCURACY,
            "meets_or_exceeds_baseline": (
                eval_metrics.get("eval_f1", 0) >= BASELINE_F1
                and eval_metrics.get("eval_accuracy", 0) >= BASELINE_ACCURACY
            ),
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    (version_dir / "training_metadata.json").write_text(json.dumps(metadata, indent=2))

    latest_pointer = MODELS_STORE_DIR / "latest.json"
    latest_pointer.write_text(json.dumps({"current_version": version}, indent=2))
    return version_dir


def run() -> dict:
    train_dataset = EmscadDataset(PROCESSED_DIR / "train.csv")
    val_dataset = EmscadDataset(PROCESSED_DIR / "val.csv")
    class_weights = compute_class_weights(train_dataset)

    model = AutoModelForSequenceClassification.from_pretrained(BERT_MODEL_NAME, num_labels=2)
    cuda_available = torch.cuda.is_available()

    training_args = TrainingArguments(
        output_dir=str(RUNS_DIR),
        num_train_epochs=4,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=16,
        gradient_accumulation_steps=2,  # effective batch size 16
        learning_rate=2e-5,
        weight_decay=0.01,
        warmup_ratio=0.1,
        lr_scheduler_type="linear",
        max_grad_norm=1.0,  # gradient clipping
        fp16=cuda_available,  # mixed precision on GPU; CPU-only stays fp32
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        greater_is_better=True,
        logging_dir=str(RUNS_DIR / "tensorboard"),
        logging_strategy="steps",
        logging_steps=50,
        report_to=["tensorboard"],
        seed=42,
    )

    trainer = WeightedTrainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
        class_weights=class_weights,
    )

    resume_checkpoint = find_last_checkpoint()
    trainer.train(resume_from_checkpoint=resume_checkpoint)

    eval_metrics = trainer.evaluate()
    version_dir = save_versioned_artifact(trainer, eval_metrics)

    print(f"Training complete. Best model saved to {version_dir}")
    print(json.dumps(eval_metrics, indent=2))
    return eval_metrics


if __name__ == "__main__":
    run()
