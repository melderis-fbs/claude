'use client';
import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import MonthSelector from '../ui/MonthSelector.jsx';
import clsx from 'clsx';

const MEDAL = ['🥇', '🥈', '🥉'];
const CLOSER_COLORS = ['#0f766e', '#0891b2', '#7c3aed', '#c2410c'];

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatARS(n) {
  if (typeof n !== 'number') return '$ 0';
  return `$ ${n.toLocaleString('es-AR')}`;
}

function formatARSShort(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}`;
}

const CLOSER_BG = ['bg-teal-700', 'bg-cyan-600', 'bg-violet-600', 'bg-orange-600'];

export default function Closers({ data, months, selectedMonth, onMonthChange }) {
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(c => c.mes === selectedMonth);
  }, [data, selectedMonth]);

  const ranked = useMemo(() => {
    return [...filtered].sort((a, b) => b.cierres - a.cierres);
  }, [filtered]);

  const allCloserNames = useMemo(() => {
    const set = new Set((data || []).map(c => c.nombre));
    return [...set];
  }, [data]);

  const chartData = ranked.map(c => ({
    nombre: c.nombre.split(' ')[0],
    cierres: c.cierres,
    llamadas: c.llamadas,
  }));

  return (
    <div className="space-y-5">
      {/* Month selector */}
      <MonthSelector months={months} selected={selectedMonth} onChange={onMonthChange} />

      {/* Performance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ranked.map((closer, i) => {
          const tasaNum = parseFloat(closer.tasa);
          return (
            <div key={closer.nombre} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className={clsx(
                  'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0',
                  CLOSER_BG[i % CLOSER_BG.length]
                )}>
                  {initials(closer.nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 truncate">{closer.nombre}</span>
                    {i < 3 && <span className="text-sm">{MEDAL[i]}</span>}
                  </div>
                  <div className="text-xs text-gray-500">Comercial</div>
                </div>
                <div className="text-right">
                  <div className={clsx(
                    'text-2xl font-bold',
                    tasaNum >= 35 ? 'text-teal-700' : tasaNum >= 20 ? 'text-blue-600' : 'text-gray-700'
                  )}>
                    {closer.tasa}%
                  </div>
                  <div className="text-xs text-gray-400">tasa</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-gray-800">{closer.llamadas}</div>
                  <div className="text-xs text-gray-400">Llamadas</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-teal-700">{closer.cierres}</div>
                  <div className="text-xs text-gray-400">Cierres</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-sm font-bold text-gray-800">{formatARSShort(closer.ingresos)}</div>
                  <div className="text-xs text-gray-400">Ingresos</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranking table */}
      {ranked.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Ranking del mes</h3>
          <div className="space-y-2">
            {ranked.map((c, i) => (
              <div key={c.nombre} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-6 text-center">
                  {i < 3 ? <span className="text-base">{MEDAL[i]}</span> : <span className="text-sm text-gray-400 font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{c.nombre}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-800">{c.cierres} cierres</div>
                  <div className="text-xs text-gray-400">{formatARS(c.ingresos)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Cierres por closer</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="cierres" name="Cierres" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <rect key={i} fill={CLOSER_COLORS[i % CLOSER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
