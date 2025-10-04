import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { patientsApi } from '../../api/patients';
import { fastApiClient } from '../../api/client';
import RiskBadge from '../../components/RiskBadge.jsx';
import Card from '../../components/Card.jsx';
import {
  Activity,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  RefreshCcw,
  Users as UsersIcon,
  AlertTriangle,
  Gauge,
  LineChart,
} from 'lucide-react';

const RiskDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [riskResults, setRiskResults] = useState({}); // { id: { value, label } }
  const [riskFilter, setRiskFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const riskCounts = Object.values(riskResults).reduce((acc, r) => {
    acc[r.label] = (acc[r.label] || 0) + 1;
    return acc;
  }, {});

  const riskCategories = ['Normal', 'At Risk', 'Moderate Risk', 'Risky', 'Very Risky', 'Critical'];
  const riskOptions = ['All', ...riskCategories];
  const counts = riskCategories.map(cat => riskCounts[cat] || 0);

  const chartData = {
    labels: riskCategories,
    datasets: [
      {
        label: 'Number of Patients',
        data: counts,
        backgroundColor: [
          '#22c55e',
          '#facc15',
          '#fbbf24',
          '#fb923c',
          '#ef4444',
          '#7f1d1d',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Patients', font: { weight: 'bold' } } },
      x: { title: { display: true, text: 'Risk Category', font: { weight: 'bold' } } },
    },
  };

  useEffect(() => {
    patientsApi.getAll().then((data) => {
      setPatients(data);
      setFiltered(data);
      runPredictions(data); // Trigger prediction API
    });
  }, []);

  const runPredictions = (data) => {
    // Reset results and fire all requests in parallel; update as each completes
    setRiskResults({});
    data.forEach((patient) => {
      const features = [
        parseFloat(patient.hba1c_1st_visit),
        parseFloat(patient.hba1c_2nd_visit),
        parseFloat(patient.fvg_1),
        parseFloat(patient.fvg_2),
        parseFloat(patient.avg_fvg_1_2),
        parseFloat(patient.reduction_a),
      ];

      if (features.some((val) => isNaN(val))) return; // skip invalid

      fastApiClient
        .post('/risk-dashboard?force=false', {
          features,
          patient_id: Number(patient.id),
          model_version: 'risk_v1',
          patient,
        })
        .then((res) => {
          const rawValue = parseFloat(res.data.prediction);
          const value = Number.isFinite(rawValue) ? rawValue.toFixed(2) : '—';
          const label = res.data.risk_label || mapNumericRisk(rawValue);
          setRiskResults((prev) => ({ ...prev, [patient.id]: { value, label } }));
        })
        .catch(() => {
          // eslint-disable-next-line no-console
          console.error(`Prediction failed for ${patient.name}`);
        });
    });
  };

  useEffect(() => {
    const q = search.toLowerCase();
    const filteredList =
      patients.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const matchesSearch = name.includes(q);
        const riskLabel = riskResults[p.id]?.label?.trim();
        const matchesRisk = riskFilter === 'All' || riskLabel === riskFilter;
        return matchesSearch && matchesRisk;
      });
    setFiltered(filteredList);
    setCurrentPage(1);
  }, [search, patients, riskFilter, riskResults]);

  const riskActiveClass = (label) => {
    const map = {
      Normal: 'bg-emerald-100 text-emerald-700',
      'At Risk': 'bg-amber-100 text-amber-700',
      'Moderate Risk': 'bg-yellow-100 text-yellow-700',
      Risky: 'bg-orange-100 text-orange-700',
      'Very Risky': 'bg-red-100 text-red-700',
      Critical: 'bg-rose-100 text-rose-700',
      All: 'bg-gray-100 text-gray-700',
    };
    return map[label] || 'bg-gray-100 text-gray-700';
  };

  const clearFilters = () => {
    setRiskFilter('All');
    setSearch('');
  };

  const totalPredictions = Object.keys(riskResults).length;
  const pendingPredictions = Math.max(patients.length - totalPredictions, 0);
  const highRiskLabels = new Set(['Very Risky', 'Critical']);
  const highRiskCount = Object.values(riskResults).filter((r) => highRiskLabels.has(r.label)).length;
  const averageRiskValue = totalPredictions
    ? (
        Object.values(riskResults).reduce((sum, r) => {
          const num = parseFloat(r.value);
          return Number.isFinite(num) ? sum + num : sum;
        }, 0) /
        totalPredictions
      ).toFixed(2)
    : null;

  const topRiskPatients = patients
    .filter((p) => riskResults[p.id])
    .sort((a, b) => {
      const aVal = parseFloat(riskResults[a.id]?.value ?? '-Infinity');
      const bVal = parseFloat(riskResults[b.id]?.value ?? '-Infinity');
      return bVal - aVal;
    })
    .slice(0, 8);

  const criticalCount = Object.values(riskResults).filter((r) => r.label === 'Critical').length;
  const highRiskShare = totalPredictions ? Math.round((highRiskCount / totalPredictions) * 100) : 0;
  const recentHighRisk = patients
    .filter((p) => {
      const label = riskResults[p.id]?.label;
      return label && highRiskLabels.has(label);
    })
    .sort((a, b) => {
      const aVal = parseFloat(riskResults[a.id]?.value ?? '-Infinity');
      const bVal = parseFloat(riskResults[b.id]?.value ?? '-Infinity');
      return bVal - aVal;
    })
    .slice(0, 4);

  const riskGradientHeading = 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500';

  const maxCardsPerPage = 12;
  const totalPages = Math.max(Math.ceil(filtered.length / maxCardsPerPage), 1);
  const startIndex = (currentPage - 1) * maxCardsPerPage;
  const visibleCards = filtered.slice(startIndex, startIndex + maxCardsPerPage);
  const backgroundByRisk = {
    normal: 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
    'at risk': 'bg-amber-50 text-amber-900 hover:bg-amber-100',
    'moderate risk': 'bg-yellow-50 text-yellow-900 hover:bg-yellow-100',
    risky: 'bg-orange-50 text-orange-900 hover:bg-orange-100',
    'very risky': 'bg-red-50 text-red-900 hover:bg-red-100',
    critical: 'bg-rose-50 text-rose-900 hover:bg-rose-100',
    unknown: 'bg-slate-50 text-slate-900 hover:bg-slate-100',
  };

  const mapNumericRisk = (val) => {
    if (val < 5.7) return 'Normal';
    if (val < 6.5) return 'At Risk';
    if (val < 7.1) return 'Moderate Risk';
    if (val < 8.1) return 'Risky';
    if (val <= 9.0) return 'Very Risky';
    return 'Critical';
  };

  // Badge colors are handled by RiskBadge component

  return (
    <div className="w-full px-6 md:px-10 lg:px-14 py-10 space-y-8">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <Card className="rounded-3xl bg-white shadow-xl ring-1 ring-black/5 p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <LineChart size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Risk Insights</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Risk Prediction</h1>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-2xl text-sm text-slate-600 leading-relaxed">
              Model-driven analytics that surface high-priority patients and highlight shifts in population risk levels.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-full sm:w-64">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400"
                />
              </div>
              <button
                onClick={() => runPredictions(patients)}
                className="inline-flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                type="button"
              >
                <RefreshCcw size={16} /> Re-run Predictions
              </button>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl bg-white/90 backdrop-blur ring-1 ring-black/5 shadow-md px-5 py-4 flex h-full flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Filters</h3>
            <button
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              onClick={clearFilters}
              type="button"
            >
              <SlidersHorizontal size={14} /> Reset
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap items-center bg-white border border-gray-200 rounded-md p-1 text-xs font-medium gap-1">
              {riskOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setRiskFilter(opt)}
                  className={`px-2.5 py-1 rounded transition ${riskFilter === opt ? riskActiveClass(opt) : 'text-gray-600 hover:bg-gray-50'}`}
                  type="button"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {(riskFilter !== 'All' || search.trim() !== '') && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {riskFilter !== 'All' && (
                <button
                  onClick={() => setRiskFilter('All')}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs border border-gray-200"
                  type="button"
                >
                  {riskFilter} <X size={12} />
                </button>
              )}
              {search.trim() !== '' && (
                <button
                  onClick={() => setSearch('')}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs border border-gray-200"
                  type="button"
                >
                  Query: {search} <X size={12} />
                </button>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        <Card className="p-4 bg-emerald-50 text-emerald-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <UsersIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">Total Patients</p>
              <p className="text-2xl font-bold">{patients.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-amber-50 text-amber-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">High Risk Patients</p>
              <p className="text-2xl font-bold">{highRiskCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-sky-50 text-sky-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Gauge size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">Avg Predicted HbA1c</p>
              <p className="text-2xl font-bold">{averageRiskValue ?? '—'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 text-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <RefreshCcw size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">Pending Predictions</p>
              <p className="text-2xl font-bold">{pendingPredictions}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.6fr)]">
        <Card className="p-6 rounded-2xl bg-gradient-to-br from-white via-emerald-50 to-emerald-100 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xs font-semibold uppercase tracking-[0.25em] text-slate-500`}>Risk distribution</h3>
            <span className="text-[11px] text-slate-400">Live predictions</span>
          </div>
          <div className="h-[520px] sm:h-[560px]">
            <Bar data={chartData} options={{ ...chartOptions, maintainAspectRatio: false }} />
          </div>
        </Card>
        <Card className="p-6 rounded-2xl bg-gradient-to-br from-white via-amber-50 to-rose-100 ring-1 ring-amber-100/60 shadow-md space-y-4 flex flex-col">
          <div className="flex items-start justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Top risk</h3>
            <span className="text-[11px] text-slate-400">{topRiskPatients.length} listed</span>
          </div>
          <div className="flex-1">
            <ul className="grid gap-3 text-sm text-slate-700">
              {topRiskPatients.length === 0 && <li className="text-slate-400">Predictions are still loading...</li>}
              {topRiskPatients.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/predict/${p.id}`}
                    className="flex items-center justify-between rounded-lg border border-amber-100 bg-white/80 px-3 py-2 transition-colors duration-200 hover:bg-rose-50 shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.gender} · {p.age} y/o</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-rose-600">{riskResults[p.id]?.value}</p>
                      <p className="text-xs text-slate-500">{riskResults[p.id]?.label}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        <Card className="p-6 rounded-2xl bg-gradient-to-br from-white via-rose-50 to-rose-100 ring-1 ring-rose-100/70 shadow-md space-y-5">
          <div className="flex items-start justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-500">Risk focus</h3>
            <span className="text-[11px] text-rose-400">{highRiskCount} high risk</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-rose-700">
            <div className="rounded-lg bg-white/80 border border-rose-100 px-3 py-2 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400">High risk share</p>
              <p className="text-lg font-semibold text-rose-600">{highRiskShare}%</p>
            </div>
            <div className="rounded-lg bg-white/80 border border-rose-100 px-3 py-2 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400">Critical</p>
              <p className="text-lg font-semibold text-rose-600">{criticalCount}</p>
            </div>
            <div className="rounded-lg bg-white/80 border border-rose-100 px-3 py-2 shadow-sm col-span-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400">Pending predictions</p>
              <p className="text-lg font-semibold text-rose-600">{pendingPredictions}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-rose-700">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500">Recent high risk</p>
            {recentHighRisk.length === 0 ? (
              <span className="text-[11px] text-rose-400">No high-risk patients yet.</span>
            ) : (
              <ul className="space-y-2">
                {recentHighRisk.map((p) => (
                  <li key={p.id} className="rounded-lg bg-white/80 border border-rose-100 px-3 py-2 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-sm font-semibold text-rose-700">{p.name}</p>
                      <p className="text-[11px] text-rose-400">{riskResults[p.id]?.label}</p>
                    </div>
                    <Link to={`/predict/${p.id}`} className="text-[11px] font-semibold text-rose-500 hover:text-rose-600">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleCards.map((p) => {
          const risk = riskResults[p.id];
          const riskKeyRaw = risk?.label?.trim().toLowerCase() ?? 'unknown';
          const riskKey = backgroundByRisk[riskKeyRaw] ? riskKeyRaw : 'unknown';
          const bgClass = backgroundByRisk[riskKey];

          return (
            <Link key={p.id} to={`/predict/${p.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2">
              <Card
                className={`space-y-3 p-4 border border-transparent transition-all duration-200 ${bgClass} shadow-sm hover:shadow-lg hover:-translate-y-0.5 cursor-pointer`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-semibold text-base">{p.name}</h3>
                    <p className="text-xs opacity-80">{p.age} y/o · {p.gender}</p>
                  </div>
                  {risk ? (
                    <RiskBadge label={risk.label} />
                  ) : (
                    <span className="text-xs font-medium text-gray-400">Loading...</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-medium opacity-80">HbA1c (1st)</p>
                    <p>{p.hba1c_1st_visit ?? '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium opacity-80">HbA1c (2nd)</p>
                    <p>{p.hba1c_2nd_visit ?? '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium opacity-80">FVG (1st)</p>
                    <p>{p.fvg_1 ?? '—'} mg/dL</p>
                  </div>
                  <div>
                    <p className="font-medium opacity-80">FVG (2nd)</p>
                    <p>{p.fvg_2 ?? '—'} mg/dL</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Prev
          </button>
          <span className="text-gray-500">Page {currentPage} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-gray-400">No matching patients found.</p>
      )}
    </div>
  );
}
;

export default RiskDashboard;
