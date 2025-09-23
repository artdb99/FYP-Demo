import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useUser } from './UserContext.jsx';
import { useEffect, useState } from 'react';

import SignIn from './features/auth/SignIn.jsx';
import RegistrationForm from './features/auth/RegistrationForm.jsx';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Chatbot from './pages/Chatbot';
import PatientsList from './features/patients/PatientsList.jsx';
import PatientProfile from './features/patients/PatientProfile.jsx';
import UpdatePatient from './features/patients/UpdatePatient.jsx';
import RiskDashboard from './features/risk/RiskDashboard';
import RiskPredictionForm from './features/risk/RiskPredictionForm';
import CreatePatient from './features/patients/CreatePatient.jsx';
import TherapyDashboard from './features/therapy/TherapyDashboard.jsx';
import TherapyEffectivenessForm from './features/therapy/TherapyEffectivenessForm.jsx';
import TreatmentRecommendationDashboard from './features/treatment/TreatmentRecommendationDashboard.jsx';
import TreatmentRecommendationForm from './features/treatment/TreatmentRecommendationForm.jsx';
import AdminDashboard from './features/admin/AdminDashboard.jsx';
import AdminPatients from './features/admin/AdminPatients.jsx';
import SystemAnalytics from './features/admin/SystemAnalytics.jsx';
import ManageUsers from './features/admin/ManageUsers.jsx';


import './App.css';

function App() {
  const { user } = useUser();

  // Inline redirect for /profile
  const PatientRedirect = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (user?.role === 'patient') {
        const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://localhost:8000";
        fetch(`${laravelUrl}/api/patients/by-user/${user.id}`)
          .then(res => res.json())
          .then(data => {
            if (data?.id) {
              navigate(`/patient/${data.id}`);
            } else {
              alert("No patient record linked.");
              navigate('/');
            }
          })
          .catch(() => {
            alert("Unable to fetch profile.");
            navigate('/');
          })
          .finally(() => setLoading(false));
      } else {
        navigate('/');
      }
    }, [user, navigate]);

    return <div className="p-6 text-gray-500">Redirecting to your profile...</div>;
  };

  return (
    <Router>
      {user ? (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<PatientRedirect />} />
            <Route
              path="/profile/edit"
              element={user?.role === 'patient' ? <UpdatePatient /> : <Navigate to="/" />}
            />
            <Route path="/patient/:id/*" element={<PatientProfile />} />
            <Route path="/chatbot" element={<Chatbot />} />


            {user.role === 'doctor' && (
              <>
                <Route path="/patients" element={<PatientsList />} />
                <Route path="/predict" element={<RiskDashboard />} />
                <Route path="/patient/update/:id" element={<UpdatePatient />} />  
                <Route path="/therapy-effectiveness" element={<TherapyDashboard />} />
                <Route path="/predict/:id" element={<RiskPredictionForm />} />
                <Route path="/therapy-effectiveness/:id" element={<TherapyEffectivenessForm />} />
                <Route path="/treatment-recommendation" element={<TreatmentRecommendationDashboard />} />
                <Route path="/treatment-recommendation/:id" element={<TreatmentRecommendationForm />} />
              </>
            )}

            {user.role === 'admin' && (
              <>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<ManageUsers />} />
                <Route path="/admin/patients" element={<AdminPatients />} />
                <Route path="/admin/patients/create" element={<CreatePatient />} />
                <Route path="/admin/analytics" element={<SystemAnalytics />} />
              </>
            )}

          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/register" element={<RegistrationForm />} />
          <Route path="*" element={<SignIn />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
