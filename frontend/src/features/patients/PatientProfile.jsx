import React, { useEffect, useState, useRef } from 'react';
import { useUser } from '@/UserContext.jsx';
import { useParams, Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { Activity, CalendarClock, Droplet, Edit3, Scale, ShieldCheck, Stethoscope, User as UserIcon } from 'lucide-react';
import Card from '@/components/Card.jsx';
import { patientsApi } from '../../api/patients';

const PatientProfile = () => {
  const { id } = useParams();
  const { user } = useUser();
  const [patient, setPatient] = useState(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'N/A';

  const activityMeta = (level) => {
    switch (level) {
      case '1–2 times per week':
        return { label: 'Light', pct: 30 };
      case '3–4 times per week':
        return { label: 'Moderate', pct: 60 };
      case '5–6 times per week':
        return { label: 'Active', pct: 85 };
      case 'Daily':
        return { label: 'Very Active', pct: 100 };
      default:
        return { label: 'Not set', pct: 0 };
    }
  };

  useEffect(() => {
    patientsApi.getById(id).then(setPatient);
  }, [id]);

  useEffect(() => {
    if (!patient || !chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    const dataPoints = [
      toNumeric(patient.hba1c_1st_visit),
      toNumeric(patient.hba1c_2nd_visit),
      toNumeric(patient.hba1c_3rd_visit),
    ];

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Visit 1', 'Visit 2', 'Visit 3'],
        datasets: [
          {
            label: 'HbA1c',
            data: dataPoints,
            borderColor: '#3b82f6',
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBorderWidth: 2,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#3b82f6',
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `HbA1c: ${formatNumber(ctx.raw, 1)}%`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              color: '#475569',
              callback: (value) => `${Number(value).toFixed(1)}%`,
            },
            title: {
              display: true,
              text: 'HbA1c (%)',
              color: '#1f2937',
              font: { weight: 'bold' },
            },
          },
          x: {
            ticks: { color: '#475569' },
          },
        },
      },
    });
  }, [patient]);

  if (!patient) {
    return (
      <div className="w-full px-6 md:px-10 lg:px-14 py-16 flex items-center justify-center text-slate-400 text-sm">
        Loading patient data...
      </div>
    );
  }

  const hba1cDropRaw = toNumeric(patient.reduction_a);
  const hba1cDrop = hba1cDropRaw != null ? Number(hba1cDropRaw.toFixed(1)) : null;
  const fvgDelta = toNumeric(patient.fvg_delta_1_2);
  const ddsTrend = toNumeric(patient.dds_trend_1_3);

  const bmiValue =
    toNumeric(patient?.weight_kg) && toNumeric(patient?.height_cm)
      ? toNumeric(patient.weight_kg) / Math.pow(toNumeric(patient.height_cm) / 100, 2)
      : null;
  const bmi = bmiValue != null ? Number(bmiValue.toFixed(1)) : null;

  const bmiCategory = bmi
    ? bmi < 18.5
      ? { label: 'Underweight', color: 'text-yellow-600' }
      : bmi < 25
      ? { label: 'Normal', color: 'text-green-600' }
      : bmi < 30
      ? { label: 'Overweight', color: 'text-orange-600' }
      : { label: 'Obese', color: 'text-red-600' }
    : { label: 'N/A', color: 'text-gray-400' };

  const pa = activityMeta(patient.physical_activity);

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

  return (
    <div className="w-full px-6 md:px-10 lg:px-14 py-10 space-y-8 text-slate-900">
      <Card className="border-0 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100/60 shadow-xl px-6 sm:px-8 py-8 space-y-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-5">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0D8ABC&color=fff`}
              alt={patient.name}
              className="h-20 w-20 rounded-2xl border-4 border-white shadow-lg"
            />
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Patient overview</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{patient.name}</h1>
              <p className="text-sm text-emerald-600">
                {patient.gender} · {patient.age} years old · Insulin regimen {patient.insulin_regimen_type || 'N/A'}
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-600">
                <ShieldCheck size={14} />
                {getStatusTag(patient)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <HeroChip icon={<CalendarClock size={16} />} label="First visit" value={formatDate(patient.first_visit_date)} />
            <HeroChip icon={<Droplet size={16} />} label="Latest HbA1c" value={`${formatNumber(patient.hba1c_3rd_visit, 1)}%`} />
            <HeroChip icon={<Activity size={16} />} label="Activity" value={pa.label} />
            {(user?.role === 'doctor' || user?.role === 'admin') && (
              <Link
                to={`/patient/update/${patient.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <Edit3 size={16} />
                Edit profile
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile tone="emerald" icon={<Droplet size={18} />} label="HbA1c (visit 3)" value={`${formatNumber(patient.hba1c_3rd_visit, 1)}%`} delta={hba1cDrop != null ? `↓ ${hba1cDrop.toFixed(1)}%` : ''} />
        <SummaryTile tone="cyan" icon={<Activity size={18} />} label="FVG delta" value={formatNumber(fvgDelta, 1)} delta="vs visit 1" />
        <SummaryTile tone="purple" icon={<Stethoscope size={18} />} label="DDS trend" value={formatNumber(ddsTrend, 1)} delta={ddsTrend != null ? `${ddsTrend > 0 ? '+' : ''}${formatNumber(ddsTrend, 1)} pts` : ''} />
        <SummaryTile tone="sky" icon={<Scale size={18} />} label="BMI" value={bmi != null ? formatNumber(bmi, 1) : 'N/A'} delta={bmiCategory.label} badgeClass={bmiCategory.color} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="rounded-2xl bg-gradient-to-br from-white via-emerald-50/70 to-white shadow-md ring-1 ring-emerald-100/70 px-6 py-6 space-y-6">
          <SectionTitle icon={<UserIcon size={16} />} title="Identity & contact" />
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoItem icon="📏" label="Height" value={patient.height_cm ? `${patient.height_cm} cm` : 'N/A'} />
            <InfoItem icon="⚖️" label="Weight" value={patient.weight_kg ? `${patient.weight_kg} kg` : 'N/A'} />
            <InfoItem icon="💉" label="Insulin regimen" value={patient.insulin_regimen_type || 'N/A'} />
            <InfoItem icon="❤️" label="Activity" value={patient.physical_activity || 'N/A'} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoItem icon="📧" label="Email" value={patient.email || 'N/A'} />
            <InfoItem icon="📞" label="Phone" value={patient.phone || 'N/A'} />
          </div>
          <div>
            <SectionTitle icon={<CalendarClock size={14} />} title="Visit timeline" subtle />
            <div className="grid sm:grid-cols-3 gap-3 mt-2">
              <InfoItem icon="①" label="First visit" value={formatDate(patient.first_visit_date)} />
              <InfoItem icon="②" label="Second" value={formatDate(patient.second_visit_date)} />
              <InfoItem icon="③" label="Third" value={formatDate(patient.third_visit_date)} />
            </div>
          </div>
          <div>
            <SectionTitle icon={<Edit3 size={14} />} title="Clinician remarks" subtle />
            <div className={`mt-2 rounded-xl border px-4 py-4 text-sm shadow-sm ${patient.remarks ? 'border-amber-200 bg-amber-50/60 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-500 italic'}`}>
              {patient.remarks && patient.remarks.trim() !== '' ? `“${patient.remarks}”` : 'No remarks recorded.'}
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-white via-sky-50/60 to-white shadow-md ring-1 ring-emerald-100/70 px-6 py-6 space-y-6">
          <SectionTitle icon={<Droplet size={16} />} title="HbA1c trajectory" />
          <div className="w-full h-[460px]">
            <canvas ref={chartRef} className="h-full w-full"></canvas>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="rounded-2xl bg-gradient-to-br from-white via-emerald-50/65 to-white shadow-md ring-1 ring-emerald-100/70 px-6 py-6 space-y-5">
          <SectionTitle icon={<Stethoscope size={16} />} title="Treatment progression" />
          <ProgressItem label="HbA1c reduction" value={safePercent(patient.reduction_a, patient.hba1c_1st_visit)} color="bg-indigo-500" />
          <ProgressItem label="FVG improvement" value={safePercent(patient.fvg_delta_1_2, patient.fvg_1)} color="bg-emerald-500" />
          <ProgressItem label="DDS reduction" value={safePercent(patient.dds_trend_1_3, patient.dds_1)} color="bg-amber-500" />
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-600">
            <InfoStack label="HbA1c drop per day" value={patient.reduction_a_per_day?.toFixed(3) ?? '—'} />
            <InfoStack label="Average FVG" value={patient.avg_fvg_1_2 ?? '—'} />
            <InfoStack label="Gap visit 1→3" value={`${Math.round(patient.gap_from_initial_visit ?? 0)} days`} />
            <InfoStack label="Gap visit 2→3" value={`${Math.round(patient.gap_from_first_clinical_visit ?? 0)} days`} />
          </div>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-white via-emerald-50/65 to-white shadow-md ring-1 ring-emerald-100/70 px-6 py-6">
          <SectionTitle icon={<CalendarClock size={16} />} title="Visit snapshots" />
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-3 mt-4">
            <VisitCard visit="Visit 1" hba1c={patient.hba1c_1st_visit} fvg={patient.fvg_1} dds={patient.dds_1} />
            <VisitCard visit="Visit 2" hba1c={patient.hba1c_2nd_visit} fvg={patient.fvg_2} dds={(patient.dds_1 + patient.dds_3) / 2} />
            <VisitCard visit="Visit 3" hba1c={patient.hba1c_3rd_visit} fvg={patient.fvg_3} dds={patient.dds_3} />
          </div>
        </Card>
      </div>
    </div>
  );
};

