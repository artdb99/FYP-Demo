import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Chart from 'chart.js/auto';

const TherapyEffectivenessForm = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [effectivenessResult, setEffectivenessResult] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_LARAVEL}/patients/${id}`)
      .then(res => res.json())
      .then(data => setPatient(data))
      .catch(err => console.error('Error:', err));
  }, [id]);

  useEffect(() => {
    if (patient) {
      const payload = {
        insulin_regimen: patient.insulin_regimen_type,
        hba1c1: patient.hba1c_1st_visit,
        hba1c2: patient.hba1c_2nd_visit,
        hba1c3: patient.hba1c_3rd_visit,
        hba1c_delta_1_2: patient.reduction_a,
        gap_initial_visit: patient.gap_from_initial_visit,
        gap_first_clinical: patient.gap_from_first_clinical_visit,
        egfr: patient.egfr,
        reduction_percent: patient.reduction_a,
        fvg1: patient.fvg_1,
        fvg2: patient.fvg_2,
        fvg3: patient.fvg_3,
        fvg_delta_1_2: patient.fvg_delta_1_2,
        dds1: patient.dds_1,
        dds3: patient.dds_3,
        dds_trend_1_3: patient.dds_trend_1_3,
      };


      console.log("Sending payload to /predict-therapy:", JSON.stringify(payload, null, 2));


      fetch("http://127.0.0.1:5000/predict-therapy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(res => res.json())
        .then(data => setEffectivenessResult(data))
        .catch(err => console.error("Prediction error:", err));
    }
  }, [patient]);

  useEffect(() => {
    if (patient && chartRef.current) {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();

      chartInstanceRef.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: ['Visit 1', 'Visit 2', 'Visit 3'],
          datasets: [
            {
              label: 'HbA1c (%)',
              data: [patient.hba1c_1st_visit, patient.hba1c_2nd_visit, patient.hba1c_3rd_visit],
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99,102,241,0.2)',
              tension: 0.4
            },
            {
              label: 'FVG',
              data: [patient.fvg_1, patient.fvg_2, patient.fvg_3],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16,185,129,0.2)',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true }
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Clinical Values'
              }
            }
          }
        }
      });
    }
  }, [patient]);

  if (!patient) return <div className="p-6 text-center">Loading patient data...</div>;

  const hba1cLevel = patient.hba1c_1st_visit;
  const adherenceGap = patient.gap_from_initial_visit;
  const ddsTrend = patient.dds_trend_1_3;

  const complicationRisk = hba1cLevel > 8 ? 'High' : hba1cLevel > 7 ? 'Moderate' : 'Low';
  const hypoRisk = adherenceGap > 120 ? 'High' : adherenceGap > 60 ? 'Moderate' : 'Low';
  const medAdherenceRisk = ddsTrend > 1.5 ? 'High' : ddsTrend > 0.5 ? 'Moderate' : 'Low';

  const riskValueMap = { Low: 20, Moderate: 50, High: 80 };
  const complicationRiskValue = riskValueMap[complicationRisk];
  const hypoRiskValue = riskValueMap[hypoRisk];
  const adherenceRiskValue = riskValueMap[medAdherenceRisk];

  let recommendationText = '';
  if (complicationRisk === 'High') {
    recommendationText += '⚠️ Patient has elevated HbA1c levels. Intensify glycemic control and reassess lifestyle interventions.\n';
  } else if (complicationRisk === 'Moderate') {
    recommendationText += '🟡 HbA1c levels are borderline. Monitor closely and optimize current therapy.\n';
  }
  if (hypoRisk === 'High') {
    recommendationText += '⚠️ Extended follow-up intervals noted. Increase frequency of visits or remote monitoring.\n';
  } else if (hypoRisk === 'Moderate') {
    recommendationText += '🟡 Slightly delayed follow-up. Encourage regular clinic attendance.\n';
  }
  if (medAdherenceRisk === 'High') {
    recommendationText += '⚠️ Patient distress suggests poor adherence. Initiate counseling or simplify regimen.\n';
  } else if (medAdherenceRisk === 'Moderate') {
    recommendationText += '🟡 Mild adherence concerns. Reinforce treatment education.\n';
  }
  if (recommendationText === '') {
    recommendationText = '✅ Patient is on track. Continue current therapy and reassess quarterly.';
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Metric Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard title="HbA1c Δ (1→2)" value={`${patient.reduction_a_per_day} %`} color="indigo" />
        <MetricCard title="HbA1c Reduction" value={`${patient.reduction_a.toFixed(2)} %`} color="blue" />
        <MetricCard title="FVG Δ (1→2)" value={`${patient.fvg_delta_1_2}`} color="green" />
        <MetricCard title="DDS Δ (1→3)" value={`${patient.dds_trend_1_3}`} color="purple" />
      </div>

      {/* Prediction Result */}
      {effectivenessResult && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl shadow text-green-800">
          <h4 className="text-md font-semibold mb-2">🎯 Therapy Effectiveness Model</h4>
          <p className="text-sm">
            Prediction: <strong>{effectivenessResult.status}</strong> (
            {Math.round(effectivenessResult.probability * 100)}% confidence)
          </p>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Therapy Trends</h3>
        <canvas ref={chartRef}></canvas>
      </div>

      {/* Patient Overview + Gaps */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded shadow">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Patient Overview</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li><strong>Insulin Regimen:</strong> {patient.insulin_regimen_type}</li>
            <li><strong>eGFR:</strong> {patient.egfr}</li>
            <li><strong>Medications:</strong> {patient.medications || 'N/A'}</li>
            <li><strong>Remarks:</strong> {patient.remarks || 'N/A'}</li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StatBox title="Gap (1→3)" value={`${patient.gap_from_initial_visit} days`} />
          <StatBox title="Gap (2→3)" value={`${patient.gap_from_first_clinical_visit} days`} />
        </div>
      </div>

      {/* Risk & Adherence Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow">
          <h4 className="text-lg font-semibold text-red-700 mb-2">Risk Assessment</h4>
          <div className="space-y-2">
            <RiskBar label="Hypoglycemia Risk" value={hypoRiskValue} color="bg-yellow-400" note={hypoRisk} />
            <RiskBar label="Complication Risk" value={complicationRiskValue} color="bg-red-500" note={complicationRisk} />
            <RiskBar label="Medication Adherence Risk" value={adherenceRiskValue} color="bg-green-500" note={medAdherenceRisk} />
          </div>
          <div className="mt-4 bg-red-100 text-red-700 text-sm p-3 rounded-lg flex items-start gap-2">
            <span>⚠️</span>
            <span>Patient has elevated risk for microvascular complications. Consider eye and kidney screening.</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl shadow">
          <h4 className="text-lg font-semibold text-blue-700 mb-2">Adherence & Engagement</h4>
          <div className="space-y-2">
            <RiskBar label="Medication Adherence" value={95} color="bg-blue-600" />
            <RiskBar label="Monitoring Adherence" value={85} color="bg-blue-500" />
            <RiskBar label="Appointment Adherence" value={100} color="bg-blue-400" />
          </div>
          <div className="mt-4 bg-blue-100 text-blue-800 text-sm p-3 rounded-lg flex items-start gap-2">
            <span>ℹ️</span>
            <span>Patient shows excellent engagement. Consider digital tools for glucose monitoring.</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <h5 className="text-sm font-semibold text-yellow-700 mb-2">Recommendation</h5>
        <p className="text-sm text-yellow-800 whitespace-pre-line">{recommendationText}</p>
      </div>
    </div>
  );
};

// Components
const MetricCard = ({ title, value, color }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700'
  };

  return (
    <div className={`${colorMap[color]} p-4 rounded shadow text-center`}>
      <h4 className="text-xs uppercase font-semibold">{title}</h4>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

const StatBox = ({ title, value }) => (
  <div className="bg-white rounded shadow p-4 text-center">
    <h5 className="text-xs text-gray-500">{title}</h5>
    <p className="text-lg font-bold text-gray-800">{value}</p>
  </div>
);

const RiskBar = ({ label, value, color, note = '' }) => (
  <div>
    <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
      <span>{label}</span>
      <span>{note}</span>
    </div>
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-2 ${color} rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export default TherapyEffectivenessForm;
