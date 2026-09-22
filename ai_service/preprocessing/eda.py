"""Exploratory data analysis on the raw EMSCAD CSV.

Run as a script: `python -m ai_service.preprocessing.eda`
Writes a markdown report + PNG charts to docs/eda/ so findings are reviewable
without re-running the analysis.
"""
from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")  # headless — this runs in a script/CI context, not a notebook
import matplotlib.pyplot as plt
import pandas as pd

DATASET_PATH = Path(__file__).resolve().parents[1] / "dataset" / "fake_job_postings.csv"
OUTPUT_DIR = Path(__file__).resolve().parents[2] / "docs" / "eda"

TEXT_FIELDS = [
    "title", "location", "department", "salary_range", "company_profile",
    "description", "requirements", "benefits", "employment_type",
    "required_experience", "required_education", "industry", "function",
]


def load_dataset() -> pd.DataFrame:
    return pd.read_csv(DATASET_PATH)


def compute_missingness(df: pd.DataFrame) -> pd.DataFrame:
    missing_count = df.isna().sum()
    # Empty-string / whitespace-only is also effectively "missing" for text fields
    for col in TEXT_FIELDS:
        if col in df.columns:
            blank_mask = df[col].isna() | (df[col].astype(str).str.strip() == "")
            missing_count[col] = int(blank_mask.sum())
    missing_pct = (missing_count / len(df) * 100).round(2)
    return pd.DataFrame({"missing_count": missing_count, "missing_pct": missing_pct}).sort_values(
        "missing_pct", ascending=False
    )


def compute_class_balance(df: pd.DataFrame) -> dict:
    counts = df["fraudulent"].value_counts().to_dict()
    total = len(df)
    return {
        "total": total,
        "legitimate": int(counts.get(0, 0)),
        "fraudulent": int(counts.get(1, 0)),
        "fraudulent_pct": round(100 * counts.get(1, 0) / total, 2),
    }


def compute_duplicates(df: pd.DataFrame) -> dict:
    full_dupes = int(df.duplicated().sum())
    text_cols = [c for c in ["title", "description"] if c in df.columns]
    text_dupes = int(df.duplicated(subset=text_cols).sum()) if text_cols else 0
    return {"full_row_duplicates": full_dupes, "title_description_duplicates": text_dupes}


def compute_missingness_by_class(df: pd.DataFrame) -> pd.DataFrame:
    """Missing company_profile / salary_range / benefits, split by label — these
    are exactly the signals the Trust/Severity engines score on, so this
    validates that the SRS's rule weights are pointed at real, present signal
    in the data rather than a hypothesis."""
    rows = []
    for col in ["company_profile", "salary_range", "benefits", "requirements"]:
        if col not in df.columns:
            continue
        blank = df[col].isna() | (df[col].astype(str).str.strip() == "")
        rows.append({
            "field": col,
            "missing_pct_legitimate": round(100 * blank[df["fraudulent"] == 0].mean(), 2),
            "missing_pct_fraudulent": round(100 * blank[df["fraudulent"] == 1].mean(), 2),
        })
    return pd.DataFrame(rows)


def plot_class_balance(balance: dict, out_dir: Path) -> None:
    fig, ax = plt.subplots(figsize=(4, 4))
    ax.bar(["Legitimate", "Fraudulent"], [balance["legitimate"], balance["fraudulent"]],
           color=["#2E7D32", "#C62828"])
    ax.set_title("EMSCAD class balance")
    ax.set_ylabel("Count")
    for i, v in enumerate([balance["legitimate"], balance["fraudulent"]]):
        ax.text(i, v, f"{v:,}", ha="center", va="bottom")
    fig.tight_layout()
    fig.savefig(out_dir / "class_balance.png", dpi=150)
    plt.close(fig)


def plot_missingness_by_class(missingness_by_class: pd.DataFrame, out_dir: Path) -> None:
    fig, ax = plt.subplots(figsize=(6, 4))
    x = range(len(missingness_by_class))
    width = 0.35
    ax.bar([i - width / 2 for i in x], missingness_by_class["missing_pct_legitimate"],
           width, label="Legitimate", color="#2E7D32")
    ax.bar([i + width / 2 for i in x], missingness_by_class["missing_pct_fraudulent"],
           width, label="Fraudulent", color="#C62828")
    ax.set_xticks(list(x))
    ax.set_xticklabels(missingness_by_class["field"], rotation=20)
    ax.set_ylabel("% missing")
    ax.set_title("Field missingness: legitimate vs fraudulent")
    ax.legend()
    fig.tight_layout()
    fig.savefig(out_dir / "missingness_by_class.png", dpi=150)
    plt.close(fig)


