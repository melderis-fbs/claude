'use client';
import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, trend, trendLabel, accent, className }) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className={clsx(
            'p-2 rounded-lg',
            accent === 'teal' ? 'bg-teal-50 text-teal-700' :
            accent === 'green' ? 'bg-green-50 text-green-700' :
            accent === 'red' ? 'bg-red-50 text-red-600' :
            accent === 'blue' ? 'bg-blue-50 text-blue-700' :
            accent === 'purple' ? 'bg-purple-50 text-purple-700' :
            accent === 'orange' ? 'bg-orange-50 text-orange-700' :
            'bg-gray-50 text-gray-600'
          )}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
      {(trend !== undefined || trendLabel) && (
        <div className={clsx(
          'flex items-center gap-1 text-xs font-medium',
          isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-500'
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
