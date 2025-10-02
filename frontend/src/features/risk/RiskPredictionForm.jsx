import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { patientsApi } from '../../api/patients';
import { fastApiClient } from '../../api/client';
import MetricBox from '../../components/MetricBox.jsx';

function RiskPredictionForm() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // initial page skeleton only
  const [riskStale, setRiskStale] = useState(false);
  const pollAttemptsRef = useRef(0);
  const [patientData, setPatientData] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPatientAndPredict() {
      try {
        const data = await patientsApi.getById(id);
        if (cancelled) return;
        setPatientData(data);

        const features = [
          parseFloat(data.hba1c_1st_visit),
          parseFloat(data.hba1c_2nd_visit),
          parseFloat(data.fvg_1),
          parseFloat(data.fvg_2),
          parseFloat(data.avg_fvg_1_2),
          parseFloat(data.reduction_a)
        ];

        if (features.some(val => isNaN(val))) {
          setError('Invalid or missing input data.');
          setLoading(false); // stop page skeleton
          return;
        }

        // Show page immediately; risk fetch runs in background
        setLoading(false);

        const doFetchRisk = async () => {
          if (cancelled) return;
          const predictionRes = await fastApiClient.post('/risk-dashboard?force=false', {
            features,
            patient_id: Number(id),
            model_version: 'risk_v1',
            patient: data,
          });
          if (cancelled) return;
          const numericRisk = parseFloat(predictionRes.data.prediction);
          const riskLabel = predictionRes.data.risk_label || mapNumericRisk(numericRisk);
          const riskColor = getRiskColor(riskLabel);
          setResult({ value: numericRisk.toFixed(2), label: riskLabel, color: riskColor, raw: numericRisk });
          setLastUpdated(new Date().toLocaleString());
          const stale = Boolean(predictionRes.data.stale);
          setRiskStale(stale);
          if (stale && pollAttemptsRef.current < 10) {
            pollAttemptsRef.current += 1;
            setTimeout(doFetchRisk, 1200);
          } else if (!stale) {
            pollAttemptsRef.current = 0;
          }
        };

        // initial risk fetch (non-blocking)
        doFetchRisk();
      } catch (err) {
        setError('Failed to fetch or predict.');
        setLoading(false);
      }
    }

    fetchPatientAndPredict();
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  const mapNumericRisk = (val) => {
    if (val < 5.7) return 'Normal';
    if (val < 6.5) return 'At Risk';
    if (val < 7.1) return 'Moderate Risk';
    if (val < 8.1) return 'Risky';
    if (val <= 9.0) return 'Very Risky';
    return 'Critical';
  };

  // UI color tokens for ring + text + bg
  const getRiskColor = (label) => {
    switch (label) {
      case 'Normal': return 'ring-emerald-400 text-emerald-700 bg-emerald-50';
      case 'At Risk': return 'ring-amber-300 text-amber-700 bg-amber-50';
      case 'Moderate Risk': return 'ring-amber-400 text-amber-800 bg-amber-50';
      case 'Risky': return 'ring-orange-400 text-orange-800 bg-orange-50';
      case 'Very Risky': return 'ring-rose-400 text-rose-700 bg-rose-50';
      case 'Critical': return 'ring-rose-600 text-rose-800 bg-rose-50';
      default: return 'ring-gray-300 text-gray-700 bg-gray-50';
    }
  };

  const riskStops = [
    { label: 'Normal', min: 4.0, max: 5.7, color: 'bg-emerald-500' },
    { label: 'At Risk', min: 5.7, max: 6.5, color: 'bg-amber-400' },
    { label: 'Moderate', min: 6.5, max: 7.1, color: 'bg-amber-500' },
    { label: 'Risky', min: 7.1, max: 8.1, color: 'bg-orange-500' },
    { label: 'Very', min: 8.1, max: 9.0, color: 'bg-rose-500' },
    { label: 'Critical', min: 9.0, max: 10.0, color: 'bg-rose-700' }
  ];

  const gaugePercent = useMemo(() => {
    if (!result?.raw) return 0;
    // map ~4.0–10.0 to 0–100%
    const clamped = Math.max(4.0, Math.min(10.0, result.raw));
    return ((clamped - 4.0) / (10.0 - 4.0)) * 100;
  }, [result]);

  const keyFactors = useMemo(() => {
    if (!patientData) return [];
    const list = [];

    if (patientData.hba1c_1st_visit > 8) {
      list.push(`High initial HbA1c (${patientData.hba1c_1st_visit}%)`);
    } else if (patientData.hba1c_1st_visit < 5.7) {
      list.push(`Normal initial HbA1c (${patientData.hba1c_1st_visit}%)`);
    }

    if (patientData.fvg_1 > 130) {
      list.push(`Elevated FVG @ V1 (${patientData.fvg_1} mg/dL)`);
    }

    if (patientData.reduction_a_per_day < 0.01) {
      list.push(`Low daily HbA1c drop (${patientData.reduction_a_per_day?.toFixed(3)})`);
    }

    if (patientData.fvg_delta_1_2 > 0) {
      list.push(`FVG increase between visits (+${patientData.fvg_delta_1_2})`);
    }

    return list.slice(0, 6);
  }, [patientData]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-14 bg-gradient-to-r from-teal-300 to-green-300/70 rounded-xl" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-48 bg-white/80 rounded-xl shadow border border-gray-100" />
            <div className="col-span-2 space-y-6">
              <div className="h-40 bg-white/80 rounded-xl shadow border border-gray-100" />
              <div className="h-40 bg-white/80 rounded-xl shadow border border-gray-100" />
            </div>
          </div>
          <div className="h-40 bg-white/80 rounded-xl shadow border border-gray-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header with status pill */}
      <header className="bg-gradient-to-r from-teal-500 to-green-600 text-white py-6 px-8 rounded-xl shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Complication Risk Assessment</h2>
          <p className="text-sm text-indigo-100">Predictions based on HbA1c, FVG, and therapy indicators</p>
          {lastUpdated && (
            <p className="text-[11px] text-white/80 mt-1">Last updated: {lastUpdated}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setError(null); setReloadKey(k=>k+1); pollAttemptsRef.current = 0; }}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md border border-white/20"
            title="Refresh prediction"
          >
            ↻ Refresh
          </button>
          {result?.label && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ring-2 ${result.color}`}>
              {result.label}
            </span>
          )}
        </div>
      </header>

      {/* KPI Tiles */}
      <KpiRow
        h1={Number(patientData?.hba1c_1st_visit)}
        h2={Number(patientData?.hba1c_2nd_visit)}
        f1={Number(patientData?.fvg_1)}
        f2={Number(patientData?.fvg_2)}
      />

      {/* Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Patient Card */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100 space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">{patientData?.name}</h3>
          <p className="text-sm text-gray-600">{patientData?.gender}, {patientData?.age} y/o</p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Insulin Type:</span> {patientData?.insulin_regimen_type || '—'}
          </p>
          <div className="text-xs text-gray-600 bg-gray-50 rounded p-3 border border-gray-200">
            <p className="mb-2">
              <span className="font-semibold">Medical History:</span><br />
              {patientData?.medicalHistory || '—'}
            </p>
            <p>
              <span className="font-semibold">Medications:</span><br />
              {patientData?.medications || '—'}
            </p>
          </div>
        </div>

        {/* Metric grids */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <IconChart /> Glycemic Metrics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <MetricBox label="HbA1c (1st)" value={patientData?.hba1c_1st_visit} />
              <MetricBox label="HbA1c (2nd)" value={patientData?.hba1c_2nd_visit} />
              <MetricBox label="FVG (1st)" value={patientData?.fvg_1} />
              <MetricBox label="FVG (2nd)" value={patientData?.fvg_2} />
            </div>
            {/* Trends */}
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <TrendCard
                title="HbA1c Trend"
                start={Number(patientData?.hba1c_1st_visit)}
                end={Number(patientData?.hba1c_2nd_visit)}
                min={4}
                max={12}
                targetLow={4.5}
                targetHigh={6.5}
                color="#0ea5e9"
              />
              <TrendCard
                title="FVG Trend"
                start={Number(patientData?.fvg_1)}
                end={Number(patientData?.fvg_2)}
                min={60}
                max={250}
                targetLow={80}
                targetHigh={130}
                color="#10b981"
              />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <IconActivity /> Treatment Trends
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <MetricBox label="HbA1c Δ" value={patientData?.reduction_a?.toFixed(1)} />
              <MetricBox label="Daily HbA1c Drop" value={patientData?.reduction_a_per_day?.toFixed(3)} />
              <MetricBox label="FVG Δ" value={patientData?.fvg_delta_1_2} />
              <MetricBox label="Avg FVG" value={patientData?.avg_fvg_1_2} />
            </div>
          </div>
        </div>
      </div>

      {/* Prediction block */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <div className="grid md:grid-cols-3 gap-6 items-center">
          {/* Gauge */}
          <div className="flex flex-col items-center">
            <RiskGauge value={gaugePercent} label={result?.value} ringClass={result?.color} />
          </div>

          {/* Scale bar + category */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between text-[11px] text-gray-600 mb-2">
              <span>Low</span><span>High</span>
            </div>
            <RiskScale percent={gaugePercent} stops={riskStops} />
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-600">Category:</span>
              <span className={`font-semibold px-2 py-0.5 rounded-full ring-2 ${result?.color}`}>
                {result?.label}
              </span>
              {riskStale && (
                <span className="text-[11px] text-gray-500">Updating…</span>
              )}
            </div>

            {/* Insight chips */}
            {keyFactors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><IconBulb /> Key Factors</h4>
                <KeyFactorChips items={keyFactors} />
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        This assessment is powered by AI. Use clinical judgment alongside predictions for decision-making.
      </p>
    </div>
  );
}

/* ------- Presentation Components (no extra deps) ------- */

function RiskGauge({ value = 0, label = '—', ringClass = '' }) {
  // semicircle gauge (SVG) with perfectly aligned center circle drawn inside SVG
  const pad = 12;
  const radius = 80;
  const width = radius * 2 + pad * 2;  // 184
  const height = radius + pad * 2;     // 104
  const cx = pad + radius;             // 70
  const cy = pad + radius;             // 70 (center of circle)
  const circumference = Math.PI * radius; // half circle length
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (circumference * clamped) / 100;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block mx-auto">
      <defs>
        <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>

      {/* track */}
      <path
        d={`M${pad},${cy} A ${radius},${radius} 0 0 1 ${width-pad},${cy}`}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* progress */}
      <path
        d={`M${pad},${cy} A ${radius},${radius} 0 0 1 ${width-pad},${cy}`}
        fill="none"
        stroke="url(#riskGrad)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />

      {/* center value circle and text (fine-tuned for visual centering within arc) */}
      <g className={ringClass}>
        <circle cx={cx} cy={cy - radius * 0.43} r={26} fill="#ffffff" stroke="currentColor" strokeWidth="4" />
        <text x={cx} y={cy - radius * 0.43 + 0.5} textAnchor="middle" dominantBaseline="middle" className="text-[16px] font-bold" fill="currentColor">
          {label}
        </text>
      </g>
    </svg>
  );
}

function RiskScale({ percent = 0, stops = [] }) {
  return (
    <div className="relative">
      <div className="flex w-full h-3 rounded-full overflow-hidden">
        {stops.map((s, i) => (
          <div key={i} className={`flex-1 ${s.color}`} />
        ))}
      </div>
      {/* indicator */}
      <div
        className="absolute -top-1 -translate-x-1/2"
        style={{ left: `calc(${percent}% + 0.5px)` }}
      >
        <div className="w-0 h-0 border-l-6 border-r-6 border-b-8 border-transparent border-b-gray-700 mx-auto" />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>5.0</span>
        <span>6.0</span>
        <span>7.0</span>
        <span>8.0</span>
        <span>9.0</span>
        <span>10+</span>
      </div>
    </div>
  );
}

/* ------- KPI tiles ------- */
function KpiRow({ h1, h2, f1, f2 }) {
  const dH = isFinite(h1) && isFinite(h2) ? (h2 - h1) : null;
  const dF = isFinite(f1) && isFinite(f2) ? (f2 - f1) : null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <KpiTile label="HbA1c (1st)" value={h1} unit="%" tint="bg-emerald-50" />
      <KpiTile label="HbA1c (2nd)" value={h2} unit="%" delta={dH} goodDown tint="bg-emerald-50" />
      <KpiTile label="FVG (1st)" value={f1} unit="mg/dL" tint="bg-sky-50" />
      <KpiTile label="FVG (2nd)" value={f2} unit="mg/dL" delta={dF} goodDown tint="bg-sky-50" />
    </div>
  );
}

function KpiTile({ label, value, unit = '', delta = null, goodDown = false, tint = 'bg-gray-50' }) {
  const fmt = (v) => (v == null || Number.isNaN(v) ? '—' : Number(v).toFixed(2));
  const better = goodDown ? (delta ?? 0) < 0 : (delta ?? 0) > 0;
  const worsen = goodDown ? (delta ?? 0) > 0 : (delta ?? 0) < 0;
  const deltaColor = delta == null ? 'text-gray-500' : better ? 'text-emerald-600' : worsen ? 'text-rose-600' : 'text-amber-600';
  const deltaIcon = delta == null ? '' : better ? '▼' : worsen ? '▲' : '■';
  return (
    <div className={`rounded-xl border border-gray-100 shadow p-4 ${tint}`}>
      <div className="text-xs font-medium text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold tabular-nums text-gray-800">
        {fmt(value)}{unit && <span className="text-base font-semibold text-gray-500 ml-1">{unit}</span>}
      </div>
      {delta != null && (
        <div className={`text-xs font-semibold mt-1 ${deltaColor}`}>{deltaIcon} {fmt(Math.abs(delta))}{unit}</div>
      )}
    </div>
  );
}

/* ------- Trend card with inline sparkline ------- */
function TrendCard({ title, start, end, min, max, targetLow, targetHigh, color = '#0ea5e9' }) {
  const data = [start, end];
  const w = 260; const h = 64; const pad = 10;
  const xs = (i) => pad + (i * (w - 2 * pad)) / Math.max(1, data.length - 1);
  const norm = (v, lo, hi) => (v - lo) / Math.max(1e-6, (hi - lo));
  const ys = (v) => h - pad - norm(v, min, max) * (h - 2 * pad);
  const path = data.map((v, i) => `${i ? 'L' : 'M'} ${xs(i)} ${ys(v)}`).join(' ');
  const delta = (isFinite(end) && isFinite(start)) ? (end - start) : null;
  const goodDown = title.includes('HbA1c') || title.includes('FVG');
  const better = goodDown ? (delta ?? 0) < 0 : (delta ?? 0) > 0;
  const badge = better ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-gray-700 flex items-center gap-2"><IconChartMini /> {title}</div>
        {delta != null && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badge}`}>{delta > 0 ? '+' : ''}{delta.toFixed(2)}</span>
        )}
      </div>
      <svg width={w} height={h} className="overflow-visible">
        {/* target band */}
        {isFinite(targetLow) && isFinite(targetHigh) && (
          <rect x={pad} y={ys(targetHigh)} width={w - 2 * pad} height={Math.max(6, ys(targetLow) - ys(targetHigh))} fill="#ecfeff" stroke="#bae6fd" strokeWidth="1" rx="4" />
        )}
        <polyline fill="none" stroke="#e5e7eb" strokeWidth="2" points={`${pad},${h - pad} ${w - pad},${h - pad}`} />
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        {data.map((v, i) => (
          <circle key={i} cx={xs(i)} cy={ys(v)} r="3" fill="white" stroke={color} strokeWidth="2" />
        ))}
      </svg>
      <div className="mt-1 text-[11px] text-gray-500">{start} → {end} (target {targetLow}–{targetHigh})</div>
    </div>
  );
}

