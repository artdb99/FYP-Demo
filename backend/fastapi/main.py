import os
import sqlite3
import hashlib
import json
# ---- Simple SQLite cache helpers ----
_db_path = os.getenv("PREDICTION_CACHE_DB", "prediction_cache.sqlite")

def _get_db_conn():
    conn = sqlite3.connect(_db_path)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS prediction_cache (
            key TEXT PRIMARY KEY,
            value REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    # For bulk endpoint we may also store vectors row-wise using same table per-row
    return conn

def _features_key(
    features: list[float],
    patient_id: int | None = None,
    model_version: str = "risk_v1",
) -> str:
    """Create a stable cache key from inputs + optional patient and model version.

    Including patient_id and model_version ensures keys change when either
    the inputs (features), the patient, or the model changes.
    """
    payload = json.dumps(
        {
            "v": model_version,
            "pid": patient_id,
            "f": [float(x) for x in features],
        },
        separators=(",", ":"),
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def cache_get(features: list[float], patient_id: int | None = None, model_version: str = "risk_v1"):
    try:
        key = _features_key(features, patient_id=patient_id, model_version=model_version)
        with _get_db_conn() as conn:
            cur = conn.execute("SELECT value FROM prediction_cache WHERE key = ?", (key,))
            row = cur.fetchone()
            return None if row is None else float(row[0])
    except Exception:
        return None

def cache_set(features: list[float], value: float, patient_id: int | None = None, model_version: str = "risk_v1"):
    try:
        key = _features_key(features, patient_id=patient_id, model_version=model_version)
        with _get_db_conn() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO prediction_cache (key, value) VALUES (?, ?)",
                (key, float(value)),
            )
    except Exception:
        pass

# ---- Latest-per-patient helpers (SWR) ----
def _latest_key(patient_id: int | None, model_version: str) -> str:
    return f"latest:{patient_id or 'na'}:{model_version}"

def latest_get(patient_id: int | None, model_version: str = "risk_v1") -> float | None:
    try:
        key = _latest_key(patient_id, model_version)
        with _get_db_conn() as conn:
            cur = conn.execute("SELECT value FROM prediction_cache WHERE key = ?", (key,))
            row = cur.fetchone()
            return None if row is None else float(row[0])
    except Exception:
        return None

def latest_set(patient_id: int | None, value: float, model_version: str = "risk_v1") -> None:
    try:
        key = _latest_key(patient_id, model_version)
        with _get_db_conn() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO prediction_cache (key, value) VALUES (?, ?)",
                (key, float(value)),
            )
    except Exception:
        pass

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import warnings
import numpy as np
import pandas as pd
import sqlite3
import hashlib
import json

load_dotenv()

# Initialize FastAPI
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_ORIGIN", "http://localhost:5174"),
        os.getenv("LARAVEL_ORIGIN", "https://104384876laravel-cwh4axg4d4h5f0ha.southeastasia-01.azurewebsites.net"),
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Suppress noisy sklearn warning about feature names mismatch
warnings.filterwarnings(
    "ignore",
    message=r"X does not have valid feature names, but .* was fitted with feature names",
)

# --- Lazy-loaded resources ---
_ridge_model = None
_therapy_pathline_model = None
_pinecone_client = None
_pinecone_index = None
_groq_client = None
_embedder = None


def get_ridge_model():
    global _ridge_model
    if _ridge_model is None:
        import joblib
        _ridge_model = joblib.load("ridge_best_model_1.pkl")
    return _ridge_model


def get_therapy_model():
    global _therapy_pathline_model
    if _therapy_pathline_model is None:
        import joblib
        _therapy_pathline_model = joblib.load("therapy_effectiveness_model.pkl")
    return _therapy_pathline_model


def get_pinecone_client():
    global _pinecone_client
    if _pinecone_client is None:
        from pinecone import Pinecone
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise RuntimeError("PINECONE_API_KEY not set")
        _pinecone_client = Pinecone(api_key=api_key)
    return _pinecone_client


def get_pinecone_index():
    global _pinecone_index
    if _pinecone_index is None:
        pc = get_pinecone_client()
        _pinecone_index = pc.Index("medicalbooks-1536")
    return _pinecone_index


def get_groq_client():
    global _groq_client
    if _groq_client is None:
        from groq import Groq
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY not set")
        _groq_client = Groq(api_key=api_key)
    return _groq_client


def get_openai_client():
    # Keep OpenAI lightweight; just set key on demand
    import openai
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        openai.api_key = api_key
    return openai


