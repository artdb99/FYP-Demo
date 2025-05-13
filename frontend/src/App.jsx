import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import PatientsList from './pages/PatientsList';
import PatientProfile from './pages/PatientProfile'; // Importing PatientProfile
import RiskDashboard from './pages/RiskDashboard';
import RiskPredictionForm from './pages/RiskPredictionForm';
import CreatePatient from './pages/CreatePatient'; // Importing CreatePatient
import TherapyDashboard from './pages/TherapyDashboard'; // Importing TherapyDashboard
import TherapyEffectivenessForm from './pages/TherapyEffectivenessForm';
import TreatmentRecommendationDashboard from './pages/TreatmentRecommendationDashboard.jsx';
import TreatmentRecommendationForm from './pages/TreatmentRecommendationForm';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<PatientsList />} />

          {/* Parent route with nested routes */}
          <Route path="/patient/:id/*" element={<PatientProfile />} />

          <Route path="/predict" element={<RiskDashboard />} />
          <Route path="/predict/:id" element={<RiskPredictionForm />} />

          {/* Route for TherapyEffectivenessForm */}
          <Route path="/therapy-effectiveness" element={<TherapyDashboard />} />
          <Route path="/therapy-effectiveness/:id" element={<TherapyEffectivenessForm />} />

          {/* Route for TreatmentRecommendationForm */}
          <Route path="/treatment-recommendation" element={<TreatmentRecommendationDashboard />} />
          <Route path="/treatment-recommendation/:id" element={<TreatmentRecommendationForm />} />
          {/* Route for CreatePatient */}
          <Route path="/patients/create" element={<CreatePatient />} /> {/* Route for CreatePatient */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
