from fastapi import FastAPI
from fastapi import HTTPException
import pandas as pd
from pydantic import BaseModel
from fastapi import Request
from chatbot_using_rag import generate_rag_response  
import numpy as np
import joblib
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use ["http://127.0.0.1"] if restricting
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Load the model
model = joblib.load("ridge_best_model.pkl")  # change to your model path

# Define request body
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

@app.post("/predict")
def predict(req: PredictionRequest):
    print("Received:", req.features)  # 👈 Add this
    input_data = np.array(req.features).reshape(1, -1)
    prediction = model.predict(input_data)
    return {"prediction": float(prediction[0])}

@app.post("/rag")
async def rag_query(request: Request):
    body = await request.json()
    query = body["query"]
    response_text = generate_rag_response(query)
    return {"response": response_text}

@app.post("/treatment-recommendation")
async def treatment_recommendation(request: TreatmentRequest):
    patient_data = "\n".join([f"{k}: {v}" for k, v in request.patient.items()])
    query = f"Patient data:\n{patient_data}\n\nQuestion: {request.question}"
    response_text = generate_rag_response(query)
    return {"response": response_text}

@app.post("/chatbot-patient-query")
async def chatbot_patient_query(req: PatientChatRequest):
    patient_data = "\n".join([f"{k}: {v}" for k, v in req.patient.items()])
    prompt = f"""
You are a medical AI assistant. Given the patient's data and their question, generate a helpful and personalized response.

Patient Info:
{patient_data}

User Question: {req.query}

Instructions:
- Use markdown headers like ## Recommendations or ## Monitoring Tips if multiple points need clarity.
- For short or direct questions, reply naturally without forcing a structure.
- Do not fabricate data. Base all suggestions on the context and user's question.
"""

    response = generate_rag_response(prompt)
    return {"response": response}

@app.post("/predict-therapy")
def predict(data: PatientData):
    try:
        print("🔎 Received payload:", data)
        input_df = pd.DataFrame([{
            'INSULIN REGIMEN': data.insulin_regimen,
            'HbA1c1': data.hba1c1,
            'HbA1c2': data.hba1c2,
            'HbA1c3': data.hba1c3,
            'HbA1c_Delta_1_2': data.hba1c_delta_1_2,
            'Gap from initial visit (days)': data.gap_initial_visit,
            'Gap from first clinical visit (days)': data.gap_first_clinical,
            'eGFR': data.egfr,
            'Reduction (%)': data.reduction_percent,
            'FVG1': data.fvg1,
            'FVG2': data.fvg2,
            'FVG3': data.fvg3,
            'FVG_Delta_1_2': data.fvg_delta_1_2,
            'DDS1': data.dds1,
            'DDS3': data.dds3,
            'DDS_Trend_1_3': data.dds_trend_1_3
        }])

        prob = model.predict_proba(input_df)[0][1]
        return {"probability": round(prob, 2), "status": "Effective" if prob >= 0.5 else "Ineffective"}
    except Exception as e:
        print("❌ Exception:", e)
        raise HTTPException(status_code=400, detail=str(e))


