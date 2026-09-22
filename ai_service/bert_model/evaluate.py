"""Final held-out test-set evaluation (SRS NFR-20, Section 10 acceptance criteria).

Run as a script: `python -m ai_service.bert_model.evaluate`

The test split is never touched during training or early stopping (see
train_model.py, which only uses train.csv/val.csv) — this is the only script
that reads test.csv, so these numbers are a genuine held-out estimate.
Writes docs/model_evaluation_report.md.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from torch.utils.data import DataLoader

from ai_service.bert_model.dataset import EmscadDataset
from ai_service.bert_model.predict import get_model
from ai_service.bert_model.train_model import BASELINE_ACCURACY, BASELINE_F1
from ai_service.config.business_rules import DEFAULT_FRAUD_DECISION_THRESHOLD

PROCESSED_DIR = Path(__file__).resolve().parents[1] / "dataset" / "processed"
REPORT_PATH = Path(__file__).resolve().parents[2] / "docs" / "model_evaluation_report.md"


def run(batch_size: int = 32, decision_threshold: float = DEFAULT_FRAUD_DECISION_THRESHOLD) -> dict:
    test_dataset = EmscadDataset(PROCESSED_DIR / "test.csv")
    loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    model = get_model()
    device = next(model.parameters()).device

    all_preds, all_labels, all_probs = [], [], []
    with torch.no_grad():
        for batch in loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].numpy()

            logits = model(input_ids=input_ids, attention_mask=attention_mask).logits
            probs = torch.softmax(logits, dim=1)[:, 1].cpu().numpy()
            # Use the same decision_threshold predict.py applies at serving
            # time (Appendix D item 1) — NOT a naive argmax/0.5 split, so this
            # report reflects the system's actual production behavior.
            preds = (probs >= decision_threshold).astype(int)

            all_preds.extend(preds.tolist())
            all_labels.extend(labels.tolist())
            all_probs.extend(probs.tolist())

    metrics = {
        "accuracy": accuracy_score(all_labels, all_preds),
        "precision": precision_score(all_labels, all_preds, zero_division=0),
        "recall": recall_score(all_labels, all_preds, zero_division=0),
        "f1": f1_score(all_labels, all_preds, zero_division=0),
        "roc_auc": roc_auc_score(all_labels, all_probs),
    }
    cm = confusion_matrix(all_labels, all_preds).tolist()

    _write_report(metrics, cm, n=len(all_labels), decision_threshold=decision_threshold)
    print(json.dumps({"metrics": metrics, "confusion_matrix": cm}, indent=2))
    return metrics


def _write_report(metrics: dict, confusion: list, n: int, decision_threshold: float) -> None:
    meets_baseline = metrics["f1"] >= BASELINE_F1 and metrics["accuracy"] >= BASELINE_ACCURACY
    lines = [
        "# BERT Fraud Classifier — Held-Out Test Evaluation",
        "",
        f"Evaluated on {n} held-out test examples (never seen during training or "
        "validation-based early stopping/model selection), using the production "
        f"decision threshold of {decision_threshold} (tuned on the validation set).",
        "",
        "## Metrics",
        "",
        "| Metric | Value |",
        "|---|---|",
        f"| Accuracy | {metrics['accuracy']:.4f} |",
        f"| Precision | {metrics['precision']:.4f} |",
        f"| Recall | {metrics['recall']:.4f} |",
        f"| F1 | {metrics['f1']:.4f} |",
        f"| ROC-AUC | {metrics['roc_auc']:.4f} |",
        "",
        "## Confusion matrix",
        "",
        "| | Predicted legitimate | Predicted fraudulent |",
        "|---|---|---|",
        f"| Actual legitimate | {confusion[0][0]} | {confusion[0][1]} |",
        f"| Actual fraudulent | {confusion[1][0]} | {confusion[1][1]} |",
        "",
        "## Baseline comparison (NFR-20 acceptance criterion)",
        "",
        "Fraud-BERT (Taneja, Vashishtha & Ratnoo, *Discover Computing*, 2025) "
        f"reports F1 0.93 / accuracy 99% on EMSCAD "
        "([source](https://link.springer.com/article/10.1007/s10791-025-09502-8)).",
        "",
        f"**Meets or exceeds baseline: {'YES' if meets_baseline else 'NO'}**",
    ]
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    run()