def get_embedder():
    global _embedder
    if _embedder is None:
        # Lazy import to avoid pulling torch/transformers at startup
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


@app.get("/health")
def health():
    return {"status": "ok"}


def get_openai_embedding(text: str) -> list:
    try:
        openai = get_openai_client()
        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input=[text]
        )
        return response.data[0].embedding
    except Exception as e:
        print("❌ OpenAI Embedding Error:", e)
        raise

def retrieve_context(query, top_k=3):
    query_vec = get_openai_embedding(query)
    index = get_pinecone_index()
    results = index.query(vector=query_vec, top_k=top_k, include_metadata=True)

    context_chunks = []
    for match in results.get("matches", []):
        metadata = match.get("metadata", {})
        if "text" in metadata:
            context_chunks.append(metadata["text"])
    
    return context_chunks

def generate_rag_response(user_query, patient_context=""):
    try:
        context_chunks = retrieve_context(user_query)
        print("[RAG] Retrieved context:", context_chunks)

        all_context = f"Patient Info:\n{patient_context}\n\nMedical Book Context:\n" + "\n".join(context_chunks)

        prompt = f"""
You are a clinical AI. Only use the information in the provided context.

Context:
{all_context}

User Question:
{user_query}

Instructions:
- Do not guess or fabricate.
- If context lacks a specific answer, say so.
- Mention insulin regimen (e.g. PBD) only if clearly stated in the context.
""".strip()

        groq_client = get_groq_client()
        response = groq_client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        return {
            "response": response.choices[0].message.content,
            "context_used": all_context
        }

    except Exception as e:
        print("[RAG ERROR]", str(e))
        return {
            "response": "❌ AI backend error: " + str(e),
            "context_used": ""
        }

# Data models
class PredictionRequest(BaseModel):
    features: list[float]
    patient_id: int | None = None
    model_version: str | None = None

class BulkPredictRequest(BaseModel):
    rows: list[list[float]]

class TreatmentRequest(BaseModel):
    patient: dict
    question: str

class PatientChatRequest(BaseModel):
    patient: dict
    query: str

class PatientData(BaseModel):
    insulin_regimen: str
    hba1c1: float
    hba1c2: float
    hba1c3: float
    hba1c_delta_1_2: float
    gap_initial_visit: float
    gap_first_clinical: float
    egfr: float
    reduction_percent: float
    fvg1: float
    fvg2: float
    fvg3: float
    fvg_delta_1_2: float
    dds1: float
    dds3: float
    dds_trend_1_3: float

class DashboardRequest(BaseModel):
    features: list[float]
    patient_id: int | None = None
    model_version: str | None = None
    patient: dict | None = None  # optional; used for key factor strings

# Routes
@app.post("/predict")
def predict(req: PredictionRequest, force: bool = False):
    try:
        model_version = req.model_version or "risk_v1"

        # Check cache first (unless force recompute)
        if not force:
            cached = cache_get(req.features, patient_id=req.patient_id, model_version=model_version)
            if cached is not None:
                return {"prediction": cached, "cached": True, "model_version": model_version}

        m = get_ridge_model()
        input_data = np.array(req.features, dtype=float).reshape(1, -1)
        prediction = float(m.predict(input_data)[0])
        cache_set(req.features, prediction, patient_id=req.patient_id, model_version=model_version)
        return {"prediction": prediction, "cached": False, "model_version": model_version}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")


@app.post("/predict-bulk")
def predict_bulk(req: BulkPredictRequest):
    try:
        m = get_ridge_model()
        if not req.rows:
            return {"predictions": []}

        predictions: list[float] = []
        rows_to_compute: list[tuple[int, list[float]]] = []

        # Try cache for each row
        for idx, row in enumerate(req.rows):
            cached = cache_get(row, patient_id=None, model_version="risk_v1")
            if cached is None:
                rows_to_compute.append((idx, row))
                predictions.append(None)  # placeholder
            else:
                predictions.append(cached)

        # Compute missing ones in a batch if any
        if rows_to_compute:
            X = np.array([r for _, r in rows_to_compute], dtype=float)
            y = m.predict(X)
            for (pos, row), y_val in zip(rows_to_compute, y):
                y_float = float(y_val)
                predictions[pos] = y_float
                cache_set(row, y_float, patient_id=None, model_version="risk_v1")

        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk prediction failed: {e}")

