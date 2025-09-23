export default function MetricBox({ label, value }) {
  return (
    <div className="bg-gray-50 border rounded-lg p-4 shadow-sm">
      <div className="text-gray-800 font-semibold text-lg">{value ?? '—'}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}
