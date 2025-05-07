import React from 'react';

const MedicalHistory = ({ patient }) => {
  return (
    <div>
      <h3>Medical History</h3>
      <div>{patient.medical_history}</div>
    </div>
  );
};

export default MedicalHistory;
