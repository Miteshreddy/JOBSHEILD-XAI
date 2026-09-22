# Troubleshooting

## AI service returns 503 on every `/analyze/*` call

No trained model exists yet. Run:

```bash
cd ai_service
.venv\Scripts\python -m bert_model.train_model
.venv\Scripts\python -m xai.shap_explainer
```

`models_store/latest.json` must exist and point at a real version directory before the service can serve predictions (see `docs/ARCHITECTURE.md`'s model-versioning section).

## `pip install torch` gives a CPU-only build even though I have a GPU

Confirmed on this project's own dev machine (Windows, RTX 4060): the default PyPI `torch` wheel resolves to CPU-only. Install the CUDA build explicitly first:

```bash
pip install torch==2.13.0 torchvision==0.28.0 --index-url https://download.pytorch.org/whl/cu130
pip install -r requirements.txt
```

Check with `python -c "import torch; print(torch.cuda.is_available())"`. If your driver is older, the available CUDA tags may differ — check `https://download.pytorch.org/whl/torch/` for what's built for your torch version.

## `docker compose build` fails on `npm ci` with an `optionalDependencies`/lockfile mismatch

Known cross-platform issue: a lockfile generated on Windows doesn't always carry the Linux-specific native-binary entries (seen here with Tailwind v4's `lightningcss`). Both Dockerfiles use `npm install` instead of `npm ci` for exactly this reason — if you've changed them back, that's why it broke.

## The AI service Docker image is huge / build pulls several GB of CUDA libraries

Plain `pip install torch` inside a Linux container resolves a CUDA-enabled build by default and drags in `nvidia-cudnn-*`/`cuda-toolkit` packages even though `docker-compose.yml` requests no GPU. `ai_service/Dockerfile` installs the CPU-only build explicitly first (`--index-url https://download.pytorch.org/whl/cpu`) so the subsequent `requirements.txt` install sees `torch==2.13.0` already satisfied and leaves it alone. If you need GPU inference in the container, remove that line and add GPU device reservations to the compose file instead.

## URL analysis fails with "resolves to a non-public address"

Working as intended (NFR-7 SSRF protection) — the target hostname resolved to a private/loopback/link-local IP. This will also reject `localhost` and internal service names by design.

## `EmscadDataset` / preprocessing crashes on `unicodedata.normalize`

Fixed in this codebase (see the Phase 4 commit) — pandas represents a missing CSV cell as `float('nan')`, which is truthy in Python and used to slip past `clean_text`'s missing-value guard. If you see this again in new code, make sure any pandas-sourced field goes through `ai_service/preprocessing/text_cleaning.py`'s `clean_text`, which now explicitly checks `isinstance(text, str)`.

## A SHAP/LIME chart shows a color that doesn't match "red = fraudulent, green = legitimate"

Also fixed in this codebase (Phase 9 commit) — make sure `ExplanationBarChart` is always given a **signed** value (`weight` for LIME, `mean_impact` for SHAP), never `mean_abs_impact`, which is always non-negative and would make every bar look "fraudulent" regardless of its real direction.

## Every request 500s once the backend is behind nginx (or any reverse proxy)

`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` in the backend logs — express-rate-limit refuses to trust the `X-Forwarded-For` header nginx adds unless Express's `trust proxy` is explicitly set. Set `TRUST_PROXY=1` (see `backend/config/env.js`) in any deployment where a reverse proxy really does sit in front — never set it where nothing is proxying, since that lets a client spoof its own IP and dodge rate limiting.

## `/analyze/*` returns 502 or 504 through Docker Compose

Two independent timeouts have to both be long enough for CPU-only inference: the backend's `AI_SERVICE_TIMEOUT_MS` and nginx's own `proxy_read_timeout` (nginx defaults to 60s regardless of what the backend is configured for, and will time out on its own first). Both are already raised in `docker-compose.yml` / `frontend/nginx.conf` — if you still see this, check how long the request is actually taking (`docker logs sdc2-ai_service-1`, `docker stats`) before raising them further.

## An analysis request through Docker Compose takes a very long time or times out

CPU-only inference (no GPU passthrough configured in `docker-compose.yml`) plus LIME's live per-request computation is genuinely slow — confirmed by watching real requests take 50s+ in this environment. `ai_service/xai/lime_explainer.py`'s `DEFAULT_NUM_SAMPLES` is already reduced from LIME's own default of 500 to 150 for this reason. If it's still too slow for your hardware, lower it further (explanation quality degrades gradually, not sharply) or add real GPU passthrough to the `ai_service` service in `docker-compose.yml`.
