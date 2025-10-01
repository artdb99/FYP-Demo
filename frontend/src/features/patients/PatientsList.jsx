import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useUser } from '@/UserContext.jsx';
import { patientsApi } from '../../api/patients';

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

  const handleAssignDoctor = async (patientId, doctorId) => {
    try {
      await patientsApi.assignDoctor(patientId, doctorId || null);
      // refresh current page
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

  const totalPages = meta?.last_page ?? Math.ceil(filteredPatients.length / pageSize);
  const visiblePatients = filteredPatients;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 text-gray-900 dark:text-gray-100">
      {!hideHeader && (
        <header className="bg-teal-500 text-white py-4 px-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Patient Management</h1>
              <p className="text-sm">Monitor clinical progress and therapy effectiveness</p>
            </div>
          </div>
        </header>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search patients by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <select className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <select className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={insulinFilter} onChange={(e) => setInsulinFilter(e.target.value)}>
          {insulinOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <select className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          {genderOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <select
          className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 ml-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
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

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Patients" value={summaryLoading ? '...' : (summary.total || meta?.total || 0)} type="total" />
        <SummaryCard label="Improving" value={summaryLoading ? '...' : summary.improving} type="improving" />
        <SummaryCard label="Stable" value={summaryLoading ? '...' : summary.stable} type="stable" />
        <SummaryCard label="Worsening" value={summaryLoading ? '...' : summary.worsening} type="worsening" />
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase font-semibold text-gray-500 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Insulin</th>
              <th className="px-4 py-3">FVG</th>
              <th className="px-4 py-3">HbA1c 1st</th>
              <th className="px-4 py-3">HbA1c 2nd</th>
              <th className="px-4 py-3">HbA1c 3rd</th>
              <th className="px-4 py-3">Avg FVG</th>
              <th className="px-4 py-3">FVG Δ</th>
              <th className="px-4 py-3">HbA1c Δ</th>
              <th className="px-4 py-3">Drop/Day</th>
              <th className="px-4 py-3">DDS Δ</th>
              <th className="px-4 py-3">Gap (1st→3rd)</th>
              <th className="px-4 py-3">Gap (2nd→3rd)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="17" className="text-center py-4 text-gray-500">
                  No matching patients found.
                </td>
              </tr>
            ) : (
              visiblePatients.map((p) => (
                <tr key={p.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="px-4 py-3 text-blue-600 font-medium">
                    <Link to={`/patient/${p.id}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.age}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.gender === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                      {p.gender}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${insulinColors[p.insulin_regimen_type] || 'bg-gray-100 text-gray-500'}`}>
                      {p.insulin_regimen_type || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.fvg ?? '-'}</td>
                  <td className="px-4 py-3">{p.hba1c_1st_visit ?? '-'}</td>
                  <td className="px-4 py-3">{p.hba1c_2nd_visit ?? '-'}</td>
                  <td className="px-4 py-3">{p.hba1c_3rd_visit ?? '-'}</td>
                  <td className="px-4 py-3">{p.avg_fvg_1_2 ?? '-'}</td>
                  <td className="px-4 py-3">{formatTrend(p.fvg_delta_1_2)}</td>
                  <td className="px-4 py-3">{formatTrend(p.reduction_a)}</td>
                  <td className="px-4 py-3">{formatTrend(p.reduction_a_per_day)}</td>
                  <td className="px-4 py-3">{formatTrend(p.dds_trend_1_3)}</td>
                  <td className="px-4 py-3">{formatGap(p.gap_from_initial_visit)}</td>
                  <td className="px-4 py-3">{formatGap(p.gap_from_first_clinical_visit)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusTag(p) === 'Improving' ? 'bg-green-100 text-green-700' : getStatusTag(p) === 'Worsening' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {getStatusTag(p)}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex flex-col sm:flex-row justify-center gap-2 text-blue-600">
                    <div className="flex items-center gap-2">
                      <Link to={`/patient/${p.id}`} title="View">
                        <Eye size={16} />
                      </Link>
                      {user?.role === 'doctor' && (
                        <Link to={`/predict/${p.id}`} title="Predict" className="underline text-xs ml-1">
                          Risk
                        </Link>
                      )}
                    </div>
                    {user?.role === 'admin' && (
                      <div className="flex items-center gap-2">
                        <select
                          className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                          value={p.assigned_doctor_id || ''}
                          onChange={(e) => handleAssignDoctor(p.id, e.target.value ? Number(e.target.value) : null)}
                          title="Assign doctor"
                        >
                          <option value="">Unassigned</option>
                          {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs ml-1" title="Delete Patient">🗑️</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            Prev
          </button>
          {[...Array(totalPages)].map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${pageNum === currentPage ? 'bg-indigo-500 text-white dark:text-white' : ''}`}>
                {pageNum}
              </button>
            );
          })}
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, type }) => {
  const colorMap = {
    total: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    improving: 'bg-green-100 text-green-700 border border-green-200',
    stable: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    worsening: 'bg-red-100 text-red-700 border border-red-200',
  };

  return (
    <div className={`p-4 rounded-lg shadow-sm text-center ${colorMap[type]}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
};

export default PatientsList;
