import joblib

model = joblib.load("risk_model_rf.pkl")  # change to your model path
x = [9.2, 8.0, 130, 145, 1.2, 0.013, -30]
print(model.predict([x]))