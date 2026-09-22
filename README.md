# 🛡️ JobShield XAI — Explainable Fake Job Detection Platform

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-green?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.140-009688?logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-Academic-orange)

**An explainable, trust-aware recruitment-fraud detection platform powered by FraudBERT.**

Extends the Fraud-BERT baseline *(Taneja, Vashishtha & Ratnoo, Discover Computing, 2025)* with SHAP/LIME explainability, a deterministic Trust Score engine, Risk Categorization, Fraud Severity assessment, and a Decision Support engine — all served through a unified Explainability Dashboard.

[Features](#-features) • [Architecture](#️-architecture) • [Quick Start](#-quick-start-windows) • [API Docs](#-api-documentation) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🤖 **FraudBERT Classifier** | Fine-tuned BERT model — 98.73% accuracy, F1 0.863 on held-out EMSCAD test set |
| 🔍 **SHAP + LIME Explainability** | Per-prediction local explanations (LIME) + global feature importance (SHAP) |
| 🏆 **Trust Score Engine** | Deterministic, rule-based trust scoring across 12 job-posting signals |
| ⚠️ **Risk Categorization** | LOW / MEDIUM / HIGH / CRITICAL risk labels with reasoning |
| 🔥 **Fraud Severity Assessment** | 5-level severity scale with weighted signal analysis |
| 🧠 **Decision Support Engine** | Actionable recommendations and red-flag summaries |
| 🌐 **Multi-Input Channels** | Analyze via URL scraping, PDF upload, or image OCR |
| 👤 **Auth System** | JWT-based login/register with httpOnly refresh cookies |
| 📜 **Analysis History** | Signed-in users get a full searchable history of past analyses |
| 🔒 **Admin Panel** | User management and platform statistics |
| 🌙 **Dark / Light Mode** | System-aware theme with manual override |

---

## 🏗️ Architecture

Three-tier architecture designed for security, scalability, and explainability:

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite + TS)                  │
│          Port 5173 — Tailwind CSS + Radix UI + Recharts         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API (/api/*)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Node.js / Express Backend                      │
│    Port 5001 — Auth (JWT) · Validation · Rate Limiting          │
│    MongoDB (Mongoose) · Swagger Docs at /api-docs               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP → localhost:8000
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Python FastAPI AI Service                      │
│    Port 8000 — FraudBERT · Trust/Risk/Severity/Decision         │
│    SHAP · LIME · URL Scraper · PDF Parser · OCR (EasyOCR)       │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
                     MongoDB (port 27017)
```

### Key Design Decisions
- **Frontend proxies to backend** via Vite proxy — no CORS issues in dev
- **Backend orchestrates AI service** — frontend never calls AI directly
- **httpOnly refresh cookies** — XSS-proof token storage
- **MongoMemoryServer fallback** — backend works without a real MongoDB install (dev only)
- **Graceful model absence** — AI service starts and `/health` responds even if model isn't trained yet

---

## 📁 Repository Layout

```
JOBSHEILD-XAI/
│
├── 🐍 ai_service/                Python FastAPI AI Service
│   ├── bert_model/               FraudBERT fine-tuning + inference
│   ├── trust_engine/             Module 3 — Trust Score (12 signals)
│   ├── risk_engine/              Module 4 — Risk Categorization
│   ├── severity_engine/          Module 5 — Fraud Severity (5 levels)
│   ├── decision_support/         Module 6 — Recommendations + warnings
│   ├── xai/                      Module 7 — SHAP (global) + LIME (local)
│   ├── input_processing/         URL scraping, PDF extraction, OCR
│   ├── preprocessing/            Text cleaning + tokenization pipeline
│   ├── schemas/                  Pydantic request/response models
│   ├── config/                   Business-rule constants & thresholds
│   ├── dataset/                  EMSCAD dataset (17,880 postings)
│   ├── models_store/             Trained model artifacts (gitignored)
│   ├── app.py                    FastAPI entry point
│   ├── pipeline.py               End-to-end analysis pipeline
│   ├── requirements.txt          Python dependencies
│   └── .env.example              Environment config template
│
├── 🟢 backend/                   Node.js / Express Backend
│   ├── config/                   DB + env + Swagger config
│   ├── controllers/              auth · analysis · history · admin
│   ├── routes/                   authRoutes · analysisRoutes · etc.
│   ├── models/                   User.js · Analysis.js (Mongoose)
│   ├── middleware/               auth · rateLimiter · upload · validate
│   ├── utils/                    logger · jwt · ApiError · asyncHandler
│   ├── tests/                    Jest test suite
│   ├── server.js                 Entry point
│   ├── app.js                    Express app factory
│   ├── package.json
│   └── .env.example
│
├── ⚛️  frontend/                  React SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── api/                  auth.ts · analysis.ts · client.ts
│   │   ├── components/           layout · ui · analysis · shared
│   │   ├── pages/                Landing · Login · Register · Analysis
│   │   │                         History · Profile · Admin · About
│   │   ├── store/                authStore · themeStore (Zustand)
│   │   └── types/                TypeScript interfaces
│   ├── vite.config.ts
│   └── package.json
│
├── 📄 docs/                      Full documentation set
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── TESTING.md
│   ├── TROUBLESHOOTING.md
│   ├── USER_GUIDE.md
│   ├── RESEARCH_CONTRIBUTION.md
│   └── model_evaluation_report.md
│
├── 🐳 docker-compose.yml         Full containerized stack
├── 🚀 start.bat                  Windows all-in-one launcher
├── 🐍 launch.py                  Cross-platform service orchestrator
└── ⚙️  .github/workflows/         CI — pytest + Jest + Vitest
```

---

## 🚀 Quick Start (Windows)

### Prerequisites

Install these **before** running `start.bat`:

| Tool | Minimum Version | Download |
|------|-----------------|----------|
| **Python** | 3.10+ | [python.org/downloads](https://www.python.org/downloads/) — ⚠️ tick **"Add Python to PATH"** |
| **Node.js** | 20 LTS+ | [nodejs.org/en/download](https://nodejs.org/en/download) |
| **MongoDB** | 7.0+ | [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) — install as **Windows Service** |
| **Git** | Any | [git-scm.com](https://git-scm.com/downloads) |

### Step 1 — Clone the repo

```bat
git clone https://github.com/Miteshreddy/JOBSHEILD-XAI.git
cd JOBSHEILD-XAI
```

### Step 2 — Double-click `start.bat`

That's it. `start.bat` automatically:
- ✅ Checks Python & Node.js are installed
- ✅ Creates the Python virtual environment (`ai_service\.venv`)
- ✅ Installs all Python packages (torch, transformers, fastapi, etc.)
- ✅ Installs all Node.js packages for backend + frontend
- ✅ Generates `.env` config files from the examples
- ✅ Starts all 3 services and opens your browser

> **First run takes 5–15 minutes** to download PyTorch (~800 MB) and other packages.  
> Subsequent runs skip setup and launch instantly.

### Step 3 — Train the AI model (once)

The BERT classifier needs to be trained on EMSCAD before analysis works:

```bat
REM Activate the virtual environment
ai_service\.venv\Scripts\activate

REM Set Python path
set PYTHONPATH=%CD%

REM Train FraudBERT (writes to ai_service\models_store\)
python -m bert_model.train_model

REM Pre-compute global SHAP explanation cache
python -m xai.shap_explainer

REM Optional: print held-out evaluation metrics
python -m bert_model.evaluate

deactivate
```

> **GPU training (recommended):** Install the CUDA build of PyTorch first:
> ```bat
> pip install torch==2.13.0 torchvision==0.28.0 --index-url https://download.pytorch.org/whl/cu130
> pip install -r ai_service\requirements.txt
> ```

### Step 4 — Use the app

Once `start.bat` is running:

| Service | URL |
|---------|-----|
| 🌐 **Web App** | http://localhost:5173 |
| 📡 **Backend API Docs** | http://localhost:5001/api-docs |
| 🤖 **AI Service Docs** | http://localhost:8000/docs |

Press **Ctrl+C** in the terminal to stop all services.

---

## 🐳 Docker Compose (Alternative)

```bat
docker compose build
docker compose up -d mongo

REM Train the model (mounts into container volume)
ai_service\.venv\Scripts\python -m bert_model.train_model
ai_service\.venv\Scripts\python -m xai.shap_explainer

docker compose up -d
```

Frontend available at **http://localhost** — see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## 🔐 Authentication

JobShield XAI includes a full JWT-based auth system:

- **Register** at `/register` — creates account, issues access + refresh tokens
- **Login** at `/login` — validates credentials, issues tokens
- **Refresh** — silent session restore on page reload via httpOnly cookie
- **Logout / Logout All** — clears cookies, optionally rotates token version

> Anonymous users can still run analyses — account creation is optional.  
> Signed-in users get analysis history persisted to MongoDB.

---

## 🧪 Testing

```bat
REM AI Service (pytest)
cd ai_service
.venv\Scripts\python -m pytest -q

REM Backend (Jest)
cd backend
npx jest --runInBand

REM Frontend (Vitest)
cd frontend
npx vitest run
```

See [`docs/TESTING.md`](docs/TESTING.md) for full coverage details.

---

## 📊 Model Performance

Evaluated on held-out EMSCAD test set (20% stratified split):

| Metric | Score |
|--------|-------|
| **Accuracy** | 98.73% |
| **F1 Score** | 0.863 |
| **Precision** | 0.891 |
| **Recall** | 0.837 |
| **AUC-ROC** | 0.971 |

Full report: [`docs/model_evaluation_report.md`](docs/model_evaluation_report.md)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Three-tier design, pipeline, model versioning |
| [`docs/API.md`](docs/API.md) | Full endpoint reference |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Local, Docker, and production deployment |
| [`docs/TESTING.md`](docs/TESTING.md) | Test suites and coverage |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Common issues and fixes |
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | End-user walkthrough |
| [`docs/RESEARCH_CONTRIBUTION.md`](docs/RESEARCH_CONTRIBUTION.md) | Novelty, results, and limitations |

---

## 🗺️ Analysis Pipeline

```
User Input (URL / PDF / Image / Text)
           │
           ▼
   Input Processing Layer
   ├── URL → BeautifulSoup scraper
   ├── PDF → PyMuPDF text extractor
   └── Image → EasyOCR
           │
           ▼
   Preprocessing Pipeline
   (text cleaning, tokenization, normalization)
           │
           ▼
   FraudBERT Classifier
   (fine-tuned bert-base-uncased → fraud probability)
           │
           ├──► Trust Score Engine     (12 signals → 0–100 score)
           ├──► Risk Categorization    (LOW / MEDIUM / HIGH / CRITICAL)
           ├──► Severity Assessment    (Level 1–5)
           ├──► Decision Support       (recommendations + red flags)
           └──► XAI Layer
                ├── LIME  → local word-level explanation
                └── SHAP  → global feature importance
           │
           ▼
   Explainability Dashboard (React)
```

---

## 🏷️ Status

- [x] Dataset acquired and verified (EMSCAD — 17,880 postings)
- [x] EDA + preprocessing pipeline
- [x] FraudBERT fine-tuning pipeline (98.73% accuracy)
- [x] Trust / Risk / Severity / Decision Support engines
- [x] SHAP + LIME explainability
- [x] FastAPI AI service with health endpoint
- [x] Node.js/Express backend with JWT auth
- [x] React frontend (Vite + TypeScript + Tailwind v4)
- [x] Multi-input channels (URL / PDF / OCR)
- [x] Analysis history + user profiles
- [x] Admin panel
- [x] Full test suites (pytest / Jest / Vitest)
- [x] Docker + CI/CD (GitHub Actions)
- [x] Windows `start.bat` — one-click launcher

---

## ⚠️ Troubleshooting

### `No module named 'torch'`
The Python venv wasn't created. Run `start.bat` — it creates and populates the venv automatically.

### `'vite' is not recognized`
The frontend node_modules are from a different OS. Run `start.bat` — it reinstalls and creates Windows `.cmd` shims.

### Login / Register not working
MongoDB must be running. Open **Services** (Win+R → `services.msc`) and ensure **MongoDB** is started.

### AI service returns 503
The model hasn't been trained yet. Run the training commands in [Step 3](#step-3--train-the-ai-model-once).

### Port already in use
Another process is using port 5001, 8000, or 5173. Kill it or change the port in the relevant `.env` file.

See [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) for more.

---

## 📄 License

Academic / research project. EMSCAD is used strictly for training and evaluation per its public Kaggle licensing — see [`ai_service/dataset/README.md`](ai_service/dataset/README.md).

---

## 🙏 Acknowledgements

- **EMSCAD Dataset** — Employment Scam Aegean Dataset (Kaggle)
- **Fraud-BERT** — Taneja, Vashishtha & Ratnoo, *Discover Computing*, 2025
- **SHAP** — Lundberg & Lee, NeurIPS 2017
- **LIME** — Ribeiro, Singh & Guestrin, KDD 2016

---

<div align="center">
  Built with ❤️ by <strong>Mitesh Reddy</strong>
</div>
