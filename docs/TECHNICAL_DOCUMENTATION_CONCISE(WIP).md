# Project Technical Documentation (Concise)

## 1) System Overview
- **Purpose**
  - A patient management platform that combines operational data (patients, visits, labs) with AI-assisted insights to support safer, faster, and more consistent clinical decisions.
  - How features serve clinical and operational value:
    - Risk Prediction: translates HbA1c/FVG and therapy indicators into a numeric risk score and category (Normal → Critical) to prioritize follow-up and triage at scale.
    - Therapy Effectiveness: projects effectiveness probabilities across visits and summarizes contributing factors, helping clinicians assess whether to continue, intensify, or change therapy.
    - Treatment Recommendation: provides structured, context-aware guidance using RAG + LLM (medical text + patient context), keeping suggestions grounded and auditable.
    - Patient Management (CRUD, profiles): central source of truth for demographics, labs, adherence indicators, and trends used across all AI features.
    - Admin & Governance: user/patient management and access boundaries so the right people manage the right data.
  - Outcomes: improved prioritization, reduced manual computation, explainable trends, and faster handoffs between care teams.

- **Primary Use Cases**
  - Clinic dashboarding and triage: identify very risky patients and drill into details quickly.
  - Therapy monitoring: compare visit-to-visit trends and receive concise, structured insights.
  - Case review: generate a treatment summary grounded in both patient context and medical literature (via RAG), to support MDT discussion.

- **Components**
  - **Laravel** (backend API + serves the React SPA)
  - **FastAPI** (ML inference and RAG/LLM endpoints; hosted separately)
  - **React SPA** (built with Vite; deployed inside Laravel `public/`)

## 2) High-Level Architecture
- **Serving model**
  - GitHub Actions builds the SPA in `frontend/` and copies `dist/` into `backend/public/`.
  - Azure Web App serves both Laravel and the SPA on the same origin.
  - FastAPI runs separately (Render) and is invoked from the SPA via `FASTAPI_URL`.

- **Data flow**
  - SPA → Laravel for patients/admin REST operations.
  - SPA → FastAPI for ML predictions and LLM/RAG.

```mermaid
flowchart LR
  A[React SPA (Vite)] -- REST --> B[(Laravel API)]
  A -- REST (ML) --> C[[FastAPI]]
  C -- RAG --> D[(Pinecone)]
  C -- LLM --> E[(Groq)]
  C -- Embeddings --> F[(OpenAI Embeddings)]
```

## 3) Environments & Configuration
- **Laravel `.env` (only .env in repo)** — `backend/.env`
  - Contains `APP_*`, `DB_*` (MySQL), `SESSION_*`, `LOG_*`.
  - Recommended URL:
    - `APP_URL=https://<laravel-app>.azurewebsites.net`
  - Azure MySQL SSL (if required):
    - `DB_SSL_CA=/home/site/wwwroot/storage/certs/DigiCertGlobalRootCA.crt.pem`

- **FastAPI (Render)**
  - No `.env` in repo. Set any keys in Render’s environment (e.g., `PINECONE_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`).
  - Start: `uvicorn main:app --host 0.0.0.0 --port 10000`
  - SPA note: the React app uses build-time configuration (Vite) for its API base URLs.

- **CORS**
  - FastAPI allows the deployed frontend/Laravel origins; tighten for production as needed.

## 4) CI/CD & Deployment
- **GitHub Actions** (`.github/workflows/deploy-laravel.yml`)
  - Composer install for `backend/`.
  - Build SPA in `frontend/` (Node 18).
  - Copy `frontend/dist/` → `backend/public/` (preserving `index.php` and `.htaccess`).
  - Deploy only `./backend` to Azure Web App Service.
  - Writes essential Laravel env entries required for the app runtime.

- **FastAPI on Render**
  - Independent service.
  - Health check: `GET /health`.

