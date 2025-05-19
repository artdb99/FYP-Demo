import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const TreatmentRecommendation = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [aiResponse, setAiResponse] = useState("Loading AI-generated treatment report...");
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetch(`http://localhost:8000/api/patients/${id}`)
      .then(res => res.json())
      .then(data => setPatient(data))
      .catch(err => console.error('Error fetching patient:', err));
  }, [id]);

  useEffect(() => {
    if (patient) {
      const fetchAIReport = async () => {
        try {
          setLoading(true);
          const response = await fetch("http://localhost:5000/treatment-recommendation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patient,
              question: `Patient data:\n${JSON.stringify(patient, null, 2)}\n\nPlease provide a treatment report broken into the following sections using markdown headers (##):

1. Clinical Trend Analysis
2. Risk Interpretation
3. Medication Plan
4. Lifestyle & Diet Advice
5. Outcome Forecast

Keep responses medically sound and readable.`

            })
          });
          const data = await response.json();
          setAiResponse(data.response);
        } catch (err) {
          console.error("AI fetch error:", err);
          setAiResponse("⚠️ Failed to retrieve AI-generated recommendation.");
        } finally {
          setLoading(false);
        }
      };

      fetchAIReport();
    }
  }, [patient]);

  if (!patient) return <div className="p-6 text-center">Loading patient data...</div>;

  const hba1cDrop = (patient.reduction_a ?? 0).toFixed(1);
  const fvgDrop = patient.fvg_delta_1_2 ?? '-';
  const ddsTrend = patient.dds_trend_1_3 ?? '-';
  const egfr = patient.egfr ?? '-';

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold text-gray-900">🧠 AI Treatment Recommendation</h1>
        <p className="text-gray-600 mt-1">This report was generated using your latest health indicators.</p>
      </section>

      {/* Patient Overview */}
      <section className="grid md:grid-cols-2 gap-6">
        <InfoBox label="Name" value={patient.name} />
        <InfoBox label="Age" value={patient.age} />
        <InfoBox label="Gender" value={patient.gender} />
        <InfoBox label="Insulin Regimen" value={patient.insulin_regimen_type || 'N/A'} />
      </section>

      {/* Data Summary Cards */}
      <section className="grid md:grid-cols-4 gap-4">
        <SummaryCard label="HbA1c Reduction" value={`↓ ${hba1cDrop}%`} color="green" />
        <SummaryCard label="FVG Δ (1→2)" value={`${fvgDrop}`} color="blue" />
        <SummaryCard label="DDS Δ (1→3)" value={`${ddsTrend}`} color="purple" />
        <SummaryCard label="eGFR" value={`${egfr} mL/min`} color="gray" />
      </section>

      {/* Kidney & DDS */}
      <section className="grid md:grid-cols-3 gap-6">
        <StatBox label="Kidney Function (eGFR)" value={egfr} note={egfr >= 90 ? "Normal" : egfr >= 60 ? "Mild decline" : "Monitor closely"} />
        <StatBox label="Diabetes Distress Score" value={ddsTrend} note={ddsTrend <= 2 ? "Low" : ddsTrend <= 3 ? "Moderate" : "High"} />
        <StatBox label="Current Medications" value={patient.medications || 'N/A'} />
      </section>

        {loading ? (
          <section className="flex flex-col justify-center items-center h-40">
            <div className="animate-pulse text-blue-600 text-sm text-center">
          <div className="text-lg font-medium">Generating treatment report...</div>
          <div className="mt-2">⏳ Please wait while our AI analyzes the patient's data</div>
            </div>
            <div className="h-3" />
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 border-opacity-50"></div>
          </section>
        ) : (
          aiResponse.split(/##\s+/).slice(1).map((section, index) => {
          const [title, ...content] = section.split('\n');
          return (
            <section key={index} className="bg-white border border-blue-200 shadow rounded-xl p-6">
              <h2 className="text-lg font-bold text-blue-800 mb-2">{title.trim()}</h2>
              <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                {content.join('\n').trim()}
              </p>
            </section>
          );
        })
      )}

    </div>
  );
};

// --- Components ---

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

export default TreatmentRecommendation;
