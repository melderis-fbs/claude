'use client';
import clsx from 'clsx';

export default function MonthSelector({ months, selected, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {months.map((month) => (
        <button
          key={month.value}
          onClick={() => onChange(month.value)}
          className={clsx(
            'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            selected === month.value
              ? 'bg-ink-1 text-white'
              : 'bg-white text-ink-2 border border-cream hover:border-cream-dark hover:text-ink-1'
          )}
        >
          {month.label}
        </button>
      ))}
    </div>
  );
}
