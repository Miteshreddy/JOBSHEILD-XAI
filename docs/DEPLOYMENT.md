# Deployment Guide

## Local development (no Docker)

Each tier's own setup is in the root `README.md`. Short version: MongoDB running locally, `ai_service` venv with the CUDA-index torch install, `backend` and `frontend` via `npm install`.

## Local, containerized (Docker Compose)

```bash
docker compose build
docker compose up -d mongo
# Train the model once (writes to ai_service/models_store/, which is volume-mounted
# into the ai_service container — see docker-compose.yml comments):
cd ai_service && .venv\Scripts\python -m bert_model.train_model && python -m xai.shap_explainer
cd ..
docker compose up -d
```

Frontend: http://localhost — Backend API docs: http://localhost:5000/api-docs — AI service docs: http://localhost:8000/docs

The `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` values in `docker-compose.yml` are dev-only placeholders (same pattern as `backend/config/env.js`'s non-production defaults) — replace them via a real secrets mechanism before this ever runs anywhere reachable outside your own machine.

## Production topology (per the SRS's suggested platforms)

| Tier | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Static build (`npm run build`); set `VITE_API_BASE_URL`-style config if the backend isn't same-origin |
| Backend | Render | Set all `backend/.env.example` variables as real secrets; `NODE_ENV=production` enforces they're present (see `config/env.js`) |
| AI service | Render or Railway | Needs the trained model + SHAP cache — bake them into the image or attach a persistent volume; CPU-only inference is supported (NFR-1) but slower than GPU |
| Database | MongoDB Atlas | Update `MONGODB_URI` on both backend and AI service |

Regardless of platform: the AI service should never be exposed directly to the public internet — only the backend should be able to reach it (see `docs/ARCHITECTURE.md`).

## Health checks

- Backend: `GET /api/health`
- AI service: `GET /health` (also gates whether `/analyze/*` will actually work — 503 if the model isn't loaded)

## Rolling back a model version

Every training run is versioned under `ai_service/models_store/bert_fraud_classifier/<version>/`. To roll back, edit `models_store/latest.json` to point at an older version and restart the AI service — no retraining or redeploy needed.
