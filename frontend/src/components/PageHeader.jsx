export default function PageHeader({ title, subtitle, className = '' }) {
  return (
    <div className={`rounded-lg p-6 mb-8 text-white bg-teal-500 ${className}`.trim()}>
      <h2 className="text-xl font-bold">{title}</h2>
      {subtitle && (
        <p className="text-sm text-blue-100">{subtitle}</p>
      )}
    </div>
  );
}
