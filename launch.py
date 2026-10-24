"""JobShield launcher — starts everything and opens the website.

    python launch.py            # production build served at http://localhost:5001
    python launch.py --dev      # also runs the Vite dev server (hot reload) on :5173

Starts, in order:
  1. Ollama (local reasoning model), if installed and not already running
  2. Analysis service  (FastAPI, http://127.0.0.1:8000)
  3. Web app + API     (Node/Express, http://localhost:5001)
Press Ctrl+C to stop everything.
"""
from __future__ import annotations

import argparse
import os
import secrets
import shutil
import signal
import subprocess
import sys
import time
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
AI_DIR = ROOT / "ai_service"
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"
IS_WINDOWS = os.name == "nt"
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.5:4b")
APP_URL = "http://localhost:5001"

children: list[subprocess.Popen] = []


def say(msg: str) -> None:
    print(f"  {msg}", flush=True)


def venv_python() -> str:
    for candidate in (AI_DIR / ".venv" / "Scripts" / "python.exe", AI_DIR / ".venv" / "bin" / "python"):
        if candidate.exists():
            return str(candidate)
    return sys.executable


def npm() -> str:
    return "npm.cmd" if IS_WINDOWS else "npm"


def is_up(url: str, timeout: float = 2.0) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            return resp.status < 500
    except Exception:
        return False


def wait_for(url: str, seconds: int) -> bool:
    deadline = time.time() + seconds
    while time.time() < deadline:
        if is_up(url):
            return True
        time.sleep(1)
    return False


def spawn(cmd: list[str], cwd: Path, log_name: str, env: dict | None = None) -> subprocess.Popen:
    logs = ROOT / "logs"
    logs.mkdir(exist_ok=True)
    log = open(logs / log_name, "a", encoding="utf-8")
    flags = subprocess.CREATE_NEW_PROCESS_GROUP if IS_WINDOWS else 0
    proc = subprocess.Popen(cmd, cwd=cwd, stdout=log, stderr=subprocess.STDOUT, env={**os.environ, **(env or {})}, creationflags=flags)
    children.append(proc)
    return proc


def ensure_env_files() -> None:
    backend_env = BACKEND_DIR / ".env"
    if not backend_env.exists():
        text = (BACKEND_DIR / ".env.example").read_text(encoding="utf-8")
        text = text.replace("change_me_access_secret_min_32_chars", secrets.token_hex(32))
        text = text.replace("change_me_refresh_secret_min_32_chars", secrets.token_hex(32))
        backend_env.write_text(text, encoding="utf-8")
        say("Created backend/.env with fresh secrets")
    ai_env = AI_DIR / ".env"
    if not ai_env.exists():
        shutil.copy(AI_DIR / ".env.example", ai_env)
        say("Created ai_service/.env")


def find_ollama() -> str | None:
    found = shutil.which("ollama")
    if found:
        return found
    if IS_WINDOWS:
        default = Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Ollama" / "ollama.exe"
        if default.exists():
            return str(default)
    return None


def start_ollama() -> None:
    if is_up("http://localhost:11434/api/version"):
        say("Ollama ............ already running")
    else:
        exe = find_ollama()
        if not exe:
            say("Ollama ............ NOT INSTALLED — reasoning disabled (run setup again to install it)")
            return
        spawn([exe, "serve"], ROOT, "ollama.log")
        if not wait_for("http://localhost:11434/api/version", 30):
            say("Ollama ............ failed to start (see logs/ollama.log) — reasoning disabled")
            return
        say("Ollama ............ started")
    try:
        with urllib.request.urlopen("http://localhost:11434/api/tags", timeout=5) as resp:
            installed = OLLAMA_MODEL.encode() in resp.read()
    except Exception:
        installed = False
    if not installed:
        exe = find_ollama()
        if exe:
            say(f"Reasoning model ... downloading {OLLAMA_MODEL} in the background (~3 GB); checks run without it until it finishes")
            spawn([exe, "pull", OLLAMA_MODEL], ROOT, "ollama-pull.log")
    else:
        say(f"Reasoning model ... {OLLAMA_MODEL} ready")


def build_frontend_if_needed() -> None:
    if (FRONTEND_DIR / "dist" / "index.html").exists():
        return
    say("Building the website (first run only)...")
    subprocess.run([npm(), "run", "build"], cwd=FRONTEND_DIR, check=True)


def shutdown(*_args) -> None:
    print("\n  Stopping JobShield...", flush=True)
    for proc in reversed(children):
        if proc.poll() is None:
            try:
                if IS_WINDOWS:
                    proc.send_signal(signal.CTRL_BREAK_EVENT)
                else:
                    proc.terminate()
                proc.wait(timeout=8)
            except Exception:
                proc.kill()
    sys.exit(0)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dev", action="store_true", help="also run the Vite dev server on :5173")
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    print("\n  JobShield\n  ---------")
    ensure_env_files()
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    start_ollama()

    if is_up("http://127.0.0.1:8000/health"):
        say("Analysis service .. already running")
    else:
        spawn([venv_python(), "-m", "uvicorn", "ai_service.app:app", "--host", "127.0.0.1", "--port", "8000"], ROOT, "ai_service.log", {"PYTHONPATH": str(ROOT)})
        ok = wait_for("http://127.0.0.1:8000/health", 120)
        say("Analysis service .. " + ("ready" if ok else "still starting (see logs/ai_service.log)"))

    if not args.dev:
        build_frontend_if_needed()
    if is_up(f"{APP_URL}/api/health"):
        say("Web app ........... already running")
    else:
        spawn(["node", "server.js"], BACKEND_DIR, "backend.log")
        # First run downloads an embedded MongoDB (~70 MB), so allow time.
        ok = wait_for(f"{APP_URL}/api/health", 240)
        say("Web app ........... " + ("ready" if ok else "failed to start (see logs/backend.log)"))
        if not ok:
            shutdown()

    url = APP_URL
    if args.dev:
        spawn([npm(), "run", "dev", "--", "--port", "5173"], FRONTEND_DIR, "frontend.log")
        wait_for("http://localhost:5173", 60)
        url = "http://localhost:5173"

    print(f"\n  JobShield is running at {url}\n  Logs are in the logs/ folder. Press Ctrl+C to stop.\n", flush=True)
    if not args.no_browser:
        webbrowser.open(url)

    while True:
        time.sleep(2)
        for proc in children:
            if proc.poll() is not None and proc.args[-1] != OLLAMA_MODEL and "pull" not in proc.args:
                say(f"A service exited unexpectedly ({' '.join(map(str, proc.args[:3]))}). Check the logs/ folder.")
                shutdown()


if __name__ == "__main__":
    main()
