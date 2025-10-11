import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { patientsApi } from '../../api/patients';
import { fastApiClient } from '../../api/client';
import MetricBox from '../../components/MetricBox.jsx';
import Card from '../../components/Card.jsx';
import { LineChart, Activity as ActivityIcon, Lightbulb, TrendingUp } from 'lucide-react';

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
          // 1) Try Laravel DB first for instant UI
          const apiBase = (import.meta.env.VITE_LARAVEL_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
          try {
            const pRes = await fetch(`${apiBase}/api/patients/${id}`);
            if (pRes.ok) {
              const p = await pRes.json();
              if (p && p.last_risk_score != null) {
                const numericRisk = parseFloat(p.last_risk_score);
                const riskLabel = p.last_risk_label || mapNumericRisk(numericRisk);
                const riskColor = getRiskColor(riskLabel);
                setResult({ value: numericRisk.toFixed(2), label: riskLabel, color: riskColor, raw: numericRisk });
                setLastUpdated(p.last_predicted_at ? new Date(p.last_predicted_at).toLocaleString() : new Date().toLocaleString());
                setRiskStale(false);
                pollAttemptsRef.current = 0;
                return; // Served from DB cache; skip FastAPI
              }
            }
          } catch (_) {
            // ignore, fall through to FastAPI
          }

          // 2) No DB value yet -> compute via FastAPI
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
          const isCached = Boolean(predictionRes.data.cached);
          
          setResult({ value: numericRisk.toFixed(2), label: riskLabel, color: riskColor, raw: numericRisk });
          setLastUpdated(new Date().toLocaleString());
          setRiskStale(false); // No longer using stale logic
          
          // Persist to Laravel if this was a fresh calculation (not cached)
          if (!isCached && Number.isFinite(numericRisk)) {
            console.log('💾 Saving risk to Laravel database...', {
              patient_id: id,
              score: numericRisk,
              label: riskLabel,
            });
            try {
              const saveResponse = await fetch(`${apiBase}/api/patients/${id}/risk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  score: numericRisk,
                  label: riskLabel,
                  model_version: predictionRes.data.model_version || 'risk_v1',
                  predicted_at: new Date().toISOString(),
                }),
              });
              
              if (!saveResponse.ok) {
                const errorText = await saveResponse.text();
                console.error('❌ Laravel save failed:', saveResponse.status, errorText);
              } else {
                const saveData = await saveResponse.json();
                console.log('✅ Risk saved to database:', saveData);
              }
            } catch (e) {
              console.error('❌ Failed to persist risk to Laravel:', e);
            }
          } else if (isCached) {
            console.log('✅ Risk loaded from database cache (patient_id:', id, ')');
          }
          
          pollAttemptsRef.current = 0;
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
    <div className="w-full px-6 md:px-10 lg:px-14 py-10 space-y-10">
      <Card className="rounded-3xl bg-gradient-to-br from-white via-rose-50 to-rose-100 ring-1 ring-rose-100/70 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <LineChart size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-rose-400">Patient risk insight</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Complication Risk Assessment</h1>
              {lastUpdated && (
                <p className="text-[11px] text-rose-400 mt-1">Last updated: {lastUpdated}</p>
              )}
            </div>
          </div>
          {result?.label && (
            <span className={`self-start text-xs font-semibold px-3 py-1 rounded-full ring-2 ${result.color}`}>
              {result.label}
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white/80 ring-1 ring-white/70 shadow-inner px-6 py-6">
            <RiskGauge value={gaugePercent} label={result?.value} ringClass={result?.color} />
            <p className="mt-4 text-xs text-slate-500 text-center">Model score mapped across low to critical thresholds.</p>
          </div>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
              <div className="rounded-xl bg-white/70 border border-white/80 px-4 py-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Patient</p>
                <p className="text-sm font-semibold text-slate-800">{patientData?.name}</p>
                <p className="text-xs text-slate-500">{patientData?.gender}, {patientData?.age} y/o</p>
              </div>
              <div className="rounded-xl bg-white/70 border border-white/80 px-4 py-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Risk status</p>
                <p className="text-sm font-semibold text-slate-800">{result?.label ?? 'Pending'}</p>
                {riskStale && <p className="text-xs text-amber-600 mt-1">Refreshing prediction…</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                <span>Low risk</span>
                <span>Critical</span>
              </div>
              <RiskScale percent={gaugePercent} stops={riskStops} />
            </div>

            {keyFactors.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Lightbulb size={14} /> Key contributing factors
                </h4>
                <KeyFactorChips items={keyFactors} />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/patient/${id}`}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-rose-200 bg-white/80 text-rose-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
              >
                View patient record
              </Link>
              <button
                onClick={() => { setError(null); setReloadKey((k) => k + 1); pollAttemptsRef.current = 0; }}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-rose-200 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                title="Refresh prediction"
                type="button"
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl bg-white shadow-md ring-1 ring-black/5 px-6 py-5">
        <KpiRow
          h1={Number(patientData?.hba1c_1st_visit)}
          h2={Number(patientData?.hba1c_2nd_visit)}
          f1={Number(patientData?.fvg_1)}
          f2={Number(patientData?.fvg_2)}
        />
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="rounded-2xl bg-white shadow-md ring-1 ring-black/5 px-6 py-6 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{patientData?.name}</h3>
              <p className="text-sm text-slate-500">{patientData?.gender}, {patientData?.age} y/o</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              {patientData?.insulin_regimen_type || 'Regimen —'}
            </span>
          </div>

          <div className="grid gap-3 text-xs text-slate-600">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Medical history</p>
              <p className="mt-1 leading-relaxed text-slate-600">{patientData?.medicalHistory || 'No history on record.'}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Current medications</p>
              <p className="mt-1 leading-relaxed text-slate-600">{patientData?.medications || 'Not specified.'}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl bg-white shadow-md ring-1 ring-black/5 px-6 py-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <LineChart size={14} /> Glycemic metrics snapshot
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <MetricBox label="HbA1c (1st)" value={patientData?.hba1c_1st_visit} />
              <MetricBox label="HbA1c (2nd)" value={patientData?.hba1c_2nd_visit} />
              <MetricBox label="FVG (1st)" value={patientData?.fvg_1} />
              <MetricBox label="FVG (2nd)" value={patientData?.fvg_2} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
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
        </Card>
      </div>

      <Card className="rounded-2xl bg-white shadow-md ring-1 ring-black/5 px-6 py-6">
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <ActivityIcon size={14} /> Therapy response metrics
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <MetricBox label="HbA1c Δ" value={patientData?.reduction_a?.toFixed(1)} />
          <MetricBox label="Daily HbA1c drop" value={patientData?.reduction_a_per_day?.toFixed(3)} />
          <MetricBox label="FVG Δ" value={patientData?.fvg_delta_1_2} />
          <MetricBox label="Avg FVG" value={patientData?.avg_fvg_1_2} />
        </div>
      </Card>

      <p className="text-center text-xs text-slate-400">
        AI-generated predictions should complement clinical judgment and patient preferences.
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
        <div className="text-xs font-semibold text-gray-700 flex items-center gap-2"><TrendingUp size={14} /> {title}</div>
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
// lucide-react icons used above; small inline mini-icon replaced by TrendingUp for TrendCard header

export default RiskPredictionForm;
