#!/bin/bash
set -e

# Optional: if not using Oryx build
# python -m pip install --upgrade pip
# pip install -r requirements.txt

exec uvicorn main:app --host 0.0.0.0 --port 8000