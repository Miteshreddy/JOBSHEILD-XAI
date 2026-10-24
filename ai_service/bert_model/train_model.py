"""Train the text classifier on the multi-source corpus and export it for serving.

Run (after build_training_corpus.py):
    python -m ai_service.bert_model.train_model [--epochs 2] [--max-length 256]

What it produces in models_store/classifier/:
  model.onnx            DistilBERT fine-tuned, exported to ONNX and int8-quantised
  tokenizer.json, ...   the matching WordPiece tokenizer
  lexical.joblib        TF-IDF (word + char n-gram) logistic regression
  metadata.json         ensemble weight, decision threshold, metrics, data summary

Design choices (CPU-only training box, see docs/model_evaluation_report.md):
  * distilbert-base-uncased (66M params): ~2.5x faster than bert-base on CPU,
    typically within ~1 F1 point of it on this task.
  * max_length 256 with dynamic padding: most postings carry
    their discriminative cues early, and padding to 512 wastes most compute.
  * class-weighted loss (fraud is ~4% of rows).
  * the ensemble weight and decision threshold are tuned on VALIDATION only;
    TEST is touched once, at the end, and reported per source.
"""
from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import FeatureUnion, make_pipeline
from torch.utils.data import Dataset
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    EarlyStoppingCallback,
    Trainer,
    TrainingArguments,
)

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "dataset" / "processed_v2"
STORE = ROOT / "models_store"
OUT_DIR = STORE / "classifier"
RUNS_DIR = STORE / "runs"
BASE_MODEL = "distilbert-base-uncased"


class TextDataset(Dataset):
    def __init__(self, df: pd.DataFrame, tokenizer, max_length: int):
        self.labels = df.label.astype(int).tolist()
        self.enc = tokenizer(df.text.astype(str).tolist(), truncation=True, max_length=max_length)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, i):
        item = {k: v[i] for k, v in self.enc.items()}
        item["labels"] = self.labels[i]
        return item


class WeightedTrainer(Trainer):
    def __init__(self, *args, class_weights: torch.Tensor, **kwargs):
        super().__init__(*args, **kwargs)
        self.class_weights = class_weights

    def compute_loss(self, model, inputs, return_outputs=False, num_items_in_batch=None):
        labels = inputs.pop("labels")
        outputs = model(**inputs)
        loss = nn.CrossEntropyLoss(weight=self.class_weights.to(outputs.logits.device))(outputs.logits, labels)
        return (loss, outputs) if return_outputs else loss


def softmax_fraud(logits: np.ndarray) -> np.ndarray:
    e = np.exp(logits - logits.max(axis=1, keepdims=True))
    return (e / e.sum(axis=1, keepdims=True))[:, 1]


def metrics_at(labels, probs, threshold: float) -> dict:
    preds = (probs >= threshold).astype(int)
    return {
        "accuracy": round(float(accuracy_score(labels, preds)), 4),
        "precision": round(float(precision_score(labels, preds, zero_division=0)), 4),
        "recall": round(float(recall_score(labels, preds, zero_division=0)), 4),
        "f1": round(float(f1_score(labels, preds, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(labels, probs)), 4) if len(set(labels)) > 1 else None,
        "pr_auc": round(float(average_precision_score(labels, probs)), 4) if len(set(labels)) > 1 else None,
        "confusion_matrix": confusion_matrix(labels, preds, labels=[0, 1]).tolist(),
        "n": int(len(labels)),
        "positives": int(np.sum(labels)),
    }


def train_lexical(train: pd.DataFrame):
    features = FeatureUnion([
        ("word", TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=60000, sublinear_tf=True)),
        ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=3, max_features=60000, sublinear_tf=True)),
    ])
    model = make_pipeline(features, LogisticRegression(C=4.0, class_weight="balanced", max_iter=2000))
    model.fit(train.text.astype(str), train.label.astype(int))
    return model


def tune(val_labels, p_transformer, p_lexical) -> tuple[float, float, float]:
    best = (0.0, 0.5, 0.5)
    for w in np.arange(0.0, 1.01, 0.1):
        p = w * p_transformer + (1 - w) * p_lexical
        for t in np.arange(0.2, 0.91, 0.025):
            f1 = f1_score(val_labels, (p >= t).astype(int), zero_division=0)
            if f1 > best[0]:
                best = (f1, round(float(w), 2), round(float(t), 3))
    return best


def export_onnx(model, tokenizer, out_dir: Path) -> None:
    from onnxruntime.quantization import QuantType, quantize_dynamic

    model = model.cpu().eval()
    sample = tokenizer(["export sample text"], return_tensors="pt")
    fp32 = out_dir / "model_fp32.onnx"
    torch.onnx.export(
        model,
        (sample["input_ids"], sample["attention_mask"]),
        str(fp32),
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={"input_ids": {0: "batch", 1: "seq"}, "attention_mask": {0: "batch", 1: "seq"}, "logits": {0: "batch"}},
        opset_version=17,
        dynamo=False,
    )
    quantize_dynamic(str(fp32), str(out_dir / "model.onnx"), weight_type=QuantType.QInt8)
    fp32.unlink()


