# Technical Documentation

## 1. Overview

- **Purpose**
  - Integrated patient management and AI-powered clinical decision support.
  - Core capabilities: patient CRUD, risk prediction, therapy effectiveness analysis, treatment recommendations, admin management.

- **Codebase layout**
  - Laravel API (Patients/Admin/Auth): `Paitent Management System/backend/`
  - FastAPI ML API: `Paitent Management System/backend/fastapi/`
  - Frontend (Vite + React): `Paitent Management System/frontend/`

> Note: In this repo, you are actively using both `FYP` and `FYP-A` working folders. The paths above reflect the main app locations as they appear in the `Paitent Management System/` directory.

---

## 2. Architecture

- **Components**
  - **Laravel** — RESTful API for patients, authentication, and admin operations.
  - **FastAPI** — ML inference (risk and therapy), RAG/LLM endpoints.
  - **React SPA** — feature-based UI (Vite build), charts, dashboards.

- **Key interactions**
  - Frontend → Laravel: `/api/patients`, `/api/patients/:id`, `/api/admin/...`
  - Frontend → FastAPI: `/health`, `/predict`, `/predict-bulk`, `/predict-therapy-pathline`, `/treatment-recommendation`, `/chatbot-patient-query`

- **Data flow**
  - Patients loaded from Laravel (server-side pagination).
  - Predictions computed by FastAPI and rendered in dashboards/forms.

- **Serving model**
  - In production, the SPA is built in CI and copied into the Laravel `public/` directory. The SPA is therefore served by the same origin as Laravel (same domain, same app service). API calls to Laravel are same-origin; the SPA calls FastAPI via the configured `FASTAPI_URL` in Laravel `.env` or via absolute URL.

```mermaid
flowchart LR
  A[React SPA (Vite)] -- REST --> B[(Laravel API)]
  A -- REST (ML) --> C[[FastAPI]]
  C -- RAG --> D[(Pinecone)]
  C -- LLM --> E[(Groq)]
  C -- Embeddings --> F[(OpenAI Embeddings)]
```

---

## 2.1 Monorepo Deployment: SPA served by Laravel

The GitHub Actions workflow `.github/workflows/deploy-laravel.yml` builds the frontend and serves it via the Laravel application. Key proof points:

- The workflow sets up both PHP/Composer and Node, builds the SPA under `frontend/`, and copies the output `dist/` into `backend/public/`.
- Only the `./backend` folder is deployed to Azure App Service, which means the SPA is deployed together with Laravel.
- Laravel's `public/` becomes the web document root; SPA files (e.g., `index.html`, `assets/`) are same-origin with Laravel.

Relevant steps (abridged):

```yaml
- name: Build frontend
  run: |
    cd frontend
    npm install
    npm run build

- name: Copy frontend build to Laravel public folder
  run: |
    cd backend/public
    mv index.php ../index.php.tmp 2>/dev/null || true
    mv .htaccess ../.htaccess.tmp 2>/dev/null || true
    cd ../..
    rm -rf backend/public/*
    cp -r frontend/dist/. backend/public/
    mv backend/index.php.tmp backend/public/index.php 2>/dev/null || true
    mv backend/.htaccess.tmp backend/public/.htaccess 2>/dev/null || true

- name: Deploy to Azure App Service
  with:
    package: ./backend
```

Runtime verification:

- Check browser devtools → Network: `index.html` and `/assets/*` load from the Laravel domain.
- Directly load an SPA route (e.g., `/therapy-effectiveness/17`) and refresh: it should still resolve (SPA fallback via web server / Laravel).
- API calls to Laravel use same-origin paths like `/api/patients` (no CORS preflight needed).

---

## 3. Environments and Configuration

- **Frontend `.env`** (`frontend/.env`)
  - `VITE_LARAVEL_URL=https://<laravel-host>`
  - `VITE_FASTAPI_URL=https://<fastapi-host>`

- **Laravel `.env`** (`backend/.env`)
  - Standard Laravel config: `DB_*`, `APP_KEY`, `APP_URL`, CORS settings.

- **FastAPI `.env`** (`backend/fastapi/.env`)
  - `PINECONE_API_KEY=...`
  - `GROQ_API_KEY=...`
  - `OPENAI_API_KEY=...`
  - `FRONTEND_ORIGIN=https://<frontend>`
  - `LARAVEL_ORIGIN=https://104384876laravel-cwh4axg4d4h5f0ha.southeastasia-01.azurewebsites.net`

- **CORS**
  - FastAPI configured in `backend/fastapi/main.py` using `allow_origins` with `FRONTEND_ORIGIN` and `LARAVEL_ORIGIN` (and currently `*`).

