# Project Technical Documentation (Concise)

## 0) Vision of the System
- **Final Look (End-state experience)**
  - A modern, responsive web app with a role-aware sidebar and clean content cards.
  - Landing views that are informative at a glance (risk distribution, recent activity), with drill‑downs to detailed patient pages.
  - Seamless navigation between Patients, Risk, Therapy, and Treatment sections with minimal perceived latency.

- **Functional Vision (What it does)**
  - Patient management: create, update, search, and filter patients; view longitudinal metrics and trends.
  - Risk intelligence: surface risk categories and scores per patient and in aggregate, with explanatory factors.
  - Therapy insights: show effectiveness probabilities across visits and concise rationale to support decisions.
  - Clinical assistance: provide grounded Q&A using patient context and medical literature (RAG), with auditable prompts and outputs.
  - Role-driven UX: doctors manage panels and predictions; patients see their profile and guidance; admins govern access.

- **Quality Vision (How it feels)**
  - Perceived instant loads for common views via caching and progressive rendering.
{{ ... }}
  - A patient management platform that combines operational data (patients, visits, labs) with AI-assisted insights to support safer, faster, and more consistent clinical decisions.
  - How features serve clinical and operational value:
    - Risk Prediction: translates HbA1c/FVG and therapy indicators into a numeric risk score and category (Normal → Critical) to prioritize follow-up and triage at scale.
    - Therapy Effectiveness: projects effectiveness probabilities ross visits and summarizes contributing ftors, helping clinicians assess whether to continue, intensify, or change therapy.
    - Treatment Recommendation: provides structured, context-aware guidance using RAG + LLM (medical text + patient context), keeping suggestions grounded and auditable.
    - Patient Management (CRUD, profiles): central source of truth for demographics, labs, adherence indicators, and trends used across all AI features.
  - Admin & Governance: user/patient management and access boundaries so the right people manage the right data.
  - Outcomes: improved prioritization, reduced manual computation, explainable trends, and faster handoffs between care teams.

- **Primary Use Cases**
  - Clinic dashboarding and triage: identify very risky patients and drill into details quickly.
  - Therapy monitoring: compare visit-to-visit trends and receive concise, structured insights.
  - Chatbot: patient context-aware Q&A with medical literature (RAG) and visual snapshot of patient metrics and trends.
  - Case review: generate a treatment summary grounded in both patient context and medical literature (via RAG), to support MDT discussion.

-- **Components**
  - **Laravel** (backend API + serves the React SPA)
  - **FastAPI** (ML inference and RAG/LLM endpoints; hosted separately; uses Groq via `GROQ_API_KEY` and `GROQ_MODEL`)
  - **React SPA** (built with Vite; deployed inside Laravel `public/`)

## 2) High-Level Architecture
- **Serving model**
  - GitHub Actions builds the SPA in `frontend/` and copies `dist/` into `backend/public/`.
  - Azure Web App serves both Laravel and the SPA on the same origin.
  - FastAPI runs separately (Render) and is invoked from the SPA via `FASTAPI_URL`.

- **Data flow**
  - SPA → Laravel for patients/admin REST operations.
  - SPA → FastAPI for ML predictions and LLM/RAG.

## 3) Environments & Configuration
- **Laravel `.env` (only .env in repo)** — `backend/.env`
  - Contains `APP_*`, `DB_*` (MySQL), `SESSION_*`, `LOG_*`.
  - Recommended URL:
    - `APP_URL=https://<laravel-app>.azurewebsites.net`
  - Azure MySQL SSL (if required):
    - `DB_SSL_CA=/home/site/wwwroot/storage/certs/DigiCertGlobalRootCA.crt.pem`

- **FastAPI (Render)**
  - No `.env` in repo. Set keys in the host environment: `PINECONE_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`, and `GROQ_MODEL` (e.g. `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`).
  - Start: `uvicorn main:app --host 0.0.0.0 --port 10000`
  - SPA note: the React app uses build-time configuration (Vite) for its API base URLs (`VITE_LARAVEL_URL`, `VITE_FASTAPI_URL`).

- **CORS**
  - FastAPI allows the deployed frontend/Laravel origins; tighten for production as needed.

