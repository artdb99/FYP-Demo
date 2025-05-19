from fastapi import FastAPI
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

