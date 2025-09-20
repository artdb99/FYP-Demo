import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const TreatmentRecommendationDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://localhost:8000";
    fetch(`${laravelUrl}/api/patients`)
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

  const Metric = ({ label, value, color }) => (
  <div className="bg-gray-50 rounded-lg p-3 text-center shadow-sm">
    <p className="text-xs text-gray-500">{label}</p>
    <p className={`font-semibold ${color}`}>{value}</p>
  </div>
);


  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <header className="bg-gradient-to-r from-teal-500 to-green-600 text-white py-6 px-8 rounded-xl shadow-md mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">💊 Treatment Recommendation Hub</h1>
            <p className="text-sm text-indigo-100">AI-driven suggestions for optimizing therapy and outcomes</p>
          </div>
          <input
            type="text"
            placeholder="🔍 Search patient..."
            className="border border-indigo-300 bg-white text-gray-900 placeholder-gray-400 rounded px-4 py-2 w-64 shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>


      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search patient..."
          className="border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded px-4 py-2 w-1/3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <Link
            to={`/treatment-recommendation/${p.id}`}
            key={p.id}
            className="bg-white border-t-4 border-indigo-500 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col space-y-3"
          >
            {/* Name + Badge */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">{p.name}</h3>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                {p.insulin_regimen_type || 'N/A'}
              </span>
            </div>

            {/* Demographics */}
            <p className="text-sm text-gray-500">{p.age} y/o — {p.gender}</p>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="HbA1c Δ" value={`${(p.reduction_a ?? 0).toFixed(1)}%`} color="text-indigo-600" />
              <Metric label="FVG Δ" value={p.fvg_delta_1_2 ?? '—'} color="text-green-600" />
              <Metric label="DDS Δ" value={p.dds_trend_1_3 ?? '—'} color="text-purple-600" />
              <Metric label="eGFR" value={`${p.egfr ?? '—'} mL/min`} color="text-blue-600" />
            </div>

            {/* Last Update */}
            <p className="text-xs text-gray-400 mt-2">Last update: {new Date(p.updated_at).toLocaleDateString()}</p>
          </Link>

        ))}
      </div>
    </div>
  );
};

export default TreatmentRecommendationDashboard;