- **Build/Start**
  - FastAPI (Render): `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2`
  - Frontend: `npm run build` (static deploy), SPA routing fallback to `index.html`
  - Laravel: Composer install, migrations, `APP_KEY` set, standard PHP hosting

- **Production note**
  - The workflow writes `FASTAPI_URL=...` into `backend/.env`. The SPA is served from Laravel's `public/`, so Laravel and the SPA share the same origin. For local development, you can still use `VITE_*` variables. In production, the SPA assets are static files in `public/` and may rely on relative paths for Laravel APIs and an absolute URL for FastAPI.

---

## 4. Backend A: Laravel (Patients/Admin/Auth)

- **Important files**
  - Controller: `backend/app/Http/Controllers/PatientController.php`
  - Requests: `backend/app/Http/Requests/StorePatientRequest.php`, `UpdatePatientRequest.php`
  - Resource: `backend/app/Http/Resources/PatientResource.php`

- **Key routes (representative)**
  - `GET /api/patients`
    - Pagination and filters: `perPage`, `page`, `search`, `gender`, `insulin`
    - Response: `{ data: Patient[], meta: { total, last_page, ... } }`
  - `GET /api/patients/:id`
    - Response: `{ data: Patient }` (Laravel Resource wrapper)
  - Admin
    - `GET /api/admin/users`
    - `DELETE /api/admin/users/:id`
    - `DELETE /api/admin/patients/:id`
  - Auth
    - `POST /api/login`
    - `POST /api/register`

- **Validation**
  - Strict validation via `StorePatientRequest`/`UpdatePatientRequest`.

---

## 5. Backend B: FastAPI (ML / RAG)

- **Entrypoint**
  - `backend/fastapi/main.py`

- **Startup strategy**
  - Lazy-loading heavy resources (joblib models, Pinecone, Groq, sentence-transformers) for fast cold starts.
  - `GET /health` endpoint for service health.
  - Sklearn warning about feature names suppressed for clean logs.

- **RAG/LLM setup**
  - Pinecone index: `medicalbooks-1536`
  - OpenAI embeddings: `text-embedding-3-small`
  - Groq completion model: `deepseek-r1-distill-llama-70b`

- **Endpoints**
  - `GET /health`
    - 200 OK: `{ "status": "ok" }`
  - `POST /predict`
    - Body: `{ "features": number[] }`
    - Response: `{ "prediction": number }`
  - `POST /predict-bulk`
    - Body: `{ "rows": number[][] }`
    - Response: `{ "predictions": number[] }`
  - `POST /predict-therapy-pathline`
    - Body: PatientData fields: `insulin_regimen`, `hba1c1/2/3`, `reduction_percent`, `fvg1/2/3`, `fvg_delta_1_2`, `dds1/dds3/dds_trend_1_3`, `gap_initial_visit`, `gap_first_clinical`, `egfr`
    - Response: `{ probabilities: number[], insight: string, top_factors: {feature, importance}[] }`
  - `POST /treatment-recommendation`
    - Body: `{ patient: object, question: string }`
    - Response: `{ response: string, context_used?: string }`
  - `POST /chatbot-patient-query`
    - Body: `{ patient: object, query: string }`
    - Response: `{ response: string }`

---

## 6. Frontend: Vite + React (Feature-Based)

- **Structure**
  - `src/features/patients/`: `PatientsList.jsx`, `PatientProfile.jsx`, `CreatePatient.jsx`, `UpdatePatient.jsx`
  - `src/features/risk/`: `RiskDashboard.jsx`, `RiskPredictionForm.jsx`
  - `src/features/therapy/`: `TherapyDashboard.jsx`, `TherapyEffectivenessForm.jsx`
  - `src/features/treatment/`: `TreatmentRecommendationDashboard.jsx`, `TreatmentRecommendationForm.jsx`
  - `src/features/admin/`: `AdminDashboard.jsx`, `ManageUsers.jsx`, `AdminPatients.jsx`, `SystemAnalytics.jsx`
  - `src/features/auth/`: `SignIn.jsx`, `RegistrationForm.jsx`
  - `src/api/`: `client.js` (axios), `patients.js` (API wrapper)
  - `src/components/`: `Card.jsx`, `PageHeader.jsx`, `MetricBox.jsx`, `RiskBadge.jsx`, `StatusBadge.jsx`

- **Vite alias**
  - `vite.config.js`: `resolve.alias = { '@': '/src' }`

