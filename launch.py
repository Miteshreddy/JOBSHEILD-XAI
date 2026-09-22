"""Unified Launcher for Explainable Fake Job Detection Platform (FraudBERT).

Starts:
  1. Python FastAPI AI Service (port 8000)
  2. Node.js / Express Backend (port 5001)
  3. React Vite Frontend (port 5173)

Automatically verifies services and opens the browser.
Press Ctrl+C in this terminal to gracefully stop all services.

The frontend is bound to 0.0.0.0 so it is accessible from any device
on the same local network (phones, tablets, other PCs).

NOTE: Run setup.bat first before running this script.
"""

import os
import sys
import time
import socket
import subprocess
import webbrowser
from pathlib import Path
import urllib.request
import urllib.error

ROOT_DIR = Path(__file__).resolve().parent
AI_DIR = ROOT_DIR / "ai_service"
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

def check_port(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0

def wait_for_url(url: str, timeout: int = 45, interval: float = 1.0) -> bool:
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "HealthChecker/1.0"})
            with urllib.request.urlopen(req, timeout=2) as resp:
                if resp.status in (200, 304):
                    return True
        except Exception:
            pass
        time.sleep(interval)
    return False

def get_python_exe() -> str:
    """Returns the venv python (preferred) or falls back to the system python."""
    venv_win = AI_DIR / ".venv" / "Scripts" / "python.exe"
    venv_unix = AI_DIR / ".venv" / "bin" / "python"
    if venv_win.exists():
        return str(venv_win)
    if venv_unix.exists():
        return str(venv_unix)
    # Fall back to the system interpreter that launched this script.
    return sys.executable


def get_local_ip() -> str:
    """Best-effort LAN IP address for the current machine."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "<your-local-ip>"

def ensure_env_files():
    # Backend .env
    backend_env = BACKEND_DIR / ".env"
    backend_example = BACKEND_DIR / ".env.example"
    if not backend_env.exists() and backend_example.exists():
        backend_env.write_text(backend_example.read_text(encoding="utf-8"), encoding="utf-8")
        print("[SETUP] Created backend/.env from .env.example")

    # AI Service .env
    ai_env = AI_DIR / ".env"
    ai_example = AI_DIR / ".env.example"
    if not ai_env.exists() and ai_example.exists():
        ai_env.write_text(ai_example.read_text(encoding="utf-8"), encoding="utf-8")
        print("[SETUP] Created ai_service/.env from .env.example")

def main():
    print("=" * 65)
    print("  🛡️  EXPLAINABLE FAKE JOB DETECTION PLATFORM (FraudBERT)")
    print("=" * 65)

    ensure_env_files()

    python_exe = get_python_exe()
    print(f"[INFO] Using Python: {python_exe}")

    processes = []
    env_ai = os.environ.copy()
    env_ai["PYTHONPATH"] = str(ROOT_DIR)
    env_ai["PYTHONUNBUFFERED"] = "1"

    # Detect backend port from backend/.env if configured
    backend_port = 5001
    backend_env_file = BACKEND_DIR / ".env"
    if backend_env_file.exists():
        for line in backend_env_file.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("PORT="):
                try:
                    backend_port = int(line.strip().split("=", 1)[1].strip())
                except ValueError:
                    pass

    try:
        # 1. Start AI Service (if uvicorn is available)
        has_uvicorn = False
        try:
            res = subprocess.run([python_exe, "-c", "import uvicorn"], capture_output=True)
            has_uvicorn = (res.returncode == 0)
        except Exception:
            pass

        if has_uvicorn:
            print("[1/3] Starting FastAPI AI Service on port 8000...")
            p_ai = subprocess.Popen(
                [python_exe, "-u", "-m", "uvicorn", "ai_service.app:app", "--host", "127.0.0.1", "--port", "8000"],
                cwd=str(ROOT_DIR),
                env=env_ai,
            )
            processes.append(("AI Service", p_ai))
        else:
            print("[1/3] Python AI Service skipped (install torch & uvicorn to enable AI analysis).")

        # 2. Start Backend Service
        print(f"[2/3] Starting Express Backend Service on port {backend_port}...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        p_backend = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=str(BACKEND_DIR),
        )
        processes.append(("Backend", p_backend))

        # 3. Start Frontend Service
        # Bind to 0.0.0.0 so the site is reachable from any device on the
        # local network (phones, tablets, other PCs — not just localhost).
        # The healthcheck still uses 127.0.0.1 which works because loopback
        # always maps to the same listener.
        print("[3/3] Starting Vite Frontend on port 5173 (all interfaces)...")
        p_frontend = subprocess.Popen(
            [npm_cmd, "run", "dev", "--", "--host", "0.0.0.0"],
            cwd=str(FRONTEND_DIR),
        )
        processes.append(("Frontend", p_frontend))

        print("\n[WAIT] Waiting for all services to initialize...")
        ai_ok = wait_for_url("http://127.0.0.1:8000/health", timeout=10) if has_uvicorn else False
        backend_ok = wait_for_url(f"http://127.0.0.1:{backend_port}/api/health", timeout=25)
        frontend_ok = wait_for_url("http://127.0.0.1:5173", timeout=20)

        local_ip = get_local_ip()
        print("\n" + "=" * 65)
        print("  🎉 ALL SERVICES ARE RUNNING!")
        print("=" * 65)
        print(f"  👉 Web Application (this machine):  http://localhost:5173  [{'ONLINE' if frontend_ok else 'STARTING'}]")
        print(f"  👉 Web Application (other devices): http://{local_ip}:5173")
        print(f"  👉 Backend API Docs:  http://localhost:{backend_port}/api-docs [{'ONLINE' if backend_ok else 'STARTING'}]")
        if has_uvicorn:
            print(f"  👉 AI Service Docs:   http://localhost:8000/docs     [{'ONLINE' if ai_ok else 'STARTING'}]")
        print("=" * 65)
        print("\nOpening web browser at http://localhost:5173 ...")
        webbrowser.open("http://localhost:5173")

        print("\nPress Ctrl+C at any time to stop all services.\n")

        # Keep alive until Ctrl+C
        while True:
            for name, proc in processes:
                poll = proc.poll()
                if poll is not None:
                    print(f"[WARN] {name} exited unexpectedly with code {poll}")
            time.sleep(2)

    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Stopping all services...")
    finally:
        for name, proc in processes:
            if proc.poll() is None:
                print(f"[SHUTDOWN] Terminating {name}...")
                try:
                    proc.terminate()
                    proc.wait(timeout=3)
                except Exception:
                    proc.kill()
        print("[SHUTDOWN] All services stopped cleanly.")

if __name__ == "__main__":
    main()