/* ------- Key factor chips ------- */
function KeyFactorChips({ items = [] }) {
  const tone = (t) => {
    const s = String(t).toLowerCase();
    if (s.includes('high') || s.includes('elevated') || s.includes('increase')) return 'bg-rose-50 text-rose-800 border border-rose-200';
    if (s.includes('normal') || s.includes('within') || s.includes('good')) return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
    if (s.includes('low daily') || s.includes('low drop')) return 'bg-rose-50 text-rose-800 border border-rose-200';
    return 'bg-amber-50 text-amber-800 border border-amber-200';
  };
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t, i) => (
        <span key={i} className={`text-xs px-2 py-1 rounded-full ${tone(t)}`}>{t}</span>
      ))}
    </div>
  );
}

/* ------- Icons ------- */
function IconChart(props) { return (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 3v18h18"/><path d="M7 13l3-3 4 4 6-6"/>
  </svg>
);} 
function IconActivity(props) { return (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);} 
function IconBulb(props) { return (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 18h6"/><path d="M10 22h4"/><path d="M2 10a10 10 0 1 1 20 0c0 3.5-2 5.5-3.5 7.5-.4.5-.5 1-.5 1.5H6c0-.5-.1-1-.5-1.5C4 15.5 2 13.5 2 10z"/>
  </svg>
);} 
function IconChartMini(props) { return (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 3v18h18"/><path d="M7 14l4-4 6 6"/>
  </svg>
);} 

export default RiskPredictionForm;
