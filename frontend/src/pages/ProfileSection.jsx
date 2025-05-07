import React from 'react';

const ProfileSection = ({ patient }) => {
  return (
    <div>
      <h3>Profile</h3>
      <div><strong>Name:</strong> {patient.name}</div>
      <div><strong>Age:</strong> {patient.age}</div>
      <div><strong>Gender:</strong> {patient.gender}</div>
    </div>
  );
};

export default ProfileSection;