const safePercent = (numerator, denominator) => {
  const num = toNumeric(numerator);
  const den = toNumeric(denominator);
  if (num == null || den == null || den === 0) return 0;
  const ratio = (num / den) * 100;
  if (!Number.isFinite(ratio)) return 0;
  const clamped = Math.max(Math.min(ratio, 200), -200);
  return Number(clamped.toFixed(1));
};

const toNumeric = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const SummaryTile = ({ tone = 'emerald', icon, label, value, delta, badgeClass }) => {
  const toneStyles = {
    emerald: {
      card: 'bg-emerald-50 border border-emerald-100 text-emerald-700',
      iconWrap: 'bg-emerald-100 text-emerald-700',
    },
    cyan: {
      card: 'bg-cyan-50 border border-cyan-100 text-cyan-700',
      iconWrap: 'bg-cyan-100 text-cyan-700',
    },
    purple: {
      card: 'bg-purple-50 border border-purple-100 text-purple-700',
      iconWrap: 'bg-purple-100 text-purple-700',
    },
    sky: {
      card: 'bg-sky-50 border border-sky-100 text-sky-700',
      iconWrap: 'bg-sky-100 text-sky-700',
    },
  };
  const palette = toneStyles[tone] ?? toneStyles.emerald;

  return (
    <Card className={`flex items-center justify-between px-4 py-4 shadow-sm ${palette.card}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${palette.iconWrap}`}>{icon}</div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold leading-tight text-slate-900">{value}</p>
        </div>
      </div>
      {delta && (
        <span className={`text-xs font-semibold uppercase tracking-wide ${badgeClass || 'text-slate-600'}`}>{delta}</span>
      )}
    </Card>
  );
};

