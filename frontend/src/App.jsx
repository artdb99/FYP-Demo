import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import PatientsList from './pages/PatientsList';
import PatientProfile from './pages/PatientProfile'; // Importing PatientProfile
import RiskPredictionForm from './pages/RiskPredictionForm';
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

          <Route path="/predict" element={<RiskPredictionForm />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
