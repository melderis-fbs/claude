'use client';
import clsx from 'clsx';

export default function TabNav({ tabs, active, onChange }) {
  return (
    <div className="flex overflow-x-auto scrollbar-hide border-b border-cream bg-white">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'flex-shrink-0 px-4 py-3 text-xs font-semibold tracking-widest uppercase border-b-2 transition-colors whitespace-nowrap',
            active === tab.id
              ? 'border-ink-1 text-ink-1'
              : 'border-transparent text-ink-3 hover:text-ink-2'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
