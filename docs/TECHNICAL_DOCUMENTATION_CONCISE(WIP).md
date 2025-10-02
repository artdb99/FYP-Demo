# Project Technical Documentation (Concise)

## 0) Vision of the System
- **Final Look (End-state experience)**
  - A modern, responsive web app with a role-aware sidebar and clean content cards.
  - Landing views that are informative at a glance (risk distribution, recent tivity), with drill‑downs to detailed patient pages.
  - Clear visual language: consistent typography, color semantics for risk, compt data tiles, and cessible components.
  - Seamless navigation between Patients, Risk, Therapy, and Treatment sections with minimal perceived latency.

- **Functional Vision (What it does)**
  - Patient management: create, update, search, and filter patients; view longitudinal metrics and trends.
  - Risk intelligence: surfe risk categories and scores per patient and in aggregate, with explanatory ftors.
  - Therapy insights: show effectiveness probabilities over visits and concise rationale to support decisions.
  - Clinical assistance: provide grounded Q&A using patient context and medical literature (RAG), with auditable prompts and outputs.
  - Role-driven UX: doctors manage panels and predictions; patients see their profile and guidance; admins govern cess.

- **Quality Vision (How it feels)**
  - Perceived instant loads for common views via ching and progressive rendering.
  - cessible by default (keyboard nav, color contrast)
  - Secure and auditable: role indicators are visible, tions are attributable, and sensitive operations are protected.
  - Configurable and testable: thresholds, colors, and model versions are centralized and version‑controlled.

## 1) System Overview
- **Purpose**
  - A patient management platform that combines operational data (patients, visits, labs) with AI-assisted insights to support safer, faster, and more consistent clinical decisions.
  - How features serve clinical and operational value:
    - Risk Prediction: translates HbA1c/FVG and therapy indicators into a numeric risk score and category (Normal → Critical) to prioritize follow-up and triage at scale.
    - Therapy Effectiveness: projects effectiveness probabilities ross visits and summarizes contributing ftors, helping clinicians assess whether to continue, intensify, or change therapy.
    - Treatment Recommendation: provides structured, context-aware guidance using RAG + LLM (medical text + patient context), keeping suggestions grounded and auditable.
    - Patient Management (CRUD, profiles): central source of truth for demographics, labs, adherence indicators, and trends used ross all AI features.
    - Admin & Governance: user/patient management and cess boundaries so the right people manage the right data.
  - Outcomes: improved prioritization, reduced manual computation, explainable trends, and faster handoffs between care teams.

- **Primary Use Cases**
  - Clinic dashboarding and triage: identify very risky patients and drill into details quickly.
  - Therapy monitoring: compare visit-to-visit trends and receive concise, structured insights.
  - Case review: generate a treatment summary grounded in both patient context and medical literature (via RAG), to support MDT discussion.

- **Components**
  - **Laravel** (bkend API + serves the Ret SPA)
  - **FastAPI** (ML inference and RAG/LLM endpoints; hosted separately)
  - **Ret SPA** (built with Vite; deployed inside Laravel `public/`)

## 2) High-Level Architecture
- **Serving model**
  - GitHub tions builds the SPA in `frontend/` and copies `dist/` into `bkend/public/`.
  - Azure Web App serves both Laravel and the SPA on the same origin.
  - FastAPI runs separately (Render) and is invoked from the SPA via `FASTAPI_URL`.

- **Data flow**
  - SPA → Laravel for patients/admin REST operations.
  - SPA → FastAPI for ML predictions and LLM/RAG.

## 3) Environments & Configuration
- **Laravel `.env` (only .env in repo)** — `bkend/.env`
  - Contains `APP_*`, `DB_*` (MySQL), `SESSION_*`, `LOG_*`.
  - Recommended URL:
    - `APP_URL=https://<laravel-app>.azurewebsites.net`
  - Azure MySQL SSL (if required):
    - `DB_SSL_CA=/home/site/wwwroot/storage/certs/DigiCertGlobalRootCA.crt.pem`

