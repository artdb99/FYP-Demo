import React, { useEffect, useMemo, useState } from 'react';
import { X, Search as SearchIcon, CheckCircle } from 'lucide-react';
import { patientsApi } from '../../api/patients';

export default function AssignPairModal({ open, onClose, onAssigned, preselectPatientId = null }) {
  const laravelUrl = useMemo(() => (import.meta.env.VITE_LARAVEL_URL || 'http://localhost:8000').replace(/\/$/, ''), []);

  const [qPatients, setQPatients] = useState('');
  const [qDoctors, setQDoctors] = useState('');
  const [patients, setPatients] = useState([]);
  const [patientsPage, setPatientsPage] = useState(1);
  const [patientsTotalPages, setPatientsTotalPages] = useState(1);
  const PATIENTS_PAGE_SIZE = 10;

  const [doctorsRaw, setDoctorsRaw] = useState([]);
  const [doctorsPage, setDoctorsPage] = useState(1);
  const [doctorsTotalPages, setDoctorsTotalPages] = useState(1);
  const DOCTORS_PAGE_SIZE = 10;
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!open) return;
    // reset selections
    setSelectedDoctor(null);
    if (preselectPatientId) {
      setSelectedPatient({ id: preselectPatientId });
    } else {
      setSelectedPatient(null);
    }
    setPatientsPage(1);
    setDoctorsPage(1);
  }, [open, preselectPatientId]);

  // Fetch patients with search
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      try {
        setLoadingPatients(true);
        const { data, meta } = await patientsApi.list({ perPage: PATIENTS_PAGE_SIZE, page: patientsPage, search: qPatients || undefined });
        if (!cancelled) {
          setPatients(data || []);
          setPatientsTotalPages(meta?.last_page || 1);
        }
      } finally {
        if (!cancelled) setLoadingPatients(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [open, qPatients, patientsPage]);

  // Reset patients page when query changes
  useEffect(() => {
    if (!open) return;
    setPatientsPage(1);
  }, [qPatients, open]);

  // Fetch doctors (admin users list)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      try {
        setLoadingDoctors(true);
        const res = await fetch(`${laravelUrl}/api/admin/users`);
        const data = await res.json();
        const docs = Array.isArray(data) ? data.filter(u => u.role === 'doctor') : [];
        if (!cancelled) setDoctorsRaw(docs);
      } finally {
        if (!cancelled) setLoadingDoctors(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [open, laravelUrl]);

  // Filter + paginate doctors client-side
  const filteredDoctors = useMemo(() => {
    const q = (qDoctors || '').toLowerCase();
    return doctorsRaw.filter(d => String(d.name || '').toLowerCase().includes(q) || String(d.email || '').toLowerCase().includes(q));
  }, [doctorsRaw, qDoctors]);

  const visibleDoctors = useMemo(() => {
    const start = (doctorsPage - 1) * DOCTORS_PAGE_SIZE;
    return filteredDoctors.slice(start, start + DOCTORS_PAGE_SIZE);
  }, [filteredDoctors, doctorsPage]);

  useEffect(() => {
    const total = Math.max(1, Math.ceil(filteredDoctors.length / DOCTORS_PAGE_SIZE));
    setDoctorsTotalPages(total);
    if (doctorsPage > total) setDoctorsPage(1);
  }, [filteredDoctors, doctorsPage]);

  useEffect(() => {
    if (!open) return;
    setDoctorsPage(1);
  }, [qDoctors, open]);

  const assign = async () => {
    if (!selectedPatient?.id || selectedDoctor?.id === undefined) return;
    try {
      setAssigning(true);
      await patientsApi.assignDoctor(selectedPatient.id, selectedDoctor.id);
      onAssigned?.({ patientId: selectedPatient.id, doctorId: selectedDoctor.id });
      onClose?.();
    } catch (e) {
      console.error('Assign failed', e);
      alert('Failed to assign doctor');
    } finally {
      setAssigning(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl mx-4 bg-white rounded-2xl shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">Assign Patient ↔ Doctor</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x">
          {/* Patients */}
          <div className="p-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Patients</div>
            <div className="relative mb-3">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={qPatients}
                onChange={e => setQPatients(e.target.value)}
                placeholder="Search patients..."
                className="w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              />
            </div>
            <div className="max-h-80 overflow-auto rounded-md border">
              {loadingPatients ? (
                <div className="p-3 text-sm text-gray-500">Loading...</div>
              ) : patients.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No patients</div>
              ) : (
                <ul>
                  {patients.map(p => (
                    <li key={p.id}>
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className={`w-full text-left px-3 py-2 border-b hover:bg-emerald-50 flex items-center justify-between ${selectedPatient?.id === p.id ? 'bg-emerald-50' : ''}`}
                      >
                        <span className="truncate">{p.name}</span>
                        {selectedPatient?.id === p.id && <CheckCircle size={16} className="text-emerald-600" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Page {patientsPage} / {patientsTotalPages}</span>
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                  onClick={() => setPatientsPage(p => Math.max(1, p - 1))}
                  disabled={patientsPage <= 1}
                >Prev</button>
                <button
                  className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                  onClick={() => setPatientsPage(p => Math.min(patientsTotalPages, p + 1))}
                  disabled={patientsPage >= patientsTotalPages}
                >Next</button>
              </div>
            </div>
          </div>

          {/* Doctors */}
          <div className="p-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Doctors</div>
            <div className="relative mb-3">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={qDoctors}
                onChange={e => setQDoctors(e.target.value)}
                placeholder="Search doctors..."
                className="w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              />
            </div>
            <div className="max-h-80 overflow-auto rounded-md border">
              {loadingDoctors ? (
                <div className="p-3 text-sm text-gray-500">Loading...</div>
              ) : visibleDoctors.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No doctors</div>
              ) : (
                <ul>
                  {visibleDoctors.map(d => (
                    <li key={d.id}>
                      <button
                        onClick={() => setSelectedDoctor(d)}
                        className={`w-full text-left px-3 py-2 border-b hover:bg-emerald-50 flex items-center justify-between ${selectedDoctor?.id === d.id ? 'bg-emerald-50' : ''}`}
                      >
                        <span className="truncate">{d.name} <span className="text-gray-400">{d.email ? `· ${d.email}` : ''}</span></span>
                        {selectedDoctor?.id === d.id && <CheckCircle size={16} className="text-emerald-600" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Page {doctorsPage} / {doctorsTotalPages}</span>
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                  onClick={() => setDoctorsPage(p => Math.max(1, p - 1))}
                  disabled={doctorsPage <= 1}
                >Prev</button>
                <button
                  className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                  onClick={() => setDoctorsPage(p => Math.min(doctorsTotalPages, p + 1))}
                  disabled={doctorsPage >= doctorsTotalPages}
                >Next</button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t">
          <div className="text-xs text-gray-500">
            {selectedPatient ? `Selected patient: ${selectedPatient.name || selectedPatient.id}` : 'Select a patient'}
            {selectedDoctor ? ` · Doctor: ${selectedDoctor.name}` : ''}
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-md border" onClick={onClose} disabled={assigning}>Cancel</button>
            <button
              className="px-3 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50"
              disabled={!selectedPatient?.id || !selectedDoctor?.id || assigning}
              onClick={assign}
            >{assigning ? 'Assigning...' : 'Assign'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
