import React from 'react';

const LabReports = ({ patient }) => {
  return (
    <div>
      <h3>Lab Reports</h3>
      <div>{patient.labreports}</div>
    </div>
  );
};

export default LabReports;
