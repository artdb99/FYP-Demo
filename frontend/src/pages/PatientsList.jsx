import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil } from 'lucide-react';

const PatientsList = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://localhost:8000";
    fetch(`${laravelUrl}/api/patients`)
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.error('Error:', err));
  }, []);

  const formatTrend = (val) => {
    if (val == null) return '-';
    const num = parseFloat(val);
    const color = num > 0 ? 'text-red-500' : num < 0 ? 'text-green-600' : 'text-yellow-500';
    return <span className={`font-semibold ${color}`}>{num}</span>;
  };

  const formatGap = (days) => (days != null ? `${Math.round(days)} days` : '-');

  const getStatusTag = (p) => {
    if (p.reduction_a < 0 && p.fvg_delta_1_2 < 0 && p.dds_trend_1_3 < 0) return 'Improving';
    if (p.reduction_a > 0 && p.fvg_delta_1_2 > 0) return 'Worsening';
    return 'Stable';
  };

  const insulinColors = {
    Basal: 'bg-indigo-100 text-indigo-700',
    Bolus: 'bg-purple-100 text-purple-700',
    PBD: 'bg-blue-100 text-blue-700',
    BB: 'bg-teal-100 text-teal-700',
    PTDS: 'bg-yellow-100 text-yellow-700',
    None: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Styled Header to match Dashboard.jsx */}
  <header className="bg-indigo-500 text-white py-4 px-6 rounded-lg shadow-md mb-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold">Patient Management</h1>
        <p className="text-sm">Monitor clinical progress and therapy effectiveness</p>
      </div>
      <Link
        to="/patients/create"
        className="bg-white text-blue-600 font-semibold px-5 py-2 rounded hover:bg-blue-100 transition"
      >
        + Add Patient
      </Link>
    </div>
  </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <SummaryCard label="Total Patients" value={patients.length} change={`+${Math.round((patients.length / 200) * 100 - 100)}%`} />
        <SummaryCard
          label="Improved HbA1c"
          value={`${Math.round(patients.filter(p => parseFloat(p.reduction_a) < 0).length / patients.length * 100 || 0)}%`}
          change=""
        />
        <SummaryCard
          label="Avg. Follow-up"
          value={
            patients.length
              ? `${Math.round(patients.filter(p => p.gap_from_first_clinical_visit).reduce((acc, p) => acc + parseFloat(p.gap_from_first_clinical_visit), 0) / patients.filter(p => p.gap_from_first_clinical_visit).length)} days`
              : '-'
          }
          change=""
        />
        <SummaryCard
          label="Avg. FVG Δ"
          value={
            patients.length
              ? (
                  patients.reduce((acc, p) => acc + (parseFloat(p.fvg_delta_1_2) || 0), 0) /
                  patients.length
                ).toFixed(1)
              : '-'
          }
          change=""
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg border">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs uppercase font-semibold text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Insulin</th>
              <th className="px-4 py-3">FVG</th>
              <th className="px-4 py-3">HbA1c 1st</th>
              <th className="px-4 py-3">HbA1c 2nd</th>
              <th className="px-4 py-3">HbA1c 3rd</th>
              <th className="px-4 py-3">Avg FVG</th>
              <th className="px-4 py-3">FVG Δ</th>
              <th className="px-4 py-3">HbA1c Δ</th>
              <th className="px-4 py-3">Drop/Day</th>
              <th className="px-4 py-3">DDS Δ</th>
              <th className="px-4 py-3">Gap (1st→3rd)</th>
              <th className="px-4 py-3">Gap (2nd→3rd)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-blue-600 font-medium">
                  <Link to={`/patient/${p.id}`} className="hover:underline">{p.name}</Link>
                </td>
                <td className="px-4 py-3">{p.age}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.gender === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                  }`}>
                    {p.gender}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${insulinColors[p.insulin_regimen_type] || 'bg-gray-100 text-gray-500'}`}>
                    {p.insulin_regimen_type || '-'}
                  </span>
                </td>
                <td className="px-4 py-3">{p.fvg ?? '-'}</td>
                <td className="px-4 py-3">{p.hba1c_1st_visit ?? '-'}</td>
                <td className="px-4 py-3">{p.hba1c_2nd_visit ?? '-'}</td>
                <td className="px-4 py-3">{p.hba1c_3rd_visit ?? '-'}</td>
                <td className="px-4 py-3">{p.avg_fvg_1_2 ?? '-'}</td>
                <td className="px-4 py-3">{formatTrend(p.fvg_delta_1_2)}</td>
                <td className="px-4 py-3">{formatTrend(p.reduction_a)}</td>
                <td className="px-4 py-3">{formatTrend(p.reduction_a_per_day)}</td>
                <td className="px-4 py-3">{formatTrend(p.dds_trend_1_3)}</td>
                <td className="px-4 py-3">{formatGap(p.gap_from_initial_visit)}</td>
                <td className="px-4 py-3">{formatGap(p.gap_from_first_clinical_visit)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    getStatusTag(p) === 'Improving' ? 'bg-green-100 text-green-700' :
                    getStatusTag(p) === 'Worsening' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {getStatusTag(p)}
                  </span>
                </td>
                <td className="px-4 py-3 flex justify-center gap-2 text-blue-600">
                  <Link to={`/patient/${p.id}`} title="View"><Eye size={16} /></Link>
                  <Link to={`/treatment-recommendation/${p.id}`} title="Edit"><Pencil size={16} /></Link>
                  <Link to={`/predict/${p.id}`} title="Predict" className="underline text-xs ml-1">Risk</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Summary card
const SummaryCard = ({ label, value, change }) => (
  <div className="bg-white border rounded-xl p-4 shadow text-center">
    <div className="text-sm text-gray-500 mb-1">{label}</div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
    {change && <div className="text-sm text-green-600">{change}</div>}
  </div>
);

export default PatientsList;
