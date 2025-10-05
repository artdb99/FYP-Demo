import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, HeartPulse, Users as UsersIcon } from 'lucide-react';
import PatientsList from '@/features/patients/PatientsList.jsx';
import Card from '@/components/Card.jsx';

const AdminPatients = () => {
  return (
    <div className="w-full px-6 md:px-10 lg:px-14 py-10 space-y-8">
      <Card className="border-0 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100/60 shadow-xl px-6 sm:px-8 py-8 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <UsersIcon size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Admin console</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Manage Patients</h1>
              <p className="text-xs text-emerald-400 mt-1">
                Review patient cohorts, monitor care status, and orchestrate clinician assignments.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link
              to="/admin/patients/create"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-500/90 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <CalendarPlus size={16} />
              New patient record
            </Link>
          </div>
        </div>
      </Card>

      <PatientsList hideHeader={true} />
    </div>
  );
};

export default AdminPatients;
