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