def _risk_label(val: float) -> str:
    if val < 5.7:
        return "Normal"
    if val < 6.5:
        return "At Risk"
    if val < 7.1:
        return "Moderate Risk"
    if val < 8.1:
        return "Risky"
    if val <= 9.0:
        return "Very Risky"
    return "Critical"

def _key_factors_from_patient(patient: dict | None) -> list[str]:
    if not patient:
        return []
    items: list[str] = []
    try:
        hba1c1 = float(patient.get("hba1c_1st_visit")) if patient.get("hba1c_1st_visit") is not None else None
        fvg1 = float(patient.get("fvg_1")) if patient.get("fvg_1") is not None else None
        rad = patient.get("reduction_a_per_day")
        rad = float(rad) if rad is not None else None
        fvg_delta_1_2 = patient.get("fvg_delta_1_2")
        fvg_delta_1_2 = float(fvg_delta_1_2) if fvg_delta_1_2 is not None else None

        if hba1c1 is not None:
            if hba1c1 > 8:
                items.append(f"High initial HbA1c ({hba1c1}%)")
            elif hba1c1 < 5.7:
                items.append(f"Normal initial HbA1c ({hba1c1}%)")
        if fvg1 is not None and fvg1 > 130:
            items.append(f"Elevated FVG @ V1 ({int(fvg1)} mg/dL)")
        if rad is not None and rad < 0.01:
            items.append(f"Low daily HbA1c drop ({rad:.3f})")
        if fvg_delta_1_2 is not None and fvg_delta_1_2 > 0:
            items.append(f"FVG increase between visits (+{fvg_delta_1_2})")
    except Exception:
        # Best-effort only
        pass
    return items[:6]

