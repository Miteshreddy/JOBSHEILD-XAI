# Testing Guide

## AI service (pytest)

```bash
cd ai_service
.venv\Scripts\python -m pytest -q          # everything except @pytest.mark.slow
.venv\Scripts\python -m pytest -q -m ""    # include the slow ones too (needs a trained model)
```

`slow`-marked tests need a trained model (`ai_service/models_store/`, produced by `python -m ai_service.bert_model.train_model`) and/or download a real OCR model — they're excluded from CI for that reason (see `.github/workflows/ci.yml`), but should be run locally after training.

Coverage by area: text cleaning & preprocessing, all four signal-detector-driven engines (Trust/Risk/Severity/Decision Support) including SRS worked-example end-to-end checks, BERT dataset/predict/evaluate, SHAP/LIME (both mocked-model unit tests and real-model integration tests), URL/PDF/OCR input channels, and FastAPI route-level tests.

## Backend (Jest + Supertest)

```bash
cd backend
npx jest --runInBand
```

Uses `mongodb-memory-server` — no real MongoDB instance needed to run the suite. Covers auth (register/login/refresh/logout-all), analysis submission (AI service client mocked), history (pagination/filtering/ownership), and admin (role-gating, aggregate stats).

## Frontend (Vitest + Testing Library)

```bash
cd frontend
npx vitest run
```

Component-level tests (RiskBadge, TrustMeter, SeverityMeter, RecommendationCard, the SHAP/LIME chart's data/color logic) and page-level tests (AnalysisPage tab switching + submission, LoginPage success/failure) with the API layer mocked via `vi.mock`.

Note: recharts' `ResponsiveContainer` doesn't render meaningfully under jsdom (no real layout), so `ExplanationBarChart`'s sorting/coloring logic is tested as pure functions (`toChartData`, `colorForValue`) rather than by rendering the chart and inspecting SVG output.

## Model evaluation

```bash
cd ai_service
.venv\Scripts\python -m bert_model.evaluate
```

Writes `docs/model_evaluation_report.md` from the held-out test split (`ai_service/dataset/processed/test.csv`), which is never touched during training or validation-based model selection.

## What "tested" means for this project, concretely

Beyond automated tests, every phase of this build was verified against real output before being considered done — real EMSCAD data (not synthetic fixtures) for EDA and training, a real trained model for evaluation and SHAP/LIME, and a full local stack (Docker MongoDB + FastAPI + Express + Vite) driven through an actual browser for the end-to-end flows (register, analyze via all channels, view history, admin dashboard). Three real bugs were only caught this way — see the git log for `Phase 4`, `Phase 6`, and `Phase 9` commits for what they were and how they were found.
