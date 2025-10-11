# User Acceptance Testing (UAT) Use Cases

Covers each route defined in `frontend/src/App.jsx`. Provide 1–2 concise cases per page with Preconditions, Steps, and Expected Results.

---

## Authentication

### Sign In (Unauthenticated default)
- **Preconditions**
  - Not logged in.
- **Steps**
  - Open `/` or any unknown path (e.g., `/foo`).
  - Enter valid credentials and submit.
- **Expected**
  - User becomes authenticated.
  - Redirects to `/` showing `Dashboard`.

### Registration (`/register`)
- **Preconditions**
  - Not logged in.
- **Steps**
  - Visit `/register`.
  - Fill required fields and submit.
- **Expected**
  - Account created (backend dependent) and user is redirected or prompted to sign in.

---

## Layout Wrapper

### Layout Rendering
- **Preconditions**
  - Logged in as any role.
- **Steps**
  - Visit `/`.
- **Expected**
  - `Layout` shared navigation visible; content area shows `Dashboard`.

---

## Dashboard (`/`)

### Load Dashboard
- **Preconditions**
  - Logged in (patient/doctor/admin).
- **Steps**
  - Visit `/`.
- **Expected**
  - Dashboard renders without errors and loads user-specific widgets if any.

---

## Profile

### Profile Redirect (`/profile`)
- **Preconditions**
  - Logged in as patient with linked record on Laravel.
- **Steps**
  - Visit `/profile`.
- **Expected**
  - App fetches `GET {VITE_LARAVEL_URL}/api/patients/by-user/{user.id}`.
  - Navigates to `/patient/{patientId}` and loads `PatientProfile`.
  - If none: alert “No patient record linked.” and navigate `/`.

### Edit Profile (`/profile/edit`)
- **Preconditions**
  - Logged in as patient.
- **Steps**
  - Visit `/profile/edit`.
  - Modify fields and submit.
- **Expected**
  - Changes saved; success message or redirect to profile.
  - Non-patient navigating here is redirected to `/`.

---

## Patient Profile (`/patient/:id/*`)

### View Patient Profile
- **Preconditions**
  - Logged in as the owning patient or a doctor with access.
- **Steps**
  - Visit `/patient/{id}`.
- **Expected**
  - Patient details load; subsections (if any) render correctly.

### Unauthorized Access
- **Preconditions**
  - Logged in as a different patient.
- **Steps**
  - Visit `/patient/{otherId}`.
- **Expected**
  - Access denied or sanitized/limited view (per backend ACL).

---

## Chatbot (`/chatbot`)

### Ask a Question
- **Preconditions**
  - Logged in as any role.
- **Steps**
  - Visit `/chatbot`.
  - Enter a question and submit.
- **Expected**
  - Response appears with concise bullet insights. Graceful error on API failure.

---

## Doctor Routes

### Patients List (`/patients`)
- **Preconditions**
  - Logged in as doctor.
- **Steps**
  - Visit `/patients`.
- **Expected**
  - List of patients renders; filters/search (if present) work.

### Create Patient (`/patients/create`)
- **Preconditions**
  - Logged in as doctor.
- **Steps**
  - Visit `/patients/create`.
  - Fill minimal required fields and submit.
- **Expected**
  - Patient is created; redirected to detail or list with success feedback.

### Update Patient (`/patient/update/:id`)
- **Preconditions**
  - Logged in as doctor; patient exists.
- **Steps**
  - Visit `/patient/update/{id}`.
  - Change a field; submit.
- **Expected**
  - Changes persist and appear on patient profile.

### Risk Dashboard (`/predict`)
- **Preconditions**
  - Logged in as doctor; FastAPI reachable.
- **Steps**
  - Visit `/predict`.
  - Enter features; submit.
- **Expected**
  - Prediction value, risk label, and key factors display.
  - Re-submitting identical features may return cached result (UI should reflect).

### Risk Prediction for Patient (`/predict/:id`)
- **Preconditions**
  - Logged in as doctor; patient exists.
- **Steps**
  - Visit `/predict/{id}` and submit.
- **Expected**
  - Patient-context prediction displays.

### Therapy Effectiveness (`/therapy-effectiveness`)
- **Preconditions**
  - Logged in as doctor; FastAPI reachable.
- **Steps**
  - Visit `/therapy-effectiveness`.
  - Provide inputs; submit.
- **Expected**
  - Probabilities across visits and markdown insight summary display.

### Therapy Effectiveness for Patient (`/therapy-effectiveness/:id`)
- **Preconditions**
  - Logged in as doctor; patient exists.
- **Steps**
  - Visit `/therapy-effectiveness/{id}`; submit.
- **Expected**
  - Patient-specific probabilities and insights display.

### Treatment Recommendation (`/treatment-recommendation`)
- **Preconditions**
  - Logged in as doctor; FastAPI reachable.
- **Steps**
  - Visit `/treatment-recommendation`.
  - Provide patient context/question; submit.
- **Expected**
  - Concise markdown recommendation with context used.

### Treatment Recommendation for Patient (`/treatment-recommendation/:id`)
- **Preconditions**
  - Logged in as doctor; patient exists.
- **Steps**
  - Visit `/treatment-recommendation/{id}` and submit.
- **Expected**
  - Patient-specific recommendation renders.

---

## Admin Routes

### Admin Dashboard (`/admin`)
- **Preconditions**
  - Logged in as admin.
- **Steps**
  - Visit `/admin`.
- **Expected**
  - Overview cards/metrics render without errors.

### Manage Users (`/admin/users`)
- **Preconditions**
  - Logged in as admin.
- **Steps**
  - Visit `/admin/users`.
  - Create/update/deactivate a user.
- **Expected**
  - Changes persist and reflect in the list.

### Admin Patients (`/admin/patients`)
- **Preconditions**
  - Logged in as admin.
- **Steps**
  - Visit `/admin/patients`.
  - Search/filter.
- **Expected**
  - Results update accordingly.

### System Analytics (`/admin/analytics`)
- **Preconditions**
  - Logged in as admin.
- **Steps**
  - Visit `/admin/analytics`.
- **Expected**
  - Charts/metrics display without errors.

---

## Negative & Access Control

### Role-Gated Visibility
- **Preconditions**
  - Logged in as patient.
- **Steps**
  - Attempt to navigate to doctor/admin routes via URL.
- **Expected**
  - Routes not available; redirected to `/` or blocked.

### Session Handling
- **Preconditions**
  - Logged in; session/token expired.
- **Steps**
  - Refresh a protected route.
- **Expected**
  - Redirected to Sign In.

---

## Data Integrity Spot Check

### Create → List → Detail Consistency
- **Preconditions**
  - Logged in as doctor or admin.
- **Steps**
  - Create a patient.
  - Verify appears in `/patients` or `/admin/patients`.
  - Open `/patient/{id}` and confirm saved fields.
- **Expected**
  - Data is consistent across create, list, and detail views.
