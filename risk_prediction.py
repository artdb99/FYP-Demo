import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import joblib

# === 1. Load Dataset ===
data = pd.read_csv("data/cleaned_expanded_preprocessed_dr_lim_5000.csv")

# === 2. Encode Categorical Features ===
label_cols = ['GENDER', 'CKD Stage']
for col in label_cols:
    if data[col].dtype == object or data[col].isnull().any():
        le = LabelEncoder()
        data[col] = le.fit_transform(data[col].astype(str))  # Convert NaNs to string to encode safely

# === 3. Select Features and Target ===
features = [
    'AGE', 'GENDER', 'DURATION DM',
    'Freq SMBG', 'Freq Hypo', 'Freq of Visits',
    'eGFR', 'CKD Stage'
]
target = 'Target HbA1C'

# === 4. Handle Missing Values ===
data = data[features + [target]].copy()

# Fill numeric missing values with median
for col in features:
    if data[col].isnull().any():
        data[col].fillna(data[col].median(), inplace=True)

# Drop rows where target is missing
data = data.dropna(subset=[target])

# === 5. Prepare Features and Target ===
X = data[features]
y = data[target]

# === 6. Train-Test Split ===
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# === 7. Train Random Forest Regressor ===
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# === 8. Evaluate Model ===
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
print(f"\n📉 Mean Absolute Error (MAE): {mae:.3f}")

# === 9. Feature Importance ===
importances = pd.Series(model.feature_importances_, index=features).sort_values(ascending=False)
print("\n📈 Top Feature Importances:")
print(importances.head(10))

# === 10. Save Model ===
joblib.dump(model, "risk_model_rf.pkl")
print("\n✅ Model saved as 'risk_model_rf.pkl'")