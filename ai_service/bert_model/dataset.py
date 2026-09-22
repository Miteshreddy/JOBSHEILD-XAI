"""PyTorch Dataset wrapping a preprocessed EMSCAD split (train/val/test.csv).

Text is built via the *exact same* `build_combined_text` used at inference
time (ai_service/preprocessing/text_cleaning.py) — this is what satisfies
FR-1.6 (every input channel routes through the identical downstream
pipeline): the classifier never sees a different text representation during
training than it will at serving time.
"""
from __future__ import annotations

import pandas as pd
import torch
from torch.utils.data import Dataset

from ai_service.config.business_rules import BERT_MAX_SEQUENCE_LENGTH
from ai_service.preprocessing.preprocess import get_tokenizer
from ai_service.preprocessing.text_cleaning import FIELD_ORDER, build_combined_text


class EmscadDataset(Dataset):
    def __init__(self, csv_path, max_length: int = BERT_MAX_SEQUENCE_LENGTH):
        df = pd.read_csv(csv_path)
        self.labels = df["fraudulent"].astype(int).tolist()

        records = df.to_dict(orient="records")
        texts = [
            build_combined_text({field: record.get(field) for field in FIELD_ORDER})
            for record in records
        ]

        tokenizer = get_tokenizer()
        encodings = tokenizer(
            texts,
            truncation=True,
            padding="max_length",
            max_length=max_length,
            return_tensors="pt",
        )
        self.input_ids = encodings["input_ids"]
        self.attention_mask = encodings["attention_mask"]

    def __len__(self) -> int:
        return len(self.labels)

    def __getitem__(self, idx: int) -> dict:
        return {
            "input_ids": self.input_ids[idx],
            "attention_mask": self.attention_mask[idx],
            "labels": torch.tensor(self.labels[idx], dtype=torch.long),
        }

    def class_counts(self) -> dict[int, int]:
        counts = {0: 0, 1: 0}
        for label in self.labels:
            counts[label] += 1
        return counts
