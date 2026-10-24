"""Generate modern, labelled job-message examples with a local Ollama model.

EMSCAD (2012-2014) predates today's dominant scam formats — Telegram/WhatsApp
"task" jobs, fake-check equipment scams, crypto "payroll" schemes, recruiter
impersonation on LinkedIn. This script asks the local LLM for short, realistic
examples of both scams AND genuine recruiter messages/short postings, so the
classifier doesn't learn the shortcut "short informal text == scam".

Synthetic rows are used for TRAINING ONLY. Every reported metric comes from
held-out real data (see build_training_corpus.py).

Run: python -m ai_service.dataset.generate_synthetic --target 600
"""
from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

import httpx

OUT_PATH = Path(__file__).parent / "synthetic_modern.jsonl"
OLLAMA_URL = "http://localhost:11434/api/chat"

SCAM_TYPES = [
    "task-based 'like videos / rate products' job that later requires a deposit",
    "fake check for home-office equipment bought from the 'company vendor'",
    "Telegram or WhatsApp 'interview' with a recruiter impersonating a well-known brand",
    "registration, training or ID-verification fee before joining",
    "package reshipping / parcel inspector from home",
    "payment processing or 'financial agent' role that moves money through your account",
    "crypto or USDT salary paid via a trading app you must install",
    "overseas visa job that requires a processing or medical-test fee",
    "data-entry or typing job paying unrealistic money for few hours",
    "government-job impersonation asking for exam fee",
    "fake internship that sells a certificate",
    "MLM / network-marketing disguised as a sales job",
    "recruiter asking for bank login, SSN, Aadhaar or passport scan before any interview",
    "unpaid 'test project' that is actually real client work",
    "hotel review / Google maps rating commission job",
]
LEGIT_TYPES = [
    "a LinkedIn InMail from an in-house recruiter at a real mid-size company inviting to a scheduled video interview",
    "a short job post from a local restaurant or retail store with hourly pay and in-person interview",
    "a short internship listing from a university lab with a stipend",
    "a staffing-agency recruiter email with a contract role, rate range and client industry",
    "a startup's short careers-page post for a remote engineer with equity and a hiring process outline",
    "a hospital nursing vacancy summary with shift details and licence requirements",
    "a government job notice that directs applicants to the official portal and charges no fee",
    "a warehouse associate posting with shift pay, location and on-site orientation",
    "a referral message from a former colleague about an open role on their team",
    "a short remote customer-support job post with realistic pay and a formal application process",
]
REGIONS = ["United States", "India", "United Kingdom", "Canada", "Nigeria", "Philippines", "UAE", "Australia", "Germany", "Singapore"]
CHANNELS = ["LinkedIn message", "email", "WhatsApp message", "Telegram message", "job-board post", "SMS", "Facebook group post", "company careers page"]

PROMPT = """Write {n} distinct, realistic {kind} examples a job seeker in {region} might receive as a {channel}.
Scenario: {scenario}.
Vary length (25-160 words), tone, company names (invent plausible names; for scams you MAY impersonate famous brands), salary formats and details.
Do not label or explain them inside the text. Return JSON: {{"examples": ["...", "..."]}}"""


def generate_batch(client: httpx.Client, model: str, label: int, n: int = 3) -> list[dict]:
    scenario = random.choice(SCAM_TYPES if label else LEGIT_TYPES)
    kind = "job-scam" if label else "genuine, legitimate recruitment"
    prompt = PROMPT.format(n=n, kind=kind, region=random.choice(REGIONS), channel=random.choice(CHANNELS), scenario=scenario)
    resp = client.post(
        OLLAMA_URL,
        json={
            "model": model,
            "stream": False,
            "think": False,
            "format": "json",
            "options": {"temperature": 0.9, "num_predict": 900},
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=600,
    )
    resp.raise_for_status()
    examples = json.loads(resp.json()["message"]["content"]).get("examples", [])
    return [
        {"text": t.strip(), "label": label, "scenario": scenario}
        for t in examples
        if isinstance(t, str) and len(t.split()) >= 15
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", type=int, default=600)
    parser.add_argument("--model", default="qwen3.5:4b")
    args = parser.parse_args()

    existing = OUT_PATH.read_text(encoding="utf-8").splitlines() if OUT_PATH.exists() else []
    count = len(existing)
    with httpx.Client() as client, OUT_PATH.open("a", encoding="utf-8") as out:
        while count < args.target:
            label = 1 if count % 2 == 0 else 0  # keep the two classes balanced
            try:
                rows = generate_batch(client, args.model, label)
            except (httpx.HTTPError, json.JSONDecodeError, KeyError) as exc:
                print(f"batch failed: {exc}")
                continue
            for row in rows:
                out.write(json.dumps(row, ensure_ascii=False) + "\n")
            out.flush()
            count += len(rows)
            print(f"{count}/{args.target}")


if __name__ == "__main__":
    main()
