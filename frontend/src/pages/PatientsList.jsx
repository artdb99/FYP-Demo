import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil } from 'lucide-react';

const PatientsList = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/patients')
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header & Summary */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Patient List</h2>
          <p className="text-gray-500 text-sm">Manage and monitor your patients’ diabetes treatment progress</p>
        </div>
        <Link to="/patients/create" className="bg-blue-600 text-white font-medium px-4 py-2 rounded hover:bg-blue-700 transition">
          + Add Patient
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Patients"
          value={patients.length}
          change={`+${Math.round((patients.length / 200) * 100 - 100)}%`} // assuming previous = 200
          icon="👥"
        />

        <SummaryCard
          label="Improved HbA1c"
          value={
            patients.length
              ? `${Math.round(
                (patients.filter(p => parseFloat(p.reduction_a) < 0).length / patients.length) * 100
              )}%`
              : '0%'
          }
          change=""
          icon="🛡️"
        />

        <SummaryCard
          label="Avg. Follow-up"
          value={
            patients.length
              ? `${Math.round(
                patients
                  .filter(p => p.gap_from_first_clinical_visit != null)
                  .reduce((acc, p) => acc + parseFloat(p.gap_from_first_clinical_visit), 0) /
                patients.filter(p => p.gap_from_first_clinical_visit != null).length
              )} days`
              : '-'
          }
          change=""
          icon="📅"
        />
      </div>


      {/* Patient Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 border-b text-xs uppercase font-medium text-gray-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Insulin Regimen</th>
              <th className="px-4 py-3">FVG</th>
              <th className="px-4 py-3">HbA1c (1st)</th>
              <th className="px-4 py-3">HbA1c (2nd)</th>
              <th className="px-4 py-3">HbA1c (3rd)</th>
              <th className="px-4 py-3">Avg FVG</th>
              <th className="px-4 py-3">FVG Δ</th>
              <th className="px-4 py-3">HbA1c Δ</th>
              <th className="px-4 py-3">HbA1c Drop/Day</th>
              <th className="px-4 py-3">DDS Δ</th>
              <th className="px-4 py-3">Gap (1st→3rd)</th>
              <th className="px-4 py-3">Gap (2nd→3rd)</th>
              <th className="px-4 py-3">Remarks</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-blue-600">
                  <Link to={`/patient/${p.id}`} className="hover:underline">{p.name}</Link>
                </td>
                <td className="px-4 py-3">{p.age}</td>
                <td className="px-4 py-3">{p.gender}</td>
                <td className="px-4 py-3">
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
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
                <td className="px-4 py-3 text-gray-700">{p.remarks || '-'}</td>
                <td className="px-4 py-3 flex gap-2 justify-center text-blue-600 text-sm">
                  <Link to={`/patient/${p.id}`} title="View"><Eye size={16} /></Link>
                  <Link to={`/treatment-recommendation/${p.id}`} title="Edit"><Pencil size={16} /></Link>
                  <Link to={`/predict/${p.id}`} title="Predict" className="underline text-xs ml-1">Risk</Link>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan="17" className="text-center py-6 text-gray-500">
                  No patient records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ label, value, change, icon, down = false }) => (
  <div className="bg-white border rounded-lg p-4 shadow-sm">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-2xl font-bold text-gray-800 mt-1 mb-2">{value}</div>
    <div className={`text-sm ${down ? 'text-red-500' : 'text-green-600'}`}>
      {down ? '↓' : '↑'} {change}
    </div>
  </div>
);

export default PatientsList;
