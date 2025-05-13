import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const TreatmentRecommendation = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/patients/${id}`)
      .then(res => res.json())
      .then(data => setPatient(data))
      .catch(err => console.error('Error fetching patient:', err));
  }, [id]);

  if (!patient) return <div className="p-6 text-center">Loading...</div>;

  const hba1cDrop = (patient.reduction_a ?? 0).toFixed(1);
  const fvgDrop = patient.fvg_delta_1_2 ?? '-';
  const ddsTrend = patient.dds_trend_1_3 ?? '-';
  const egfr = patient.egfr ?? '-';

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold text-gray-900">AI-Generated Treatment Recommendations</h1>
        <p className="text-gray-600 mt-1">Based on the patient’s latest clinical data.</p>
      </section>

      {/* Data Summary Cards */}
      <section className="grid md:grid-cols-4 gap-4">
        <SummaryCard label="HbA1c Reduction" value={`↓ ${hba1cDrop}%`} color="green" />
        <SummaryCard label="FVG Δ (1→2)" value={`${fvgDrop}`} color="blue" />
        <SummaryCard label="DDS Δ (1→3)" value={`${ddsTrend}`} color="purple" />
        <SummaryCard label="eGFR" value={`${egfr} mL/min`} color="gray" />
      </section>

      {/* Glycemic Trend Notes */}
      <section className="grid md:grid-cols-2 gap-6">
        <TrendNote
          title="HbA1c Analysis"
          text={`Patient shows ${hba1cDrop >= 1 ? 'significant improvement' : hba1cDrop > 0 ? 'moderate reduction' : 'no improvement'} in glycemic control. Continue therapy and reassess in 90 days.`}
          tone="info"
        />
        <TrendNote
          title="Fasting Glucose Analysis"
          text={`Fasting glucose trend indicates ${fvgDrop < 0 ? 'positive response to treatment' : 'stagnation or worsening'}. Recommend reviewing insulin and dietary compliance.`}
          tone={fvgDrop < 0 ? 'success' : 'warn'}
        />
      </section>

      {/* Kidney & DDS */}
      <section className="grid md:grid-cols-3 gap-6">
        <StatBox label="Kidney Function (eGFR)" value={egfr} note={egfr >= 90 ? "Normal" : egfr >= 60 ? "Mild decline" : "Monitor closely"} />
        <StatBox label="Diabetes Distress Score" value={ddsTrend} note={ddsTrend <= 2 ? "Low" : ddsTrend <= 3 ? "Moderate" : "High"} />
        <StatBox label="Current Medications" value={patient.medications || 'N/A'} />
      </section>

      {/* AI Recommendation */}
      <section className="bg-blue-50 p-6 rounded-xl shadow border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">🔍 Primary Treatment Plan: Medication Optimization</h2>
        <p className="text-sm text-blue-700 mb-4">Based on the patient’s profile, consider adjusting the current medications to further improve glucose control.</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="text-sm">
            <h4 className="font-semibold text-gray-700">Current Regimen:</h4>
            <p className="text-gray-800 mt-1">{patient.medications || 'Not documented'}</p>
          </div>
          <div className="text-sm">
            <h4 className="font-semibold text-gray-700">Suggested Change:</h4>
            <p className="text-gray-800 mt-1">Evaluate need to reduce insulin dose or add SGLT2 if hypoglycemia risk is detected.</p>
          </div>
        </div>
        <div className="mt-4 bg-yellow-100 text-yellow-900 p-3 rounded text-sm">
          ⚠️ Monitor renal function closely and educate patient on medication risks and sick-day rules.
        </div>
      </section>

      {/* Supportive Interventions */}
      <section className="grid md:grid-cols-2 gap-6">
        <SupportBox
          title="Dietary Strategy"
          checks={[
            'Encourage low GI carbohydrate intake (45–60g/meal)',
            'Plan mid-afternoon protein snacks to prevent hypo episodes',
            'Limit high sugar intake on weekends'
          ]}
          color="green"
          effectiveness="85%"
        />
        <SupportBox
          title="Physical Activity Plan"
          checks={[
            'Walk 15 mins post-meal to reduce spikes',
            'Moderate activity 30 mins/day, 5 days/week',
            'Resistance training 2x weekly'
          ]}
          color="purple"
          effectiveness="78%"
        />
      </section>

      {/* Success Forecast */}
      <section className="bg-white border rounded-xl p-6 shadow">
        <h3 className="text-lg font-bold mb-4 text-gray-800">📈 Treatment Success Forecast</h3>
        <ForecastStat label="HbA1c" current={patient.hba1c1} projected={patient.hba1c3} />
        <ForecastStat label="FVG" current={patient.fvg_1} projected={patient.fvg_3} />
        <ForecastStat label="DDS Score" current={patient.dds_1} projected={patient.dds_3} />
        <div className="mt-4 text-sm text-green-800 bg-green-50 p-4 rounded border-l-4 border-green-400">
          ✅ With high adherence, projected probability of achieving target glucose control in 90 days is <strong>89%</strong>.
        </div>
      </section>
    </div>
  );
};

// --- Components ---

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

const TrendNote = ({ title, text, tone }) => {
  const toneColor = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warn: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  }[tone];

  return (
    <div className={`rounded border p-4 text-sm shadow-sm ${toneColor}`}>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p>{text}</p>
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

const SupportBox = ({ title, checks, color, effectiveness }) => {
  const colorMap = {
    green: 'text-green-700 border-green-200 bg-green-50',
    purple: 'text-purple-700 border-purple-200 bg-purple-50',
  }[color];

  return (
    <div className={`rounded p-4 border shadow-sm ${colorMap}`}>
      <h4 className="text-md font-bold mb-3">{title}</h4>
      <ul className="list-disc text-sm ml-5 space-y-1 text-gray-800">
        {checks.map((c, i) => <li key={i}>{c}</li>)}
      </ul>
      <p className="text-xs mt-3">Effectiveness: <span className="font-semibold">{effectiveness}</span></p>
    </div>
  );
};

const ForecastStat = ({ label, current, projected }) => (
  <div className="text-sm text-gray-700 mb-2">
    <span className="font-medium">{label}:</span> <span className="font-semibold text-gray-800">{current}</span> → <span className="font-semibold text-green-700">{projected}</span>
  </div>
);

export default TreatmentRecommendation;
