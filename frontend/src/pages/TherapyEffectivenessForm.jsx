import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Chart from 'chart.js/auto';



const TherapyEffectivenessForm = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const pathlineChartRef = useRef(null);
  const pathlineChartInstanceRef = useRef(null);
  const [therapyPathline, setTherapyPathline] = useState([]);
  const [llmInsight, setLlmInsight] = useState('');
  const [topFactors, setTopFactors] = useState([]);


  useEffect(() => {
    const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://localhost:8000";
    fetch(`${laravelUrl}/api/patients/${id}`)
      .then(res => res.json())
      .then(data => setPatient(data))
      .catch(err => console.error('Error:', err));
  }, [id]);

  useEffect(() => {
    if (patient) {
      const fastApiUrl = import.meta.env.VITE_FASTAPI_URL || "http://127.0.0.1:5000";
      const payload = {
        insulin_regimen: String(patient.insulin_regimen_type || ''),
        hba1c1: Number(patient.hba1c_1st_visit),
        hba1c2: Number(patient.hba1c_2nd_visit),
        hba1c3: Number(patient.hba1c_3rd_visit),
        hba1c_delta_1_2: Number(patient.reduction_a),
        gap_initial_visit: Number(patient.gap_from_initial_visit),
        gap_first_clinical: Number(patient.gap_from_first_clinical_visit),
        egfr: Number(patient.egfr),
        reduction_percent: Number(patient.reduction_a),
        fvg1: Number(patient.fvg_1),
        fvg2: Number(patient.fvg_2),
        fvg3: Number(patient.fvg_3),
        fvg_delta_1_2: Number(patient.fvg_delta_1_2),
        dds1: Number(patient.dds_1),
        dds3: Number(patient.dds_3),
        dds_trend_1_3: Number(patient.dds_trend_1_3),
      };

      fetch(`${fastApiUrl}/predict-therapy-pathline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(res => res.json())
        .then(data => {
          setTherapyPathline(data.probabilities);
          setLlmInsight(data.insight);
          setTopFactors(data.top_factors);
        })
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
            },
            {
              label: 'DDS Score',
              data: [patient.dds_1, (patient.dds_1 + patient.dds_3) / 2, patient.dds_3],
              borderColor: '#a855f7',
              backgroundColor: 'rgba(216,180,254,0.2)',
              tension: 0.4,
              yAxisID: 'y1' // keep using the main axis
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
                text: 'HbA1c & FVG'
              },
              position: 'left'
            },
            y1: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'DDS'
              },
              position: 'right',
              grid: {
                drawOnChartArea: false
              }
            }
          }

        }
      });
    }
  }, [patient]);

  useEffect(() => {
    if (therapyPathline.length === 3 && pathlineChartRef.current) {
      if (pathlineChartInstanceRef.current) {
        pathlineChartInstanceRef.current.destroy();
      }

      // Get dynamic min/max with some padding
      const minProb = Math.min(...therapyPathline);
      const maxProb = Math.max(...therapyPathline);
      const buffer = 0.01; // you can adjust this to exaggerate the change

      pathlineChartInstanceRef.current = new Chart(pathlineChartRef.current, {
        type: 'line',
        data: {
          labels: ['Visit 1', 'Visit 2', 'Visit 3'],
          datasets: [{
            label: 'Therapy Effectiveness Probability',
            data: therapyPathline,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              min: Math.max(0, minProb - buffer),
              max: Math.min(1, maxProb + buffer),
              title: {
                display: true,
                text: 'Probability'
              }
            }
          }
        }
      });
    }
  }, [therapyPathline]);


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

  const parseMarkdown = (text) => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-md font-bold mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };



  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <div className="bg-white border border-blue-200 rounded-xl p-6 shadow mb-6">
        <h2 className="text-2xl font-bold text-blue-600">{patient.name}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {patient.age} y/o — {patient.gender} · Therapy Effectiveness Summary
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard title="HbA1c Δ (1→2)" value={`${patient.reduction_a_per_day} %`} color="indigo" />
        <MetricCard title="HbA1c Reduction" value={`${patient.reduction_a.toFixed(2)} %`} color="blue" />
        <MetricCard title="FVG Δ (1→2)" value={`${patient.fvg_delta_1_2}`} color="green" />
        <MetricCard title="DDS Δ (1→3)" value={`${patient.dds_trend_1_3}`} color="purple" />
      </div>

      {/* Therapy Effectiveness Pathline Chart */}
      {therapyPathline.length === 3 && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Therapy Effectiveness Trend</h3>
          <canvas ref={pathlineChartRef}></canvas>
        </div>
      )}

      {/* Pathline Text Summary */}
      {therapyPathline.length === 3 && (
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow space-y-4">
          <h4 className="text-md font-semibold text-gray-800">📈 Therapy Effectiveness Probabilities</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {therapyPathline.map((p, i) => (
              <li key={i}>Visit {i + 1}: <strong>{(p * 100).toFixed(1)}%</strong></li>
            ))}
          </ul>
        </div>
      )}

      {/* LLM Insight */}
      {llmInsight && (
        <div className="bg-gray-50 border border-gray-300 p-6 rounded-xl shadow text-sm text-gray-800 whitespace-pre-line">
          <h4 className="font-semibold text-md mb-2">🧠 LLM-Based Insight</h4>
          <div className="space-y-2 text-sm text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{
            __html: parseMarkdown(
              llmInsight
                .replace(/^-\s*/gm, '• ')  // optional: change dashes to bullet points
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // ensure bold
            )
          }} />
        </div>
      )}

      {/* HbA1c/FVG Chart */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Therapy Trends</h3>
        <canvas ref={chartRef}></canvas>
      </div>

      {/* Patient Overview */}
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

      {/* Recommendation Summary */}
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
