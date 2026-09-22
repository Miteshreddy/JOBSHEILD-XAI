"""Stratified train/validation/test split of the raw EMSCAD CSV.

Stratification on `fraudulent` matters here specifically because the positive
class is only ~4.85% of the data (see docs/eda/eda_report.md) — a non-stratified
split risks a test/val fold with too few fraudulent examples to evaluate
Precision/Recall/F1/ROC-AUC (NFR-20) meaningfully.

Run as a script: `python -m ai_service.preprocessing.dataset_split`
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

DATASET_PATH = Path(__file__).resolve().parents[1] / "dataset" / "fake_job_postings.csv"
PROCESSED_DIR = Path(__file__).resolve().parents[1] / "dataset" / "processed"

TRAIN_FRACTION = 0.70
VAL_FRACTION = 0.15
TEST_FRACTION = 0.15
RANDOM_STATE = 42


def split(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    train_df, temp_df = train_test_split(
        df,
        train_size=TRAIN_FRACTION,
        stratify=df["fraudulent"],
        random_state=RANDOM_STATE,
    )
    relative_val_fraction = VAL_FRACTION / (VAL_FRACTION + TEST_FRACTION)
    val_df, test_df = train_test_split(
        temp_df,
        train_size=relative_val_fraction,
        stratify=temp_df["fraudulent"],
        random_state=RANDOM_STATE,
    )
    return train_df, val_df, test_df


def run() -> dict:
    df = pd.read_csv(DATASET_PATH)
    train_df, val_df, test_df = split(df)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    train_df.to_csv(PROCESSED_DIR / "train.csv", index=False)
    val_df.to_csv(PROCESSED_DIR / "val.csv", index=False)
    test_df.to_csv(PROCESSED_DIR / "test.csv", index=False)

    summary = {
        "train": {"rows": len(train_df), "fraudulent": int(train_df["fraudulent"].sum())},
        "val": {"rows": len(val_df), "fraudulent": int(val_df["fraudulent"].sum())},
        "test": {"rows": len(test_df), "fraudulent": int(test_df["fraudulent"].sum())},
    }
    print(summary)
    return summary


if __name__ == "__main__":
    run()
