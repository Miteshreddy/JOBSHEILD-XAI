"""End-to-end preprocessing: raw record -> BERT-ready tokens (FR-2.1-2.7).

This is the single entry point every input channel (text/URL/PDF/image, SRS
Module 0) routes through before reaching the classifier (FR-1.6), so results
are comparable regardless of input source.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Any

from ai_service.config.business_rules import BERT_MAX_SEQUENCE_LENGTH, BERT_MODEL_NAME
from ai_service.preprocessing.text_cleaning import build_combined_text, clean_text


@lru_cache(maxsize=1)
def get_tokenizer():
    # Imported lazily so importing this module doesn't require torch/transformers
    # to be installed for callers that only need build_combined_text/clean_text.
    from transformers import AutoTokenizer

    return AutoTokenizer.from_pretrained(BERT_MODEL_NAME)


def tokenize_for_bert(text: str, max_length: int = BERT_MAX_SEQUENCE_LENGTH) -> dict[str, Any]:
    """FR-2.7: WordPiece-tokenize, truncating/padding to `max_length`.

    Returns a dict of plain Python lists (not tensors) so this function has no
    framework-specific return type; callers (training loop, inference
    service) convert to tensors as needed.
    """
    tokenizer = get_tokenizer()
    encoded = tokenizer(
        text,
        truncation=True,
        padding="max_length",
        max_length=max_length,
        return_tensors=None,
    )
    return {
        "input_ids": encoded["input_ids"],
        "attention_mask": encoded["attention_mask"],
    }


def preprocess_record(fields: dict[str, str | None]) -> dict[str, Any]:
    """Preprocess one job-advertisement record end to end.

    `fields` is a dict keyed by the EMSCAD field names (title, company_profile,
    description, requirements, benefits, location, salary_range,
    employment_type) — the same shape regardless of whether it came from raw
    text entry, URL scraping, PDF extraction, or OCR (FR-1.6).
    """
    combined_text = build_combined_text(fields)
    tokens = tokenize_for_bert(combined_text)
    return {
        "cleaned_text": combined_text,
        "input_ids": tokens["input_ids"],
        "attention_mask": tokens["attention_mask"],
    }


def preprocess_raw_text(raw_text: str) -> dict[str, Any]:
    """Preprocess a single pasted-text submission (FR-1.1) with no field structure."""
    combined_text = clean_text(raw_text)
    tokens = tokenize_for_bert(combined_text)
    return {
        "cleaned_text": combined_text,
        "input_ids": tokens["input_ids"],
        "attention_mask": tokens["attention_mask"],
    }
