# api_therapy_effectiveness.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI()

# Load model
model = joblib.load("therapy_effectiveness_model.pkl")

# Define input schema
class PatientData(BaseModel):
    insulin_regimen: str
    HbA1c1: float
    HbA1c2: float
    HbA1c3: float
    HbA1c_Delta_1_2: float
    gap_initial_visit: float
    gap_first_clinical: float
    eGFR: float
    reduction_percent: float
    FVG1: float
    FVG2: float
    FVG3: float
    FVG_Delta_1_2: float
    DDS1: float
    DDS3: float
    DDS_Trend_1_3: float

@app.post("/predict-therapy")
def predict(data: PatientData):
    try:
        input_df = pd.DataFrame([{
            'INSULIN REGIMEN': data.insulin_regimen,
            'HbA1c1': data.HbA1c1,
            'HbA1c2': data.HbA1c2,
            'HbA1c3': data.HbA1c3,
            'HbA1c_Delta_1_2': data.HbA1c_Delta_1_2,
            'Gap from initial visit (days)': data.gap_initial_visit,
            'Gap from first clinical visit (days)': data.gap_first_clinical,
            'eGFR': data.eGFR,
            'Reduction (%)': data.reduction_percent,
            'FVG1': data.FVG1,
            'FVG2': data.FVG2,
            'FVG3': data.FVG3,
            'FVG_Delta_1_2': data.FVG_Delta_1_2,
            'DDS1': data.DDS1,
            'DDS3': data.DDS3,
            'DDS_Trend_1_3': data.DDS_Trend_1_3
        }])

        prob = model.predict_proba(input_df)[0][1]
        return {"probability": round(prob, 2), "status": "Effective" if prob >= 0.5 else "Ineffective"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