def plot_description_length(df: pd.DataFrame, out_dir: Path) -> None:
    lengths = df["description"].fillna("").astype(str).str.split().str.len()
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.hist(lengths[df["fraudulent"] == 0], bins=50, alpha=0.6, label="Legitimate",
            color="#2E7D32", range=(0, 500))
    ax.hist(lengths[df["fraudulent"] == 1], bins=50, alpha=0.6, label="Fraudulent",
            color="#C62828", range=(0, 500))
    ax.set_xlabel("Description word count")
    ax.set_ylabel("Number of postings")
    ax.set_title("Description length distribution")
    ax.legend()
    fig.tight_layout()
    fig.savefig(out_dir / "description_length.png", dpi=150)
    plt.close(fig)


def run() -> dict:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df = load_dataset()

    missingness = compute_missingness(df)
    balance = compute_class_balance(df)
    duplicates = compute_duplicates(df)
    missingness_by_class = compute_missingness_by_class(df)

    plot_class_balance(balance, OUTPUT_DIR)
    plot_missingness_by_class(missingness_by_class, OUTPUT_DIR)
    plot_description_length(df, OUTPUT_DIR)

    stats = {
        "shape": {"rows": df.shape[0], "columns": df.shape[1]},
        "class_balance": balance,
        "duplicates": duplicates,
        "missingness_top10": missingness.head(10).to_dict(orient="index"),
        "missingness_by_class": missingness_by_class.to_dict(orient="records"),
    }
    (OUTPUT_DIR / "eda_stats.json").write_text(json.dumps(stats, indent=2))

    report = _render_markdown_report(stats, missingness)
    (OUTPUT_DIR / "eda_report.md").write_text(report, encoding="utf-8")

    print(json.dumps(stats, indent=2))
    return stats


def _render_markdown_report(stats: dict, missingness: pd.DataFrame) -> str:
    balance = stats["class_balance"]
    dupes = stats["duplicates"]
    lines = [
        "# EMSCAD — Exploratory Data Analysis",
        "",
        f"Generated from `ai_service/dataset/fake_job_postings.csv` "
        f"({stats['shape']['rows']:,} rows, {stats['shape']['columns']} columns).",
        "",
        "## Class balance",
        "",
        f"- Legitimate: {balance['legitimate']:,}",
        f"- Fraudulent: {balance['fraudulent']:,} ({balance['fraudulent_pct']}%)",
        "",
        "**Implication**: severe class imbalance (~5% positive class). Training "
        "(Phase 4) applies class-weighted loss so the classifier does not "
        "collapse to always predicting 'legitimate' — a naive 95%-accuracy "
        "model that never flags fraud would fail the project's actual goal.",
        "",
        "![Class balance](class_balance.png)",
        "",
        "## Duplicates",
        "",
        f"- Full-row duplicates: {dupes['full_row_duplicates']}",
        f"- Title+description duplicates: {dupes['title_description_duplicates']}",
        "",
        "## Missingness (top 10 fields)",
        "",
        "| Field | Missing count | Missing % |",
        "|---|---|---|",
    ]
    for field, row in stats["missingness_top10"].items():
        lines.append(f"| {field} | {row['missing_count']} | {row['missing_pct']}% |")

    lines += [
        "",
        "## Missingness by class (fraud signal validation)",
        "",
        "This directly validates the SRS Section 7.1/7.3 rule weights — fields "
        "the Trust/Severity engines penalize for being absent really are "
        "missing far more often in fraudulent postings than legitimate ones:",
        "",
        "| Field | Missing % (legitimate) | Missing % (fraudulent) |",
        "|---|---|---|",
    ]
    for row in stats["missingness_by_class"]:
        lines.append(f"| {row['field']} | {row['missing_pct_legitimate']}% | {row['missing_pct_fraudulent']}% |")

    lines += [
        "",
        "![Missingness by class](missingness_by_class.png)",
        "",
        "## Description length",
        "",
        "![Description length distribution](description_length.png)",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    run()
