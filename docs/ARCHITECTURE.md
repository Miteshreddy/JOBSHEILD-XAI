# Architecture

## Three-tier overview

```
 ┌─────────────┐      HTTPS/JSON       ┌──────────────────┐      HTTP/JSON       ┌──────────────────┐
 │   React      │ ───────────────────▶ │  Node/Express     │ ───────────────────▶ │  FastAPI          │
 │  frontend    │ ◀─────────────────── │  backend (MVC)    │ ◀─────────────────── │  AI service       │
 └─────────────┘                       └──────────────────┘                       └──────────────────┘
                                                │                                          │
                                                ▼                                          ▼
                                          ┌──────────┐                            ┌──────────────────┐
                                          │ MongoDB  │                            │ BERT weights +    │
                                          └──────────┘                            │ SHAP cache (disk) │
                                                                                   └──────────────────┘
```

- **Frontend** (`frontend/`) — React 19 + Vite + TypeScript + Tailwind v4. Collects input (text/URL/PDF/image), renders the Explainability Dashboard. Talks only to the backend, never directly to the AI service.
- **Backend** (`backend/`) — Node/Express, MVC layout (`controllers/`, `routes/`, `models/`). Owns authentication, request validation, rate limiting, and orchestrates calls to the AI service. Persists every analysis to MongoDB (SRS Section 6.2).
- **AI service** (`ai_service/`) — Python/FastAPI. Owns preprocessing, the BERT classifier, the Trust/Risk/Severity/Decision engines, and SHAP/LIME explainability. Stateless per request except for the loaded model and the on-disk SHAP cache.
- **Database** — MongoDB. Two collections: `users` and `analyses` (see `backend/models/`).

## Why the backend never lets the frontend call the AI service directly

Auth, rate limiting, and upload validation belong in one place (the backend). The AI service has no auth of its own — it trusts whatever the backend forwards. In production, the AI service should not be reachable from the public internet at all (bind it to an internal network / service mesh); `docker-compose.yml` reflects this by only publishing the AI service's port for local development convenience.

## The analysis pipeline (`ai_service/pipeline.py`)

Every input channel converges on the same function:

1. **Input acquisition** (`ai_service/input_processing/`) — URL scraping (JSON-LD first, generic HTML fallback), PDF extraction (PyMuPDF, with OCR fallback for scanned pages), image OCR (EasyOCR default, Tesseract optional). Raw text needs no extraction step.
2. **Preprocessing** (`ai_service/preprocessing/`) — HTML/URL/email/phone/emoji stripping, unicode normalization, combining the EMSCAD-shaped fields into one string, WordPiece tokenization.
3. **Classification** (`ai_service/bert_model/predict.py`) — fine-tuned `bert-base-uncased` outputs a fraud probability; a tuned threshold (`ai_service/config/business_rules.py`) derives the binary label.
4. **Signal detection** (`ai_service/signals/`) — ten deterministic regex/heuristic detectors (registration fee, personal email domain, missing company profile, etc.) computed once and shared by the Trust and Severity engines.
5. **Trust / Risk / Severity / Decision Support** (`ai_service/trust_engine/`, `risk_engine/`, `severity_engine/`, `decision_support/`) — pure rule-based scoring, every threshold defined in `ai_service/config/business_rules.py` and documented against SRS Section 7.
6. **Explainability** (`ai_service/xai/`) — LIME runs live per request; SHAP's global explanation is precomputed once (`python -m ai_service.xai.shap_explainer`) and cached alongside the model version, per NFR-2.

## Model versioning

`ai_service/models_store/bert_fraud_classifier/<version>/` holds one directory per training run (timestamped), each with `training_metadata.json` recording its evaluation metrics and baseline comparison. `models_store/latest.json` points at whichever version is "current" — that's what `predict.py` and `shap_explainer.py` load. Retraining never overwrites a previous version; it adds a new one and repoints `latest.json`.

## Deterministic scoring, not a second ML model

The Trust/Risk/Severity/Decision engines are plain Python functions over named boolean signals, not a trained model — every point deducted or category assigned traces back to one regex/threshold in `ai_service/signals/detectors.py` and `ai_service/config/business_rules.py`. This is deliberate: the project's premise is explainability, and stacking a second opaque model on top of BERT's output would undermine that.

The one place this required a documented design decision: SRS Section 7.2's risk-categorization table gives four anchor points, not full coverage of the probability × trust grid. `ai_service/risk_engine/risk_category.py` resolves this with a tier-decomposition function that reproduces all four SRS anchors exactly while covering every other combination — see that file's docstring for the full derivation.
