import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend);

const TherapyDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

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
    let result = patients.filter(p => p.name.toLowerCase().includes(q));
    if (activeFilter !== 'All') {
      result = result.filter(p => getPatientStatus(p) === activeFilter);
    }
    setFiltered(result);
  }, [search, patients, activeFilter]);

  const getPatientStatus = (p) => {
    if (p.reduction_a > 0.5) return 'Improved';
    if (p.reduction_a < 0.3) return 'Review';
    return 'Stable';
  };

  const countStatus = (status) =>
    patients.filter(p => getPatientStatus(p) === status).length;

  const avgHbA1cDrop = () => {
    const valid = patients.filter(p => p.reduction_a);
    const total = valid.reduce((sum, p) => sum + parseFloat(p.reduction_a || 0), 0);
    return valid.length ? (total / valid.length).toFixed(2) : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

      <div className="bg-indigo-500 text-white rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold">Therapy Effectiveness Overview</h2>
        <p className="text-sm text-blue-100">Track reduction trends and therapy impact across all patients</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <KpiCard title="Total Patients" value={patients.length} icon="👥" color="blue" />
        <KpiCard title="Improved" value={countStatus('Improved')} icon="✅" color="green" />
        <KpiCard title="Review Needed" value={countStatus('Review')} icon="⚠️" color="red" />
        <KpiCard title="Avg. HbA1c Drop" value={`${avgHbA1cDrop()} %`} icon="📉" color="amber" />
      </div>

      {/* Doughnut Chart */}
      <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
        <h3 className="font-semibold mb-3 text-center">Patient Status Overview</h3>
        <Doughnut
          data={{
            labels: ['Improved', 'Review', 'Stable'],
            datasets: [{
              data: [
                countStatus('Improved'),
                countStatus('Review'),
                countStatus('Stable')
              ],
              backgroundColor: ['#10b981', '#ef4444', '#facc15']
            }]
          }}
          options={{
            plugins: {
              legend: { position: 'bottom' }
            }
          }}
        />
      </div>

      <div className="flex gap-4 border-b text-sm mt-10 mb-2">
        {['All', 'Improved', 'Review', 'Stable'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`py-2 px-4 border-b-2 font-medium ${activeFilter === tab
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex justify-between items-center mt-10 mb-4">
        <input
          type="text"
          placeholder="Search patients..."
          className="border p-2 rounded w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Patient Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => (
          <Link
            to={`/therapy-effectiveness/${p.id}`}
            key={p.id}
            className="border rounded-lg p-4 shadow hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{p.name}</h4>
                <p className="text-sm text-gray-600">{p.age} y/o — {p.gender}</p>
                <p className="text-xs text-gray-400 mt-1">Updated: {new Date(p.updated_at).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={getPatientStatus(p)} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// KPI Card
const KpiCard = ({ title, value, icon, color }) => {
  const colorMap = {
    blue: 'text-blue-700 bg-blue-50',
    green: 'text-green-700 bg-green-50',
    red: 'text-red-700 bg-red-50',
    amber: 'text-yellow-700 bg-yellow-50'
  };

  return (
    <div className={`rounded-lg shadow p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase">{title}</h4>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

// Badge
const StatusBadge = ({ status }) => {
  const badgeColor = {
    Improved: 'bg-green-100 text-green-800',
    Review: 'bg-red-100 text-red-800',
    Stable: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeColor[status]}`}>
      {status}
    </span>
  );
};

export default TherapyDashboard;
