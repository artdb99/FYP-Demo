import React from 'react';

const Logbook = ({ patient }) => {
  return (
    <div>
      <h3>Logbook</h3>
      <div>{patient.logbook}</div>
    </div>
  );
};

export default Logbook;
