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
            'flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            active === tab.id
              ? 'border-gold text-gold-dark'
              : 'border-transparent text-ink-3 hover:text-ink-2 hover:border-cream-dark'
          )}
        >
          {tab.icon && <tab.icon size={15} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
