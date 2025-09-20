import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);
import { useParams } from 'react-router-dom';

const TreatmentRecommendation = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [ragContext, setRagContext] = useState(""); // Add this to state


  useEffect(() => {
    const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://localhost:8000";
    fetch(`${laravelUrl}/api/patients/${id}`)
      .then(res => res.json())
      .then(data => setPatient(data))
      .catch(err => console.error('Error fetching patient:', err));
  }, [id]);

  const generateReport = async () => {
    if (!patient) return;
    setLoading(true);
    try {
      const fastApiUrl = import.meta.env.VITE_FASTAPI_URL || "http://localhost:5000";
      const response = await fetch(`${fastApiUrl}/treatment-recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient,
          question: `
Please analyze the following diabetic patient's data and return a structured treatment report using markdown headers (##) with the following sections:

## Clinical Trend Analysis  
Explain the patient’s recent clinical indicators like HbA1c and FVG trends.

## Risk Interpretation  
Interpret any health risks based on eGFR, DDS, and symptom severity.

## Medication Plan  
Suggest potential medication changes, highlighting insulin regimen if applicable. Include received context from the RAG response.

## Lifestyle & Diet Advice  
Return 4–5 short, bulleted suggestions with action-based phrasing. Use layman’s language.
Each bullet must be concise and directly related to the patient’s context.

## Outcome Forecast  
Forecast future clinical outcomes if current trends continue.

Respond concisely and medically sound.

Instructions:
- Answer only using the provided context.
- Medication Plan should mention specifics only if mentioned in the context (e.g., insulin type like PBD).
- Lifestyle Advice must be short bullets (≤ 15 words per point).
- Do not fabricate or generalize outside of context.
`
        })
      });
      const data = await response.json();
      setAiResponse(data.response);
      setRagContext(data.context || "");
      localStorage.setItem(`report-${id}`, data.response);
    } catch (err) {
      setAiResponse("⚠️ Failed to retrieve AI-generated recommendation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem(`report-${id}`);
    if (cached) {
      setAiResponse(cached);
    }
  }, [id]);

  if (!patient) return <div className="p-6 text-center">Loading patient data...</div>;

  const hba1cDrop = (patient.reduction_a ?? 0).toFixed(1);
  const fvgDrop = patient.fvg_delta_1_2 ?? '-';
  const ddsTrend = patient.dds_trend_1_3 ?? '-';
  const egfr = patient.egfr ?? '-';

  const parseMarkdownBold = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const hba1cForecastChart = {
    labels: ['Now', '30d', '60d', '90d'],
    datasets: [{
      label: 'Projected HbA1c (%)',
      data: [patient?.hba1c_1st_visit ?? 9.1, 8.8, 8.5, 8.2],
      fill: true,
      borderColor: '#facc15',
      backgroundColor: 'rgba(250,204,21,0.2)',
      tension: 0.4
    }]
  };

  const timelineEvents = [
    { date: patient?.first_visit_date, title: 'Initial Visit', icon: '🩺' },
    { date: patient?.second_visit_date, title: 'Insulin Regimen Start', icon: '💉' },
    { date: patient?.third_visit_date, title: 'HbA1c Peak Detected', icon: '📊' },
    { date: 'In 90 days', title: 'Expected Follow-Up', icon: '⏳' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      <div className="bg-indigo-100 border-l-4 border-indigo-500 p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-xl font-bold text-indigo-800">{patient.name}</h1>
            <p className="text-sm text-gray-700">{patient.age} y/o — {patient.gender}</p>
          </div>
          <div className="mt-2 md:mt-0">
            <button
              className="bg-indigo-200 text-indigo-800 text-xs px-3 py-1 rounded border border-indigo-300 hover:bg-indigo-300 transition"
              onClick={generateReport}
              disabled={loading}
            >
              {aiResponse ? "Regenerate Report" : "Generate Report"}
            </button>
          </div>
        </div>
        <p className="text-sm text-indigo-600 mt-2">AI-based treatment insights below</p>
      </div>

      {/* Patient Overview */}
      <section className="grid md:grid-cols-2 gap-6">
        <InfoBox label="Name" value={patient.name} />
        <InfoBox label="Age" value={patient.age} />
        <InfoBox label="Gender" value={patient.gender} />
        <InfoBox label="Insulin Regimen" value={patient.insulin_regimen_type || 'N/A'} />
      </section>

      {/* Data Summary */}
      <section className="grid md:grid-cols-4 gap-4">
        <SummaryCard label="HbA1c Reduction" value={`↓ ${hba1cDrop}%`} color="green" />
        <SummaryCard label="FVG Δ (1→2)" value={`${fvgDrop}`} color="blue" />
        <SummaryCard label="DDS Δ (1→3)" value={`${ddsTrend}`} color="purple" />
        <SummaryCard label="eGFR" value={`${egfr} mL/min`} color="gray" />
      </section>

      {/* Kidney & DDS Cards */}
      <section className="grid md:grid-cols-3 gap-6">
        <StatBox label="Current Medications" value={patient.medications || 'N/A'} />
      </section>

      {/* AI Output */}
      {loading ? (
        <section className="text-center text-blue-600 flex flex-col items-center">
          <div className="text-lg font-medium animate-pulse">Generating treatment report...</div>
          <div className="mt-2 text-sm">⏳ Please wait while our AI analyzes the patient's data</div>
          <div className="mt-4 animate-spin h-8 w-8 border-t-2 border-blue-600 rounded-full"></div>
        </section>
      ) : (
        aiResponse.split(/##\s+/).slice(1).map((section, index) => {
          const [title, ...contentLines] = section.trim().split('\n');
          const content = contentLines.join('\n').trim();
          const lines = content.split(/\n(?=\d+\.|\*|\-)/g).filter(Boolean);

          if (title.toLowerCase().includes("trend")) {
            return (
              <section key={index} className="bg-green-50 border border-green-200 rounded-xl shadow p-6 text-green-900 space-y-4">
                <h2 className="text-lg font-bold mb-2">Clinical Trend Overview</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <TrendCard
                    label="HbA1c Trend"
                    values={[patient.hba1c_1st_visit, patient.hba1c_2nd_visit, patient.hba1c_3rd_visit]}
                    unit="%"
                    warn={patient.hba1c_3rd_visit > patient.hba1c_2nd_visit}
                  />

                  <TrendCard
                    label="FVG Trend"
                    values={[patient.fvg_1, patient.fvg_2, patient.fvg_3]}
                    unit="mmol/L"
                    warn={patient.fvg_3 > patient.fvg_2}
                  />

                  <TrendCard label="HbA1c Δ / 91d" values={[patient.reduction_a?.toFixed(2)]} unit="%" />
                </div>
              </section>
            );
          }

          if (title.toLowerCase().includes("risk")) {
            const riskMap = [
              {
                label: "Complication Risk",
                score: patient.hba1c_1st_visit > 8 ? 80 : patient.hba1c_1st_visit > 7 ? 50 : 20,
                color: "bg-red-500",
                note: patient.hba1c_1st_visit > 8 ? "HbA1c > 8% — elevated long-term complication risk" :
                  patient.hba1c_1st_visit > 7 ? "HbA1c > 7% — moderate glycemic risk" :
                    "HbA1c controlled — lower complication likelihood"
              },
              {
                label: "Kidney Function (eGFR)",
                score: patient.egfr > 90 ? 20 : patient.egfr > 60 ? 50 : 80,
                color: "bg-yellow-400",
                note: patient.egfr > 90 ? "Normal kidney function" :
                  patient.egfr > 60 ? "Mild renal decline — monitor advised" :
                    "Possible CKD — close monitoring required"
              },
              {
                label: "Medication Adherence Risk",
                score: patient.dds_trend_1_3 > 1.5 ? 80 : patient.dds_trend_1_3 > 0.5 ? 50 : 20,
                color: "bg-blue-500",
                note: patient.dds_trend_1_3 > 1.5 ? "High DDS — patient distress may hinder adherence" :
                  patient.dds_trend_1_3 > 0.5 ? "Moderate DDS — support recommended" :
                    "Low DDS — good adherence likelihood"
              }
            ];

            return (
              <section key={index} className="bg-red-50 border border-red-200 rounded-xl shadow p-6 text-red-900 space-y-4">
                <h2 className="text-lg font-bold mb-2">{title.trim()}</h2>
                {riskMap.map((risk, i) => (
                  <div key={i} className="mb-6">
                    <RiskBar label={risk.label} value={risk.score} color={risk.color} />
                    <p className="text-xs text-red-700 mt-1">
                      {risk.label === "Complication Risk" && "Higher HbA1c levels increase the risk of vascular and nerve complications."}
                      {risk.label === "Kidney Function (eGFR)" && "Lower eGFR values may indicate declining kidney health."}
                      {risk.label === "Medication Adherence Risk" && "Elevated DDS scores suggest psychological barriers to adherence."}
                    </p>
                  </div>
                ))}

              </section>
            );
          }


          if (title.toLowerCase().includes("medication")) {
            return (
              <section key={index} className="bg-blue-50 border border-blue-200 rounded-xl shadow p-6 text-blue-900">
                <h2 className="text-lg font-bold mb-2">{title.trim()}</h2>
                <div className="space-y-2 text-sm">
                  {lines.map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span>💊</span>
                      <span dangerouslySetInnerHTML={{ __html: parseMarkdownBold(line.trim()) }} />
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (title.toLowerCase().includes("lifestyle")) {
            return (
              <section key={index} className="bg-purple-50 border border-purple-200 rounded-xl shadow p-6 text-purple-900">
                <h2 className="text-lg font-bold mb-2">{title.trim()}</h2>
                <ul className="grid md:grid-cols-2 gap-2 text-sm list-disc list-inside">
                  {lines.slice(0, 6).map((line, i) => {
                    const cleanLine = line.replace(/^\s*[-*]\s*/, ""); // remove leading "-" or "*"
                    return (
                      <li
                        key={i}
                        className="leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: parseMarkdownBold(cleanLine.trim()) }}
                      />
                    );
                  })}
                </ul>
              </section>
            );
          }

          if (title.toLowerCase().includes("forecast")) {
            return (
              <section key={index} className="bg-yellow-50 border border-yellow-200 rounded-xl shadow p-6 text-yellow-900">
                <h2 className="text-lg font-bold mb-4">📈 {title.trim()}</h2>
                <Line data={hba1cForecastChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                <div className="text-sm whitespace-pre-line leading-relaxed mt-4"
                  dangerouslySetInnerHTML={{ __html: parseMarkdownBold(content) }} />
              </section>
            );
          }

          return (
            <section key={index} className="bg-gray-50 border border-gray-200 shadow rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">{title.trim()}</h2>
              <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseMarkdownBold(content) }} />
            </section>
          );
        })
      )}

      {ragContext && (
        <div className="mt-6 bg-white border border-blue-200 rounded-lg shadow-sm p-4 text-sm">
          <details>
            <summary className="cursor-pointer font-semibold text-blue-700">
              📚 Show AI Context (Medical Book References)
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-gray-700">{ragContext}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

// COMPONENTS
const InfoBox = ({ label, value }) => (
  <div className="bg-gray-50 border border-gray-200 rounded p-4 shadow-sm">
    <h4 className="text-xs font-semibold text-gray-500 uppercase">{label}</h4>
    <p className="text-lg font-bold text-gray-800 mt-1">{value}</p>
  </div>
);

const SummaryCard = ({ label, value, color }) => {
  const bg = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  }[color];

  return (
    <div className={`p-4 rounded shadow-sm border ${bg}`}>
      <h4 className="text-xs uppercase font-semibold">{label}</h4>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
};

const StatBox = ({ label, value, note }) => (
  <div className="bg-gray-50 border border-gray-200 p-4 rounded shadow-sm">
    <h4 className="text-sm text-gray-700 font-semibold">{label}</h4>
    <p className="text-xl font-bold text-gray-900">{value}</p>
    {note && <p className="text-sm text-gray-500 mt-1">{note}</p>}
  </div>
);

const TrendCard = ({ label, values, unit, warn = false }) => {
  let trendIcon = '–';
  let trendText = 'Stable';

  if (values.length >= 3) {
    if (values[2] > values[1]) {
      trendIcon = '📈';
      trendText = 'Increasing';
    } else if (values[2] < values[1]) {
      trendIcon = '📉';
      trendText = 'Decreasing';
    }
  }

  const boxClass = warn
    ? "bg-red-100 border border-red-300 text-red-800"
    : "bg-white border border-green-100 text-green-700";

  return (
    <div className={`${boxClass} p-4 rounded shadow-sm text-center`}>
      <h4 className="text-xs uppercase font-semibold">{label}</h4>
      <p className="text-xl font-bold">{values.join(" → ")} {unit}</p>
      <p className="text-sm mt-1">{trendIcon} {trendText}</p>
    </div>
  );
};

const RiskBar = ({ label, value, color }) => (
  <div className="mb-4">
    <div className="flex justify-between text-sm font-medium">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-2 ${color} rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export default TreatmentRecommendation;
