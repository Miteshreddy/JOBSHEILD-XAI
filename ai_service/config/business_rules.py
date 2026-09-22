"""Centralized business-rule constants for the Trust, Risk, Severity and Decision
Support engines (SRS Section 7 / Appendix A). NFR-14 requires these thresholds to
live in one place, independent of classification and presentation code, so they
can be tuned without touching engine logic.

Every constant here maps directly to a row in SRS Section 7 — do not duplicate
these numbers elsewhere; import from this module instead.
"""
from __future__ import annotations

# --- Module 2: BERT classifier decision threshold (SRS FR-3.3, Appendix D item 1) ---
# Tuned by sweeping thresholds against the validation set's F1 after the
# 2026-07-29 training run (see docs/model_evaluation_report.md): 0.65 gave
# F1 0.9055 vs 0.8984 at the naive 0.5 default. Re-sweep after any retrain.
DEFAULT_FRAUD_DECISION_THRESHOLD = 0.65

# --- Module 3: Trust Score penalties (SRS Section 7.1) ---
# Trust Score = 100 - sum(applicable penalties). Clamped to [0, 100].
TRUST_SCORE_START = 100
TRUST_PENALTIES = {
    "registration_fee_requested": 30,
    "personal_email_domain": 15,
    "missing_company_profile": 20,
    "missing_company_website": 10,
    "unrealistic_salary": 20,
    "whatsapp_only_contact": 15,
    "missing_location": 10,
    "poor_grammar_or_spam_wording": 10,
}

TRUST_BANDS = [
    # (min_inclusive, max_inclusive, label)
    (80, 100, "Highly Trustworthy"),
    (60, 79, "Moderately Trustworthy"),
    (30, 59, "Suspicious"),
    (0, 29, "Very Low Trust"),
]

# --- Module 4: Risk Categorization (SRS Section 7.2) ---
# The SRS table gives 4 anchor points, not full grid coverage. These anchors
# are used by ai_service/risk_engine/risk_category.py to build a complete,
# deterministic decision function — see that module's docstring for the
# documented interpolation rule (Phase 1 gap-resolution, approved 2026-07-29).
RISK_MATRIX_ANCHORS = [
    # (fraud_probability_predicate, trust_score_predicate, category)
    {"prob_max": 0.30, "trust_min": 80, "category": "Low"},
    {"prob_min": 0.30, "prob_max": 0.60, "trust_min": 60, "trust_max": 80, "category": "Medium"},
    {"prob_min": 0.60, "trust_min": 30, "trust_max": 60, "category": "High"},
    {"prob_min": 0.85, "trust_max": 30, "category": "Critical"},
]

# --- Module 5: Fraud Severity points (SRS Section 7.3) ---
SEVERITY_POINTS = {
    "registration_fee_requested": 30,
    "unrealistic_salary": 20,
    "missing_company_profile": 15,
    "whatsapp_only_contact": 15,
    "urgent_or_spam_wording": 10,
    "unverified_website_or_email": 10,
}

SEVERITY_BANDS = [
    (0, 20, "Low"),
    (21, 40, "Medium"),
    (41, 70, "High"),
    (71, 100, "Critical"),
]

# --- Module 6: Decision Support recommendations (SRS Section 7.4) ---
RISK_RECOMMENDATIONS = {
    "Critical": "Do NOT apply.",
    "High": "Manual verification required before proceeding.",
    "Medium": "Verify the company before applying.",
    "Low": "Appears trustworthy — perform normal verification.",
}

# --- Input validation limits (SRS FR-1.5, NFR-6, Appendix D item 5) ---
MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024   # 10 MB
MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB

# --- Preprocessing (SRS FR-2.7) ---
BERT_MAX_SEQUENCE_LENGTH = 512
BERT_MODEL_NAME = "bert-base-uncased"
