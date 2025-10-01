# Wireframes and Navigation Map

These wireframes are derived from the routes in `frontend/src/App.jsx` and the role-based navigation in `frontend/src/Layout.jsx`.

## Sitemap by Role

```mermaid
flowchart TD
    start[Sign In /] --> register[/Register /register/]
    start -->|After login| dashboard[/Home /]

    subgraph Patient
        dashboard --> patientProfile[/My Profile /profile -> /patient/:id/]
        dashboard --> chatbot[/Chatbot /chatbot]
        patientProfile --> editProfile[/Edit Profile /profile/edit]
    end

    subgraph Doctor
        dashboard --> listPatients[/My Patients (assigned) /patients]
        listPatients --> createPatientDoc[[Create Patient (future)]]
        listPatients --> viewPatient[/Patient Profile /patient/:id/]
        dashboard --> riskDash[/Risk Dashboard /predict]
        riskDash --> riskForm[/Risk Prediction Form /predict/:id]
        dashboard --> therapyDash[/Therapy Effectiveness /therapy-effectiveness]
        therapyDash --> therapyForm[/Therapy Form /therapy-effectiveness/:id]
        dashboard --> treatDash[/Treatment Recommendation /treatment-recommendation]
        treatDash --> treatForm[/Recommendation Form /treatment-recommendation/:id]
    end

    subgraph Admin
        dashboard --> adminHome[/Admin /admin]
        adminHome --> manageUsers[/Manage Users /admin/users]
        adminHome --> managePatients[/Manage Patients /admin/patients]
        managePatients --> createPatient[/Create Patient /admin/patients/create]
        managePatients --> assignPatients[[Assign Patients to Doctors]]
        adminHome --> systemAnalytics[/System Analytics /admin/analytics]
    end
```

## Screen Wireframes

Note: These are low-fidelity structures to guide layout and content. Final UI follows Tailwind classes used in the code.

### 1) Sign In (`/` when unauthenticated)

```
+---------------------------------------------------+
|            App Title / Branding                   |
|---------------------------------------------------|
|  [ Email ]                                        |
|  [ Password ]                                     |
|  ( Sign In )                                      |
|                                                   |
|  Don't have an account? ( Register )              |
+---------------------------------------------------+
```

### 2) Registration (`/register`)

```
+---------------------------------------------------+
| Create your account                               |
| Role: ( Admin ) ( Doctor ) ( Patient )            |
| First Name | Last Name                            |
| Gender     | Email                                |
| Phone      | Date of Birth                        |
| Password   | Confirm Password                     |
| ( Create account )                                |
| Already have an account? ( Sign in )              |
+---------------------------------------------------+
```

### 3) Authenticated Layout (All roles)

```
+-- Sidebar ---------------------------------+---------------------------+
| Header: Role Title + [☰]                   |                           |
|--------------------------------------------|    Page Content           |
| Nav items depend on role:                  |                           |
|  - Patient: My Profile, Chatbot            |  (children from routes)   |
|  - Doctor: Patients, Risk, Therapy,        |                           |
|            Treatment Recommendation        |                           |
|  - Admin: Manage Users, Manage Patients    |                           |
| Footer: ( Log Out )                        |                           |
### 4) Patients List (`/patients`, Doctor)

```
+---------------- My Patients (Assigned) ----------------+
| Only patients assigned to the logged-in doctor        |
| Search [.................]  Filters [Status][Ins..]|
| [Gender] [Page size]                                 |
|-----------------------------------------------------|
| Name | Age | Gender | Insulin | FVG | HbA1c 1/2/3 | |
|      | Avg FVG | ΔFVG | ΔHbA1c | ΔDDS | Gaps | ... |
|-----------------------------------------------------|
| [Link to Patient]  [Risk]                            |
| Pagination: Prev [1][2][3] Next                     |
+-----------------------------------------------------+
| Summary Cards: Total | Improving | Stable | Worsening|
+-----------------------------------------------------+
| ( Create Patient ) — future flow                    |
+-----------------------------------------------------+

### 5) Patient Profile (`/patient/:id`)

