import React, { useEffect, useState, useRef } from 'react';
import { useUser } from '../UserContext';
import { useParams } from 'react-router-dom';
import Chart from 'chart.js/auto';
import './PatientProfile.css'; // Assuming you have some CSS for styling

const PatientProfile = () => {
  const { id } = useParams();
  const { user } = useUser();
  const [patient, setPatient] = useState(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'N/A';


  useEffect(() => {
    const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://localhost:8000";
    fetch(`${laravelUrl}/api/patients/${id}`)
      .then(res => res.json())
      .then(data => setPatient(data));
  }, [id]);

  useEffect(() => {
    if (patient && chartRef.current) {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();

      const ctx = chartRef.current.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['1st Visit', '2nd Visit', '3rd Visit'],
          datasets: [
            {
              label: 'HbA1c',
              data: [patient.hba1c_1st_visit, patient.hba1c_2nd_visit, patient.hba1c_3rd_visit],
              borderColor: '#6366f1',
              backgroundColor: gradient,
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointBackgroundColor: '#6366f1'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => `HbA1c: ${ctx.raw}%`
              }
            }
          },
          scales: {
            y: {
              title: {
                display: true,
                text: 'HbA1c (%)',
                font: { weight: 'bold' }
              }
            }
          }
        }
      });
    }
  }, [patient]);

  if (!patient) return <div className="text-center py-10">Loading patient data...</div>;

  const hba1cDrop = patient.reduction_a?.toFixed(1);
  const fvgDelta = patient.fvg_delta_1_2;
  const ddsTrend = patient.dds_trend_1_3;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 bg-white text-gray-800">

      {/* Top Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white shadow-lg rounded-xl p-6 text-center space-y-4">
          <img
            src={`https://ui-avatars.com/api/?name=${patient.name}&background=random`}
            className="w-24 h-24 mx-auto rounded-full"
            alt="avatar"
          />
          <h2 className="text-xl font-bold text-gray-800">{patient.name}</h2>
          {user?.role === 'patient' && parseInt(user.id) === patient.user_id && (
            <div className="flex justify-center">
              <a
                href="/profile/edit"
                className="inline-block bg-indigo-600 text-white px-4 py-2 mt-2 rounded hover:bg-indigo-700 transition text-sm"
              >
                ✏️ Edit My Profile
              </a>
            </div>
          )}

          <p className="text-gray-500 text-sm">{patient.gender}, {patient.age} years old</p>
          <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
            Improving
          </span>

          <div className="text-left text-sm mt-4">
            <h4 className="text-gray-600 font-semibold mb-1">Personal Information</h4>
            <ul className="space-y-1 text-gray-700">
              <li><strong>Insulin Regimen:</strong> {patient.insulin_regimen_type}</li>
              <li><strong>First Visit:</strong> {formatDate(patient.first_visit_date)}</li>
              <li><strong>Second Visit:</strong> {formatDate(patient.second_visit_date)}</li>
              <li><strong>Third Visit:</strong> {formatDate(patient.third_visit_date)}</li>

            </ul>
            <h4 className="mt-4 text-gray-600 font-semibold mb-1">Contact</h4>
            <p>📧 patient@example.com</p>
            <p>📞 (555) 123-4567</p>
          </div>

          <div className="mt-4">
            <h4 className="text-gray-600 font-semibold mb-1">Remarks</h4>
            <p className="text-gray-700 text-sm">{patient.remarks || 'N/A'}</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="col-span-2 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <StatCard title="Current HbA1c" value={`${patient.hba1c_3rd_visit}%`} change={`↓ ${hba1cDrop}%`} color="text-indigo-600" />
            <StatCard title="Current FVG" value={patient.fvg} change={`↑ ${fvgDelta} points`} color="text-green-600" />
            <StatCard title="DDS Trend" value={ddsTrend} change={`${ddsTrend > 0 ? '+' : ''}${ddsTrend} pts`} color="text-yellow-600" />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl shadow p-6">
            <h4 className="text-gray-700 font-semibold mb-2">HbA1c Progress</h4>
            <canvas ref={chartRef} height={150}></canvas>
          </div>
        </div>
      </div>

      {/* Mid Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Treatment Progress */}
        <div className="bg-white rounded-xl shadow p-6">
          <h4 className="text-gray-700 font-semibold mb-4">Treatment Progress</h4>
          <ProgressItem label="HbA1c Reduction" value={Math.round((patient.reduction_a / patient.hba1c_1st_visit) * 100)} color="bg-indigo-500" />
          <ProgressItem label="FVG Improvement" value={Math.round((patient.fvg_delta_1_2 / patient.fvg_1) * 100)} color="bg-green-600" />
          <ProgressItem label="DDS Reduction" value={Math.round((patient.dds_trend_1_3 / patient.dds_1) * 100)} color="bg-orange-500" />

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mt-4">
            <div><strong>HbA1c Drop/Day:</strong> {patient.reduction_a_per_day?.toFixed(3)}</div>
            <div><strong>Avg FVG:</strong> {patient.avg_fvg_1_2}</div>
            <div><strong>Gap (1st→3rd):</strong> {Math.round(patient.gap_from_initial_visit)} days</div>
            <div><strong>Gap (2nd→3rd):</strong> {Math.round(patient.gap_from_first_clinical_visit)} days</div>
          </div>
        </div>

        {/* Visit Timeline */}
        <div className="bg-white rounded-xl shadow p-6 md:col-span-2">
          <h4 className="text-gray-700 font-semibold mb-4">Visit Timeline</h4>
          <ul className="space-y-4 text-sm text-gray-700">
            <li>
              <strong>🟣 First Visit</strong> ({patient.first_visit_date})<br />
              Initial assessment and treatment plan. HbA1c: {patient.hba1c_1st_visit}
            </li>
            <li>
              <strong>🔵 Second Visit</strong> ({patient.second_visit_date})<br />
              Adjustment and follow-up. HbA1c: {patient.hba1c_2nd_visit}
            </li>
            <li>
              <strong>🟢 Third Visit</strong> ({patient.third_visit_date})<br />
              Long-term plan review. HbA1c: {patient.hba1c_3rd_visit}
            </li>
            <li>
              <strong>📆 Next Appointment:</strong> In 3 months
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
};

// Components
const StatCard = ({ title, value, change, color }) => (
  <div className="bg-white border rounded-lg p-4 shadow-sm text-center">
    <div className="text-xs text-gray-500 font-medium">{title}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className={`text-sm mt-1 ${color}`}>{change}</div>
  </div>
);

const ProgressItem = ({ label, value, color }) => (
  <div className="mb-3">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-600 font-medium">{label}</span>
      <span className="text-gray-800 font-bold">{value}%</span>
    </div>
    <div className="w-full h-2 bg-gray-200 rounded-full">
      <div className={`${color} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const NoteCard = ({ title, text, color }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 border-l-4 border-indigo-400',
    green: 'bg-green-50 border-l-4 border-green-400',
    yellow: 'bg-yellow-50 border-l-4 border-yellow-400'
  };

  return (
    <li className={`${colorMap[color]} p-4 rounded-md`}>
      <h5 className="font-semibold text-sm mb-1">{title}</h5>
      <p className="text-gray-700 text-sm">{text}</p>
    </li>
  );
};

export default PatientProfile;
