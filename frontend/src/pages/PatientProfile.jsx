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

  const activityMeta = (level) => {
    switch (level) {
      case '1–2 times per week': return { label: 'Light', pct: 30 };
      case '3–4 times per week': return { label: 'Moderate', pct: 60 };
      case '5–6 times per week': return { label: 'Active', pct: 85 };
      case 'Daily': return { label: 'Very Active', pct: 100 };
      default: return { label: 'Not set', pct: 0 };
    }
  };



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

  // Inside PatientProfile component, after fetching patient

  // Add BMI calculation after patient is loaded
  const bmi = patient?.weight_kg && patient?.height_cm
    ? (patient.weight_kg / Math.pow(patient.height_cm / 100, 2)).toFixed(1)
    : null;

  const bmiCategory = bmi
    ? bmi < 18.5
      ? { label: 'Underweight', color: 'text-yellow-600' }
      : bmi < 25
        ? { label: 'Normal', color: 'text-green-600' }
        : bmi < 30
          ? { label: 'Overweight', color: 'text-orange-600' }
          : { label: 'Obese', color: 'text-red-600' }
    : { label: 'N/A', color: 'text-gray-400' };

  const pa = activityMeta(patient.physical_activity);

  const getStatusTag = (p) => {
    const hbDrop = p.reduction_a_2_3 ?? null;
    const fvgDelta = p.fvg_delta_1_2 ?? null;
    const ddsTrend = p.dds_trend_1_3 ?? null;

    // HbA1c priority
    if (hbDrop !== null) {
      if (hbDrop > 1.0) return 'Improving';
      if (hbDrop < 0) return 'Worsening';
      // 0–1% drop → Stable
    }

    // FVG fallback
    if (fvgDelta !== null) {
      if (fvgDelta < -1.0) return 'Improving';
      if (fvgDelta > 1.0) return 'Worsening';
    }

    // DDS advisory
    if (ddsTrend !== null && ddsTrend > 1) {
      return 'Needs Review';
    }

    return 'Stable';
  };


  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 bg-white text-gray-800">

      {/* Top Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-teal-50 border border-teal-200 shadow-lg rounded-xl p-6 text-center space-y-4">
          <img
            src={`https://ui-avatars.com/api/?name=${patient.name}&background=random`}
            className="w-24 h-24 mx-auto rounded-full"
            alt="avatar"
          />
          <h2 className="text-xl font-bold text-gray-800">{patient.name}</h2>

          {(user?.role === 'doctor' || user?.role === 'admin') && (
            <div className="flex justify-center">
              <a
                href={`/patient/update/${patient.id}`}
                className="inline-block bg-indigo-600 text-white px-4 py-2 mt-2 rounded hover:bg-indigo-700 transition text-sm"
              >
                ✏️ Edit Patient
              </a>
            </div>
          )}

          <p className="text-gray-500 text-sm">{patient.gender}, {patient.age} years old</p>
          {/* Dynamic Status */}
          {patient && (
            <span
              className={`inline-block text-xs px-3 py-1 rounded-full ${getStatusTag(patient) === 'Improving'
                  ? 'bg-green-200 text-green-900'
                  : getStatusTag(patient) === 'Worsening'
                    ? 'bg-red-200 text-red-900'
                    : getStatusTag(patient) === 'Needs Review'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-yellow-200 text-yellow-800'
                }`}
            >
              {getStatusTag(patient)}
            </span>
          )}


          {/* Personal Info Section */}
          <div className="mt-4 space-y-4">
            <h4 className="text-gray-600 font-semibold mb-2">Personal Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoItem icon="📏" label="Height" value={patient.height_cm ? `${patient.height_cm} cm` : 'N/A'} />
              <InfoItem icon="⚖️" label="Weight" value={patient.weight_kg ? `${patient.weight_kg} kg` : 'N/A'} />
              <InfoItem icon="💉" label="Insulin" value={patient.insulin_regimen_type || 'N/A'} />
              <InfoItem icon="📅" label="1st Visit" value={formatDate(patient.first_visit_date)} />
              <InfoItem icon="📅" label="2nd Visit" value={formatDate(patient.second_visit_date)} />
              <InfoItem icon="📅" label="3rd Visit" value={formatDate(patient.third_visit_date)} />
            </div>

            <h4 className="text-gray-600 font-semibold mt-4 mb-2">Contact</h4>
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2 text-gray-700">
                <span className="text-blue-500">📧</span> {patient.email || 'N/A'}
              </p>
              <p className="flex items-center gap-2 text-gray-700">
                <span className="text-pink-500">📞</span> {patient.phone || 'N/A'}
              </p>
            </div>
          </div>


          {/* Remarks */}
          <div className="mt-6">
            <h4 className="text-gray-600 font-semibold mb-2">Remarks</h4>
            <div className={`rounded-lg p-4 shadow-sm border-l-4 ${patient.remarks ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-300'
              }`}>
              <p className="text-sm text-gray-800 italic">
                {patient.remarks && patient.remarks.trim() !== ''
                  ? `“${patient.remarks}”`
                  : 'No remarks provided.'}
              </p>
            </div>
          </div>

        </div>

        {/* Stat Cards */}
        <div className="col-span-2 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <StatCard title="Current HbA1c" value={`${patient.hba1c_3rd_visit}%`} change={`↓ ${hba1cDrop}%`} color="text-indigo-600" />
            <StatCard title="Current FVG" value={patient.fvg} change={`↑ ${fvgDelta} points`} color="text-green-600" />
            <StatCard title="DDS Trend" value={ddsTrend} change={`${ddsTrend > 0 ? '+' : ''}${ddsTrend} pts`} color="text-yellow-600" />
            <StatCard title="BMI" value={bmi ? `${bmi} (${bmiCategory.label})` : 'N/A'} change="" color={bmiCategory.color} />
            {/* Enhanced Activity Card */}
            <div className="bg-white border rounded-lg p-4 shadow-sm text-center">
              <div className="text-xs text-gray-500 font-medium">Activity</div>
              <div className="text-xl font-bold text-blue-600">{pa.label}</div>
              <div className="text-sm text-gray-600 mt-1">{patient.physical_activity}</div>
            </div>
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

        {/* Visit Cards */}
        <div className="bg-white rounded-xl shadow p-6 md:col-span-2">
          <h4 className="text-gray-700 font-semibold mb-4">Visit Summary</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <VisitCard
              visit="Visit 1"
              hba1c={patient.hba1c_1st_visit}
              fvg={patient.fvg_1}
              dds={patient.dds_1}
            />
            <VisitCard
              visit="Visit 2"
              hba1c={patient.hba1c_2nd_visit}
              fvg={patient.fvg_2}
              dds={(patient.dds_1 + patient.dds_3) / 2}
            />
            <VisitCard
              visit="Visit 3"
              hba1c={patient.hba1c_3rd_visit}
              fvg={patient.fvg_3}
              dds={patient.dds_3}
            />
          </div>
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

const VisitCard = ({ visit, hba1c, fvg, dds }) => (
  <div className="bg-white shadow-md rounded-xl p-5 flex flex-col space-y-3 text-center hover:shadow-lg transition">
    <h5 className="font-bold text-indigo-600">{visit}</h5>

    <div className="flex items-center justify-between bg-indigo-50 px-3 py-2 rounded-md">
      <span className="text-sm font-medium text-gray-600">HbA1c</span>
      <span className="text-indigo-700 font-bold">{hba1c?.toFixed(1)}</span>
    </div>

    <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
      <span className="text-sm font-medium text-gray-600">FVG</span>
      <span className="text-green-700 font-bold">{fvg?.toFixed(1)}</span>
    </div>

    <div className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded-md">
      <span className="text-sm font-medium text-gray-600">DDS</span>
      <span className="text-purple-700 font-bold">{dds?.toFixed(2)}</span>
    </div>
  </div>
);

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md shadow-sm">
    <span className="text-lg">{icon}</span>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);


export default PatientProfile;
