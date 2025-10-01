# Entity Relationship Diagram (ERD)

This ERD is inferred from the frontend usage (`frontend/src/App.jsx`, `Layout.jsx`, `PatientsList.jsx`, `Chatbot.jsx`) and the FastAPI interfaces in `backend/fastapi/main.py`. The Laravel API is the system of record for users and patients; exact column names may vary.

## Current Laravel schema (from code)

The following matches `backend/app/Models/Patient.php` and `backend/routes/api.php`.

```mermaid
erDiagram
    USERS ||--o{ PATIENTS : has

    USERS {
        int id PK
        string name
        string email UNIQUE
        string role "admin|doctor|patient"
        string phone
        date dob
        string gender
        string password_hash
        timestamp created_at
        timestamp updated_at
    }

    PATIENTS {
        int id PK
        int user_id FK "linked patient user (optional)"
        string name
        int age
        string gender
        text medical_history
        text medications
        text remarks
        string insulin_regimen_type
        float fvg
        float fvg_1
        float fvg_2
        float fvg_3
        float hba1c_1st_visit
        float hba1c_2nd_visit
        float hba1c_3rd_visit
        date first_visit_date
        date second_visit_date
        date third_visit_date
        float egfr
        float dds_1
        float dds_3
        float height_cm
        float weight_kg
        string physical_activity
        float avg_fvg_1_2
        float fvg_delta_1_2
        float reduction_a
        float reduction_a_per_day
        float reduction_a_2_3
        int gap_from_initial_visit
        int gap_from_first_clinical_visit
        float dds_trend_1_3
        timestamp created_at
        timestamp updated_at
    }
```

### API endpoints in Laravel (from `backend/routes/api.php`)

- **Auth**: `POST /api/register`, `POST /api/login`
- **Patients**:
  - `GET /api/patients` (filters: `gender`, `insulin`, `search`; optional `perPage` pagination)
  - `POST /api/patients` (create)
  - `PUT /api/patients/{id}` (update)
  - `GET /api/patients/{id}` (show)
  - `GET /api/patients/by-user/{userId}` (lookup by linked user)
  - Admin: `GET /api/admin/patients`, `DELETE /api/admin/patients/{id}`
- **Users (admin)**: `GET /api/admin/users`, `PUT /api/admin/users/{id}`, `DELETE /api/admin/users/{id}`
- **Chatbot**: `POST /api/chatbot/message`

