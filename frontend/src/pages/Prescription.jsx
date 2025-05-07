import React from 'react';

const Prescription = ({ patient }) => {
  return (
    <div>
      <h3>Prescription</h3>
      <div>{patient.prescription}</div>
    </div>
  );
};

export default Prescription;
