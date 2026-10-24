"""Build the multi-source training corpus for the text classifier.

Sources (all public):
  * EMSCAD / Kaggle "Real or Fake Job Postings" — 17,880 postings, 866 fraud (2012-14)
  * datastax/linkedin_job_listings (Hugging Face) — 123,849 real LinkedIn postings
    (2023-24); a capped sample is used as modern *legitimate* examples
  * sohaibdevv/Tech-Job-Scams-and-Predatory-Recruitment — modern tech-job scams
  * Aioshi/smolified-fakejob — short Indian job posts, labelled Real/Fake
  * synthetic_modern.jsonl — LLM-generated modern scams + genuine recruiter
    messages (generate_synthetic.py). TRAIN SPLIT ONLY, never evaluated on.

Leakage control (the original pipeline split EMSCAD randomly even though its
own EDA found 2,093 duplicate title+description pairs):
  1. exact + near-duplicate removal on a normalised text fingerprint
  2. per-company cap on LinkedIn rows, so the model can't memorise employers
  3. duplicates are removed BEFORE splitting, so no copy straddles splits

Short-text augmentation: real scams submitted by users are often short chat
messages, while most legitimate training postings are long. To stop the model
learning "short == scam", a share of legitimate (and fraudulent) training rows
are also added as random 30-90 word excerpts.

Run: python -m ai_service.dataset.build_training_corpus --raw-dir <dir>
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

from ai_service.preprocessing.text_cleaning import clean_text

DATASET_DIR = Path(__file__).parent
OUT_DIR = DATASET_DIR / "processed_v2"
SEED = 42
LINKEDIN_SAMPLE = 9000
LINKEDIN_PER_COMPANY_CAP = 25
SHORT_AUGMENT_FRACTION = 0.12


def fingerprint(text: str) -> str:
    norm = re.sub(r"[^a-z]+", " ", text.lower())
    norm = " ".join(norm.split()[:120])
    return hashlib.md5(norm.encode()).hexdigest()


# EMSCAD anonymises links/emails/phones as e.g. "#URL_0c8d3...#". Left in, they
# become hex-string tokens that exist only in EMSCAD — a dataset fingerprint
# the model would learn instead of fraud cues.
_EMSCAD_PLACEHOLDER_RE = re.compile(r"#(URL|EMAIL|PHONE)_[0-9a-fA-F]+#")


def join_fields(*parts) -> str:
    cleaned = (clean_text(_EMSCAD_PLACEHOLDER_RE.sub(" ", p)) for p in parts if isinstance(p, str))
    return ". ".join(c for c in cleaned if c)


def load_emscad(raw: Path) -> pd.DataFrame:
    df = pd.read_csv(raw / "fake_job_postings.csv")
    text = [
        join_fields(r.title, r.company_profile, r.description, r.requirements, r.benefits, r.location, r.salary_range, r.employment_type)
        for r in df.itertuples()
    ]
    return pd.DataFrame({"text": text, "label": df.fraudulent.astype(int), "source": "emscad"})


def load_linkedin(raw: Path) -> pd.DataFrame:
    files = sorted(raw.glob("datastax_linkedin_job_listings_*.parquet"))
    df = pd.concat([pd.read_parquet(f, columns=["company_name", "title", "description", "location", "min_salary", "max_salary", "pay_period"]) for f in files])
    df = df.dropna(subset=["description"])
    df = df[df.description.str.len() > 200]
    df = df.groupby(df.company_name.fillna("unknown"), group_keys=False).apply(
        lambda g: g.sample(n=min(len(g), LINKEDIN_PER_COMPANY_CAP), random_state=SEED)
    )
    df = df.sample(n=min(LINKEDIN_SAMPLE, len(df)), random_state=SEED)

    def salary(r):
        if pd.notna(r.min_salary) and pd.notna(r.max_salary):
            return f"{r.min_salary:.0f}-{r.max_salary:.0f} {r.pay_period or ''}"
        return None

    text = [join_fields(r.title, r.description, r.location, salary(r)) for r in df.itertuples()]
    return pd.DataFrame({"text": text, "label": 0, "source": "linkedin"})


def load_modern_scams(raw: Path) -> pd.DataFrame:
    frames = []
    tech = raw / "sohaibdevv_Tech-Job-Scams-and-Predatory-Recruitment_0.parquet"
    if tech.exists():
        t = pd.read_parquet(tech).drop_duplicates("text_sample")
        frames.append(pd.DataFrame({"text": t.text_sample.map(clean_text), "label": 1, "source": "tech_scams"}))
    indian = raw / "Aioshi_smolified-fakejob_0.parquet"
    if indian.exists():
        a = pd.read_parquet(indian)
        label = a.assistant.str.extract(r"Classification: (\w+)")[0].str.lower().eq("fake").astype(int)
        text = a.user.str.replace(r"^Job Posting:\s*", "", regex=True).map(clean_text)
        frames.append(pd.DataFrame({"text": text, "label": label, "source": "india_posts"}))
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=["text", "label", "source"])


def load_synthetic() -> pd.DataFrame:
    path = DATASET_DIR / "synthetic_modern.jsonl"
    if not path.exists():
        return pd.DataFrame(columns=["text", "label", "source"])
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    return pd.DataFrame({"text": [clean_text(r["text"]) for r in rows], "label": [int(r["label"]) for r in rows], "source": "synthetic"})


def short_excerpts(df: pd.DataFrame, fraction: float, rng: random.Random) -> pd.DataFrame:
    rows = []
    for r in df.sample(frac=fraction, random_state=SEED).itertuples():
        words = r.text.split()
        if len(words) < 120:
            continue
        length = rng.randint(30, 90)
        start = rng.randint(0, len(words) - length)
        rows.append({"text": " ".join(words[start : start + length]), "label": r.label, "source": f"{r.source}_excerpt"})
    return pd.DataFrame(rows)


def build(raw: Path) -> dict:
    rng = random.Random(SEED)
    real = pd.concat([load_emscad(raw), load_linkedin(raw), load_modern_scams(raw)], ignore_index=True)
    real = real[real.text.str.split().str.len() >= 8]
    real["fp"] = real.text.map(fingerprint)
    before = len(real)
    # A fingerprint seen with both labels is ambiguous — drop every copy.
    conflicted = real.groupby("fp").label.nunique()
    real = real[~real.fp.isin(conflicted[conflicted > 1].index)].drop_duplicates("fp")
    removed = before - len(real)

    strat = real.source + "_" + real.label.astype(str)
    train, temp = train_test_split(real, train_size=0.8, stratify=strat, random_state=SEED)
    val, test = train_test_split(temp, train_size=0.5, stratify=temp.source + "_" + temp.label.astype(str), random_state=SEED)

    synthetic = load_synthetic()
    synthetic = synthetic[~synthetic.text.map(fingerprint).isin(set(real.fp))]
    train = pd.concat([train, synthetic, short_excerpts(train, SHORT_AUGMENT_FRACTION, rng)], ignore_index=True)
    train = train.sample(frac=1, random_state=SEED)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    summary = {"duplicates_removed": int(removed)}
    for name, part in (("train", train), ("val", val), ("test", test)):
        part[["text", "label", "source"]].to_csv(OUT_DIR / f"{name}.csv", index=False)
        summary[name] = {
            "rows": int(len(part)),
            "fraudulent": int(part.label.sum()),
            "by_source": {k: int(v) for k, v in part.source.value_counts().items()},
        }
    (OUT_DIR / "summary.json").write_text(json.dumps(summary, indent=2))
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-dir", type=Path, default=DATASET_DIR / "raw")
    print(json.dumps(build(parser.parse_args().raw_dir), indent=2))
