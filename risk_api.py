from fastapi import FastAPI
from pydantic import BaseModel, Field
import joblib
import pandas as pd

# Load the trained model
model = joblib.load("risk_model_rf.pkl")

# FastAPI app
app = FastAPI()

# Root route
@app.get("/")
def read_root():
    return {"message": "Risk Prediction API is running 🚀"}

# Input schema (map clean names to model names)
class PatientData(BaseModel):
    age: float = Field(..., alias="AGE")
    gender: int = Field(..., alias="GENDER")
    duration_dm: float = Field(..., alias="DURATION DM")
    freq_smbg: float = Field(..., alias="Freq SMBG")
    freq_hypo: float = Field(..., alias="Freq Hypo")
    freq_visits: float = Field(..., alias="Freq of Visits")
    egfr: float = Field(..., alias="eGFR")
    ckd_stage: int = Field(..., alias="CKD Stage")

    class Config:
        allow_population_by_field_name = True  # allow both alias and field name in input

# Predict endpoint
@app.post("/predict")
def predict_hba1c(data: PatientData):
    # Convert input to DataFrame with original model column names
    input_df = pd.DataFrame([{
        "AGE": data.age,
        "GENDER": data.gender,
        "DURATION DM": data.duration_dm,
        "Freq SMBG": data.freq_smbg,
        "Freq Hypo": data.freq_hypo,
        "Freq of Visits": data.freq_visits,
        "eGFR": data.egfr,
        "CKD Stage": data.ckd_stage,
    }])

    prediction = model.predict(input_df)[0]
    return {"predicted_hba1c": round(prediction, 3)}
