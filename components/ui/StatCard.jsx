'use client';
import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, trend, trendLabel, accent, className }) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-sm border border-cream p-4 flex flex-col gap-2',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-3 uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className={clsx(
            'p-2 rounded-lg',
            accent === 'teal'   ? 'bg-gold-light text-gold-dark' :
            accent === 'green'  ? 'bg-pos-light text-pos' :
            accent === 'red'    ? 'bg-neg-light text-neg' :
            accent === 'blue'   ? 'bg-cream text-ink-2' :
            accent === 'purple' ? 'bg-cream text-ink-2' :
            accent === 'orange' ? 'bg-gold-light text-gold-dark' :
            'bg-cream text-ink-2'
          )}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-ink-1 leading-tight">{value}</div>
      {(trend !== undefined || trendLabel) && (
        <div className={clsx(
          'flex items-center gap-1 text-xs font-medium',
          isPositive ? 'text-pos' : isNegative ? 'text-neg' : 'text-ink-3'
        )}>
          {trend !== undefined && (
            isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : null
          )}
          <span>{trendLabel || (trend > 0 ? `+${trend}%` : `${trend}%`)}</span>
        </div>
      )}
    </div>
  );
}
