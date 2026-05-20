'use client';
import {
  DollarSign, TrendingDown, Scale, Phone, Calendar, Star, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import StatCard from '../ui/StatCard.jsx';
import clsx from 'clsx';

function formatARS(n) {
  if (typeof n !== 'number') return '$ 0';
  return `$ ${n.toLocaleString('es-AR')}`;
}

function formatARSShort(n) {
  if (n >= 1000000) return `$ ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$ ${(n / 1000).toFixed(0)}k`;
  return `$ ${n}`;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Overview({ data }) {
  if (!data) return null;

  const {
    ingresosMes, egresosMes, balanceNeto, llamadasHoy,
    agendasHoy, mejorCloser, chartData = [], urgentes = [], topClosers = [],
    updatedAt,
  } = data;

  const balancePositive = balanceNeto >= 0;

  return (
    <div className="space-y-5">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={DollarSign}
          label="Ingresos del mes"
          value={formatARS(ingresosMes)}
          accent="teal"
        />
        <StatCard
          icon={TrendingDown}
          label="Egresos del mes"
          value={formatARS(egresosMes)}
          accent="red"
        />
        <StatCard
          icon={Scale}
          label="Balance neto"
          value={formatARS(balanceNeto)}
          accent={balancePositive ? 'green' : 'red'}
          trendLabel={balancePositive ? 'Positivo' : 'Negativo'}
          trend={balancePositive ? 1 : -1}
        />
        <StatCard
          icon={Phone}
          label="Llamadas hoy"
          value={llamadasHoy}
          accent="blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Calendar}
          label="Agendas hoy"
          value={agendasHoy}
          accent="purple"
        />
        <StatCard
          icon={Star}
          label="Mejor closer del mes"
          value={mejorCloser || '—'}
          accent="orange"
        />
      </div>

      {/* Urgentes */}
      {urgentes.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-amber-600" />
            <h3 className="font-semibold text-amber-800 text-sm">Cosas urgentes — próximos 2 días</h3>
          </div>
          <div className="space-y-2">
            {urgentes.map((u, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-white rounded-lg px-3 py-2 border border-amber-100">
                <div>
                  <span className="font-medium text-gray-900 text-sm">{u.cliente}</span>
                  <span className="text-gray-500 text-xs ml-2">· {u.closer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">{u.proximoPaso}</span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{u.fecha}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Ingresos vs Egresos — últimas 4 semanas</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatARS(v)} labelStyle={{ fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top 3 closers */}
      {topClosers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Top closers del mes</h3>
          <div className="space-y-2">
            {topClosers.slice(0, 3).map((c, i) => (
              <div key={c.nombre} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{MEDAL[i]}</span>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{c.nombre}</div>
                    <div className="text-xs text-gray-500">{c.cierres} cierres · {c.tasa}% tasa</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-teal-700">{formatARS(c.ingresos)}</div>
                  <div className="text-xs text-gray-400">{c.llamadas} llamadas</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {updatedAt && (
        <p className="text-center text-xs text-gray-400 pb-2">
          Última actualización: {new Date(updatedAt).toLocaleString('es-AR')}
        </p>
      )}
    </div>
  );
}
