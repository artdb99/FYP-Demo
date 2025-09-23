export default function RiskBadge({ label }) {
  const map = {
    'Normal': 'bg-green-100 text-green-700',
    'At Risk': 'bg-yellow-100 text-yellow-700',
    'Moderate Risk': 'bg-yellow-200 text-yellow-800',
    'Risky': 'bg-orange-200 text-orange-800',
    'Very Risky': 'bg-red-200 text-red-700',
    'Critical': 'bg-red-800 text-white',
  };
  const cls = map[label] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}
