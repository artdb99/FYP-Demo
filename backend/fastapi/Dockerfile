FROM python:3.11-slim

# Optional build tools; remove if not needed by your pip wheels
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first to leverage layer caching
COPY backend/fastapi/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy app
COPY backend/fastapi/ /app

# Expose expected port
ENV PORT=8000
# Start FastAPI
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]