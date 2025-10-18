FROM python:3.11-slim

# Install build tools AND runtime libs needed by scientific Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    libstdc++6 \
    libblas3 \
    liblapack3 \
    libgfortran5 \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Install deps first for layer caching
COPY backend/fastapi/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Optional: pre-warm the embedding model to avoid runtime downloads (can remove if not needed)
ENV HF_HOME=/app/.cache/huggingface
# Uncomment to pre-bake the model (adds image size but faster cold start)
# RUN python - <<'PY'\nfrom sentence_transformers import SentenceTransformer\nSentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')\nPY

# Copy app
COPY backend/fastapi/ /app

# Expose expected port
ENV PORT=8000
# Run single worker to reduce memory pressure
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]