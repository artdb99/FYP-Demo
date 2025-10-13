import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, LineChart, Users as UsersIcon, TrendingUp, Activity as ActivityIcon, TrendingDown, Trash2, Search as SearchIcon, SlidersHorizontal, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useUser } from '@/UserContext.jsx';
import { patientsApi } from '../../api/patients';
import Card from '../../components/Card.jsx';
import AssignPairModal from '../admin/AssignPairModal.jsx';

const PatientsList = ({ hideHeader = false }) => {
  const [patients, setPatients] = useState([]);
  const [meta, setMeta] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [insulinFilter, setInsulinFilter] = useState('All Insulin Types');
  const [genderFilter, setGenderFilter] = useState('All Genders');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useUser();
  const [doctors, setDoctors] = useState([]);
  const [summary, setSummary] = useState({ total: 0, improving: 0, stable: 0, worsening: 0 });
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortBy, setSortBy] = useState(null); // 'name' | 'gender' | 'age' | 'status'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPatientId, setAssignPatientId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    try {
      const laravelUrl = import.meta.env.VITE_LARAVEL_URL || 'http://localhost:8000';
      await fetch(`${laravelUrl}/api/admin/patients/${id}`, { method: 'DELETE' });
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error deleting patient:', err);
    }
  };

  // Admin: load doctors for assignment dropdown
  useEffect(() => {
    const loadDocs = async () => {
      if (user?.role !== 'admin') return;
      try {
        const laravelUrl = import.meta.env.VITE_LARAVEL_URL || 'http://localhost:8000';
        const res = await fetch(`${laravelUrl}/api/admin/users`);
        const data = await res.json();
        setDoctors((data || []).filter(u => u.role === 'doctor'));
      } catch (e) {
        console.error('Failed to load doctors', e);
      }
    };
    loadDocs();
  }, [user]);

  const refreshCurrentPage = async () => {
    const params = {
      perPage: pageSize,
      page: currentPage,
      search: searchTerm || undefined,
      gender: genderFilter !== 'All Genders' ? genderFilter : undefined,
      insulin: insulinFilter !== 'All Insulin Types' ? insulinFilter : undefined,
      ...(user?.role === 'doctor' ? { doctor_id: user.id } : {}),
    };
    const { data, meta } = await patientsApi.list(params);
    setPatients(data || []);
    setMeta(meta || null);
  };

  const handleAssignDoctor = async (patientId, doctorId) => {
    try {
      await patientsApi.assignDoctor(patientId, doctorId || null);
      await refreshCurrentPage();
    } catch (e) {
      console.error('Assign failed', e);
      alert('Failed to assign doctor.');
    }
  };

  useEffect(() => {
    const params = {
      perPage: pageSize,
      page: currentPage,
      search: searchTerm || undefined,
      gender: genderFilter !== 'All Genders' ? genderFilter : undefined,
      insulin: insulinFilter !== 'All Insulin Types' ? insulinFilter : undefined,
      ...(user?.role === 'doctor' ? { doctor_id: user.id } : {}),
    };
    patientsApi
      .list(params)
      .then(({ data, meta }) => {
        setPatients(data || []);
        setMeta(meta || null);
      })
      .catch((err) => console.error('Error:', err));
  }, [pageSize, currentPage, searchTerm, genderFilter, insulinFilter, user]);

  // Compute totals across ALL pages for current filters (not limited to current page)
  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const fetchAllPages = async () => {
      try {
        setSummaryLoading(true);
        const baseParams = {
          perPage: 100, // fetch in chunks to avoid huge payloads
          page: 1,
          search: searchTerm || undefined,
          gender: genderFilter !== 'All Genders' ? genderFilter : undefined,
          insulin: insulinFilter !== 'All Insulin Types' ? insulinFilter : undefined,
          ...(user?.role === 'doctor' ? { doctor_id: user.id } : {}),
        };

        // first page
        const first = await patientsApi.list(baseParams);
        if (isCancelled) return;
        const firstData = first.data || [];
        const lastPage = first.meta?.last_page || 1;
        let improving = 0, stable = 0, worsening = 0;

        const tally = (arr) => {
          for (const p of arr) {
            const s = getStatusTag(p);
            if (s === 'Improving') improving++;
            else if (s === 'Worsening') worsening++;
            else if (s === 'Stable') stable++;
          }
        };
        tally(firstData);

        // remaining pages
        for (let page = 2; page <= lastPage; page++) {
          const res = await patientsApi.list({ ...baseParams, page });
          if (isCancelled) return;
          tally(res.data || []);
        }

        const total = first.meta?.total ?? improving + stable + worsening;
        if (!isCancelled) setSummary({ total, improving, stable, worsening });
      } catch (e) {
        if (!isCancelled) console.error('Summary fetch error:', e);
      } finally {
        if (!isCancelled) setSummaryLoading(false);
      }
    };

    fetchAllPages();
    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [searchTerm, genderFilter, insulinFilter, user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, insulinFilter, genderFilter, pageSize, searchTerm]);

  const formatTrend = (val) => {
    if (val == null) return '-';
    const num = parseFloat(val);
    const color = num > 0 ? 'text-red-500' : num < 0 ? 'text-green-600' : 'text-yellow-500';
    return <span className={`font-semibold ${color}`}>{num}</span>;
  };

  const formatGap = (days) => (days != null ? `${Math.round(days)} days` : '-');

  const getStatusTag = (p) => {
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
    if (ddsTrend !== null && ddsTrend > 1) {
      return 'Needs Review';
    }
    return 'Stable';
  };

  const insulinColors = {
    Basal: 'bg-indigo-100 text-indigo-700',
    Bolus: 'bg-purple-100 text-purple-700',
    PBD: 'bg-blue-100 text-blue-700',
    BB: 'bg-teal-100 text-teal-700',
    PTDS: 'bg-yellow-100 text-yellow-700',
    None: 'bg-gray-100 text-gray-500',
  };

  const statusOptions = ['All Status', 'Improving', 'Stable', 'Worsening'];
  const insulinOptions = ['All Insulin Types', 'Basal', 'Bolus', 'PBD', 'BB', 'PTDS', 'None'];
  const genderOptions = ['All Genders', 'Male', 'Female'];
  const pageSizeOptions = [10, 25, 50, 100];

  const statusActiveClass = (opt) => {
    switch (opt) {
      case 'Improving':
        return 'bg-green-100 text-green-700';
      case 'Stable':
        return 'bg-yellow-100 text-yellow-700';
      case 'Worsening':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredPatients = patients.filter((p) => {
    const status = getStatusTag(p).toLowerCase();
    const insulin = (p.insulin_regimen_type ?? 'None').trim().toLowerCase();
    const gender = (p.gender ?? '-').trim().toLowerCase();
    const name = (p.name ?? '').toLowerCase();

    const statusFilterNormalized = statusFilter.toLowerCase();
    const insulinFilterNormalized = insulinFilter.toLowerCase();
    const genderFilterNormalized = genderFilter.toLowerCase();
    const searchTermNormalized = searchTerm.trim().toLowerCase();

    return (
      (statusFilter === 'All Status' || status === statusFilterNormalized) &&
      (insulinFilter === 'All Insulin Types' || insulin === insulinFilterNormalized) &&
      (genderFilter === 'All Genders' || gender === genderFilterNormalized) &&
      (searchTermNormalized === '' || name.includes(searchTermNormalized))
    );
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (!sortBy) return 0;
    const statusA = getStatusTag(a);
    const statusB = getStatusTag(b);
    const map = {
      name: [a.name ?? '', b.name ?? ''],
      gender: [a.gender ?? '', b.gender ?? ''],
      age: [Number(a.age ?? 0), Number(b.age ?? 0)],
      status: [statusA, statusB],
    };
    const [va, vb] = map[sortBy] || ['',''];
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? (va - vb)
      : String(va).localeCompare(String(vb));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = meta?.last_page ?? Math.ceil(sortedPatients.length / pageSize);
  const visiblePatients = sortedPatients;

  const toggleSort = (key) => {
    setSortBy(prev => (prev === key ? key : key));
    setSortDir(prev => (sortBy === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
  };

  return (
    <div className="w-full px-6 md:px-10 lg:px-14 py-10 space-y-8 text-gray-900 dark:text-gray-100">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-3xl shadow-xl ring-1 ring-emerald-100/60 p-6 sm:p-8 lg:p-10 space-y-6 bg-gradient-to-r from-emerald-50 to-cyan-50 min-h-[140px]">
          {!hideHeader && (
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <UsersIcon size={24} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Patient Directory</p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Patients</h1>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 sm:mt-6">
            <div className="relative w-full sm:w-80">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400"
                />
              </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => { setAssignPatientId(null); setAssignOpen(true); }}
                className="inline-flex items-center justify-center h-10 px-3 rounded-md border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="Assign Patient ↔ Doctor"
              >
                <Plus size={16} className="mr-2" /> Assign Patient ↔ Doctor
              </button>
            )}
          </div>
        </Card>

        <Card className="rounded-2xl bg-white/90 backdrop-blur ring-1 ring-black/5 shadow-md px-4 py-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h3>
            <button
              className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              onClick={() => setShowAdvanced(v => !v)}
            >
              <SlidersHorizontal size={14} /> Advanced <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center bg-white border border-gray-200 rounded-md p-1 text-xs font-medium overflow-hidden">
              {statusOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={`px-2.5 py-1 rounded ${statusFilter === opt ? statusActiveClass(opt) : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              className="text-sm px-2.5 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              onClick={() => { setStatusFilter('All Status'); setInsulinFilter('All Insulin Types'); setGenderFilter('All Genders'); setSearchTerm(''); }}
            >
              Reset Filters
            </button>
            <select
              className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              value={`${pageSize} per page`}
              onChange={(e) => setPageSize(Number(e.target.value.split(' ')[0]))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={`${size} per page`}>
                  {`${size} per page`}
                </option>
              ))}
            </select>
          </div>

          {(insulinFilter !== 'All Insulin Types' || genderFilter !== 'All Genders' || searchTerm.trim() !== '') && (
            <div className="flex flex-wrap gap-2">
              {insulinFilter !== 'All Insulin Types' && (
                <button onClick={() => setInsulinFilter('All Insulin Types')} className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs border border-gray-200">
                  {insulinFilter} <X size={12} />
                </button>
              )}
              {genderFilter !== 'All Genders' && (
                <button onClick={() => setGenderFilter('All Genders')} className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs border border-gray-200">
                  {genderFilter} <X size={12} />
                </button>
              )}
              {searchTerm.trim() !== '' && (
                <button onClick={() => setSearchTerm('')} className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs border border-gray-200">
                  Query: {searchTerm} <X size={12} />
                </button>
              )}
            </div>
          )}

          {showAdvanced && (
            <div className="flex flex-wrap gap-3 items-center">
              <label className="text-xs text-gray-500">Insulin</label>
              <select className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" value={insulinFilter} onChange={(e) => setInsulinFilter(e.target.value)}>
                {insulinOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              <label className="text-xs text-gray-500">Gender</label>
              <select className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                {genderOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-5 mb-6">
        <SummaryCard label="Total Patients" value={summaryLoading ? '...' : (summary.total || meta?.total || 0)} type="total" />
        <SummaryCard label="Improving" value={summaryLoading ? '...' : summary.improving} type="improving" />
        <SummaryCard label="Stable" value={summaryLoading ? '...' : summary.stable} type="stable" />
        <SummaryCard label="Worsening" value={summaryLoading ? '...' : summary.worsening} type="worsening" />
      </div>

      <Card className="overflow-hidden p-0 rounded-xl ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur text-xs uppercase font-semibold text-gray-600 border-b">
            <tr>
              <th className="px-4 py-2.5">
                <button onClick={() => toggleSort('name')} className="inline-flex items-center gap-1 hover:text-gray-900">Name {sortBy==='name' && (sortDir==='asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/> )}</button>
              </th>
              <th className="px-4 py-2.5">
                <button onClick={() => toggleSort('age')} className="inline-flex items-center gap-1 hover:text-gray-900">Age {sortBy==='age' && (sortDir==='asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/> )}</button>
              </th>
              <th className="px-4 py-2.5">
                <button onClick={() => toggleSort('gender')} className="inline-flex items-center gap-1 hover:text-gray-900">Gender {sortBy==='gender' && (sortDir==='asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/> )}</button>
              </th>
              <th className="px-4 py-2.5">Insulin</th>
              <th className="px-4 py-2.5">FVG</th>
              <th className="px-4 py-2.5">HbA1c 1st</th>
              <th className="px-4 py-2.5">HbA1c 2nd</th>
              <th className="px-4 py-2.5">HbA1c 3rd</th>
              <th className="px-4 py-2.5">Avg FVG</th>
              <th className="px-4 py-2.5">FVG Δ</th>
              <th className="px-4 py-2.5">HbA1c Δ</th>
              <th className="px-4 py-2.5">Drop/Day</th>
              <th className="px-4 py-2.5">DDS Δ</th>
              <th className="px-4 py-2.5">Gap (1st→3rd)</th>
              <th className="px-4 py-2.5">Gap (2nd→3rd)</th>
              <th className="px-4 py-2.5">
                <button onClick={() => toggleSort('status')} className="inline-flex items-center gap-1 hover:text-gray-900">Status {sortBy==='status' && (sortDir==='asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/> )}</button>
              </th>
              <th className="px-4 py-2.5 text-center">Actions</th>
            </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="16" className="text-center py-6 text-gray-500">
                    No matching patients found.
                  </td>
                </tr>
              ) : (
                visiblePatients.map((p) => (
                  <tr key={p.id} className="odd:bg-white even:bg-gray-50 hover:bg-emerald-50/30 transition border-b border-gray-200">
                    <td className="px-4 py-2.5 text-blue-600 font-medium">
                      <Link to={`/patient/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">{p.age}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.gender === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                        {p.gender}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${insulinColors[p.insulin_regimen_type] || 'bg-gray-100 text-gray-500'}`}>
                        {p.insulin_regimen_type || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{p.fvg ?? '-'}</td>
                    <td className="px-4 py-2.5">{p.hba1c_1st_visit ?? '-'}</td>
                    <td className="px-4 py-2.5">{p.hba1c_2nd_visit ?? '-'}</td>
                    <td className="px-4 py-2.5">{p.hba1c_3rd_visit ?? '-'}</td>
                    <td className="px-4 py-2.5">{p.avg_fvg_1_2 ?? '-'}</td>
                    <td className="px-4 py-2.5">{formatTrend(p.fvg_delta_1_2)}</td>
                    <td className="px-4 py-2.5">{formatTrend(p.reduction_a)}</td>
                    <td className="px-4 py-2.5">{formatTrend(p.reduction_a_per_day)}</td>
                    <td className="px-4 py-2.5">{formatTrend(p.dds_trend_1_3)}</td>
                    <td className="px-4 py-2.5">{formatGap(p.gap_from_initial_visit)}</td>
                    <td className="px-4 py-2.5">{formatGap(p.gap_from_first_clinical_visit)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusTag(p) === 'Improving' ? 'bg-green-100 text-green-700' : getStatusTag(p) === 'Worsening' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {getStatusTag(p)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Link to={`/patient/${p.id}`} title="View" className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-blue-600">
                          <Eye size={16} />
                        </Link>
                        {user?.role === 'doctor' && (
                          <Link to={`/predict/${p.id}`} title="Risk Prediction" className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-emerald-600">
                            <LineChart size={16} />
                          </Link>
                        )}
                        {user?.role === 'admin' && (
                          <>
                            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs border border-gray-200">
                              {p.assigned_doctor_id
                                ? (doctors.find(d => d.id === p.assigned_doctor_id)?.name || `Doctor #${p.assigned_doctor_id}`)
                                : 'Unassigned'}
                            </span>
                            <button onClick={() => handleDelete(p.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 text-rose-600" title="Delete Patient">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 bg-white hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            Prev
          </button>
          {[...Array(totalPages)].map((_, idx) => {
            const pageNum = idx + 1;
            const active = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1.5 border rounded-md focus-visible:outline-none focus-visible:ring-2 ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
              >
                {pageNum}
              </button>
            );
          })}
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 bg-white hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            Next
          </button>
        </div>
      )}
      {/* Assign modal */}
      <AssignPairModal
        open={assignOpen}
        preselectPatientId={assignPatientId}
        onClose={() => setAssignOpen(false)}
        onAssigned={async () => { setAssignOpen(false); await refreshCurrentPage(); }}
      />
    </div>
  );
};

const SummaryCard = ({ label, value, type }) => {
  const tone = {
    total: {
      card: 'bg-emerald-50 border border-emerald-100 text-emerald-700',
      iconWrap: 'bg-emerald-100 text-emerald-700',
      icon: <UsersIcon size={18} />,
    },
    improving: {
      card: 'bg-blue-50 border border-blue-100 text-blue-700',
      iconWrap: 'bg-blue-100 text-blue-700',
      icon: <TrendingUp size={18} />,
    },
    stable: {
      card: 'bg-amber-50 border border-amber-100 text-amber-700',
      iconWrap: 'bg-amber-100 text-amber-700',
      icon: <ActivityIcon size={18} />,
    },
    worsening: {
      card: 'bg-rose-50 border border-rose-100 text-rose-700',
      iconWrap: 'bg-rose-100 text-rose-700',
      icon: <TrendingDown size={18} />,
    },
  };

  const palette = tone[type] ?? tone.total;

  return (
    <Card className={`flex items-center gap-3 px-4 py-3 shadow-sm ${palette.card}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${palette.iconWrap}`}>
        {palette.icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold leading-tight text-current">{value}</p>
      </div>
    </Card>
  );
};

export default PatientsList;