const HeroChip = ({ icon, label, value }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-2 text-xs text-slate-600 shadow-sm">
    <span className="text-emerald-400">{icon}</span>
    <span className="font-semibold uppercase tracking-[0.2em] text-emerald-400">{label}</span>
    <span className="text-slate-700 font-semibold">{value}</span>
  </div>
);

const SectionTitle = ({ icon, title, subtle = false }) => (
  <div className="flex items-center gap-2">
    <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${subtle ? 'bg-slate-50 text-slate-400' : 'bg-emerald-50 text-emerald-500'}`}>
      {icon}
    </span>
    <div>
      <p className={`text-xs uppercase tracking-[0.2em] ${subtle ? 'text-slate-400' : 'text-emerald-400 font-semibold'}`}>{title}</p>
    </div>
  </div>
);

const MetricChip = ({ label, value }) => (
  <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
    {label}: <span className="text-slate-700">{value}</span>
  </div>
);

const ProgressItem = ({ label, value, color }) => {
  const numeric = Number.isFinite(value) ? value : 0;
  const width = Math.min(Math.abs(numeric), 100);
  const barColor = numeric >= 0 ? color : 'bg-rose-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-wide">
        <span>{label}</span>
        <span className={`text-sm font-semibold ${numeric >= 0 ? 'text-slate-700' : 'text-rose-600'}`}>
          {numeric >= 0 ? numeric.toFixed(1) : `-${Math.abs(numeric).toFixed(1)}`}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`${barColor} h-full transition-all`} style={{ width: `${width}%` }}></div>
      </div>
    </div>
  );
};

const VisitCard = ({ visit, hba1c, fvg, dds }) => (
  <div className="flex h-full flex-col justify-between rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-white px-4 py-5 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">{visit}</p>
      <span className="text-[11px] font-semibold text-slate-400">Timeline</span>
    </div>
    <div className="mt-4 space-y-3 text-sm">
      <VisitMetric label="HbA1c" value={formatNumber(hba1c, 1)} tone="text-indigo-600" />
      <VisitMetric label="FVG" value={formatNumber(fvg, 1)} tone="text-emerald-600" />
      <VisitMetric label="DDS" value={formatNumber(dds, 2)} tone="text-purple-600" />
    </div>
  </div>
);

const VisitMetric = ({ label, value, tone }) => (
  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
    <span className={`text-sm font-semibold ${tone}`}>{value}</span>
  </div>
);

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-white via-emerald-50/50 to-white px-3 py-2 text-sm shadow-sm">
    <span className="text-lg">{icon}</span>
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="font-semibold text-slate-700">{value}</p>
    </div>
  </div>
);

const InfoStack = ({ label, value }) => (
  <div className="rounded-lg border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-white px-3 py-2">
    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-slate-700 mt-1">{value}</p>
  </div>
);

const formatNumber = (val, decimals = 1) => {
  if (typeof val !== 'number') return '—';
  return val.toFixed(decimals);
};

export default PatientProfile;
