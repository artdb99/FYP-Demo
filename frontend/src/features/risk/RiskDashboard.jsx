import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { patientsApi } from '../../api/patients';
import { fastApiClient } from '../../api/client';
import RiskBadge from '../../components/RiskBadge.jsx';
import Card from '../../components/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';

const RiskDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [riskResults, setRiskResults] = useState({}); // { id: { value, label } }

  const riskCounts = Object.values(riskResults).reduce((acc, r) => {
    acc[r.label] = (acc[r.label] || 0) + 1;
    return acc;
  }, {});

  const riskCategories = ['Normal', 'At Risk', 'Moderate Risk', 'Risky', 'Very Risky', 'Critical'];
  const counts = riskCategories.map(cat => riskCounts[cat] || 0);

  const chartData = {
    labels: riskCategories,
    datasets: [
      {
        label: 'Number of Patients',
        data: counts,
        backgroundColor: [
          '#22c55e',
          '#facc15',
          '#fbbf24',
          '#fb923c',
          '#ef4444',
          '#7f1d1d',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Patients', font: { weight: 'bold' } } },
      x: { title: { display: true, text: 'Risk Category', font: { weight: 'bold' } } },
    },
  };

  useEffect(() => {
    patientsApi.getAll().then((data) => {
      setPatients(data);
      setFiltered(data);
      runPredictions(data); // Trigger prediction API
    });
  }, []);

  const runPredictions = async (data) => {
    const results = {};
    for (const patient of data) {
      const features = [
        parseFloat(patient.hba1c_1st_visit),
        parseFloat(patient.hba1c_2nd_visit),
        parseFloat(patient.fvg_1),
        parseFloat(patient.fvg_2),
        parseFloat(patient.avg_fvg_1_2),
        parseFloat(patient.reduction_a),
      ];

      // Skip invalid
      if (features.some((val) => isNaN(val))) continue;

      try {
        const res = await fastApiClient.post('/predict', { features });
        const rawValue = parseFloat(res.data.prediction);
        const value = rawValue.toFixed(2);
        const label = mapNumericRisk(rawValue);
        results[patient.id] = { value, label };
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Prediction failed for ${patient.name}`);
      }
    }
    setRiskResults(results);
  };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(patients.filter((p) => p.name.toLowerCase().includes(q)));
  }, [search, patients]);

  const mapNumericRisk = (val) => {
    if (val < 5.7) return 'Normal';
    if (val < 6.5) return 'At Risk';
    if (val < 7.1) return 'Moderate Risk';
    if (val < 8.1) return 'Risky';
    if (val <= 9.0) return 'Very Risky';
    return 'Critical';
  };

  // Badge colors are handled by RiskBadge component

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <PageHeader title="Risk Prediction" subtitle="Model-driven prediction of diabetes severity" />
      <div className="mb-6 flex justify-end">
        <input
          type="text"
          placeholder="Search patients..."
          className="px-4 py-2 border border-gray-300 rounded shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Risk Distribution</h3>
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => {
          const risk = riskResults[p.id];

          return (
            <Card key={p.id} className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{p.name}</h3>
                  <p className="text-sm text-gray-600">{p.age} y/o — {p.gender}</p>
                </div>
                {risk ? (
                  <RiskBadge label={risk.label} />
                ) : (
                  <span className="text-xs font-medium text-gray-400">Loading...</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
                <div>
                  <p className="text-gray-500 font-medium">HbA1c (1st)</p>
                  <p>{p.hba1c_1st_visit ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">HbA1c (2nd)</p>
                  <p>{p.hba1c_2nd_visit ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">FVG (1st)</p>
                  <p>{p.fvg_1 ?? '—'} mg/dL</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">FVG (2nd)</p>
                  <p>{p.fvg_2 ?? '—'} mg/dL</p>
                </div>
              </div>

              <Link
                to={`/predict/${p.id}`}
                className="mt-4 block text-center bg-indigo-600 text-white font-semibold py-2 rounded hover:bg-indigo-700 transition"
              >
                View Details →
              </Link>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400">No matching patients found.</p>
      )}
    </div>
  );
};

export default RiskDashboard;
