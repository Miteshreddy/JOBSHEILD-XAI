#!/usr/bin/env bash
# JobShield setup for macOS / Linux. Needs Python 3.10-3.13 and Node.js 20+.
set -euo pipefail
cd "$(dirname "$0")"
MODEL="${OLLAMA_MODEL:-qwen3.5:4b}"
PY="$(command -v python3.12 || command -v python3.13 || command -v python3.11 || command -v python3)"

echo "[1/5] Python environment"
[ -x ai_service/.venv/bin/python ] || "$PY" -m venv ai_service/.venv
ai_service/.venv/bin/python -m pip install -q --upgrade pip
ai_service/.venv/bin/python -m pip install -q -r ai_service/requirements.txt
ai_service/.venv/bin/python -m playwright install chromium >/dev/null 2>&1 || echo "  (browser download skipped)"

echo "[2/5] Web app packages"
(cd backend && npm install --no-audit --no-fund --loglevel=error)
(cd frontend && npm install --no-audit --no-fund --loglevel=error && npm run build --silent)

echo "[3/5] Ollama"
if ! command -v ollama >/dev/null; then
  if [[ "$(uname)" == "Darwin" ]]; then brew install ollama || echo "  Install Ollama from https://ollama.com/download"
  else curl -fsSL https://ollama.com/install.sh | sh || echo "  Install Ollama from https://ollama.com/download"; fi
fi

if command -v ollama >/dev/null; then
  curl -s localhost:11434/api/version >/dev/null || (ollama serve >/dev/null 2>&1 &) ; sleep 3
  echo "[4/5] Reasoning model $MODEL (~3 GB, first run only)"
  ollama pull "$MODEL" || echo "  Model download failed; JobShield works without it."
fi

echo "[5/5] Starting JobShield"
exec ai_service/.venv/bin/python launch.py
