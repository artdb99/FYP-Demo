import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import Card from '@/components/Card.jsx';
import PageHeader from '@/components/PageHeader.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';

Chart.register(ArcElement, Tooltip, Legend);

const TherapyDashboard = () => {
  const [patients, setPatients] = useState([]);

  // Filters, search and pagination states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [insulinFilter, setInsulinFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const laravelUrl = import.meta.env.VITE_LARAVEL_URL || 'http://localhost:8000';
    fetch(`${laravelUrl}/api/patients`)
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, insulinFilter, genderFilter, search, pageSize]);

  const getPatientStatus = (p) => {
    const hbDrop = p.reduction_a_2_3 ?? null;
    const fvgDelta = p.fvg_delta_1_2 ?? null;
    const ddsTrend = p.dds_trend_1_3 ?? null;

    if (hbDrop !== null) {
      if (hbDrop > 1.0) return 'Improving';
      if (hbDrop < 0) return 'Worsening';
    }
    if (fvgDelta !== null) {
      if (fvgDelta < -1.0) return 'Improving';
      if (fvgDelta > 1.0) return 'Worsening';
    }
    return 'Stable';
  };

  const countStatus = (status) => patients.filter((p) => getPatientStatus(p) === status).length;

  const filteredPatients = patients.filter((p) => {
    const name = (p.name || '').toLowerCase();
    const status = getPatientStatus(p);
    const insulin = (p.insulin_regimen_type || '').toString();
    const gender = p.gender || '';
    const matchesSearch = name.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    const matchesInsulin =
      insulinFilter === 'All' || insulin.trim().toLowerCase() === insulinFilter.trim().toLowerCase();
    const matchesGender = genderFilter === 'All' || gender === genderFilter;

    return matchesSearch && matchesStatus && matchesInsulin && matchesGender;
  });

  const totalPages = Math.ceil(filteredPatients.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const visiblePatients = filteredPatients.slice(startIndex, startIndex + pageSize);

  const insulinTypes = Array.from(new Set(patients.map((p) => p.insulin_regimen_type).filter(Boolean)));
  const genders = Array.from(new Set(patients.map((p) => p.gender).filter(Boolean)));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <PageHeader title="Therapy Effectiveness Overview" subtitle="Track reduction trends and therapy impact across all patients" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <KpiCard title="Total Patients" value={patients.length} icon="👥" color="blue" />
        <KpiCard title="Improving" value={countStatus('Improving')} icon="✅" color="green" />
        <KpiCard title="Stable" value={countStatus('Stable')} icon="➖" color="amber" />
        <KpiCard title="Worsening" value={countStatus('Worsening')} icon="❌" color="red" />
      </div>

      {/* Doughnut Chart */}
      <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
        <h3 className="font-semibold mb-3 text-center">Patient Status Overview</h3>
        <Doughnut
          data={{
            labels: ['Improving', 'Stable', 'Worsening'],
            datasets: [
              {
                data: [countStatus('Improving'), countStatus('Stable'), countStatus('Worsening')],
                backgroundColor: ['#10b981', '#facc15', '#ef4444'],
              },
            ],
          }}
          options={{ plugins: { legend: { position: 'bottom' } } }}
        />
      </div>

      {/* Filters and search */}
      <div className="flex flex-wrap gap-4 items-center mt-10 mb-4">
        <select className="border rounded px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Improved">Improved</option>
          <option value="Review">Review</option>
          <option value="Stable">Stable</option>
        </select>

        <select className="border rounded px-3 py-2" value={insulinFilter} onChange={(e) => setInsulinFilter(e.target.value)}>
          <option value="All">All Insulin Types</option>
          {insulinTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select className="border rounded px-3 py-2" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="All">All Genders</option>
          {genders.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search patients..."
          className="border rounded px-3 py-2 flex-grow min-w-[200px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select className="border rounded px-3 py-2" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>

      {/* Patient cards grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {visiblePatients.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-10">No patients found.</div>
        ) : (
          visiblePatients.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition">
              <Link to={`/therapy-effectiveness/${p.id}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-blue-600 hover:underline">{p.name}</h4>
                    <p className="text-sm text-gray-600">
                      {p.age} y/o — {p.gender}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Updated: {new Date(p.updated_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={getPatientStatus(p)} />
                </div>
              </Link>
            </Card>
          ))
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1 border rounded ${pageNum === currentPage ? 'bg-indigo-500 text-white' : ''}`}>
                {pageNum}
              </button>
            );
          })}

          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ title, value, icon, color }) => {
  const colorMap = {
    blue: 'text-blue-700 bg-blue-50',
    green: 'text-green-700 bg-green-50',
    red: 'text-red-700 bg-red-50',
    amber: 'text-yellow-700 bg-yellow-50',
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

export default TherapyDashboard;
