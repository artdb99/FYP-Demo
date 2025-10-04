import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { patientsApi } from '@/api/patients';

const TherapyEffectivenessForm = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const pathlineChartRef = useRef(null);
  const pathlineChartInstanceRef = useRef(null);
  const [therapyPathline, setTherapyPathline] = useState([]);
  const [llmInsight, setLlmInsight] = useState('');

  useEffect(() => {
    patientsApi.getById(id).then(setPatient).catch(err => console.error('Error:', err));
  }, [id]);

  useEffect(() => {
    if (patient) {
      const fastApiUrl = import.meta.env.VITE_FASTAPI_URL || 'http://127.0.0.1:5000';
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          setTherapyPathline(data.probabilities);
          setLlmInsight(data.insight);
        })
        .catch((err) => console.error('Prediction error:', err));
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
              backgroundColor: (ctx) => {
                const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(99,102,241,0.3)');
                gradient.addColorStop(1, 'rgba(99,102,241,0)');
                return gradient;
              },
              tension: 0.4,
              fill: true,
            },
            {
              label: 'FVG',
              data: [patient.fvg_1, patient.fvg_2, patient.fvg_3],
              borderColor: '#10b981',
              backgroundColor: (ctx) => {
                const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(16,185,129,0.3)');
                gradient.addColorStop(1, 'rgba(16,185,129,0)');
                return gradient;
              },
              tension: 0.4,
              fill: true,
            },
            {
              label: 'DDS Score',
              data: [patient.dds_1, (patient.dds_1 + patient.dds_3) / 2, patient.dds_3],
              borderColor: '#a855f7',
              backgroundColor: 'rgba(216,180,254,0.2)',
              tension: 0.4,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            y: { beginAtZero: false, title: { display: true, text: 'HbA1c & FVG' }, position: 'left' },
            y1: { beginAtZero: true, title: { display: true, text: 'DDS' }, position: 'right', grid: { drawOnChartArea: false } },
          },
        },
      });
    }
  }, [patient]);

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
          datasets: [
            {
              label: 'Therapy Effectiveness Probability',
              data: therapyPathline,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59,130,246,0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: { min: Math.max(0, minProb - buffer), max: Math.min(1, maxProb + buffer), title: { display: true, text: 'Probability' } },
          },
        },
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

  const parseMarkdown = (text) =>
    text
      .replace(/^### (.*$)/gim, '<h3 class="text-md font-bold mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return (
    <div className="w-full px-6 md:px-10 lg:px-14 py-10 space-y-10">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-3xl bg-gradient-to-br from-white via-indigo-50 to-purple-100 ring-1 ring-indigo-100/70 shadow-xl px-6 sm:px-8 py-8 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <span className="text-xl">💊</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-400">Therapy intelligence</p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Therapy Effectiveness Review</h1>
                <p className="text-xs text-indigo-400 mt-1">{patient.age} y/o · {patient.gender}</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 text-xs text-slate-500">
              <div className="rounded-xl bg-white/80 border border-white/60 px-4 py-3 shadow-sm">
                <p className="uppercase tracking-[0.2em] text-[11px] text-slate-400">Insulin regimen</p>
                <p className="text-sm font-semibold text-slate-800">{patient.insulin_regimen_type || 'Not specified'}</p>
              </div>
              <div className="rounded-xl bg-white/80 border border-white/60 px-4 py-3 shadow-sm">
                <p className="uppercase tracking-[0.2em] text-[11px] text-slate-400">Predicted pathway</p>
                <p className="text-sm font-semibold text-slate-800">{therapyPathline.length ? `${Math.round((therapyPathline[2] ?? 0) * 100)}% at visit 3` : 'Loading…'}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric label="HbA1c Δ (1→2)" value={typeof patient.reduction_a_per_day === 'number' ? `${patient.reduction_a_per_day.toFixed(3)}% / day` : '—'} tone="indigo" />
            <SummaryMetric label="HbA1c reduction" value={typeof patient.reduction_a === 'number' ? `${patient.reduction_a.toFixed(1)}%` : '—'} tone="blue" />
            <SummaryMetric label="FVG Δ (1→2)" value={patient.fvg_delta_1_2 ?? '—'} tone="emerald" />
            <SummaryMetric label="DDS Δ (1→3)" value={patient.dds_trend_1_3 ?? '—'} tone="purple" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-xs text-slate-600">
            <RiskChip label="Complication" value={complicationRisk} />
            <RiskChip label="Hypoglycemia" value={hypoRisk} />
            <RiskChip label="Adherence" value={medAdherenceRisk} />
          </div>

          {therapyPathline.length === 3 && (
            <div className="rounded-2xl bg-white/80 border border-white/70 px-4 sm:px-6 py-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Therapy effectiveness trajectory</h3>
              <canvas ref={pathlineChartRef} className="max-h-[260px]"></canvas>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white shadow-md ring-1 ring-black/5 px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Therapy summary</h3>
            <span className="text-xs text-slate-400">Powered by LLM insights</span>
          </div>

          {llmInsight ? (
            <div className="space-y-4 text-sm text-slate-600">
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <InsightStat title="Pathline probability" value={`${Math.round((therapyPathline[therapyPathline.length - 1] ?? 0) * 100)}%`} tone="emerald" />
                <InsightStat title="Complication risk" value={complicationRisk} tone="rose" />
                <InsightStat title="Adherence signal" value={medAdherenceRisk} tone="purple" />
              </div>

              <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-4 py-3">
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 mb-2">Summary</h4>
                <div className="space-y-2" dangerouslySetInnerHTML={{ __html: parseMarkdown(llmInsight.replace(/^\-\s*/gm, '• ').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')) }} />
              </div>

              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <InsightStat title="HbA1c (1→3)" value={`${patient.hba1c_1st_visit ?? '—'} → ${patient.hba1c_3rd_visit ?? '—'}`} tone="indigo" />
                <InsightStat title="FVG (1→3)" value={`${patient.fvg_1 ?? '—'} → ${patient.fvg_3 ?? '—'}`} tone="emerald" />
                <InsightStat title="DDS (1→3)" value={`${patient.dds_1 ?? '—'} → ${patient.dds_3 ?? '—'}`} tone="purple" />
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">Recommended actions</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Validate insulin regimen fit versus glycemic response trajectory.',
                    'Increase behavioural support to reduce DDS-related adherence risk.',
                    'Schedule follow-up analytics review in 4 weeks.',
                  ].map((action, idx) => (
                    <ActionChip key={idx} text={action} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-4 text-xs text-slate-500">
              Generating treatment insight…
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl bg-white shadow-md ring-1 ring-black/5 px-6 py-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-700">Visit snapshots</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <VisitCard visit="Visit 1" hba1c={patient.hba1c_1st_visit} fvg={patient.fvg_1} dds={patient.dds_1} />
            <VisitCard visit="Visit 2" hba1c={patient.hba1c_2nd_visit} fvg={patient.fvg_2} dds={(patient.dds_1 + patient.dds_3) / 2} />
            <VisitCard visit="Visit 3" hba1c={patient.hba1c_3rd_visit} fvg={patient.fvg_3} dds={patient.dds_3} />
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-md ring-1 ring-black/5 px-6 py-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Therapy metric trends</h3>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        Therapy intelligence is AI-assisted. Apply clinical judgment before adjusting care plans.
      </p>
    </div>
  );
};

const SummaryMetric = ({ label, value, tone = 'indigo' }) => {
  const toneMap = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };
  return (
    <div className={`rounded-2xl border ${toneMap[tone] || toneMap.indigo} px-4 py-3 shadow-sm`}> 
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-inherit">{value}</p>
    </div>
  );
};

const RiskChip = ({ label, value }) => {
  const palette = {
    High: 'bg-rose-50 text-rose-600 border border-rose-100',
    Moderate: 'bg-amber-50 text-amber-600 border border-amber-100',
    Low: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  };
  return (
    <div className={`rounded-full px-3 py-1 text-xs font-semibold flex items-center justify-between ${palette[value] || 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
      <span className="uppercase tracking-[0.2em] text-[10px] mr-2 text-slate-400">{label}</span>
      <span>{value}</span>
    </div>
  );
};

const InsightStat = ({ title, value, tone = 'indigo' }) => {
  const toneMap = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return (
    <div className={`rounded-xl border ${toneMap[tone] || toneMap.indigo} px-4 py-3 text-center shadow-sm`}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm font-semibold text-inherit">{value}</p>
    </div>
  );
};

const ActionChip = ({ text }) => (
  <span className="inline-flex items-start text-left text-xs leading-snug px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 shadow-sm max-w-[260px]">
    {text}
  </span>
);

const VisitCard = ({ visit, hba1c, fvg, dds }) => (
  <div className="bg-white shadow-md rounded-xl p-5 flex flex-col space-y-3 text-center hover:shadow-lg transition">
    <h5 className="font-bold text-indigo-600">{visit}</h5>
    <div className="flex items-center justify-between bg-indigo-50 px-3 py-2 rounded-md">
      <span className="text-sm font-medium text-gray-600">HbA1c</span>
      <span className="text-indigo-700 font-bold">{typeof hba1c === 'number' ? hba1c.toFixed(1) : '—'}</span>
    </div>
    <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
      <span className="text-sm font-medium text-gray-600">FVG</span>
      <span className="text-green-700 font-bold">{typeof fvg === 'number' ? fvg.toFixed(1) : '—'}</span>
    </div>
    <div className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded-md">
      <span className="text-sm font-medium text-gray-600">DDS</span>
      <span className="text-purple-700 font-bold">{typeof dds === 'number' ? dds.toFixed(2) : '—'}</span>
    </div>
  </div>
);

export default TherapyEffectivenessForm;
