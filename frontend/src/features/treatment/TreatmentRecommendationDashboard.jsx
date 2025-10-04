import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card.jsx';
import { Users as UsersIcon, Search as SearchIcon, SlidersHorizontal, X, Activity as ActivityIcon, TrendingUp, TrendingDown, Stethoscope } from 'lucide-react';

const TreatmentRecommendationDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [insulinFilter, setInsulinFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');

  useEffect(() => {
    const laravelUrl = import.meta.env.VITE_LARAVEL_URL || 'http://localhost:8000';
    fetch(`${laravelUrl}/api/patients`)
      .then((res) => res.json())
      .then((data) => {
        setPatients(data);
        setFiltered(data);
      });
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      patients.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const insulin = (p.insulin_regimen_type || '').trim().toLowerCase();
        const gender = (p.gender || '').trim().toLowerCase();
        const matchesSearch = name.includes(q);
        const matchesInsulin = insulinFilter === 'All' || insulin === insulinFilter.toLowerCase();
        const matchesGender = genderFilter === 'All' || gender === genderFilter.toLowerCase();
        return matchesSearch && matchesInsulin && matchesGender;
      })
    );
  }, [search, insulinFilter, genderFilter, patients]);

  const insulinTypes = Array.from(new Set(patients.map((p) => p.insulin_regimen_type).filter(Boolean)));
  const genders = Array.from(new Set(patients.map((p) => p.gender).filter(Boolean)));
  const clearFilters = () => {
    setSearch('');
    setInsulinFilter('All');
    setGenderFilter('All');
  };

  const totalPatients = patients.length;
  const filteredCount = filtered.length;
  const avgHbChange = filteredCount
    ? (filtered.reduce((sum, p) => sum + (Number(p.reduction_a) || 0), 0) / filteredCount).toFixed(1)
    : '—';
  const avgFvgChange = filteredCount
    ? (filtered.reduce((sum, p) => sum + (Number(p.fvg_delta_1_2) || 0), 0) / filteredCount).toFixed(1)
    : '—';
  const regimenCounts = patients.reduce((acc, p) => {
    const key = p.insulin_regimen_type ? p.insulin_regimen_type.toString() : 'Unspecified';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topRegimens = Object.entries(regimenCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const readyForReview = filtered.filter((p) => (Number(p.reduction_a) || 0) > 1 || (Number(p.fvg_delta_1_2) || 0) > 2).length;
  const highDistressPatients = filtered
    .filter((p) => (Number(p.dds_trend_1_3) || 0) > 1.5)
    .sort((a, b) => (Number(b.dds_trend_1_3) || 0) - (Number(a.dds_trend_1_3) || 0))
    .slice(0, 5);
  const lowEgfrPatients = filtered
    .filter((p) => (Number(p.egfr) || Infinity) < 60)
    .sort((a, b) => (Number(a.egfr) || Infinity) - (Number(b.egfr) || Infinity))
    .slice(0, 5);

  const avgDds = filteredCount
    ? (filtered.reduce((sum, p) => sum + (Number(p.dds_trend_1_3) || 0), 0) / filteredCount).toFixed(2)
    : '—';
  const noRegimenCount = patients.filter((p) => !p.insulin_regimen_type).length;

  const [reportPatients, setReportPatients] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage || {}).filter((key) => key.startsWith('report-'));
    const mapped = keys
      .map((key) => key.replace('report-', ''))
      .map((id) => {
        const patient = patients.find((p) => String(p.id) === id);
        return patient
          ? { id: patient.id, name: patient.name, updated: patient.updated_at }
          : { id, name: `Patient ${id}`, updated: null };
      })
      .sort((a, b) => new Date(b.updated || 0) - new Date(a.updated || 0));
    setReportPatients(mapped);
  }, [patients]);

  const [pageSize, setPageSize] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, insulinFilter, genderFilter]);

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const startIndex = (currentPage - 1) * pageSize;
  const visiblePatients = filtered.slice(startIndex, startIndex + pageSize);

  const Metric = ({ label, value, tone }) => {
    const palette = {
      indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
      emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      purple: 'bg-purple-50 text-purple-700 border border-purple-100',
      blue: 'bg-blue-50 text-blue-700 border border-blue-100',
    };
    const classes = palette[tone] || 'bg-slate-50 text-slate-700 border border-slate-100';
    return (
      <div className={`rounded-lg px-3 py-2 text-sm ${classes}`}>
        <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
        <p className="font-semibold text-current">{value}</p>
      </div>
    );
  };

  return (
    <div className="w-full px-6 md:px-10 lg:px-14 py-10 space-y-10">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <Card className="rounded-3xl bg-white shadow-xl ring-1 ring-black/5 p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
              <Stethoscope size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Treatment Intelligence</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Treatment Recommendations Hub</h1>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm text-slate-600 leading-relaxed">
              Surface the right interventions faster by filtering cohorts, tracking therapy response, and exploring regimen-specific insights.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-full sm:w-64">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient..."
                  className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl bg-white/95 backdrop-blur ring-1 ring-black/5 shadow-md px-5 py-4 flex h-full flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Filters</h3>
            <button
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              onClick={clearFilters}
            >
              <SlidersHorizontal size={14} /> Reset
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              value={insulinFilter}
              onChange={(e) => setInsulinFilter(e.target.value)}
            >
              <option value="All">All insulin types</option>
              {insulinTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value="All">All genders</option>
              {genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {(insulinFilter !== 'All' || genderFilter !== 'All' || search.trim() !== '') && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {insulinFilter !== 'All' && (
                <button onClick={() => setInsulinFilter('All')} className="inline-flex items-center gap-1 rounded-full bg-teal-50 text-teal-700 px-2.5 py-0.5 text-xs border border-teal-100">
                  Insulin: {insulinFilter} <X size={12} />
                </button>
              )}
              {genderFilter !== 'All' && (
                <button onClick={() => setGenderFilter('All')} className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs border border-amber-100">
                  Gender: {genderFilter} <X size={12} />
                </button>
              )}
              {search.trim() !== '' && (
                <button onClick={() => setSearch('')} className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-xs border border-slate-200">
                  Query: {search} <X size={12} />
                </button>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card className="rounded-2xl bg-gradient-to-br from-white via-emerald-50 to-emerald-100 ring-1 ring-emerald-100/60 shadow-md px-4 py-4 space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Regimen mix</h3>
              <span className="text-[11px] text-slate-400">Top {topRegimens.length}</span>
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-600">
              {topRegimens.length === 0 ? (
                <span className="text-[11px] text-slate-400">No regimen data available.</span>
              ) : (
                topRegimens.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white/80 px-2.5 py-1.5 shadow-sm">
                    <span className="font-medium">{name}</span>
                    <span className="text-sm font-semibold text-slate-800">{count}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-2xl bg-gradient-to-br from-white via-indigo-50 to-indigo-100 ring-1 ring-indigo-100/60 shadow-md px-4 py-4 space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Report activity</h3>
              <span className="text-[11px] text-slate-400">{reportPatients.length} generated</span>
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-600">
              {reportPatients.length === 0 ? (
                <span className="text-[11px] text-slate-400">No AI reports generated yet.</span>
              ) : (
                reportPatients.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white/80 px-2.5 py-1.5 shadow-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-[11px] text-slate-400">{p.updated ? new Date(p.updated).toLocaleDateString() : '—'}</span>
                  </div>
                ))
              )}
            </div>
            {reportPatients.length > 3 && (
              <p className="text-[11px] text-slate-400">+{reportPatients.length - 3} more reports in history</p>
            )}
          </Card>

          <Card className="rounded-2xl bg-gradient-to-br from-white via-rose-50 to-rose-100 ring-1 ring-rose-100/70 shadow-md px-4 py-4 space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-500">Engagement watch</h3>
              <span className="text-[11px] text-rose-400">Adherence signals</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-rose-700">
              <div className="rounded-lg border border-rose-100 bg-white/80 px-2.5 py-1.5 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400">Avg DDS Δ</p>
                <p className="text-lg font-semibold text-rose-600">{avgDds}</p>
              </div>
              <div className="rounded-lg border border-rose-100 bg-white/80 px-2.5 py-1.5 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400">No regimen set</p>
                <p className="text-lg font-semibold text-rose-600">{noRegimenCount}</p>
              </div>
              <div className="col-span-2 rounded-lg border border-rose-100 bg-white/80 px-2.5 py-1.5 shadow-sm text-rose-600">
                <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400">Action tip</p>
                <p className="text-sm">Prioritise counselling for distress cases and confirm regimen plans for {noRegimenCount} patients.</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="rounded-2xl bg-gradient-to-br from-white via-rose-50 to-rose-100 ring-1 ring-rose-100/70 shadow-md px-5 py-5 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-500">Follow-up priorities</h3>
            <span className="text-[11px] text-rose-400">High distress / low eGFR</span>
          </div>
          <div className="grid gap-3 text-xs text-rose-700">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400 mb-2">High distress (DDS &gt; 1.5)</p>
              {highDistressPatients.length === 0 ? (
                <span className="text-[11px] text-rose-400">No patients flagged.</span>
              ) : (
                <ul className="space-y-2">
                  {highDistressPatients.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-lg bg-white/80 border border-rose-100 px-3 py-2 shadow-sm">
                      <div>
                        <p className="text-sm font-semibold text-rose-700">{p.name}</p>
                        <p className="text-[11px] text-rose-400">DDS Δ {p.dds_trend_1_3 ?? '—'}</p>
                      </div>
                      <Link to={`/treatment-recommendation/${p.id}`} className="text-[11px] font-semibold text-rose-500 hover:text-rose-600">
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400 mb-2">Renal watch (eGFR &lt; 60)</p>
              {lowEgfrPatients.length === 0 ? (
                <span className="text-[11px] text-rose-400">No renal concerns detected.</span>
              ) : (
                <ul className="space-y-2">
                  {lowEgfrPatients.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-lg bg-white/80 border border-rose-100 px-3 py-2 shadow-sm">
                      <div>
                        <p className="text-sm font-semibold text-rose-700">{p.name}</p>
                        <p className="text-[11px] text-rose-400">eGFR {p.egfr ?? '—'} mL/min</p>
                      </div>
                      <Link to={`/treatment-recommendation/${p.id}`} className="text-[11px] font-semibold text-rose-500 hover:text-rose-600">
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visiblePatients.map((p) => (
          <Card
            key={p.id}
            className="space-y-4 rounded-2xl border border-indigo-100 bg-white/90 p-6 shadow-sm transition hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{p.age} y/o · {p.gender} · Regimen {p.insulin_regimen_type || '—'}</p>
              </div>
              <span className="text-xs rounded-full bg-indigo-50 text-indigo-600 px-2 py-1 border border-indigo-100 font-medium">
                {p.insulin_regimen_type || 'N/A'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <Metric label="HbA1c Δ" value={`${(p.reduction_a ?? 0).toFixed(1)}%`} tone="indigo" />
              <Metric label="FVG Δ" value={p.fvg_delta_1_2 ?? '—'} tone="emerald" />
              <Metric label="DDS Δ" value={p.dds_trend_1_3 ?? '—'} tone="purple" />
              <Metric label="eGFR" value={`${p.egfr ?? '—'} mL/min`} tone="blue" />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <p>Updated {new Date(p.updated_at).toLocaleDateString()}</p>
              <Link to={`/treatment-recommendation/${p.id}`} className="text-indigo-600 font-semibold hover:text-indigo-500">
                View recommendation
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Results per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              {[12, 16, 24].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-200 rounded-full text-xs disabled:opacity-40"
            >
              Prev
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border border-slate-200 rounded-full text-xs ${pageNum === currentPage ? 'bg-indigo-500 text-white border-indigo-500' : 'hover:bg-slate-50'}`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-slate-200 rounded-full text-xs disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentRecommendationDashboard;