```
+---------------- Patient Name ----------------+
| Demographics: Age, Gender, Insulin Regimen   |
| Labs: FVG, HbA1c (1st/2nd/3rd), DDS, Gaps    |
| Trends/Badges: Improving/Stable/Worsening    |
| Actions: ( Predict Risk ) ( Therapy Form )   |
+----------------------------------------------+
```

### 6) Risk Prediction Dashboard and Form (`/predict`, `/predict/:id`)

```
+---------------- Risk Dashboard ----------------+
| Intro / instructions                           |
| Select Patient -> ( Go to Form )               |
+------------------------------------------------+

+---------------- Risk Prediction Form -----------+
| Patient context (pre-filled where possible)    |
| Features matrix or selected fields             |
| ( Submit ) -> show predicted value             |
+------------------------------------------------+
```

### 7) Therapy Effectiveness (`/therapy-effectiveness`, `/therapy-effectiveness/:id`)

```
+-------------- Therapy Dashboard ---------------+
| Select Patient -> ( Open Form )                |
+------------------------------------------------+

+-------------- Therapy Form --------------------+
| Inputs: Insulin Regimen, HbA1c1/2/3, FVG1/2/3 |
| Gaps, eGFR, Reduction(%), DDS1/DDS3, etc.     |
| ( Submit ) -> shows probabilities and insight  |
+------------------------------------------------+
```

### 8) Treatment Recommendation (`/treatment-recommendation`, `/treatment-recommendation/:id`)

```
+---------- Treatment Recommendation ------------+
| Select Patient                                 |
| Question: [................................]  |
| ( Generate ) -> AI response with context       |
+------------------------------------------------+
```

### 9) Chatbot (`/chatbot`, Patient)

```
+------------------ AI Health Assistant ------------------+
| Conversation (bubbles)                                  |
|  - Bot welcome message                                  |
|  - User messages                                        |
|  - Bot messages with sections and simple formatting     |
| If applicable: chart + progress bars (HbA1c/FVG/DDS)    |
| Input: [.................] ( Send )                     |
| Suggested Questions (right sidebar)                     |
+---------------------------------------------------------+
```

### 10) Admin: Manage Users (`/admin/users`)

```
+---------------- Manage Users ----------------+
| Table: Name | Email | Role | Actions        |
| (Create / Edit / Delete)                    |
+---------------------------------------------+
```

### 11) Admin: Manage Patients (`/admin/patients`, `/admin/patients/create`)

```
+--------------- Manage Patients ---------------+
| Search / Filters                             |
| Table of patients                            |
| ( Create Patient ) -> Create form            |
| ( Assign to Doctor ) -> Assign dialog/page   |
+----------------------------------------------+
```

### 12) Doctor: Create Patient (future)

```
+---------------- Create Patient ----------------+
| Basic Info: Name, Age, Gender, Contact          |
| Optional: Initial Insulin Regimen, Notes        |
| ( Save ) -> Patient created; appears in My      |
|            Patients once admin assigns or auto- |
|            assigns to creator (per policy)      |
+------------------------------------------------+
```

### 13) Admin: Assign Patients to Doctor

```
+--------------- Assign Patients ----------------+
| Select Doctor: [.....................]          |
| Unassigned Patients: [List with checkboxes]     |
| [ Assign Selected ]                             |
| Current Assignments (for doctor):               |
|   - Patient A   ( Unassign )                    |
|   - Patient B   ( Unassign )                    |
+------------------------------------------------+
```

## Notes and Assumptions

- Routes were taken from `frontend/src/App.jsx`.
- Role-based navigation is based on `frontend/src/Layout.jsx`.
- Patient fields (e.g., `hba1c_1st_visit`, `fvg_1..3`, `dds_1`, `dds_3`, gaps) inferred from components like `PatientsList.jsx` and `Chatbot.jsx`.
- Data is primarily fetched from a Laravel API (`VITE_LARAVEL_URL`), while AI and predictions use FastAPI endpoints (`backend/fastapi/main.py`).
- Doctor list is filtered to assigned patients (via `PATIENT_DOCTORS`). Admin can assign/unassign. Doctor create patient is planned; route to be added when implemented.