@app.post("/risk-dashboard")
def risk_dashboard(req: DashboardRequest, force: bool = False):
    try:
        model_version = req.model_version or "risk_v1"

        # 1) Exact cache hit: return immediately, not stale
        if not force:
            hit = cache_get(req.features, patient_id=req.patient_id, model_version=model_version)
            if hit is not None:
                label = _risk_label(float(hit))
                factors = _key_factors_from_patient(req.patient)
                return {
                    "prediction": float(hit),
                    "risk_label": label,
                    "key_factors": factors,
                    "cached": True,
                    "stale": False,
                    "model_version": model_version,
                }

        # 2) No exact hit: try latest-per-patient; if present, return immediately with stale=true
        latest = latest_get(req.patient_id, model_version=model_version)
        if latest is not None and not force:
            # Trigger background recompute to refresh exact cache for current features
            import threading
            def _recompute():
                try:
                    m = get_ridge_model()
                    input_data = np.array(req.features, dtype=float).reshape(1, -1)
                    pred = float(m.predict(input_data)[0])
                    cache_set(req.features, pred, patient_id=req.patient_id, model_version=model_version)
                    latest_set(req.patient_id, pred, model_version=model_version)
                except Exception:
                    pass
            threading.Thread(target=_recompute, daemon=True).start()

            label = _risk_label(float(latest))
            factors = _key_factors_from_patient(req.patient)
            return {
                "prediction": float(latest),
                "risk_label": label,
                "key_factors": factors,
                "cached": True,
                "stale": True,
                "model_version": model_version,
            }

        # 3) No latest value (or force): compute synchronously once, update both caches
        m = get_ridge_model()
        input_data = np.array(req.features, dtype=float).reshape(1, -1)
        prediction_val = float(m.predict(input_data)[0])
        cache_set(req.features, prediction_val, patient_id=req.patient_id, model_version=model_version)
        latest_set(req.patient_id, prediction_val, model_version=model_version)

        label = _risk_label(prediction_val)
        factors = _key_factors_from_patient(req.patient)
        return {
            "prediction": prediction_val,
            "risk_label": label,
            "key_factors": factors,
            "cached": False,
            "stale": False,
            "model_version": model_version,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk dashboard failed: {e}")

@app.post("/rag")
async def rag_query(request: Request):
    query = (await request.json())["query"]
    response_text = generate_rag_response(query)
    return {"response": response_text}

@app.post("/treatment-recommendation")
async def treatment_recommendation(request: Request):
    try:
        body = await request.json()
        patient = body["patient"]
        question = body["question"]

        # Serialize patient data as context
        patient_data = "\n".join([f"{k}: {v}" for k, v in patient.items()])

        # Use RAG-style structured prompt (pass patient context)
        response = generate_rag_response(question, patient_context=patient_data)

        return {
            "response": response["response"],
            "context_used": response["context_used"]
        }

    except Exception as e:
        print("❌ Treatment Recommendation Error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chatbot-patient-query")
async def chatbot_patient_query(req: PatientChatRequest):
    patient_data = "\n".join([f"{k}: {v}" for k, v in req.patient.items()])
    prompt = f"""
You are a clinical health assistant.

Context:
Patient Info:
{patient_data}

User Question:
{req.query}

Instructions:
- Answer directly and concisely based only on the patient's context.
- Do not show reasoning steps like "let me think" or "first".
- Do not explain your thought process or include <think> or internal monologue.
- Do not state patient ID, use patient name instead.
- Make notable key information that the AI had gathered from the medical book context that it was trained on.
- Use markdown only for bold and bullet points, like:
  - **HbA1c:** Slight improvement...
  - **FVG:** High variability...
- Keep responses friendly and clear, under 180 words.
"""

    response = generate_rag_response(prompt)
    return {"response": response["response"]}


@app.post("/predict-therapy-pathline")
def predict_therapy_pathline(data: PatientData):
    try:
        patient_dict = {
            'INSULIN REGIMEN': [data.insulin_regimen],
            'HbA1c1': [data.hba1c1],
            'HbA1c2': [data.hba1c2],
            'HbA1c3': [data.hba1c3],
            'HbA1c_Delta_1_2': [data.hba1c_delta_1_2],
            'Gap from initial visit (days)': [data.gap_initial_visit],
            'Gap from first clinical visit (days)': [data.gap_first_clinical],
            'eGFR': [data.egfr],
            'Reduction (%)': [data.reduction_percent],
            'FVG1': [data.fvg1],
            'FVG2': [data.fvg2],
            'FVG3': [data.fvg3],
            'FVG_Delta_1_2': [data.fvg_delta_1_2],
            'DDS1': [data.dds1],
            'DDS3': [data.dds3],
            'DDS_Trend_1_3': [data.dds_trend_1_3],
        }

        df = pd.DataFrame(patient_dict)
        visits = [data.hba1c1, data.hba1c2, data.hba1c3]
        probabilities = []

        tm = get_therapy_model()
        for val in visits:
            df['HbA1c1'] = [val]
            prob = tm.predict_proba(df)[0][1]
            probabilities.append(round(prob, 3))

        prob_text = "\n".join([f"Visit {i+1}: {p * 100:.1f}%" for i, p in enumerate(probabilities)])
        prompt = (
            f"The patient is undergoing the insulin regimen: {data.insulin_regimen}.\n"
    "The predicted therapy effectiveness probabilities over three visits are:\n{prob_text}\n\n"

    "Format output in strict markdown with the following sections:\n\n"

    "### 📋 Insights\n"
    "- **HbA1c**: one short statement.\n\n"
    "- **FVG**: one short statement.\n\n"
    "- **DDS**: one short statement.\n\n"

    "### 📝 Justification\n"
    "- 2–3 short but concise sentences explaining how HbA1c, FVG, and DDS trends justify the probabilities. Make sure these 3 are in bold to highlight separation\n\n"

    "Rules:\n"
    "- Always use `-` at the start of bullets.\n"
    "- Do not mix multiple points in one line.\n"
    "- Make sure for insights, it enters a new line after each bullet.\n"
    "- Keep all sections under 360 words total.\n"
    "- Use only markdown (no HTML).\n"

    f"HbA1c scores: {data.hba1c1}, {data.hba1c2}, {data.hba1c3}\n"
    f"FVG scores: {data.fvg1}, {data.fvg2}, {data.fvg3}\n"
    f"DDS scores: {data.dds1}, {data.dds3}\n"
        )

        llm = get_groq_client().chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[
                {"role": "system", "content": "You are a helpful medical AI assistant."},
                {"role": "user", "content": prompt}
            ]
        )

        full_reply = llm.choices[0].message.content
        insight = full_reply.split("</think>")[-1].strip() if "</think>" in full_reply else full_reply.strip()

        feature_names = tm.named_steps['preprocessor'].get_feature_names_out()
        importances = tm.named_steps['classifier'].feature_importances_
        sorted_features = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        top_factors = [{"feature": name, "importance": round(score, 4)} for name, score in sorted_features[:5]]

        return {
            "probabilities": probabilities,
            "insight": insight,
            "top_factors": top_factors
        }

    except Exception as e:
        print("❌ LLM Pathline Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
