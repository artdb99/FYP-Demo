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

  // HbA1c/FVG chart
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
              backgroundColor: ctx => {
                const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(99,102,241,0.3)');
                gradient.addColorStop(1, 'rgba(99,102,241,0)');
                return gradient;
              },
              tension: 0.4,
              fill: true
            },
            {
              label: 'FVG',
              data: [patient.fvg_1, patient.fvg_2, patient.fvg_3],
              borderColor: '#10b981',
              backgroundColor: ctx => {
                const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(16,185,129,0.3)');
                gradient.addColorStop(1, 'rgba(16,185,129,0)');
                return gradient;
              },
              tension: 0.4,
              fill: true
            },
            {
              label: 'DDS Score',
              data: [patient.dds_1, (patient.dds_1 + patient.dds_3) / 2, patient.dds_3],
              borderColor: '#a855f7',
              backgroundColor: 'rgba(216,180,254,0.2)',
              tension: 0.4,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            y: {
              beginAtZero: false,
              title: { display: true, text: 'HbA1c & FVG' },
              position: 'left'
            },
            y1: {
              beginAtZero: true,
              title: { display: true, text: 'DDS' },
              position: 'right',
              grid: { drawOnChartArea: false }
            }
          }
        }
      });
    }
  }, [patient]);

  // Therapy pathline chart
  useEffect(() => {
    if (therapyPathline.length === 3 && pathlineChartRef.current) {
      if (pathlineChartInstanceRef.current) {
        pathlineChartInstanceRef.current.destroy();
      }

      const minProb = Math.min(...therapyPathline);
      const maxProb = Math.max(...therapyPathline);
      const buffer = 0.01;

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
              title: { display: true, text: 'Probability' }
            }
          }
        }
      });
    }
  }, [therapyPathline]);

  if (!patient) return <div className="p-6 text-center">Loading patient data...</div>;

  // Risk values
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

  const parseMarkdown = (text) => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-md font-bold mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white border border-blue-200 rounded-xl p-6 shadow mb-6">
        <h2 className="text-2xl font-bold text-blue-600">{patient.name}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {patient.age} y/o — {patient.gender} · Therapy Effectiveness Summary
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard title="HbA1c Δ (1→2)" value={`${patient.reduction_a_per_day.toFixed(2)} %`} color="indigo" icon="📉" />
        <MetricCard title="HbA1c Reduction" value={`${patient.reduction_a.toFixed(2)} %`} color="blue" icon="💉" />
        <MetricCard title="FVG Δ (1→2)" value={`${patient.fvg_delta_1_2}`} color="green" icon="📊" />
        <MetricCard title="DDS Δ (1→3)" value={`${patient.dds_trend_1_3}`} color="purple" icon="🧠" />
      </div>

      {/* Risk Overview */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-md font-semibold text-gray-800 mb-4">Risk Overview</h3>
        <div className="flex justify-around">
          <Badge label="Complication" value={complicationRisk} />
          <Badge label="Hypo" value={hypoRisk} />
          <Badge label="Adherence" value={medAdherenceRisk} />
        </div>
      </div>

      {/* Therapy Effectiveness Pathline Chart */}
      {therapyPathline.length === 3 && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Therapy Effectiveness Trend</h3>
          <canvas ref={pathlineChartRef}></canvas>
        </div>
      )}

      {/* LLM-Based Insight + Key Numbers */}
      {llmInsight && (
        <div className="p-6 rounded-xl shadow bg-green-50 border-l-4 border-green-500 text-green-900 space-y-6">

          {/* Header */}
          <h4 className="font-semibold text-lg flex items-center gap-2">
            🧠 LLM-Based Insight
          </h4>

          {/* Insights */}
          <div
            className="space-y-2 text-sm"
            dangerouslySetInnerHTML={{
              __html: parseMarkdown(
                llmInsight
                  .replace(/^-\s*/gm, '• ')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              ),
            }}
          />

          {/* Key Numbers */}
          <div>
            <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">📊 Key Numbers</h5>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-indigo-100 rounded-lg p-4">
                <div className="text-xs text-gray-600">HbA1c (1→3)</div>
                <div className="text-lg font-bold text-indigo-700">
                  {patient.hba1c_1st_visit} → {patient.hba1c_3rd_visit}
                </div>
              </div>
              <div className="bg-green-100 rounded-lg p-4">
                <div className="text-xs text-gray-600">FVG (1→3)</div>
                <div className="text-lg font-bold text-green-700">
                  {patient.fvg_1} → {patient.fvg_3}
                </div>
              </div>
              <div className="bg-purple-100 rounded-lg p-4">
                <div className="text-xs text-gray-600">DDS (1→3)</div>
                <div className="text-lg font-bold text-purple-700">
                  {patient.dds_1} → {patient.dds_3}
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">✅ Recommended Next Steps</h5>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Adjust insulin therapy to address inconsistent HbA1c and rising FVG.</li>
              <li>Monitor glycemic patterns closely to guide therapy adjustments.</li>
            </ul>
          </div>
        </div>
      )}

      {/* HbA1c/FVG Chart */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Therapy Trends</h3>
        <canvas ref={chartRef}></canvas>
      </div>

      {/* Mini Timeline */}
      <div className="grid md:grid-cols-3 gap-4">
        <VisitCard visit="Visit 1" hba1c={patient.hba1c_1st_visit} fvg={patient.fvg_1} dds={patient.dds_1} />
        <VisitCard visit="Visit 2" hba1c={patient.hba1c_2nd_visit} fvg={patient.fvg_2} dds={(patient.dds_1 + patient.dds_3) / 2} />
        <VisitCard visit="Visit 3" hba1c={patient.hba1c_3rd_visit} fvg={patient.fvg_3} dds={patient.dds_3} />
      </div>
    </div>
  );
};

