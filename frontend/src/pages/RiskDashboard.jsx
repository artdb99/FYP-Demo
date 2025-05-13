import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const RiskDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/patients')
      .then((res) => res.json())
      .then((data) => {
        setPatients(data);
        setFiltered(data);
      })
      .catch((err) => console.error('Failed to load patients:', err));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(patients.filter(p => p.name.toLowerCase().includes(q)));
  }, [search, patients]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Complication Risk Prediction</h1>
      <p className="text-gray-600 mb-4">
        Select a patient below to analyze predicted diabetes complication risks based on therapy progress.
      </p>

      <input
        type="text"
        placeholder="Search patients..."
        className="w-full md:w-1/2 p-2 border border-gray-300 rounded mb-6"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(patient => (
          <div key={patient.id} className="bg-white border rounded-lg shadow p-4 space-y-3">
            <div>
              <h4 className="text-lg font-semibold text-blue-700">{patient.name}</h4>
              <p className="text-sm text-gray-600">{patient.age} y/o — {patient.gender}</p>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>HbA1c1:</strong> {patient.hba1c_1st_visit}</li>
              <li><strong>HbA1c2:</strong> {patient.hba1c_2nd_visit}</li>
              <li><strong>FVG1:</strong> {patient.fvg_1}</li>
              <li><strong>FVG2:</strong> {patient.fvg_2}</li>
            </ul>
            <Link
              to={`/predict/${patient.id}`}
              className="block text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 px-4 rounded hover:from-blue-600 hover:to-indigo-700 transition"
            >
              Predict Risk →
            </Link>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-center mt-10">No patients match your search.</p>
      )}
    </div>
  );
};

export default RiskDashboard;
