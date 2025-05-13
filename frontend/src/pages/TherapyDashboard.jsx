import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart,
  ArcElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(ArcElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const TherapyDashboard = () => {
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

  const countImproved = () => patients.filter(p => p.reduction_a > 0.5).length;
  const countReview = () => patients.filter(p => p.reduction_a < 0.3).length;
  const avgHbA1cDrop = () => {
    const valid = patients.filter(p => p.reduction_a);
    const total = valid.reduce((sum, p) => sum + parseFloat(p.reduction_a || 0), 0);
    return valid.length ? (total / valid.length).toFixed(1) : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <KpiCard title="Total Patients" value={patients.length} growth="↑ 12%" target="100" icon="👥" color="blue" />
        <KpiCard title="Improved Patients" value={countImproved()} growth="↑ 18%" target="75%" icon="✅" color="green" />
        <KpiCard title="Needs Review" value={countReview()} growth="↓ 5%" target="<10%" icon="⚠️" color="red" />
        <KpiCard title="Avg. HbA1c Reduction" value={`${avgHbA1cDrop()}%`} growth="↑ 8%" target="1.5%" icon="📉" color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-3">Therapy Effectiveness</h3>
          <Line
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                label: 'HbA1c',
                data: [9.2, 8.7, 8.3, 7.8, 7.5, 7.2],
                backgroundColor: 'rgba(99,102,241,0.2)',
                borderColor: '#4f46e5',
                tension: 0.3
              }]
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-3">Patient Status Distribution</h3>
          <Doughnut
            data={{
              labels: ['Improved', 'Needs Review', 'Stable', 'New'],
              datasets: [{
                data: [countImproved(), countReview(), 4, 2],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#6366f1']
              }]
            }}
            options={{ plugins: { legend: { position: 'bottom' } } }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b text-sm mt-10">
        {['All Patients', 'Improved', 'Needs Review', 'Stable', 'New'].map((tab) => (
          <button key={tab} className="py-2 px-4 border-b-2 font-medium text-gray-600 hover:text-blue-600">
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex justify-between items-center mt-6 mb-2">
        <input
          type="text"
          placeholder="Search patients..."
          className="border p-2 rounded w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="border p-2 rounded text-sm">
          <option>All Ages</option>
        </select>
      </div>

      {/* Patient Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => (
          <Link
            to={`/therapy-effectiveness/${p.id}`}
            key={p.id}
            className="border rounded-lg p-4 shadow hover:shadow-md transition"
          >
            <div className="flex justify-between">
              <div>
                <h4 className="font-semibold">{p.name}</h4>
                <p className="text-sm text-gray-600">{p.age} y/o — {p.gender}</p>
                <p className="text-xs text-gray-400 mt-1">Updated: {new Date(p.updated_at).toLocaleDateString()}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Improved</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Activity & Actions */}
      <div className="mt-12 grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h4 className="font-semibold mb-3">Recent Activity</h4>
          <ul className="text-sm space-y-2">
            {patients.slice(-5).reverse().map(p => (
              <li key={p.id} className="text-gray-600">
                {p.name} updated on {new Date(p.updated_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h4 className="font-semibold mb-3">Quick Actions</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/patients/create" className="text-blue-600 hover:underline">➕ Add New Patient</Link></li>
            <li><Link to="/therapy-effectiveness" className="text-green-600 hover:underline">📈 Generate Report</Link></li>
            <li><Link to="/treatment-recommendation" className="text-red-600 hover:underline">⚠️ Review Alerts</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, growth, target, icon, color }) => {
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
      <p className="text-sm">{growth} vs last month</p>
      <div className="text-xs text-gray-600 mt-1">Target: {target}</div>
    </div>
  );
};

export default TherapyDashboard;
