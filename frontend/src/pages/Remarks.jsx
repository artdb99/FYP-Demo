import React from 'react';

const Remarks = ({ patient }) => {
  return (
    <div>
      <h3>Remarks</h3>
      <div>{patient.remarks}</div>
    </div>
  );
};

export default Remarks;