## 4) CI/CD & Deployment
-- **GitHub Actions** (`.github/workflows/deploy-laravel.yml`)
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
  - Patients
    - `GET /api/patients` (filters: `perPage`, `page`, `search`, `gender`, `insulin`)
    - `GET /api/patients/:id`
    - `GET /api/patients/by-user/{userId}` (resolve patient by linked user)
    - `GET /api/patients/{id}/doctor` (assigned doctor: `{ id, name, email }`)
    - `POST /api/patients/{id}/risk` (persist latest risk from FastAPI)
    - `PATCH /api/patients/{id}/assign-doctor` (assign/unassign doctor)
  - Messaging
    - `GET /api/messages/conversations`
    - `GET /api/messages/thread/{patientId}`
    - `POST /api/messages`
    - `PATCH /api/messages/{id}/read`
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
  - `POST /predict` → `{ prediction }`   (Body: `{ features: number[] }`) — if enabled
  - `POST /predict-bulk` → `{ predictions }`   (Body: `{ rows: number[][] }`) — if enabled
  - `POST /risk-dashboard?force=<bool>` → `{ prediction, risk_label, cached, stale, model_version }` (read‑through from MySQL; compute if missing)
  - `POST /predict-therapy-pathline` → `{ probabilities[3], insight, top_factors[] }`
  - `POST /treatment-recommendation` → `{ response, context_used? }`
  - `POST /chatbot-patient-query` → `{ response }` (frontend now also sends optional `context`)
- **Performance**
  - Lazy-load heavy resources for fast cold starts.
  - `/predict-bulk` avoids N× calls and uses vectorized inference.

## 7) Frontend (React + Vite)
- **Structure**
  - `src/features/patients/`: list, profile, create, update
  - `src/features/risk/`: `RiskDashboard`, `RiskPredictionForm`
  - `src/features/therapy/`: `TherapyDashboard`, `TherapyEffectivenessForm`
  - `src/features/treatment/`: `TreatmentRecommendationDashboard`, `TreatmentRecommendationForm`
  - `src/features/messages/`: `MessagesPage`, `MessagesThread`, `MessageInput`
  - `src/features/admin/`: admin views
  - `src/api/`: `client.js` (Axios), `patients.js` (REST wrapper)
  - `src/components/`: shared UI (Card, PageHeader, MetricBox, RiskBadge, etc.)

- **Patterns**
  - `patientsApi.list(params)` normalizes Laravel pagination `{ data, meta }`.
  - `RiskDashboard` calls `POST /predict-bulk` once, maps predictions to patients, aggregates chart counts.
  - `RiskPredictionForm` accepts precomputed risk via Link state for instant render, then revalidates with `POST /predict`.
  - `TherapyEffectivenessForm` calls `POST /predict-therapy-pathline` and renders trends + LLM insight.
  - Messages:
    - Patient role: single-thread view with assigned doctor; conversations list hidden.
    - `MessagesPage` resolves `myPatientId` via `GET /api/patients/by-user/{userId}`; `MessagesThread` fetches doctor header via `GET /api/patients/{id}/doctor`.
    - Input field/button anchored at the bottom of the container; bubbles aligned by sender.

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
  - `pip install -r backend/fastapi/requirements.txt`
  - `uvicorn main:app --host 0.0.0.0 --port 10000`
- **Frontend (optional dev)**
  - `npm install` in `frontend/`
  - `npm run dev`
  - In production, SPA is built by CI into `backend/public/`.

## 11) Non-Functional Requirements (NFRs)
- **Performance**
  - Common views render meaningful content within 300ms on cache hit; background refresh completes within ~2s.
  - Bulk dashboards update incrementally; no page‑wide blocking on long computations.
- **Reliability & Resilience**
  - Graceful degradation when external providers fail; clear user messaging and retry strategies.
  - Health checks exposed; errors logged with correlation IDs.
- **Security & Roles**
  - Role‑based navigation and indicators visible in UI (e.g., doctor/patient/admin badge).
  - Backend authorization on sensitive endpoints; least‑privilege access.
  - Secrets only in server environments; no secrets in the client bundle.
- **Privacy & Auditability**
  - Audit logs for prediction requests and key clinical actions (viewed/updated patient data, generated insights).
  - Model versions attached to results; inputs hashed/fingerprinted for traceability.
- **Maintainability & Configurability**
  - Risk thresholds, gradient stops, and color tokens centralized; no hardcoded values in components.
  - Predict endpoints versioned

