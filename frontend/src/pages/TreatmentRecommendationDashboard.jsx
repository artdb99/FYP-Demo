import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const TreatmentRecommendationDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        setFiltered(data);
      });
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(patients.filter(p => p.name.toLowerCase().includes(q)));
  }, [search, patients]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <header className="bg-indigo-500 text-white py-4 px-6 rounded-lg shadow mb-6">
        <h1 className="text-xl font-bold">Treatment Recommendation Hub</h1>
        <p className="text-sm">Model-based suggestions for improving patient outcomes</p>
      </header>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search patient..."
          className="border px-3 py-2 rounded w-60 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <Link
            to={`/treatment-recommendation/${p.id}`}
            key={p.id}
            className="bg-white p-4 border rounded-lg shadow hover:shadow-md transition"
          >
            <h3 className="text-blue-700 font-semibold text-lg mb-1">{p.name}</h3>
            <p className="text-sm text-gray-600 mb-1">{p.age} y/o — {p.gender}</p>
            <div className="text-sm text-gray-800 space-y-1">
              <p><strong>HbA1c Δ:</strong> ↓ {(p.reduction_a ?? 0).toFixed(1)}%</p>
              <p><strong>FVG Δ:</strong> {p.fvg_delta_1_2 ?? '—'}</p>
              <p><strong>DDS Δ:</strong> {p.dds_trend_1_3 ?? '—'}</p>
              <p><strong>eGFR:</strong> {p.egfr ?? '—'} mL/min</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">Last update: {new Date(p.updated_at).toLocaleDateString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TreatmentRecommendationDashboard;