// Components
const MetricCard = ({ title, value, color, icon }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700'
  };

  // Format values consistently
  const formattedValue =
    typeof value === "number"
      ? `${value.toFixed(2)} %`
      : value;

  return (
    <div className={`${colorMap[color]} p-4 rounded shadow text-center`}>
      <div className="flex items-center justify-center space-x-2">
        <span className="text-lg">{icon}</span>
        <h4 className="text-xs uppercase font-semibold">{title}</h4>
      </div>
      <p className="text-xl font-bold mt-2">{formattedValue}</p>
    </div>
  );
};


const Badge = ({ label, value }) => {
  const colorMap = {
    High: 'bg-red-100 text-red-700',
    Moderate: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-green-100 text-green-700'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorMap[value]}`}>
      {label}: {value}
    </span>
  );
};

const ComparisonCard = ({ label, start, end, color }) => {
  const improved = end < start;
  const diff = Math.abs(end - start).toFixed(1); // round to 1 decimal place
  return (
    <div className={`bg-${color}-50 p-4 rounded-lg shadow text-center`}>
      <h4 className="font-semibold text-sm text-gray-700">{label}</h4>
      <p className={`text-lg font-bold text-${color}-700 flex items-center justify-center space-x-2`}>
        <span>{start}</span>
        <span>⟶</span>
        <span>{end}</span>
        <span className={improved ? 'text-green-600' : 'text-red-600'}>
          ({improved ? '↓' : '↑'} {diff})
        </span>
      </p>
    </div>
  );
};


const VisitCard = ({ visit, hba1c, fvg, dds }) => (
  <div className="bg-white shadow-md rounded-xl p-5 flex flex-col space-y-3 text-center hover:shadow-lg transition">
    <h5 className="font-bold text-indigo-600">{visit}</h5>

    <div className="flex items-center justify-between bg-indigo-50 px-3 py-2 rounded-md">
      <span className="text-sm font-medium text-gray-600">HbA1c</span>
      <span className="text-indigo-700 font-bold">{hba1c.toFixed(1)}</span>
    </div>

    <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
      <span className="text-sm font-medium text-gray-600">FVG</span>
      <span className="text-green-700 font-bold">{fvg.toFixed(1)}</span>
    </div>

    <div className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded-md">
      <span className="text-sm font-medium text-gray-600">DDS</span>
      <span className="text-purple-700 font-bold">{dds.toFixed(2)}</span>
    </div>
  </div>
);


export default TherapyEffectivenessForm;