## 12) Recent Changes Summary (Oct 2025)
- **Risk Prediction caching (read‑through via MySQL)**
  - `/risk-dashboard` first checks `patients` table (`last_risk_score`, `risk_model_version`), computes via Ridge model if missing or forced, and persists back to MySQL.
  - Responses include `{ cached, model_version }`.
- **Patient Messaging simplification**
  - Patient view now shows a single conversation with their assigned doctor; conversations list removed for patients.
  - Added `GET /api/patients/{id}/doctor` to surface doctor name/email for the header.
  - Input bar is anchored at the bottom of the message container; message UI polished (bubble colors, timestamps).
- **LLM model configuration**
  - Replaced deprecated Groq model with env-driven selection: `GROQ_MODEL` (default recommended: `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`).
- **General UI**
  - Sidebar icon centering and logout/toggle alignment in `frontend/src/Layout.jsx`.

## 13) Product Backlog

### Log A: Risk Dashboard Performance & UX
- **[Done] Parallel per-patient updates**
  - Code: `RiskDashboard.jsx` uses `/risk-dashboard?force=false`, updates `riskResults` per response.
- **Warm cache on patient metric update (backend)**
  - AC: On metric change, recompute in background and update both caches; next dashboard load is instant.
  - Priority: Medium | Effort: M

### Log B: Risk Prediction View polish
- **[Done] Non-blocking render + SWR**
  - Code: `RiskPredictionForm.jsx` background-fetch with polling when stale.
- **Extract risk constants**
  - AC: thresholds, color tokens, gradient stops in `frontend/src/features/risk/config.js`; no hardcoding in components.
  - Priority: Medium | Effort: S

### Log C: Backend caching & durability
- **[Done] MySQL read‑through cache**
  - Persist fresh predictions to `patients` table; reads return cached scores when available.
- **Historical audit table (optional)**
  - AC: `risk_predictions` table with `(patient_id, features_hash, model_version, prediction, created_at)` + composite index.
  - Priority: Low | Effort: M

### Log D: Docs & Ops
- **Technical docs consolidation**
  - AC: Vision, NFRs, architecture, recent changes, backlog (this document) are maintained and versioned.
  - Priority: High | Effort: S

### Log E: Frontend polish & tooling
**[Done] Reusable UI components**
  - Consolidated and reused: `Card`, `MetricBox`, `RiskGauge`, `TrendCard`, `KpiTile`, `KeyFactorChips` under `src/components/` and feature folders.
  - Result: consistent card/badge styling and simplified composition across Risk and Chatbot views.
**[Done] Loading and empty states**
  - Added page-level skeletons in `RiskPredictionForm.jsx` and subtle inline “Refreshing prediction…” indicator when stale.
  - Standardized soft-empty states for cards (muted text, bordered containers).
**[Done] Chart and metric visuals**
  - Unified color semantics for risk gradients; improved SVG gauge centering and sparkline targets.
  - Chart.js used selectively (chatbot insights) with matching palette.
**[Done] API client centralization**
  - `src/api/client.js` as the Axios base; feature modules (`patients.js`) wrap REST calls.

### Log F: Chatbot Improvements
- **[Done] UI revamp**
  - Hero card, cohesive bubbles, suggested prompts layout.
- **[Done] Patient context (frontend)**
- **[Done] Rich AI visuals**
  - Metric badges, trend chart, and progress bars on analytic replies.
- **[Pending] Patient context (backend)**
  - Accept optional `context` in `PatientChatRequest`; include in prompt with safe length clamp.
  - Priority: High | Effort: S
- **[Pending] Chat UX polish**
  - Auto-scroll to latest, disable send while loading/empty, textarea auto-grow, responsive bubble widths.
  - Priority: Medium | Effort: S
- **[Pending] Ops**
  - Set Render Health Check Path to `/health`; ensure `VITE_FASTAPI_URL` points to Render in prod; optional keep‑warm cron.
  - Priority: Medium | Effort: S

## 15) Deployment & Operational Notes
- **Assets/logo**
  - Logo is served from `frontend/public/biotective-logo.png` and referenced as `/biotective-logo.png`. If deploying under a subpath, use `import.meta.env.BASE_URL + 'biotective-logo.png'`.
- **Environment variables**
  - Frontend: Vite `import.meta.env` for API base URLs.
  - Backend FastAPI: set keys in the hosting provider’s env (Render).
- **Observability**
  - Add logs for cache hits/misses on `/risk-dashboard` to monitor effectiveness.

