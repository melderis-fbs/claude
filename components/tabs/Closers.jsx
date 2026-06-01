'use client';
import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GitCompare } from 'lucide-react';
import clsx from 'clsx';

const medals = ['🥇', '🥈', '🥉'];

function Initials({ name }) {
  const parts = (name || '').split(' ');
  const ini = parts.slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-gold-light text-gold-dark flex items-center justify-center font-bold text-lg mx-auto mb-2">
      {ini}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-cream rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-ink-2 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function Closers({ data = [], months = [], selectedMonth, onMonthChange }) {
  const [compareMode, setCompareMode]   = useState(false);
  const [compareMonth, setCompareMonth] = useState('');

  const latestMonth = useMemo(() => {
    const ms = [...new Set(data.map(d => d.mes))].sort().reverse();
    return ms[0] || selectedMonth;
  }, [data, selectedMonth]);

  const effectiveMonth = useMemo(() => {
    return data.some(d => d.mes === selectedMonth) ? selectedMonth : latestMonth;
  }, [data, selectedMonth, latestMonth]);

  const filtered  = useMemo(() => data.filter(d => d.mes === effectiveMonth), [data, effectiveMonth]);
  const todosRow  = useMemo(() => filtered.find(d => d.closer?.toUpperCase() === 'TODOS'), [filtered]);
  const sorted    = useMemo(() => [...filtered].filter(d => d.closer?.toUpperCase() !== 'TODOS').sort((a, b) => b.cierres - a.cierres), [filtered]);

  const filteredB = useMemo(() =>
    compareMode && compareMonth ? data.filter(d => d.mes === compareMonth) : [],
  [data, compareMode, compareMonth]);

  const chartData = sorted.map(c => ({
    name:        c.closer.split(' ')[0],
    Agendadas:   c.agendadas,
    Asistencias: c.asistencias,
    Cierres:     c.cierres,
  }));

  // Label for the effective month
  const monthLabel = months.find(m => m.value === effectiveMonth)?.label || effectiveMonth;
  const compareLbl = months.find(m => m.value === compareMonth)?.label  || compareMonth;

  return (
    <div className="space-y-5">

      {/* Toggle comparar */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setCompareMode(m => !m);
            if (!compareMonth && months.length > 1) {
              // Default: pick the previous available month
              const otherMonths = months.filter(m => m.value !== effectiveMonth);
              setCompareMonth(otherMonths[0]?.value || '');
            }
          }}
          className={clsx(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
            compareMode ? 'bg-ink-1 text-white border-ink-1' : 'bg-white text-ink-2 border-cream'
          )}
        >
          <GitCompare size={12} />
          {compareMode ? 'Salir de comparación' : 'Comparar meses'}
        </button>
      </div>

      {/* Selector del mes de comparación */}
      {compareMode && (
        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Comparar con</p>
          <select
            value={compareMonth}
            onChange={e => setCompareMonth(e.target.value)}
            className="text-sm font-medium text-ink-1 bg-white border border-cream rounded-full px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="">— Elegí un mes —</option>
            {months.filter(m => m.value !== effectiveMonth).map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tabla de comparación */}
      {compareMode && filteredB.length > 0 && (
        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h2 className="text-sm font-semibold text-ink-2 mb-4">
            Comparativo: {monthLabel} vs {compareLbl}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-cream">
                  <th className="pb-2 px-2 text-left text-xs text-ink-3 font-medium">Closer</th>
                  <th className="pb-2 px-2 text-center text-xs text-ink-3 font-medium" colSpan={2}>{monthLabel}</th>
                  <th className="pb-2 px-2 text-center text-xs text-ink-3 font-medium" colSpan={2}>{compareLbl}</th>
                  <th className="pb-2 px-2 text-center text-xs text-ink-3 font-medium">Δ Cierres</th>
                </tr>
                <tr className="border-b border-cream/50">
                  <th className="pb-1 px-2" />
                  {['Cierres','%'].map(h => <th key={`a-${h}`} className="pb-1 px-2 text-xs text-ink-3 font-normal text-center">{h}</th>)}
                  {['Cierres','%'].map(h => <th key={`b-${h}`} className="pb-1 px-2 text-xs text-ink-3 font-normal text-center">{h}</th>)}
                  <th />
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => {
                  const cb = filteredB.find(x => x.closer === c.closer);
                  const delta = cb ? c.cierres - cb.cierres : null;
                  return (
                    <tr key={c.closer} className="border-b border-cream/50">
                      <td className="py-2.5 px-2 font-medium text-ink-1 whitespace-nowrap">
                        {medals[i] || ''} {c.closer}
                      </td>
                      <td className="py-2.5 px-2 text-center font-semibold text-ink-1">{c.cierres}</td>
                      <td className="py-2.5 px-2 text-center text-gold-dark font-semibold">{c.pctCierre}%</td>
                      <td className="py-2.5 px-2 text-center font-semibold text-ink-1">{cb?.cierres ?? '—'}</td>
                      <td className="py-2.5 px-2 text-center text-ink-2">{cb ? `${cb.pctCierre}%` : '—'}</td>
                      <td className="py-2.5 px-2 text-center font-bold">
                        {delta === null ? '—' : (
                          <span className={delta > 0 ? 'text-pos' : delta < 0 ? 'text-neg' : 'text-ink-3'}>
                            {delta > 0 ? '+' : ''}{delta}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards normales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sorted.map((c, i) => (
          <div key={c.closer} className="bg-white rounded-xl border border-cream shadow-sm p-4 text-center relative">
            {i < 3 && <span className="absolute top-2 right-2 text-lg">{medals[i]}</span>}
            <Initials name={c.closer} />
            <p className="text-sm font-semibold text-ink-1 truncate">{c.closer}</p>

            <div className="grid grid-cols-2 gap-1.5 mt-3">
              {[
                { label: 'Agendadas',   val: c.agendadas,      bg: 'bg-page',       text: 'text-ink-1'     },
                { label: 'Asistencias', val: c.asistencias,    bg: 'bg-cream',      text: 'text-ink-2'     },
                { label: 'Reagenda',    val: c.reagenda,       bg: 'bg-gold-light', text: 'text-gold-dark' },
                { label: '2da llamada', val: c.segundaLlamada, bg: 'bg-cream',      text: 'text-ink-2'     },
                { label: 'Ofertas',     val: c.ofertas,        bg: 'bg-gold-light', text: 'text-gold-dark' },
                { label: 'Seña',        val: c.senia,          bg: 'bg-pos-light',  text: 'text-pos'       },
              ].map(({ label, val, bg, text }) => (
                <div key={label} className={`${bg} rounded-lg p-1.5`}>
                  <p className={`text-base font-bold ${text}`}>{val}</p>
                  <p className="text-xs text-ink-3">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <div className="bg-gold-light rounded-lg p-2">
                <p className="text-xl font-bold text-gold-dark">{c.cierres}</p>
                <p className="text-xs text-ink-3">cierres</p>
              </div>
              <div className="bg-gold-light rounded-lg p-2">
                <p className="text-xl font-bold text-gold-dark">{c.pctCierre}%</p>
                <p className="text-xs text-ink-3">% cierre</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-3">% asistencia: <span className="font-semibold text-ink-2">{c.pctAsistencia}%</span></p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h2 className="text-sm font-semibold text-ink-2 mb-3">Ranking del mes</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-cream">
                  {['#','Closer','Agendadas','Asist.','Reagenda','2da','Ofertas','Seña','Cierres','%Cierre','%Asist.'].map(h => (
                    <th key={h} className="pb-2 px-2 text-left text-xs text-ink-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr key={c.closer} className="border-b border-cream/50">
                    <td className="py-2 px-2">{medals[i] || i + 1}</td>
                    <td className="py-2 px-2 font-medium text-ink-1 whitespace-nowrap">{c.closer}</td>
                    <td className="py-2 px-2 text-ink-2">{c.agendadas}</td>
                    <td className="py-2 px-2 text-ink-2">{c.asistencias}</td>
                    <td className="py-2 px-2 text-ink-2">{c.reagenda}</td>
                    <td className="py-2 px-2 text-ink-2">{c.segundaLlamada}</td>
                    <td className="py-2 px-2 text-ink-2">{c.ofertas}</td>
                    <td className="py-2 px-2 text-ink-2">{c.senia}</td>
                    <td className="py-2 px-2 font-semibold text-ink-1">{c.cierres}</td>
                    <td className="py-2 px-2"><span className="text-gold-dark font-semibold">{c.pctCierre}%</span></td>
                    <td className="py-2 px-2 text-ink-2">{c.pctAsistencia}%</td>
                  </tr>
                ))}
                {todosRow && (
                  <tr className="bg-page border-t-2 border-cream">
                    <td className="py-2 px-2 text-xs text-ink-3">—</td>
                    <td className="py-2 px-2 font-bold text-ink-1 whitespace-nowrap">Total</td>
                    <td className="py-2 px-2 font-semibold text-ink-1">{todosRow.agendadas}</td>
                    <td className="py-2 px-2 font-semibold text-ink-1">{todosRow.asistencias}</td>
                    <td className="py-2 px-2 font-semibold text-ink-1">{todosRow.reagenda}</td>
                    <td className="py-2 px-2 font-semibold text-ink-1">{todosRow.segundaLlamada}</td>
                    <td className="py-2 px-2 font-semibold text-ink-1">{todosRow.ofertas}</td>
                    <td className="py-2 px-2 font-semibold text-ink-1">{todosRow.senia}</td>
                    <td className="py-2 px-2 font-bold text-ink-1">{todosRow.cierres}</td>
                    <td className="py-2 px-2"><span className="text-gold-dark font-bold">{todosRow.pctCierre}%</span></td>
                    <td className="py-2 px-2 font-semibold text-ink-1">{todosRow.pctAsistencia}%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h2 className="text-sm font-semibold text-ink-2 mb-4">Comparativo del mes</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={14} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#999999' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#999999' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Agendadas"   fill="#BFDBFE" radius={[4,4,0,0]} />
              <Bar dataKey="Asistencias" fill="#8B5CF6" radius={[4,4,0,0]} />
              <Bar dataKey="Cierres"     fill="#3B82F6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
