export default function StatusBadge({ status }) {
  const badgeColors = {
    Improving: 'bg-green-100 text-green-700',
    Worsening: 'bg-red-100 text-red-600',
    Stable: 'bg-yellow-100 text-yellow-600',
    Review: 'bg-orange-100 text-orange-700',
    'Needs Review': 'bg-orange-100 text-orange-700',
  };
  const cls = badgeColors[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${cls}`}>
      {status}
    </span>
  );
}
