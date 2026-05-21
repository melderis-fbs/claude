'use client';

export default function MonthSelector({ months, selected, onChange }) {
  return (
    <select
      value={selected}
      onChange={e => onChange(e.target.value)}
      className="text-sm font-medium text-ink-1 bg-white border border-cream rounded-full px-3 py-1.5 outline-none cursor-pointer hover:border-cream-dark transition-colors"
    >
      {months.map(m => (
        <option key={m.value} value={m.value}>{m.label}</option>
      ))}
    </select>
  );
}
