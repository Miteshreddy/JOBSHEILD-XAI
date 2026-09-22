# Research Contribution and Future Scope

## Relationship to the base paper

This project extends Fraud-BERT (Taneja, Vashishtha & Ratnoo, *Discover Computing*, 2025 — [DOI](https://doi.org/10.1007/s10791-025-09502-8)), which fine-tunes BERT-base-uncased on EMSCAD for binary fraud classification but stops there: a label and a probability, no explanation, no trust signal, no severity read, no guidance.

The novelty here, matching the SRS/proposal's framing, is not SHAP or LIME individually — both are established techniques — but their integration with a deterministic Trust Assessment Engine, Risk Categorization, Fraud Severity Assessment, and Decision Support into one coherent, auditable pipeline that a job seeker can actually act on.

## What was actually built vs. the base paper

| | Fraud-BERT (base paper) | This project |
|---|---|---|
| Classification | BERT-base-uncased, binary | Same architecture, same dataset |
| Explainability | None | SHAP (global) + LIME (local), every prediction (NFR-19) |
| Trust signal | None | 0–100 deterministic score, 8 named penalty conditions |
| Risk categorization | None | 4-tier, full probability×trust coverage (see `ai_service/risk_engine/risk_category.py`) |
| Severity | None | 0–100 deterministic score, 6 named high-harm patterns |
| Guidance | None | Recommendation + severity-tied warnings + verification suggestions |
| Input modalities | Text only (dataset records) | Text, URL, PDF, image/OCR |

## Model results (this training run, 2026-07-29)

Held-out test set (never touched during training or model selection): **accuracy 98.73%, precision 90.68%, recall 82.31%, F1 0.863, ROC-AUC 0.983**. Full breakdown in `docs/model_evaluation_report.md`.

Reported against the stated acceptance criterion (F1 0.93 / accuracy 99%): accuracy comes close; F1 (driven by recall) does not quite reach it in this run. Reported honestly rather than adjusted — recall (82.3%) is the metric with the most headroom; likely levers for a future run: more training epochs, a learning-rate sweep, or a different imbalance-handling strategy (e.g. focal loss instead of static class weights) given EMSCAD's 4.85% positive class.

## Generalization

The classifier is not a lookup table — SRS Section 6.1.3's own worked examples (a KMIT faculty posting never in EMSCAD) are used verbatim as end-to-end integration tests (`ai_service/tests/test_pipeline_integration.py`) and pass: both the fraudulent and legitimate examples are classified correctly, with correct trust band and risk category, purely from the model's learned patterns.

## Limitations found and either fixed or documented during this build

- **Unstructured-channel trust scoring**: the `company_profile`/`location` fields only exist for URL-scraped input with JSON-LD structured data; the text/PDF/OCR channels have no field separation at all. `detect_missing_company_profile` originally penalized *every* text/PDF/image submission regardless of actual content (confirmed via a real browser walkthrough — a detailed legitimate posting scored 70/100 instead of ~90+). Fixed with an overall-substance fallback for genuinely unstructured input (`ai_service/signals/detectors.py`); `detect_missing_location` has no comparable proxy available (no gazetteer/NER in scope) and remains a known limitation for those channels.
- **SHAP word-level noise**: SHAP's default word-level Text masker sometimes splits on data-quality artifacts in the raw EMSCAD text (e.g. concatenated words with no space), producing rare one-off tokens with large-looking magnitude. Mitigated with a minimum-occurrence filter so the cached global explanation reflects population-level patterns, not per-instance noise (see `ai_service/xai/shap_explainer.py`).

## Future scope (per SRS Appendix C, unchanged)

Multilingual support, a browser extension for real-time in-page scanning, federated/continual learning, and direct recruitment-platform API integration for automated moderation — none of these were attempted; all four remain explicitly out of scope for this release.
