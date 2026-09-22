"""Fetch and verify the EMSCAD (fake job postings) dataset.

Downloads a public, authentication-free mirror of the Kaggle EMSCAD dataset
and verifies it against the dataset's known public statistics before writing
it to disk. See README.md in this directory for provenance details.
"""
from __future__ import annotations

import csv
import sys
import urllib.request
from pathlib import Path

MIRROR_URL = (
    "https://raw.githubusercontent.com/abbylmm/fake_job_posting/main/data/fake_job_postings.csv"
)
OUTPUT_PATH = Path(__file__).parent / "fake_job_postings.csv"

EXPECTED_ROW_COUNT = 17_880
EXPECTED_FRAUD_COUNT = 866
EXPECTED_COLUMNS = [
    "job_id", "title", "location", "department", "salary_range",
    "company_profile", "description", "requirements", "benefits",
    "telecommuting", "has_company_logo", "has_questions", "employment_type",
    "required_experience", "required_education", "industry", "function",
    "fraudulent",
]


def download(url: str, dest: Path) -> None:
    print(f"Downloading dataset from {url} ...")
    with urllib.request.urlopen(url, timeout=60) as response:
        data = response.read()
    dest.write_bytes(data)
    print(f"Wrote {len(data):,} bytes to {dest}")


def verify(path: Path) -> None:
    csv.field_size_limit(10_000_000)
    with path.open(encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        header = next(reader)
        if header != EXPECTED_COLUMNS:
            raise ValueError(
                f"Column mismatch.\nExpected: {EXPECTED_COLUMNS}\nFound:    {header}"
            )
        fraud_idx = header.index("fraudulent")
        row_count = 0
        fraud_count = 0
        for row in reader:
            row_count += 1
            if len(row) > fraud_idx and row[fraud_idx].strip() == "1":
                fraud_count += 1

    if row_count != EXPECTED_ROW_COUNT:
        raise ValueError(f"Row count mismatch: expected {EXPECTED_ROW_COUNT}, found {row_count}")
    if fraud_count != EXPECTED_FRAUD_COUNT:
        raise ValueError(
            f"Fraudulent-label count mismatch: expected {EXPECTED_FRAUD_COUNT}, found {fraud_count}"
        )

    print(f"Verified: {row_count:,} rows, {fraud_count} fraudulent "
          f"({100 * fraud_count / row_count:.2f}%), schema matches EMSCAD.")


def main() -> int:
    if OUTPUT_PATH.exists():
        print(f"{OUTPUT_PATH} already exists -- verifying in place (skip download).")
    else:
        download(MIRROR_URL, OUTPUT_PATH)

    try:
        verify(OUTPUT_PATH)
    except ValueError as exc:
        print(f"VERIFICATION FAILED: {exc}", file=sys.stderr)
        OUTPUT_PATH.unlink(missing_ok=True)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
