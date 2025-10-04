import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import Card from '@/components/Card.jsx';
import { Activity, Search as SearchIcon, SlidersHorizontal, X, Users as UsersIcon, TrendingUp, Activity as ActivityIcon, TrendingDown, CalendarClock, ClipboardPlus } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const TherapyDashboard = () => {
  const [patients, setPatients] = useState([]);

  // Filters, search and pagination states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [insulinFilter, setInsulinFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [pageSize, setPageSize] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [ageBandFilter, setAgeBandFilter] = useState('All');

  useEffect(() => {
    const laravelUrl = import.meta.env.VITE_LARAVEL_URL || 'http://localhost:8000';
    fetch(`${laravelUrl}/api/patients`)
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, insulinFilter, genderFilter, ageBandFilter, search, pageSize]);

  const getPatientStatus = (p) => {
    const hbDrop = p.reduction_a_2_3 ?? null;
    const fvgDelta = p.fvg_delta_1_2 ?? null;
    const ddsTrend = p.dds_trend_1_3 ?? null;

    if (hbDrop !== null) {
      if (hbDrop > 1.0) return 'Improving';
      if (hbDrop < 0) return 'Worsening';
    }
    if (fvgDelta !== null) {
      if (fvgDelta < -1.0) return 'Improving';
      if (fvgDelta > 1.0) return 'Worsening';
    }
    return 'Stable';
  };

  const countStatus = (status) => patients.filter((p) => getPatientStatus(p) === status).length;

  const getAgeCohort = (age) => {
    const numericAge = Number(age);
    if (!Number.isFinite(numericAge)) return 'Unknown';
    if (numericAge < 18) return 'Under 18';
    if (numericAge <= 30) return '18-30';
    if (numericAge <= 45) return '31-45';
    if (numericAge <= 60) return '46-60';
    return '60+';
  };

  const ageCohortOptions = ['Under 18', '18-30', '31-45', '46-60', '60+', 'Unknown'];

  const filteredPatients = patients.filter((p) => {
    const name = (p.name || '').toLowerCase();
    const status = getPatientStatus(p);
    const insulin = (p.insulin_regimen_type || '').toString();
    const gender = p.gender || '';
    const matchesSearch = name.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    const matchesInsulin =
      insulinFilter === 'All' || insulin.trim().toLowerCase() === insulinFilter.trim().toLowerCase();
    const matchesGender = genderFilter === 'All' || gender === genderFilter;
    const matchesAgeBand = ageBandFilter === 'All' || getAgeCohort(p.age) === ageBandFilter;

    return matchesSearch && matchesStatus && matchesInsulin && matchesGender && matchesAgeBand;
  });

  const totalPages = Math.ceil(filteredPatients.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const visiblePatients = filteredPatients.slice(startIndex, startIndex + pageSize);

  const insulinTypes = Array.from(new Set(patients.map((p) => p.insulin_regimen_type).filter(Boolean)));
  const genders = Array.from(new Set(patients.map((p) => p.gender).filter(Boolean)));
  const statusCounts = {
    Improving: countStatus('Improving'),
    Stable: countStatus('Stable'),
    Worsening: countStatus('Worsening'),
  };

  const ageCohortDistribution = ageCohortOptions.reduce((acc, cohort) => {
    acc[cohort] = 0;
    return acc;
  }, {});

  patients.forEach((p) => {
    const cohort = getAgeCohort(p.age);
    if (ageCohortDistribution[cohort] === undefined) {
      ageCohortDistribution[cohort] = 0;
    }
    ageCohortDistribution[cohort] += 1;
  });

  const insulinMixCounts = patients.reduce((acc, p) => {
    const key = p.insulin_regimen_type ? p.insulin_regimen_type.toString() : 'Unspecified';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topInsulinMix = Object.entries(insulinMixCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const genderCounts = patients.reduce((acc, p) => {
    const key = p.gender || 'Unspecified';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const genderEntries = Object.entries(genderCounts).sort((a, b) => b[1] - a[1]);

  const priorityPatients = patients
    .filter((p) => getPatientStatus(p) === 'Worsening')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 4);

  const improvingShare = patients.length ? Math.round((statusCounts.Improving / patients.length) * 100) : 0;
  const stableShare = patients.length ? Math.round((statusCounts.Stable / patients.length) * 100) : 0;
  const averageAdherence = patients.length
    ? Math.round(
        patients.reduce((sum, p) => sum + Math.max(0, Math.min(100, Math.round((p.med_adherence ?? 0) * 100))), 0) /
          patients.length,
      )
    : 0;

  const cohortPercent = (count) => (patients.length ? Math.round((count / patients.length) * 100) : 0);

  const gradientHeadingClass = 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400';

  return (
    <div className="w-full px-6 md:px-10 lg:px-14 py-10 space-y-10">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <Card className="rounded-3xl bg-white shadow-xl ring-1 ring-black/5 p-6 sm:p-8 lg:p-10 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <Activity size={26} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Therapy Insights</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Therapy Effectiveness Control Center</h1>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-2xl text-sm text-slate-600 leading-relaxed">
              Track improvement velocity, surface patients approaching thresholds, and prioritise interventions based on regimen response.
            </p>

            <div className="relative w-full max-w-xs lg:max-w-sm">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients..."
                className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <div className="space-y-4 xl:h-full">
          <Card className="rounded-2xl bg-white/95 backdrop-blur ring-1 ring-black/5 shadow-md px-5 py-4 flex h-full flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Filters</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => setShowAdvancedFilters((prev) => !prev)}
                >
                  <SlidersHorizontal size={12} /> {showAdvancedFilters ? 'Hide' : 'Advanced'}
                </button>
                <button
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => {
                    setStatusFilter('All');
                    setInsulinFilter('All');
                    setGenderFilter('All');
                    setAgeBandFilter('All');
                    setSearch('');
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {['All', 'Improving', 'Stable', 'Worsening'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition border ${statusFilter === status ? 'bg-sky-500 text-white border-sky-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {status}
                </button>
              ))}
            </div>

            {showAdvancedFilters && (
              <div className="grid gap-3 border-t border-slate-100 pt-3 text-xs sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-500">
                  Insulin regimen
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    value={insulinFilter}
                    onChange={(e) => setInsulinFilter(e.target.value)}
                  >
                    <option value="All">All types</option>
                    {insulinTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-slate-500">
                  Gender
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
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
                </label>

                <label className="flex flex-col gap-1 text-slate-500">
                  Age cohort
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    value={ageBandFilter}
                    onChange={(e) => setAgeBandFilter(e.target.value)}
                  >
                    <option value="All">All cohorts</option>
                    {ageCohortOptions.map((band) => (
                      <option key={band} value={band}>
                        {band}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-slate-500">
                  Results per page
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size} per page
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-slate-500">
                  Free text
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, note, or tag"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  />
                </label>
              </div>
            )}

            {(statusFilter !== 'All' || insulinFilter !== 'All' || genderFilter !== 'All' || ageBandFilter !== 'All' || search.trim() !== '') && (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {statusFilter !== 'All' && (
                  <button onClick={() => setStatusFilter('All')} className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 px-2.5 py-0.5 text-xs border border-sky-100">
                    {statusFilter} <X size={12} />
                  </button>
                )}
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
                {ageBandFilter !== 'All' && (
                  <button onClick={() => setAgeBandFilter('All')} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-600 px-2.5 py-0.5 text-xs border border-indigo-100">
                    Age: {ageBandFilter} <X size={12} />
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
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        <KpiCard title="Total Patients" value={patients.length} tone="emerald" />
        <KpiCard title="Improving" value={statusCounts.Improving} tone="blue" />
        <KpiCard title="Stable" value={statusCounts.Stable} tone="amber" />
        <KpiCard title="Worsening" value={statusCounts.Worsening} tone="rose" />
      </div>

      {/* Analytics strip */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,0.65fr)]">
        <Card className="rounded-2xl bg-gradient-to-br from-white via-sky-50 to-sky-100 ring-1 ring-sky-100/60 shadow-md px-5 py-5 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Patient status overview</h3>
            <span className="text-[11px] text-slate-400">Updated daily</span>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-[440px] h-[440px] sm:h-[440px]">
              <Doughnut
                data={{
                  labels: ['Improving', 'Stable', 'Worsening'],
                  datasets: [
                    {
                      data: [statusCounts.Improving, statusCounts.Stable, statusCounts.Worsening],
                      backgroundColor: ['#34d399', '#60a5fa', '#f87171'],
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        color: '#64748b',
                        boxWidth: 10,
                      },
                    },
                  },
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-white via-indigo-50 to-indigo-100 ring-1 ring-indigo-100/60 shadow-md px-5 py-5 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Cohort snapshot</h3>
            <span className="text-[11px] text-slate-400">{patients.length} total</span>
          </div>

          <div className="space-y-4 text-xs text-slate-600">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">Age cohorts</p>
              <div className="grid grid-cols-2 gap-2">
                {ageCohortOptions
                  .filter((cohort) => cohort !== 'Unknown')
                  .map((cohort) => (
                    <div key={cohort} className="rounded-lg border border-indigo-100 bg-white/70 px-2.5 py-2 shadow-sm">
                      <p className="text-[11px] text-slate-500">{cohort}</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {ageCohortDistribution[cohort] || 0}
                        <span className="ml-1 text-[11px] font-medium text-slate-400">{cohortPercent(ageCohortDistribution[cohort] || 0)}%</span>
                      </p>
                    </div>
                  ))}
                {ageCohortDistribution.Unknown > 0 && (
                  <div className="rounded-lg border border-dashed border-indigo-200 bg-white/60 px-2.5 py-2">
                    <p className="text-[11px] text-slate-500">Unknown</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {ageCohortDistribution.Unknown}
                      <span className="ml-1 text-[11px] font-medium text-slate-400">{cohortPercent(ageCohortDistribution.Unknown)}%</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-indigo-100 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">Gender mix</p>
              <div className="flex flex-wrap gap-2">
                {genderEntries.length === 0 ? (
                  <span className="text-[11px] text-slate-400">No gender data</span>
                ) : (
                  genderEntries.map(([label, value]) => (
                    <div key={label} className="rounded-full border border-indigo-100 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
                      {label}: {value}
                      <span className="ml-1 text-slate-400">{cohortPercent(value)}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-indigo-100 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">Top regimens</p>
              <div className="flex flex-col gap-1">
                {topInsulinMix.length === 0 ? (
                  <span className="text-[11px] text-slate-400">No regimen data</span>
                ) : (
                  topInsulinMix.map(([name, value]) => (
                    <div key={name} className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white/75 px-3 py-1.5 text-[11px] text-slate-600 shadow-sm">
                      <span className="font-medium">{name}</span>
                      <span className="font-semibold text-slate-800">{value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-white via-rose-50 to-rose-100 ring-1 ring-rose-100/70 shadow-md px-5 py-5 space-y-5">
          <div className="flex items-start justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-500">Care focus</h3>
            <span className="text-[11px] text-rose-400">{priorityPatients.length} priority</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-rose-700">
            <div className="rounded-lg bg-white/70 border border-rose-100 px-3 py-2 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400">Improving</p>
              <p className="text-lg font-semibold text-rose-600">{improvingShare}%</p>
            </div>
            <div className="rounded-lg bg-white/70 border border-rose-100 px-3 py-2 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400">Stable</p>
              <p className="text-lg font-semibold text-rose-600">{stableShare}%</p>
            </div>
            <div className="rounded-lg bg-white/70 border border-rose-100 px-3 py-2 shadow-sm col-span-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400">Avg adherence</p>
              <p className="text-lg font-semibold text-rose-600">{averageAdherence}%</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-rose-700">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500">Priority patients</p>
            {priorityPatients.length === 0 ? (
              <span className="text-[11px] text-rose-400">No patients flagged right now.</span>
            ) : (
              <ul className="space-y-2">
                {priorityPatients.map((p) => (
                  <li key={p.id} className="rounded-lg bg-white/80 border border-rose-100 px-3 py-2 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-sm font-semibold text-rose-700">{p.name}</p>
                      <p className="text-[11px] text-rose-400">Regimen {p.insulin_regimen_type || '—'}</p>
                    </div>
                    <Link to={`/therapy-effectiveness/${p.id}`} className="text-[11px] font-semibold text-rose-500 hover:text-rose-600">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Patient cards grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visiblePatients.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-10">No patients found.</div>
        ) : (
          visiblePatients.map((p) => (
            <Card key={p.id} className="space-y-4 hover:shadow-lg transition">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <Link to={`/therapy-effectiveness/${p.id}`} className="group">
                    <h4 className="font-semibold text-slate-800 group-hover:text-sky-600 group-hover:underline">
                      {p.name}
                    </h4>
                  </Link>
                  <p className="text-xs text-slate-500 mt-1">
                    {p.age} y/o · {p.gender} · Regimen {p.insulin_regimen_type || '—'}
                  </p>
                </div>
                <StatusBadge status={getPatientStatus(p)} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <MetricTile label="HbA1c Δ" value={`${(p.reduction_a ?? 0).toFixed(1)}%`} tone="indigo" />
                <MetricTile label="FVG Δ" value={p.fvg_delta_1_2 ?? '—'} tone="emerald" />
                <MetricTile label="DDS Δ" value={p.dds_trend_1_3 ?? '—'} tone="purple" />
                <MetricTile label="Adherence" value={`${Math.round((p.med_adherence ?? 0) * 100)}%`} tone="amber" />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <p>Updated {new Date(p.updated_at).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <Link to={`/therapy-effectiveness/${p.id}`} className="text-sky-600 font-semibold hover:text-sky-500">
                    View profile
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1 border rounded ${pageNum === currentPage ? 'bg-indigo-500 text-white' : ''}`}>
                {pageNum}
              </button>
            );
          })}

          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ title, value, tone }) => {
  const palette = {
    emerald: {
      card: 'bg-emerald-50 border border-emerald-100 text-emerald-700',
      iconWrap: 'bg-emerald-100 text-emerald-700',
      Icon: UsersIcon,
    },
    blue: {
      card: 'bg-blue-50 border border-blue-100 text-blue-700',
      iconWrap: 'bg-blue-100 text-blue-700',
      Icon: TrendingUp,
    },
    amber: {
      card: 'bg-amber-50 border border-amber-100 text-amber-700',
      iconWrap: 'bg-amber-100 text-amber-700',
      Icon: ActivityIcon,
    },
    rose: {
      card: 'bg-rose-50 border border-rose-100 text-rose-700',
      iconWrap: 'bg-rose-100 text-rose-700',
      Icon: TrendingDown,
    },
  };

  const paletteKey = palette[tone] ? tone : 'emerald';
  const colors = palette[paletteKey];

  const Icon = colors.Icon;

  return (
    <Card className={`flex items-center gap-3 px-4 py-3 shadow-sm ${colors.card}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconWrap}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold leading-tight text-current">{value}</p>
      </div>
    </Card>
  );
};

const MetricTile = ({ label, value, tone }) => {
  const palette = {
    indigo: 'bg-indigo-50 border border-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-50 border border-emerald-100 text-emerald-700',
    purple: 'bg-purple-50 border border-purple-100 text-purple-700',
    amber: 'bg-amber-50 border border-amber-100 text-amber-700',
  };
  const classes = palette[tone] || 'bg-slate-50 border border-slate-100 text-slate-700';
  return (
    <div className={`rounded-lg px-3 py-2 flex flex-col gap-1 ${classes}`}>
      <span className="text-[10px] uppercase tracking-[0.2em] text-current/70">{label}</span>
      <span className="text-base font-semibold text-current">{value}</span>
    </div>
  );
};

export default TherapyDashboard;