- **FastAPI (Render)**
  - No `.env` in repo. Set any keys in Render’s environment (e.g., `PINECONE_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`).
  - Start: `uvicorn main:app --host 0.0.0.0 --port 10000`
  - SPA note: the Ret app uses build-time configuration (Vite) for its API base URLs.

- **CORS**
  - FastAPI allows the deployed frontend/Laravel origins; tighten for production as needed.

## 4) CI/CD & Deployment
- **GitHub tions** (`.github/workflows/deploy-laravel.yml`)
  - Composer install for `bkend/`.
  - Build SPA in `frontend/` (Node 18).
  - Copy `frontend/dist/` → `bkend/public/` (preserving `index.php` and `.htcess`).
  - Deploy only `./bkend` to Azure Web App Service.
  - Writes essential Laravel env entries required for the app runtime.

- **FastAPI on Render**
  - Independent service.
  - Health check: `GET /health`.

## 5) Laravel Bkend (API + Hosting)
- **Endpoints (representative)**
  - `GET /api/patients`
    - Filters: `perPage`, `page`, `search`, `gender`, `insulin`
    - Response: `{ data: Patient[], meta: { total, last_page, ... } }`
  - `GET /api/patients/:id`
    - Response: `{ data: Patient }`
  - Admin (if enabled): `GET/DELETE /api/admin/users`, `DELETE /api/admin/patients/:id`

- **Validation/Resources**
  - Requests: `bkend/app/Http/Requests/StorePatientRequest.php`, `UpdatePatientRequest.php`
  - Resource: `bkend/app/Http/Resources/PatientResource.php`

- **Database**
  - Azure MySQL via `DB_*` in `bkend/.env` (SSL CA supported).

## 6) FastAPI Bkend (ML & RAG)
- **Entrypoint**: `bkend/fastapi/main.py`
- **Endpoints**
  - `GET /health` → `{ status: "ok" }`
  - `POST /predict` → `{ prediction }`   (Body: `{ features: number[] }`)
  - `POST /predict-bulk` → `{ predictions }`   (Body: `{ rows: number[][] }`)
  - `POST /predict-therapy-pathline` → `{ probabilities[3], insight, top_ftors[] }`
  - `POST /treatment-recommendation` → `{ response, context_used? }`
  - `POST /chatbot-patient-query` → `{ response }`
- **Performance**
  - Lazy-load heavy resources for fast cold starts.
  - `/predict-bulk` avoids N× calls and uses vectorized inference.

## 7) Frontend (Ret + Vite)
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
  - `RiskPredictionForm` cepts precomputed risk via Link state for instant render, then revalidates with `POST /predict`.
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
  - Laravel: set `APP_KEY`, `DB_*` in Azure App Service Configuration (bkend/.env for local only).
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
  - `pip install -r bkend/fastapi/requirements.txt`
  - `uvicorn main:app --host 0.0.0.0 --port 10000`
- **Frontend (optional dev)**
  - `npm install` in `frontend/`
  - `npm run dev`
  - In production, SPA is built by CI into `bkend/public/`.

## 11) Non-Functional Requirements (NFRs)
- **Performance**
  - Common views render meaningful content within 300ms on che hit; bkground refresh completes within ~2s.
  - Bulk dashboards update incrementally; no page‑wide blocking on long computations.
- **Reliability & Resilience**
  - Greful degradation when external providers fail; clear user messaging and retry strategies.
  - Health checks exposed; errors logged with correlation IDs.
- **Security & Roles**
  - Role‑based navigation and indicators visible in UI (e.g., doctor/patient/admin badge).
  - Bkend authorization on sensitive endpoints; least‑privilege cess.
  - Secrets only in server environments; no secrets in the client bundle.
- **Privy & Auditability**
  - Audit logs for prediction requests and key clinical tions (viewed/updated patient data, generated insights).
  - Model versions atthed to results; inputs hashed/fingerprinted for treability.
- **Maintainability & Configurability**
  - Risk thresholds, gradient stops, and color tokens centralized; no hardcoded values in components.
  - Predict endpoints versioned