## 5) Laravel Backend (API + Hosting)
- **Endpoints (representative)**
  - `GET /api/patients`
    - Filters: `perPage`, `page`, `search`, `gender`, `insulin`
    - Response: `{ data: Patient[], meta: { total, last_page, ... } }`
  - `GET /api/patients/:id`
    - Response: `{ data: Patient }`
  - Admin (if enabled): `GET/DELETE /api/admin/users`, `DELETE /api/admin/patients/:id`

- **Validation/Resources**
  - Requests: `backend/app/Http/Requests/StorePatientRequest.php`, `UpdatePatientRequest.php`
  - Resource: `backend/app/Http/Resources/PatientResource.php`

- **Database**
  - Azure MySQL via `DB_*` in `backend/.env` (SSL CA supported).

## 6) FastAPI Backend (ML & RAG)
- **Entrypoint**: `backend/fastapi/main.py`
- **Endpoints**
  - `GET /health` → `{ status: "ok" }`
  - `POST /predict` → `{ prediction }`   (Body: `{ features: number[] }`)
  - `POST /predict-bulk` → `{ predictions }`   (Body: `{ rows: number[][] }`)
  - `POST /predict-therapy-pathline` → `{ probabilities[3], insight, top_factors[] }`
  - `POST /treatment-recommendation` → `{ response, context_used? }`
  - `POST /chatbot-patient-query` → `{ response }`
- **Performance**
  - Lazy-load heavy resources for fast cold starts.
  - `/predict-bulk` avoids N× calls and uses vectorized inference.

## 7) Frontend (React + Vite)
- **Structure**
  - `src/features/patients/`: list, profile, create, update
  - `src/features/risk/`: `RiskDashboard`, `RiskPredictionForm`
  - `src/features/therapy/`: `TherapyDashboard`, `TherapyEffectivenessForm`
  - `src/features/treatment/`: `TreatmentRecommendationDashboard`, `TreatmentRecommendationForm`
  - `src/features/admin/`: admin views
  - `src/api/`: `client.js` (Axios), `patients.js` (REST wrapper)
  - `src/components/`: shared UI (Card, PageHeader, MetricBox, RiskBadge, etc.)

- **Patterns**
  - `patientsApi.list(params)` normalizes Laravel pagination `{ data, meta }`.
  - `RiskDashboard` calls `POST /predict-bulk` once, maps predictions to patients, aggregates chart counts.
  - `RiskPredictionForm` accepts precomputed risk via Link state for instant render, then revalidates with `POST /predict`.
  - `TherapyEffectivenessForm` calls `POST /predict-therapy-pathline` and renders trends + LLM insight.

## 8) Data Model (used by features/ML)
- **Patient fields (common)**
  - Demographics: `name`, `age`, `gender`, `insulin_regimen_type`
  - Glycemic: `hba1c_1st_visit`, `hba1c_2nd_visit`, `hba1c_3rd_visit`
  - FVG: `fvg_1`, `fvg_2`, `fvg_3`, `avg_fvg_1_2`, `fvg_delta_1_2`
  - Therapy/psychometrics: `reduction_a`, `reduction_a_per_day`, `dds_1`, `dds_3`, `dds_trend_1_3`
  - Clinical gaps/renal: `gap_from_initial_visit`, `gap_from_first_clinical_visit`, `egfr`

## 9) Security & Operations (Essentials)
- **Secrets**
  - Laravel: set `APP_KEY`, `DB_*` in Azure App Service Configuration (backend/.env for local only).
  - FastAPI: set keys in Render environment (no repo `.env`).
- **CORS**
  - Whitelist deployed frontend/Laravel origins on FastAPI for production.
- **Health & Logs**
  - FastAPI: `GET /health`; logs in Render.
  - Laravel: logs under `storage/logs` in Azure.

## 10) Local Development (Minimal)
- **Laravel**
  - `composer install`
  - `php artisan migrate`
  - `php artisan serve`
- **FastAPI**
  - `pip install -r backend/fastapi/requirements.txt`
  - `uvicorn main:app --host 0.0.0.0 --port 10000`
- **Frontend (optional dev)**
  - `npm install` in `frontend/`
  - `npm run dev`
  - In production, SPA is built by CI into `backend/public/`.
