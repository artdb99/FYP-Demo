import React, { useEffect, useState } from 'react';
import { ClipboardPlus } from 'lucide-react';
import { useUser } from '@/UserContext.jsx';
import Card from '@/components/Card.jsx';

const CreatePatient = () => {
  const { user } = useUser();
  const [doctors, setDoctors] = useState([]);
  const [assignedDoctorId, setAssignedDoctorId] = useState('');

  const makeInitialFormData = () => ({
    name: '',
    age: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    physical_activity: '',
    insulinType: '',
    medicalHistory: '',
    medications: '',
    remarks: '',
    fvg: '',
    fvg_1: '',
    fvg_2: '',
    fvg_3: '',
    hba1c1: '',
    hba1c2: '',
    hba1c3: '',
    egfr: '',
    dds_1: '',
    dds_3: '',
    first_visit_date: '',
    second_visit_date: '',
    third_visit_date: '',
  });

  const [formData, setFormData] = useState(makeInitialFormData);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const enrichedData = {
      ...formData,
      fvg: parseFloat(formData.fvg),
      fvg_1: parseFloat(formData.fvg_1),
      fvg_2: parseFloat(formData.fvg_2),
      fvg_3: parseFloat(formData.fvg_3),
      hba1c1: parseFloat(formData.hba1c1),
      hba1c2: parseFloat(formData.hba1c2),
      hba1c3: parseFloat(formData.hba1c3),
      egfr: parseFloat(formData.egfr),
      dds_1: parseFloat(formData.dds_1),
      dds_3: parseFloat(formData.dds_3),
      height_cm: parseFloat(formData.height_cm),
      weight_kg: parseFloat(formData.weight_kg),
      first_visit_date: formData.first_visit_date,
      second_visit_date: formData.second_visit_date,
      third_visit_date: formData.third_visit_date
    };

    // Assignment logic
    if (user?.role === 'doctor') {
      enrichedData.assigned_doctor_id = user.id;
    } else if (user?.role === 'admin' && assignedDoctorId) {
      enrichedData.assigned_doctor_id = Number(assignedDoctorId);
    }

    try {
      const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://localhost:8000";
      const res = await fetch(`${laravelUrl}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedData)
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      await res.json();
      alert('Patient created!');
    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to create patient. The API might not be implemented yet.');
    }
  };

  // Load doctors for admin assignment
  useEffect(() => {
    const loadDoctors = async () => {
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
    loadDoctors();
  }, [user]);

  return (
    <div className="w-full px-6 md:px-10 lg:px-14 py-10 space-y-10">
      <Card className="border-0 rounded-3xl bg-gradient-to-br from-white via-rose-50 to-rose-100 ring-1 ring-rose-100/70 shadow-xl px-6 sm:px-8 py-8 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <ClipboardPlus size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-rose-400">Patient onboarding</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Create Patient Record</h1>
              <p className="text-xs text-rose-400 mt-1">Capture baseline data to unlock tailored risk and therapy analytics.</p>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8">
        {user?.role === 'admin' && (
          <Card className="rounded-2xl bg-white shadow-md ring-1 ring-amber-100/70 px-6 py-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-400">Assignment</p>
                <h2 className="text-xl font-semibold text-amber-700">Assign to Doctor (optional)</h2>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Select
                label="Doctor"
                name="assigned_doctor"
                value={assignedDoctorId}
                onChange={(e) => setAssignedDoctorId(e.target.value)}
                options={doctors.map((d) => ({ label: d.name, value: d.id }))}
                placeholder="Unassigned"
              />
            </div>
          </Card>
        )}

        <Card className="rounded-2xl bg-white shadow-md ring-1 ring-indigo-100/70 px-6 py-6 space-y-6">
          <SectionHeader icon="🧍‍♂️" title="Basic information" subtitle="Demographics and lifestyle" />
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Full name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter patient’s full name" />
            <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} placeholder="Enter age" />
            <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
            <Select label="Insulin regimen type" name="insulinType" value={formData.insulinType} onChange={handleChange} options={["BB", "PTDS", "PBD"]} />
            <Input label="Height (cm)" name="height_cm" type="number" step="0.1" value={formData.height_cm} onChange={handleChange} placeholder="170.0" />
            <Input label="Weight (kg)" name="weight_kg" type="number" step="0.1" value={formData.weight_kg} onChange={handleChange} placeholder="68.5" />
            <Select label="Physical activity" name="physical_activity" value={formData.physical_activity} onChange={handleChange} options={['1–2 times per week','3–4 times per week','5–6 times per week','Daily']} />
          </div>
        </Card>

        <Card className="rounded-2xl bg-white shadow-md ring-1 ring-emerald-100/70 px-6 py-6 space-y-6">
          <SectionHeader icon="📝" title="Medical background" subtitle="Narrative history for context" />
          <div className="grid md:grid-cols-2 gap-4">
            <Textarea label="Medical history" name="medicalHistory" value={formData.medicalHistory} onChange={handleChange} placeholder="Enter relevant medical history" />
            <Textarea label="Current medications" name="medications" value={formData.medications} onChange={handleChange} placeholder="List current medications" />
            <Textarea label="Additional remarks" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Any additional notes or observations" className="md:col-span-2" />
          </div>
        </Card>

        <Card className="rounded-2xl bg-white shadow-md ring-1 ring-purple-100/70 px-6 py-6 space-y-8">
          <SectionHeader icon="📊" title="Clinical indicators" subtitle="Structured biomarker capture" />

          <Fieldset title="Fasting venous glucose (FVG)">
            <div className="grid md:grid-cols-4 gap-4">
              <Input name="fvg" label="Initial FVG" value={formData.fvg} onChange={handleChange} placeholder="mmol/L" />
              <Input name="fvg_1" label="FVG (1st visit)" value={formData.fvg_1} onChange={handleChange} placeholder="mmol/L" />
              <Input name="fvg_2" label="FVG (2nd visit)" value={formData.fvg_2} onChange={handleChange} placeholder="mmol/L" />
              <Input name="fvg_3" label="FVG (3rd visit)" value={formData.fvg_3} onChange={handleChange} placeholder="mmol/L" />
            </div>
          </Fieldset>

          <Fieldset title="HbA1c measurements">
            <div className="grid md:grid-cols-3 gap-4">
              <Input name="hba1c1" label="HbA1c (1st reading)" value={formData.hba1c1} onChange={handleChange} placeholder="%" />
              <Input name="hba1c2" label="HbA1c (2nd reading)" value={formData.hba1c2} onChange={handleChange} placeholder="%" />
              <Input name="hba1c3" label="HbA1c (3rd reading)" value={formData.hba1c3} onChange={handleChange} placeholder="%" />
            </div>
          </Fieldset>

          <Fieldset title="Other clinical indicators">
            <div className="grid md:grid-cols-3 gap-4">
              <Input name="egfr" label="eGFR" value={formData.egfr} onChange={handleChange} placeholder="mL/min/1.73m²" />
              <Input name="dds_1" label="DDS (1st reading)" value={formData.dds_1} onChange={handleChange} placeholder="Score" />
              <Input name="dds_3" label="DDS (3rd reading)" value={formData.dds_3} onChange={handleChange} placeholder="Score" />
            </div>
          </Fieldset>

          <Fieldset title="Visit timeline">
            <div className="grid md:grid-cols-3 gap-4">
              <Input name="first_visit_date" label="First visit date" type="date" value={formData.first_visit_date} onChange={handleChange} />
              <Input name="second_visit_date" label="Second visit date" type="date" value={formData.second_visit_date} onChange={handleChange} />
              <Input name="third_visit_date" label="Third visit date" type="date" value={formData.third_visit_date} onChange={handleChange} />
            </div>
          </Fieldset>
        </Card>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setFormData(makeInitialFormData())}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-slate-200 bg-white/80 text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            Reset form
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-full border border-rose-200 bg-rose-500/90 text-white hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            Create patient record
          </button>
        </div>
      </form>
    </div>
  );
};

const labelClass = 'text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2 block';
const controlBaseClass = 'w-full rounded-xl border border-white/70 bg-white/90 px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-1 focus-visible:ring-offset-white transition';

const Input = ({ label, name, value, onChange, placeholder, type = 'text', className = '' }) => (
  <div className={className}>
    <label className={labelClass}>{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={controlBaseClass}
    />
  </div>
);

const Textarea = ({ label, name, value, onChange, placeholder, className = '' }) => (
  <div className={className}>
    <label className={labelClass}>{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows="3"
      className={`${controlBaseClass} min-h-[120px]`}
    />
  </div>
);

const Select = ({ label, name, value, onChange, options = [], placeholder = '', className = '' }) => (
  <div className={className}>
    <label className={labelClass}>{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={controlBaseClass}
    >
      <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
      {options.map((opt) => {
        if (typeof opt === 'string') {
          return <option key={opt} value={opt}>{opt}</option>;
        }
        return <option key={opt.value} value={opt.value}>{opt.label}</option>;
      })}
    </select>
  </div>
);

const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-slate-700">
      <span className="text-lg">{icon}</span>
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
    </div>
    <p className="text-xs text-slate-500">{subtitle}</p>
  </div>
);

const Fieldset = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</h3>
    {children}
  </div>
);

const HeroMetric = ({ icon, label, value }) => (
  <div className="rounded-xl bg-white/70 border border-white/60 px-4 py-3 shadow-sm flex items-center gap-3">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-500">
      {icon}
    </div>
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-rose-300">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-1">{value}</p>
    </div>
  </div>
);

export default CreatePatient;
