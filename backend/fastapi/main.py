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
model = joblib.load("ridge_best_model_1.pkl")  # change to your model path
# Load therapy effectiveness model
therapy_pathline_model = joblib.load("therapy_effectiveness_model.pkl")


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

        # Run prediction for each visit (modifying HbA1c1 field)
        visits = [data.hba1c1, data.hba1c2, data.hba1c3]
        probabilities = []

        for val in visits:
            df['HbA1c1'] = [val]
            prob = therapy_pathline_model.predict_proba(df)[0][1]
            probabilities.append(round(prob, 3))

        # Build prompt and call Groq
        import os
        from groq import Groq

        prob_text = "\n".join([f"Visit {i+1}: {p * 100:.1f}%" for i, p in enumerate(probabilities)])
        prompt = (
        f"The patient is undergoing the insulin regimen: {patient['INSULIN REGIMEN']}.\n"
        f"The predicted therapy effectiveness probabilities over three visits are:\n"
        + "\n".join(prob_strings) +
        "\n\n"
        "Based on these probabilities, provide personalized insights or advice regarding this patient's therapy effectiveness.\n"
        "Additionally, justify the therapy effectiveness probabilities by analyzing the patient's HbA1c, FVG, and DDS score trends.\n"
        "For example, indicate if decreasing trends in these scores support the predicted effectiveness or if there are concerns.\n"
        "Use the following patient score values for your analysis:\n"
        f"- HbA1c scores: {patient['HbA1c1']}, {patient['HbA1c2']}, {patient['HbA1c3']}\n"
        f"- FVG scores: {patient['FVG1']}, {patient['FVG2']}, {patient['FVG3']}\n"
        f"- DDS scores: {patient['DDS1']}, {patient['DDS3']}\n"
        "Please keep your response concise and limit it to no more than 360 words."
    )

        client = Groq(api_key="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")
        llm = client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[
                {"role": "system", "content": "You are a helpful medical AI assistant."},
                {"role": "user", "content": prompt}
            ]
        )

        full_reply = llm.choices[0].message.content
        insight = full_reply.split("</think>")[-1].strip() if "</think>" in full_reply else full_reply.strip()

        # Extract top 5 global feature importances
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





