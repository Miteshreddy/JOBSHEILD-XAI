FROM python:3.11-slim

WORKDIR /app

# libgl1/libglib2.0-0: required by opencv-python-headless (a EasyOCR
# dependency) even in headless mode, for its shared-library loading.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY ai_service/requirements.txt ./ai_service/requirements.txt
# This image serves CPU-only (no GPU passthrough configured in
# docker-compose.yml, matching NFR-1's CPU-inference support) — installing
# plain `torch` from PyPI on Linux pulls several GB of CUDA/cuDNN libraries
# it will never use, so the CPU-only build is installed explicitly first;
# the requirements.txt install below then sees torch==2.13.0 already
# satisfied and leaves it alone.
#
# torchvision MUST be pinned here too, from the same index, in the same
# command: installing it later (as a transitive dependency of something in
# requirements.txt, e.g. via accelerate) resolved a torchvision build with a
# different ABI than this CPU-only torch and crashed the whole service at
# startup with `RuntimeError: operator torchvision::nms does not exist` —
# found by actually running the built image, not just building it.
RUN pip install --no-cache-dir torch==2.13.0 torchvision==0.28.0 --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r ai_service/requirements.txt

COPY ai_service ./ai_service
COPY pytest.ini ./pytest.ini

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

CMD ["uvicorn", "ai_service.app:app", "--host", "0.0.0.0", "--port", "8000"]