- **API client patterns**
  - Laravel via `patientsApi` (`frontend/src/api/patients.js`):
    - `getAll()`
    - `list(params)` — normalizes `{ data, meta }` from Laravel pagination
    - `getById()` — unwraps Resource response via `res.data?.data ?? res.data`
  - FastAPI via `fastApiClient` (`frontend/src/api/client.js`):
    - `POST /predict`, `POST /predict-bulk`, `POST /predict-therapy-pathline`, `POST /treatment-recommendation`, `POST /chatbot-patient-query`

---

## 7. Data Model and Contracts

- **Patient (subset used in UI)**
  - Demographics: `name`, `age`, `gender`, `insulin_regimen_type`
  - Labs/metrics: `hba1c_1st_visit`, `hba1c_2nd_visit`, `hba1c_3rd_visit`, `fvg_1`, `fvg_2`, `fvg_3`, `avg_fvg_1_2`
  - Therapy stats: `reduction_a`, `reduction_a_per_day`, `fvg_delta_1_2`, `dds_1`, `dds_3`, `dds_trend_1_3`, `egfr`, `gap_from_initial_visit`, `gap_from_first_clinical_visit`

- **FastAPI contracts**
  - See Endpoints above for each body/response shape.

- **Laravel pagination**
  - Response shape: `{ data: [...], meta: {...} }`, normalized in the frontend via `patientsApi.list()`.

---

## 8. Core Features and Flows

- **Patients Management**
  - `PatientsList.jsx` uses server-side pagination (`patientsApi.list`) and shows status badges (improving/stable/worsening).
  - Create/Update forms for patient data.

- **Risk Prediction**
  - `RiskDashboard.jsx`
    - Loads patients and calls `POST /predict-bulk` with rows (feature arrays).
    - Displays chart by risk category; per-card risk badge.
    - Optimization: bulk endpoint avoids 60+ parallel `/predict` calls.
  - `RiskPredictionForm.jsx`
    - Accepts precomputed `risk` via `Link` state for instant render.
    - Revalidates by calling `POST /predict` for accuracy.

- **Therapy Effectiveness**
  - `TherapyEffectivenessForm.jsx`
    - Fetches patient via `patientsApi.getById()`
    - Calls `POST /predict-therapy-pathline` to get probabilities and LLM insights.
    - Renders trend charts and key numbers; includes null guards around numeric values.

- **Treatment Recommendation**
  - `TreatmentRecommendationForm.jsx`
    - Calls `POST /treatment-recommendation` with patient data and a structured prompt.
    - Displays sections from the LLM response plus forecast chart.

- **Admin**
  - `ManageUsers.jsx` — list with search and role filter; deletion supported.
  - `AdminPatients.jsx` — embeds `PatientsList`; admin creation/deletion.

---

## 9. Performance and Scalability

- **Implemented**
  - Laravel server-side pagination (via `patientsApi.list()`), reduces payload and render overhead.
  - FastAPI lazy-loading for heavy models and clients, `GET /health` for quick readiness.
  - `/predict-bulk` reduces network overhead and uses vectorized inference.
  - Numeric null guards in UI prevent runtime crashes (e.g., `.toFixed()` on null).

- **Recommended**
  - Use **2 Uvicorn workers** on Render where possible: `--workers 2`.
  - Optional local caching in the frontend for stable patient lists.
  - Add retry/backoff around RAG endpoints (Pinecone, Groq, OpenAI).

---

## 10. Security and Compliance

- **Secrets**
  - All API keys provided via env vars; never commit secrets to source control.

- **CORS**
  - Whitelist frontend and Laravel origins; remove `*` for stricter production environments.

- **Validation**
  - Laravel request classes enforce strict input validation.

---

## 11. Observability and Operations

- **Health check**
  - FastAPI: `GET /health` (used by Render health checks).

- **Logs**
  - Check Render logs for cold start, model loading, warnings, and errors.

- **Metrics (suggestion)**
  - Track latency and error rates for `/predict-bulk` and `/predict-therapy-pathline`.

---

## 12. Testing Strategy

- **Laravel**
  - PHPUnit/Pest for `PatientController` (CRUD, filters) and `PatientResource` serialization.

- **FastAPI**
  - pytest for `/health`, `/predict`, `/predict-bulk`, `/predict-therapy-pathline` (happy-path and invalid inputs).

- **Frontend**
  - Vitest + RTL: `RiskDashboard` bulk flow, `PatientsList` pagination, `TherapyEffectivenessForm` rendering guards.

---

## 13. Deployment Guides

- **Frontend**
  - Build: `npm run build` → deploy to Netlify/Vercel/Static host with SPA fallback.