## 12) Recent Changes Summary (Oct 2025)
- **Risk Prediction ching** (`bkend/fastapi/main.py`)
  - Feature-hash key includes `patient_id` and `model_version`.
  - Added lightweight SQLite K/V table `prediction_che.sqlite` for che and a second key for latest-per-patient: `latest:<patient_id>:<version>`.
- **SWR for Risk Dashboard**
  - New endpoint `POST /risk-dashboard` returns ched value immediately; on miss returns latest with `stale: true` and triggers bkground recompute.
  - `frontend/src/features/risk/RiskDashboard.jsx` sends per-patient calls in parallel and updates eh card as soon as it completes.
- **Risk Prediction view UX**
  - `frontend/src/features/risk/RiskPredictionForm.jsx` no longer blocks the whole page; fetches risk in bkground and shows “Updating…” if stale.
- **Gauge/UI**
  - Center badge drawn inside SVG; larger radius and stroke; better alignment.
- **Auth**
  - Removed login debug alerts in `SignIn.jsx`.

## 13) Product Bklog

### Log A: Risk Dashboard Performance & UX
- **[Done] Parallel per-patient updates**
  - Code: `RiskDashboard.jsx` uses `/risk-dashboard?force=false`, updates `riskResults` per response.
- **Warm che on patient metric update (bkend)**
  - : On metric change, recompute in bkground and update both ches; next dashboard load is instant.
  - Priority: Medium | Effort: M

### Log B: Risk Prediction View polish
- **[Done] Non-blocking render + SWR**
  - Code: `RiskPredictionForm.jsx` bkground-fetch with polling when stale.
- **Extrt risk constants**
  - : thresholds, color tokens, gradient stops in `frontend/src/features/risk/config.js`; no hardcoding in components.
  - Priority: Medium | Effort: S

### Log C: Bkend ching & durability
- **[Done] SQLite che + latest-per-patient**
  - Keys: ext feature-hash and `latest:<patient_id>:<version>`.
- **Historical audit table (optional)**
  - : `risk_predictions` table with `(patient_id, features_hash, model_version, prediction, created_at)` + composite index.
  - Priority: Low | Effort: M

### Log D: Docs & Ops
- **Technical docs consolidation**
  - : Vision, NFRs, architecture, recent changes, bklog (this document) are maintained and versioned.
  - Priority: High | Effort: S

### Log E: Frontend polish & tooling
- **Design system and theming**
  - Introduce a tokenized theme (sping, color, typography) and a small style guide; dark mode switch optional.
  - Priority: Medium | Effort: M
- **Component library rationalization**
  - Consolidate common primitives (`Button`, `Badge`, `Card`, `Input`) under `src/components/ui/` with props documented.
  - Priority: Medium | Effort: M
- **Consistent charts and empty states**
  - Standardize chart palette and axes; define empty/loading/skeleton states for dashboard cards.
  - Priority: Medium | Effort: S
- **Performance & UX polish**
  - Add code-splitting for rarely used views; prefetch data on hover for patient detail links; avoid layout shift.
  - Priority: Medium | Effort: M
 - **Data fetching layer (TanStk Query)**
   - : Introduce TanStk Query for patient lists and risk calls (query che, bkground refetch, prefetch on hover).
   - Priority: Medium | Effort: M
 - **Form handling & validation**
   - : Use Ret Hook Form + Zod for `CreatePatient.jsx` and edits (schema validation, inline errors, keyboard-friendly).
   - Priority: Medium | Effort: M
 - **Icon & date utilities**
   - : Standardize icons via `lucide-ret` and dates via `date-fns` with a single formatting helper.
   - Priority: Low | Effort: S

## 15) Deployment & Operational Notes
- **Assets/logo**
  - Logo is served from `frontend/public/biotective-logo.png` and referenced as `/biotective-logo.png`. If deploying under a subpath, use `import.meta.env.BASE_URL + 'biotective-logo.png'`.
- **Environment variables**
  - Frontend: Vite `import.meta.env` for API base URLs.
  - Bkend FastAPI: set keys in the hosting provider’s env (Render).
- **Observability**
  - Add logs for che hits/misses on `/risk-dashboard` to monitor effectiveness.