def run(epochs: float, max_length: int, batch_size: int, max_train_rows: int | None = None, freeze_layers: int = 0, eval_during_training: bool = True) -> dict:
    torch.manual_seed(42)
    full_train_df = pd.read_csv(DATA_DIR / "train.csv").dropna(subset=["text"])
    train_df = full_train_df
    if max_train_rows and len(train_df) > max_train_rows:
        # Time-budgeted run: keep every fraud example, sample the legit rows.
        fraud = train_df[train_df.label == 1]
        legit = train_df[train_df.label == 0].sample(n=max_train_rows - len(fraud), random_state=42)
        train_df = pd.concat([fraud, legit]).sample(frac=1, random_state=42)
    val_df = pd.read_csv(DATA_DIR / "val.csv").dropna(subset=["text"])
    test_df = pd.read_csv(DATA_DIR / "test.csv").dropna(subset=["text"])

    print("Training lexical model ...")
    lexical = train_lexical(full_train_df)  # cheap, so it always sees every row

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    model = AutoModelForSequenceClassification.from_pretrained(BASE_MODEL, num_labels=2)
    if freeze_layers:
        # Freeze embeddings + the lowest transformer blocks: general language
        # features stay as pre-trained, and backprop through them is skipped.
        for param in model.distilbert.embeddings.parameters():
            param.requires_grad = False
        for block in model.distilbert.transformer.layer[:freeze_layers]:
            for param in block.parameters():
                param.requires_grad = False
    train_ds, val_ds = TextDataset(train_df, tokenizer, max_length), TextDataset(val_df, tokenizer, max_length)
    counts = np.bincount(train_df.label.astype(int), minlength=2)
    class_weights = torch.tensor(len(train_df) / (2 * counts), dtype=torch.float)

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        probs = softmax_fraud(logits)
        return {"f1": f1_score(labels, (probs >= 0.5).astype(int), zero_division=0), "pr_auc": average_precision_score(labels, probs)}

    args = TrainingArguments(
        output_dir=str(RUNS_DIR),
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=32,
        learning_rate=3e-5,
        weight_decay=0.01,
        warmup_ratio=0.06,
        lr_scheduler_type="linear",
        max_grad_norm=1.0,
        eval_strategy="steps" if eval_during_training else "no",
        eval_steps=400,
        save_strategy="steps" if eval_during_training else "no",
        save_steps=400,
        save_total_limit=2,
        load_best_model_at_end=eval_during_training,
        metric_for_best_model="pr_auc",
        greater_is_better=True,
        logging_steps=50,
        report_to=[],
        seed=42,
        dataloader_num_workers=0,
    )
    trainer = WeightedTrainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        data_collator=DataCollatorWithPadding(tokenizer),
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=3)] if eval_during_training else [],
        class_weights=class_weights,
    )
    resume = sorted(RUNS_DIR.glob("checkpoint-*"), key=lambda p: int(p.name.split("-")[-1])) if RUNS_DIR.exists() else []
    trainer.train(resume_from_checkpoint=str(resume[-1]) if resume else None)

    def transformer_probs(df):
        return softmax_fraud(trainer.predict(TextDataset(df, tokenizer, max_length)).predictions)

    val_t, val_l = transformer_probs(val_df), lexical.predict_proba(val_df.text.astype(str))[:, 1]
    best_f1, weight, threshold = tune(val_df.label.values, val_t, val_l)
    print(f"Validation-tuned ensemble: weight={weight} threshold={threshold} F1={best_f1:.4f}")

    test_t, test_l = transformer_probs(test_df), lexical.predict_proba(test_df.text.astype(str))[:, 1]
    test_p = weight * test_t + (1 - weight) * test_l
    y = test_df.label.values
    report = {
        "ensemble": metrics_at(y, test_p, threshold),
        "transformer_only@0.5": metrics_at(y, test_t, 0.5),
        "lexical_only@0.5": metrics_at(y, test_l, 0.5),
        "by_source": {
            src: metrics_at(y[mask], test_p[mask], threshold)
            for src in sorted(test_df.source.unique())
            if (mask := (test_df.source == src).values).sum() > 0
        },
    }

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True)
    tokenizer.save_pretrained(OUT_DIR)
    export_onnx(trainer.model, tokenizer, OUT_DIR)
    joblib.dump(lexical, OUT_DIR / "lexical.joblib", compress=3)
    metadata = {
        "version": datetime.now(timezone.utc).strftime("v2-%Y%m%dT%H%M%SZ"),
        "base_model": BASE_MODEL,
        "parameters": int(sum(p.numel() for p in trainer.model.parameters())),
        "max_length": max_length,
        "ensemble_weight_transformer": weight,
        "decision_threshold": threshold,
        "validation_f1": round(best_f1, 4),
        "test_metrics": report,
        "data_summary": json.loads((DATA_DIR / "summary.json").read_text()),
        "epochs": epochs,
        "transformer_train_rows": int(len(train_df)),
        "frozen_layers": freeze_layers,
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }
    (OUT_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2))
    print(json.dumps(report["ensemble"], indent=2))
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=float, default=2)
    parser.add_argument("--max-length", type=int, default=256)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--max-train-rows", type=int, default=None, help="cap transformer training rows (keeps all fraud)")
    parser.add_argument("--freeze-layers", type=int, default=0, help="freeze embeddings + this many lower blocks")
    parser.add_argument("--fast", action="store_true", help="~30 min CPU budget: 128 tokens, 1 epoch, 13k rows, 3 frozen blocks, no mid-run eval")
    a = parser.parse_args()
    if a.fast:
        run(1, 128, 16, max_train_rows=13000, freeze_layers=3, eval_during_training=False)
    else:
        run(a.epochs, a.max_length, a.batch_size, a.max_train_rows, a.freeze_layers)
