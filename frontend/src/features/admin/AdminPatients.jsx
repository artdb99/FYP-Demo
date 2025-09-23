import React from 'react';
import { Link } from 'react-router-dom';
import PatientsList from '@/features/patients/PatientsList.jsx';

const AdminPatients = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
      <header className="bg-gradient-to-r from-teal-500 to-green-500 text-white py-6 px-6 rounded-lg shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Patient Management</h1>
          <p className="text-sm">View, manage, and add new patients</p>
        </div>
        <Link to="/admin/patients/create" className="bg-white text-purple-700 px-4 py-2 rounded shadow hover:bg-gray-100 transition">
          + Create Patient
        </Link>
      </header>

      <PatientsList hideHeader={true} />
    </div>
  );
};

export default AdminPatients;
