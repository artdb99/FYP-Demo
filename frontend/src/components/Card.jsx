export default function Card({ className = '', children }) {
  const base = 'bg-white border rounded-xl shadow p-5';
  return <div className={`${base} ${className}`.trim()}>{children}</div>;
}
