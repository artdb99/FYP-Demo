from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import joblib
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
import openai
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "https://104384876laravel-cwh4axg4d4h5f0ha.southeastasia-01.azurewebsites.net"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models
model = joblib.load("ridge_best_model_1.pkl")
therapy_pathline_model = joblib.load("therapy_effectiveness_model.pkl")

# RAG setup
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
openai.api_key = os.getenv("OPENAI_API_KEY")

index = pc.Index("medicalbooks-1536")

def get_openai_embedding(text: str) -> list:
    try:
        print("🔍 Getting OpenAI embedding...")
        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input=[text]
        )
        print("✅ Embedding received.")
        return response.data[0].embedding
    except Exception as e:
        print("❌ OpenAI Embedding Error:", e)
        raise

def retrieve_context(query, top_k=3):
    query_vec = get_openai_embedding(query)
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

# Routes
@app.post("/predict")
def predict(req: PredictionRequest):
    input_data = np.array(req.features).reshape(1, -1)
    prediction = model.predict(input_data)
    return {"prediction": float(prediction[0])}

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

        for val in visits:
            df['HbA1c1'] = [val]
            prob = therapy_pathline_model.predict_proba(df)[0][1]
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

        llm = groq_client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[
                {"role": "system", "content": "You are a helpful medical AI assistant."},
                {"role": "user", "content": prompt}
            ]
        )

        full_reply = llm.choices[0].message.content
        insight = full_reply.split("</think>")[-1].strip() if "</think>" in full_reply else full_reply.strip()

        feature_names = therapy_pathline_model.named_steps['preprocessor'].get_feature_names_out()
        importances = therapy_pathline_model.named_steps['classifier'].feature_importances_
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
