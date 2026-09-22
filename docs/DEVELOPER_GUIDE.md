# Developer Guide

## Code organization principles

Each of the SRS's numbered modules (preprocessing, BERT classifier, trust engine, risk engine, severity engine, decision support, XAI) lives in its own `ai_service/` subpackage with its own tests, per NFR-13. Business-rule constants (SRS Section 7's exact numbers) live in exactly one place — `ai_service/config/business_rules.py` — per NFR-14; nowhere else in the codebase should hardcode a penalty point, a threshold, or a band boundary.

## Adding a new fraud signal

1. Add the detector function to `ai_service/signals/detectors.py` (pure function, `fields: dict -> bool`), and any vocabulary it needs to `ai_service/signals/lexicons.py`.
2. Wire it into `detect_all_signals()`.
3. Add its weight to `TRUST_PENALTIES` and/or `SEVERITY_POINTS` in `ai_service/config/business_rules.py` (whichever engine(s) it applies to — SRS Sections 7.1 and 7.3 are independent lists).
4. If it should surface a specific warning, add its message to `WARNING_MESSAGES` in `ai_service/decision_support/recommendation.py`.
5. Test the detector directly (`ai_service/tests/test_detectors.py`) before testing it through the engines — much easier to debug.

## Retraining the model

```bash
cd ai_service
python -m bert_model.train_model    # resumes automatically from the last checkpoint if interrupted
python -m xai.shap_explainer        # must be re-run after every retrain — the cache is per model version
python -m bert_model.evaluate        # updates docs/model_evaluation_report.md
```

Training writes a new timestamped version under `models_store/bert_fraud_classifier/` and repoints `models_store/latest.json` — it never overwrites a previous version. All hyperparameters are in `ai_service/bert_model/train_model.py`'s `TrainingArguments`.

## Conventions

- **Python**: PEP 8, type hints on public function signatures, docstrings that explain *why* (a design decision, a non-obvious constraint) rather than restating the signature.
- **TypeScript**: strict mode is on (`tsconfig.app.json`); no `any` without a comment explaining why it's unavoidable.
- **Tests**: `@pytest.mark.slow` for anything that needs a trained model or downloads a real ML model — everything else must run without either.
- **Commits**: one phase/feature per commit, message explains *why* not just *what* (see `git log` for the pattern this project follows throughout).

## Where things are decided

If you're wondering "why is this threshold X and not Y," check, in order: (1) the docstring right above the constant in `business_rules.py`, (2) `docs/ARCHITECTURE.md`, (3) `docs/RESEARCH_CONTRIBUTION.md`'s limitations section, (4) the SRS itself. Several thresholds (the risk-category tier decomposition, the BERT decision threshold, the unstructured-channel trust fallback) required judgment calls beyond what the SRS specifies exactly — all of them are documented inline at the point of decision, not just in this file.
