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
              ? 'bg-teal-700 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300 hover:text-teal-700'
          )}
        >
          {month.label}
        </button>
      ))}
    </div>
  );
}
