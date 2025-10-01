# Finished Product Website Wireframes (Consolidated)

This document consolidates the final wireframes of the app for Patient, Doctor, and Admin roles. It is derived from `docs/wireframes.md`, aligned to routes in `frontend/src/App.jsx` and the role-based layout in `frontend/src/Layout.jsx`.

## 0) Sitemap (by Role)

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

## Layout conventions

- Grid: 12 columns, desktop 1440×1024. Content max-width ~1200px.
- Primary actions top-right; secondary actions near the entity title.
- Use status chips (Improving/Stable/Worsening) and insulin regimen chips.

---

## 1) Sign In (`/` when unauthenticated)

```
+---------------------------------------------------+
| Logo / Product Name                               |
|---------------------------------------------------|
|  [ Email ]                                        |
|  [ Password ]                                     |
|  ( Sign In )                                      |
|                                                   |
|  Don't have an account? ( Register )              |
+---------------------------------------------------+
```

## 2) Registration (`/register`)

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

---

## 3) Authenticated Layout (all roles)

```
+-- Sidebar ---------------------------------+---------------------------+
| Role Title + [☰]                           |  Page Title               |
|--------------------------------------------|---------------------------|
| - Patient: Profile, Chatbot                |  Content area             |
| - Doctor: My Patients, Risk, Therapy,      |                           |
|           Treatment Recommendation         |                           |
| - Admin: Manage Users, Manage Patients     |                           |
| Footer: ( Log Out )                        |                           |
+--------------------------------------------+---------------------------+
```

---

## 4) Patient: My Profile (`/profile` -> `/patient/:id`)

```
+---------------- Patient Name ----------------+
| Demographics: Age, Gender, Height/Weight     |
| Insulin Regimen                              |
| Labs: FVG, HbA1c (1st/2nd/3rd), DDS          |
| Gaps: Initial->3rd, 1st Clinical->3rd        |
| Status: [Improving]                          |
| Actions: ( Edit Profile )                    |
+----------------------------------------------+
```

## 5) Patient: Chatbot (`/chatbot`)

```
+------------------ AI Health Assistant ------------------+
| Conversation (bubbles)                                  |
|  Bot messages (sectioned)                               |
|  Small Trend: HbA1c / FVG / DDS                         |
| Input: [.................] ( Send )                     |
| Suggested Questions (right sidebar)                     |
+---------------------------------------------------------+
```

---

## 6) Doctor: My Patients (assigned) (`/patients`)

```
+---------------- My Patients (Assigned) ----------------+
| Search [....]  Filters [Status][Insulin][Gender]       |
| Page size [10|25|50|100]                               |
|--------------------------------------------------------|
| Name | Age | Gender | Insulin | FVG | HbA1c 1/2/3 |    |
| Avg FVG | ΔFVG | ΔHbA1c | ΔDDS | Gaps | Status | ...  |
|--------------------------------------------------------|
| [Link to Patient]  [Risk]                              |
| Pagination: Prev [1][2][3] Next                        |
| Summary Cards: Total | Improving | Stable | Worsening  |
+--------------------------------------------------------+
```

## 7) Doctor: Risk Prediction (`/predict`, `/predict/:id`)

```
+---------------- Risk Dashboard ----------------+
| Intro / instructions                           |
| Select Patient -> ( Go to Form )               |
+------------------------------------------------+

+---------------- Risk Prediction Form -----------+
| Patient context (prefill where possible)       |
| Feature inputs (as needed)                     |
| ( Submit ) -> Predicted value                  |
+------------------------------------------------+
```

## 8) Doctor: Therapy Effectiveness (`/therapy-effectiveness`, `/:id`)

```
+-------------- Therapy Dashboard ---------------+
| Select Patient -> ( Open Form )                |
+------------------------------------------------+

+-------------- Therapy Form --------------------+
| Inputs: Insulin Regimen, HbA1c1/2/3, FVG1/2/3 |
| Gaps, eGFR, Reduction(%), DDS1/DDS3           |
| ( Submit ) -> Probabilities + Insight + Factors|
+------------------------------------------------+
```

## 9) Doctor: Treatment Recommendation (`/treatment-recommendation`, `/:id`)

```
+---------- Treatment Recommendation ------------+
| Select Patient                                 |
| Question: [................................]  |
| ( Generate ) -> AI response with context       |
+------------------------------------------------+
```

---

## 10) Admin: Manage Users (`/admin/users`)

```
+---------------- Manage Users ----------------+
| Table: Name | Email | Role | Actions        |
| (Create / Edit / Delete)                    |
+---------------------------------------------+
```

## 11) Admin: Manage Patients (`/admin/patients`, `/admin/patients/create`)

```
+--------------- Manage Patients ---------------+
| Search / Filters                             |
| Table of patients                            |
| ( Create Patient ) -> Create form            |
| ( Assign to Doctor ) -> Assign dialog/page   |
+----------------------------------------------+
```

## 12) Admin: Assign Patients to Doctor

```
+--------------- Assign Patients ----------------+
| Select Doctor: [.....................]          |
| Unassigned Patients: [List + checkboxes]       |
| [ Assign Selected ]                             |
| Current Assignments for doctor:                 |
|   - Patient A   ( Unassign )                    |
|   - Patient B   ( Unassign )                    |
+------------------------------------------------+
```

---

## Appendix: Component inventory

- Buttons: Primary, Ghost, Destructive; states: default/hover/disabled.
- Inputs: Text, Password, Select, Textarea with labels, help, error.
- Tags/Chips: Status (Improving/Stable/Worsening), Insulin types.
- Cards: Summary stat (label + value).
- Table: Header row, data row, pagination bar.
- Layout: Sidebar, Header, Main content area.
- Chart placeholder: Line chart container for trends.
