# AI Service — Explainable Fake Job Detection

Python/FastAPI service: preprocessing, BERT fraud classification, Trust/Risk/Severity/Decision engines, SHAP+LIME explainability. See the [root README](../README.md) and [`docs/`](../docs/) for the full project, [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for how this service's pipeline fits together.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install torch==2.13.0 torchvision==0.28.0 --index-url https://download.pytorch.org/whl/cu130   # GPU; see docs/TROUBLESHOOTING.md for CPU-only
pip install -r requirements.txt

python -m bert_model.train_model   # produces models_store/ (gitignored)
python -m xai.shap_explainer       # precomputes the SHAP global-explanation cache
python -m bert_model.evaluate      # writes ../docs/model_evaluation_report.md

uvicorn ai_service.app:app --reload --port 8000   # from the repo root, not this directory
```

Interactive API docs: http://localhost:8000/docs

## Tests

```bash
python -m pytest -q            # excludes @pytest.mark.slow (needs a trained model)
python -m pytest -q -m ""      # everything, including slow
```

## Layout

One subpackage per SRS module — see the root README's repository-layout section, or just browse: `preprocessing/`, `bert_model/`, `trust_engine/`, `risk_engine/`, `severity_engine/`, `decision_support/`, `xai/`, `input_processing/`, `signals/` (shared fraud-pattern detectors), `config/business_rules.py` (every tunable threshold, centralized).
