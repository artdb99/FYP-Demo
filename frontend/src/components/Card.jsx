export default function Card({ className = '', children }) {
  const base = 'border rounded-xl shadow p-5';
  const hasCustomBg = /\bbg-/.test(className) || /gradient/.test(className) || /background/.test(className);
  const classes = [base];
  if (!hasCustomBg) {
    classes.push('bg-white');
  }
  if (className) {
    classes.push(className);
  }
  return <div className={classes.join(' ').trim()}>{children}</div>;
}
