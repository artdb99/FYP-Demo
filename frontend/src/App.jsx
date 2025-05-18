import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useUser } from './UserContext.jsx';
import { useEffect, useState } from 'react';

import SignIn from './pages/SignIn.jsx';
import RegistrationForm from './pages/RegistrationForm.jsx';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Chatbot from './pages/Chatbot';
import PatientsList from './pages/PatientsList';
import PatientProfile from './pages/PatientProfile';
import UpdatePatient from './pages/UpdatePatient';
import RiskDashboard from './pages/RiskDashboard';
import RiskPredictionForm from './pages/RiskPredictionForm';
import CreatePatient from './pages/CreatePatient';
import TherapyDashboard from './pages/TherapyDashboard';
import TherapyEffectivenessForm from './pages/TherapyEffectivenessForm';
import TreatmentRecommendationDashboard from './pages/TreatmentRecommendationDashboard.jsx';
import TreatmentRecommendationForm from './pages/TreatmentRecommendationForm';

import './App.css';

function App() {
  const { user } = useUser();

  // Inline redirect for /profile
  const PatientRedirect = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (user?.role === 'patient') {
        fetch(`http://localhost:8000/api/patients/by-user/${user.id}`)
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
                <Route path="/therapy-effectiveness" element={<TherapyDashboard />} />
                <Route path="/predict/:id" element={<RiskPredictionForm />} />
                <Route path="/therapy-effectiveness/:id" element={<TherapyEffectivenessForm />} />
                <Route path="/treatment-recommendation" element={<TreatmentRecommendationDashboard />} />
                <Route path="/treatment-recommendation/:id" element={<TreatmentRecommendationForm />} />
                <Route path="/patients/create" element={<CreatePatient />} />
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