## ER Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ PATIENTS : has
    USERS {
        int id PK
        string name
        string email UNIQUE
        string role "admin|doctor|patient"
        string phone
        date dob
        string gender
        string password_hash
        timestamp created_at
        timestamp updated_at
    }

    PATIENTS {
        int id PK
        int user_id FK "nullable if created by admin before linking"
        int created_by_user_id FK "doctor who created this patient, nullable"
        string name
        int age
        string gender
        string insulin_regimen_type "Basal|Bolus|PBD|BB|PTDS|None"
        timestamp created_at
        timestamp updated_at
    }

    %% Doctor-patient assignments (many-to-many)
    PATIENT_DOCTORS {
        int id PK
        int patient_id FK
        int doctor_user_id FK "user with role=doctor"
        int assigned_by_user_id FK "admin user who assigned"
        timestamp assigned_at
        timestamp unassigned_at "nullable"
    }
    PATIENTS ||--o{ PATIENT_DOCTORS : assigned_to
    USERS ||--o{ PATIENT_DOCTORS : assigns
    USERS ||--o{ PATIENTS : created_by

    PATIENTS ||--o{ VISITS : has
    VISITS {
        int id PK
        int patient_id FK
        int visit_no "1|2|3"
        float hba1c
        float fvg
        float dds
        date visit_date
        int gap_from_initial_visit_days
        int gap_from_previous_visit_days
        timestamp created_at
        timestamp updated_at
    }

    %% Precomputed aggregates used by UI (can be materialized view or cached columns)
    PATIENT_METRICS {
        int id PK
        int patient_id FK UNIQUE
        float hba1c_1st_visit
        float hba1c_2nd_visit
        float hba1c_3rd_visit
        float fvg_1
        float fvg_2
        float fvg_3
        float avg_fvg_1_2
        float fvg_delta_1_2
        float reduction_a "HbA1c delta across visits"
        float reduction_a_per_day
        float dds_1
        float dds_3
        float dds_trend_1_3
        int gap_from_initial_visit
        int gap_from_first_clinical_visit
        timestamp computed_at
    }
    PATIENTS ||--|| PATIENT_METRICS : computed_for

    %% AI: risk predictions
    RISK_PREDICTIONS {
        int id PK
        int patient_id FK
        json features "vector sent to model"
        float prediction
        bool cached_flag
        timestamp created_at
    }
    PATIENTS ||--o{ RISK_PREDICTIONS : has

    %% AI: therapy effectiveness
    THERAPY_EFFECTIVENESS {
        int id PK
        int patient_id FK
        string insulin_regimen
        float prob_visit1
        float prob_visit2
        float prob_visit3
        json top_factors "[{feature, importance}]"
        text insight_md
        timestamp created_at
    }
    PATIENTS ||--o{ THERAPY_EFFECTIVENESS : has

    %% AI: treatment recommendation Q&A
    TREATMENT_RECOMMENDATIONS {
        int id PK
        int patient_id FK
        int user_id FK "doctor initiating"
        text question
        text response_md
        text context_used
        timestamp created_at
    }
    PATIENTS ||--o{ TREATMENT_RECOMMENDATIONS : has
    USERS ||--o{ TREATMENT_RECOMMENDATIONS : asked_by

    %% Patient chatbot messages
    CHAT_MESSAGES {
        int id PK
        int patient_id FK
        int user_id FK "patient user"
        bool is_user
        text message
        timestamp created_at
    }
    PATIENTS ||--o{ CHAT_MESSAGES : has
    USERS ||--o{ CHAT_MESSAGES : authored_by
```

## Notes

- `VISITS` normalizes per-visit data instead of fixed columns (1st/2nd/3rd). The current UI uses fixed fields; both can coexist by maintaining `PATIENT_METRICS` as a denormalized/cache table or a view.
- `insulin_regimen_type` could be an enum or a lookup table if you need flexibility.
- `RISK_PREDICTIONS` and `THERAPY_EFFECTIVENESS` store AI outputs for auditability. They can be purged or cached depending on requirements.
- `TREATMENT_RECOMMENDATIONS` tracks prompts and AI responses with context for traceability.
- `CHAT_MESSAGES` logs patient-bot conversations to support longitudinal insights.
- `PATIENT_DOCTORS` governs visibility: doctors should only see patients where a current row exists with `unassigned_at IS NULL`. Admins can create rows (assign) and close rows (unassign). Historical assignment is preserved.
- `PATIENTS.created_by_user_id` allows doctor-created patients; `user_id` can later be linked to the patient's own user account.
- Current implementation keeps visit values on `PATIENTS` (fields like `hba1c_1st_visit`, `fvg_1..3`, `dds_1`, `dds_3`, gaps). Normalization to `VISITS` is optional; keep if performance/simple queries are preferred.
- Patient listing supports filters: `gender`, `insulin` (maps to `insulin_regimen_type`), and `search` (patient `name`), plus optional `perPage` pagination returned as a resource collection.

## Alignment with Code

- `RegistrationForm.jsx` gathers user demographics and role, mapping to `USERS`.
- `PatientsList.jsx` uses fields like `hba1c_1st_visit`, `fvg_1..3`, `dds_1`, `dds_3`, `fvg_delta_1_2`, `reduction_a`, `gap_from_initial_visit`, which fit `PATIENT_METRICS` and/or are derivable from `VISITS`.
- `Chatbot.jsx` reads current patient via `/api/patients/by-user/:userId` (implies `PATIENTS.user_id` linkage), and displays charts for HbA1c/FVG/DDS per visit, which match `VISITS`.
- FastAPI (`backend/fastapi/main.py`) exposes endpoints for predictions and RAG-based responses; the ERD provides tables to persist those outputs.

## Next Steps

- Confirm actual Laravel table/column names and adjust the ERD accordingly.
- Decide whether to keep denormalized patient metrics for speed or compute on-demand from `VISITS`.
- Add indices on `patient_id`, `user_id`, and time columns.