- **Laravel**
  - Deploy to Azure App Service or similar; ensure DB migrations, `APP_KEY`, `APP_URL` configured.
  - CI builds the SPA and copies `frontend/dist` into `backend/public/` prior to deployment.
  - The workflow preserves Laravel's `index.php` and `.htaccess` by temporarily moving them out, clearing `public/`, copying SPA files, and restoring them. This allows SPA assets and Laravel to coexist.
  - Ensure SPA fallback works for client-side routes (via `.htaccess` rewrite to `index.html` or Laravel catch‑all route if applicable).

- **FastAPI**
  - Render: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2`
  - Health check: `/health`
  - Env vars: `PINECONE_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`, `FRONTEND_ORIGIN`, `LARAVEL_ORIGIN`

---

## CI/CD Appendix (Laravel + SPA)

The workflow `.github/workflows/deploy-laravel.yml` deploys Laravel and serves the SPA from the same app service. Key excerpts:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '!backend/fastapi/**'
      - '.github/workflows/deploy-laravel.yml'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mbstring, dom, fileinfo, mysql
          tools: composer
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install Laravel dependencies
        run: |
          cd backend
          composer install --no-interaction --prefer-dist --optimize-autoloader

      - name: Build frontend
        run: |
          cd frontend
          npm install
          npm run build

      - name: Copy frontend build to Laravel public folder
        run: |
          cd backend/public
          mv index.php ../index.php.tmp 2>/dev/null || true
          mv .htaccess ../.htaccess.tmp 2>/dev/null || true
          cd ../..
          rm -rf backend/public/*
          cp -r frontend/dist/. backend/public/
          mv backend/index.php.tmp backend/public/index.php 2>/dev/null || true
          mv backend/.htaccess.tmp backend/public/.htaccess 2>/dev/null || true

      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: 104384876laravel
          package: ./backend
```

This proves the SPA is built and hosted under Laravel's `public/`, resulting in a same-origin frontend and Laravel API.

---

## 14. Troubleshooting and Known Issues

- **Cold starts**
  - Lazy-loading mitigates; consider paid plan or reduce dependencies further if needed.

- **Sklearn warnings**
  - Feature-name mismatch suppressed; alternatively, use a DataFrame with training column names for `/predict`.

- **RAG timeouts**
  - Add timeouts/retries; degrade gracefully in UI if context retrieval or LLM is unavailable.

---

## 15. Roadmap

- Replace any remaining relative imports with `@` alias.
- Add endpoint-level metrics and dashboards.
- Integrate automated tests in CI.
- Optional: split FastAPI requirements into **core** vs **rag-extra** to reduce base footprint.

---

## API Appendix

### FastAPI

- **GET** `/health`
  - 200 OK: `{ "status": "ok" }`

- **POST** `/predict`
  - Body: `{ "features": number[] }`
  - 200 OK: `{ "prediction": number }`

- **POST** `/predict-bulk`
  - Body: `{ "rows": number[][] }`
  - 200 OK: `{ "predictions": number[] }`

- **POST** `/predict-therapy-pathline`
  - Body: PatientData fields
  - 200 OK: `{ "probabilities": number[], "insight": string, "top_factors": Array<{feature, importance}> }`

- **POST** `/treatment-recommendation`
  - Body: `{ "patient": object, "question": string }`
  - 200 OK: `{ "response": string, "context_used"?: string }`

- **POST** `/chatbot-patient-query`
  - Body: `{ "patient": object, "query": string }`
  - 200 OK: `{ "response": string }`

### Laravel (representative)

- **GET** `/api/patients`
  - Query: `perPage`, `page`, `search`, `gender`, `insulin`
  - 200 OK: `{ "data": Patient[], "meta": { "total": number, "last_page": number, ... } }`

- **GET** `/api/patients/:id`
  - 200 OK: `{ "data": Patient }`

- **Admin**
  - `GET /api/admin/users`
  - `DELETE /api/admin/users/:id`
  - `DELETE /api/admin/patients/:id`

- **Auth**
  - `POST /api/login`
  - `POST /api/register`

---

## Key Files Index

- **FastAPI**: `backend/fastapi/main.py`
- **Laravel**:
  - Controllers: `app/Http/Controllers/PatientController.php`
  - Requests: `app/Http/Requests/StorePatientRequest.php`, `UpdatePatientRequest.php`
  - Resource: `app/Http/Resources/PatientResource.php`
- **Frontend**:
  - `vite.config.js`, `src/api/client.js`, `src/api/patients.js`
  - Feature entrypoints: see section 6
