import React, { useState, useEffect } from 'react';
import { useParams, Link, Routes, Route } from 'react-router-dom';
import './PatientProfile.css'; 

// Correct imports for the sections
import ProfileSection from './ProfileSection';  // Ensure this is the correct import
import MedicalHistory from './MedicalHistory'; 
import Logbook from './Logbook';  
import LabReports from './LabReports';  
import Medications from './Medications';  
import Prescription from './Prescription';  
import Remarks from './Remarks';  

const PatientProfile = () => {
  const { id } = useParams(); // Access the patient ID from the URL
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    // Fetch patient details based on the patient ID
    fetch(`http://localhost/ai-ncd-project/patient.php?id=${id}`) 
      .then((response) => response.json())
      .then((data) => setPatient(data))
      .catch((error) => console.error('Error fetching patient details:', error));
  }, [id]);

  if (!patient) return <div>Loading...</div>;

  return (
    <div>
      <h2>{patient.name}'s Profile</h2>
      
      {/* Navigation Links for the Sections */}
      <nav>
        <ul>
          <li><Link to={`/patient/${id}/profile`}>Profile</Link></li>
          <li><Link to={`/patient/${id}/medical-history`}>Medical History</Link></li>
          <li><Link to={`/patient/${id}/logbook`}>Logbook</Link></li>
          <li><Link to={`/patient/${id}/lab-reports`}>Lab Reports</Link></li>
          <li><Link to={`/patient/${id}/medications`}>Medications</Link></li>
          <li><Link to={`/patient/${id}/prescription`}>Prescription</Link></li>
          <li><Link to={`/patient/${id}/remarks`}>Remarks</Link></li>
        </ul>
      </nav>

      {/* Routes for each section */}
      <Routes>
        <Route path="profile" element={<ProfileSection patient={patient} />} />
        <Route path="medical-history" element={<MedicalHistory patient={patient} />} />
        <Route path="logbook" element={<Logbook patient={patient} />} />
        <Route path="lab-reports" element={<LabReports patient={patient} />} />
        <Route path="medications" element={<Medications patient={patient} />} />
        <Route path="prescription" element={<Prescription patient={patient} />} />
        <Route path="remarks" element={<Remarks patient={patient} />} />
      </Routes>
    </div>
  );
};

export default PatientProfile;
