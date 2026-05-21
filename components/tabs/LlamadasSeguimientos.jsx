'use client';
import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

function formatDate(d) {
  try { return format(parseISO(d), 'yyyy-MM-dd'); } catch { return d; }
}
function getTodayStr() { return format(new Date(), 'yyyy-MM-dd'); }

const RESULT_GROUPS = [
  { label: 'Cerrados',     keys: ['Cerrado'],                   color: 'text-pos',       bar: 'bg-pos'       },
  { label: 'Seguimientos', keys: ['Seguimiento', 'Reagendado'], color: 'text-gold-dark', bar: 'bg-gold'      },
  { label: 'Perdidos',     keys: ['No interesado'],             color: 'text-neg',       bar: 'bg-neg'       },
  { label: 'No show',      keys: ['Sin respuesta'],             color: 'text-ink-3',     bar: 'bg-cream-dark'},
];

export default function LlamadasSeguimientos({ data }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (!data || !data.length) return getTodayStr();
    const dates = [...new Set(
      data.map(l => l.fecha).filter(Boolean).map(d => {
        try { return format(parseISO(d), 'yyyy-MM-dd'); } catch { return d; }
      })
    )].sort().reverse();
    return dates[0] || getTodayStr();
  });

  const allDates = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.map(l => l.fecha).filter(Boolean).map(formatDate));
    return [...set].sort().reverse();
  }, [data]);

  const filtered = useMemo(() =>
    data ? data.filter(l => formatDate(l.fecha) === selectedDate) : [],
  [data, selectedDate]);

  const totalLlamadas = filtered.length;
  const totalCierres  = filtered.filter(l => l.resultado === 'Cerrado').length;
  const tasaCierre    = totalLlamadas > 0
    ? ((totalCierres / totalLlamadas) * 100).toFixed(1)
    : '0.0';

  const resultGroups = useMemo(() =>
    RESULT_GROUPS.map(g => {
      const count = filtered.filter(l => g.keys.includes(l.resultado)).length;
      const pct   = totalLlamadas > 0 ? Math.round((count / totalLlamadas) * 100) : 0;
      return { ...g, count, pct };
    }),
  [filtered, totalLlamadas]);

  const reportes = useMemo(() =>
    filtered.filter(l => l.resultado === 'Cerrado' && l.observaciones && l.observaciones !== '-'),
  [filtered]);

  const objeciones = useMemo(() => {
    const obs = filtered.filter(l =>
      l.resultado === 'No interesado' && l.observaciones && l.observaciones !== '-'
    );
    const map = {};
    obs.forEach(l => {
      const key = l.observaciones.substring(0, 50);
      if (!map[key]) map[key] = { text: l.observaciones, count: 0 };
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [filtered]);

  const dateIdx = allDates.indexOf(selectedDate);
  function prevDate() { if (dateIdx < allDates.length - 1) setSelectedDate(allDates[dateIdx + 1]); }
  function nextDate() { if (dateIdx > 0) setSelectedDate(allDates[dateIdx - 1]); }

  return (
    <div className="space-y-5">

      {/* Selector de fecha */}
      <div className="bg-white rounded-xl border border-cream p-3 flex items-center justify-between shadow-sm">
        <button onClick={prevDate} disabled={dateIdx >= allDates.length - 1}
          className="p-2 rounded-lg hover:bg-cream disabled:opacity-30 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="text-sm font-semibold text-ink-1 bg-transparent border-none outline-none cursor-pointer text-center">
            {allDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <p className="text-xs text-ink-3">Seleccioná una fecha</p>
        </div>
        <button onClick={nextDate} disabled={dateIdx <= 0}
          className="p-2 rounded-lg hover:bg-cream disabled:opacity-30 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-cream p-4 text-center shadow-sm">
          <p className="text-xs text-ink-3 mb-1">Llamadas</p>
          <p className="text-2xl font-bold text-ink-1">{totalLlamadas}</p>
        </div>
        <div className="bg-white rounded-xl border border-cream p-4 text-center shadow-sm">
          <p className="text-xs text-ink-3 mb-1">Cierres</p>
          <p className="text-2xl font-bold text-pos">{totalCierres}</p>
        </div>
        <div className="bg-white rounded-xl border border-cream p-4 text-center shadow-sm">
          <p className="text-xs text-ink-3 mb-1">Tasa</p>
          <p className={clsx('text-2xl font-bold', parseFloat(tasaCierre) >= 30 ? 'text-pos' : 'text-ink-1')}>
            {tasaCierre}%
          </p>
        </div>
      </div>

      {/* Reportes del día */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Reportes del día</p>
        <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
          {reportes.length === 0 ? (
            <p className="text-sm text-ink-3 text-center py-6">Sin reportes en este período</p>
          ) : (
            <div className="divide-y divide-cream">
              {reportes.map((r, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-ink-1">{r.nombre}</span>
                    <span className="text-xs font-medium text-pos">{r.closer}</span>
                  </div>
                  <p className="text-xs text-ink-3 leading-relaxed">{r.observaciones}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumen · Resultados */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Resumen · Resultados de llamadas</p>
        <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
          {resultGroups.map((g, i) => (
            <div key={g.label} className={clsx('relative px-4 py-3.5 overflow-hidden', i > 0 && 'border-t border-cream')}>
              <div className={clsx('absolute inset-y-0 left-0 opacity-[0.08] transition-all', g.bar)}
                   style={{ width: `${g.pct}%` }} />
              <div className="relative flex items-center justify-between">
                <span className="text-sm font-medium text-ink-2">{g.label}</span>
                <span className={clsx('text-sm font-bold tabular-nums', g.color)}>
                  {g.count} · {g.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Objeciones del día */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Objeciones del día</p>
        <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
          {objeciones.length === 0 ? (
            <p className="text-sm text-ink-3 text-center py-6">Sin objeciones detectadas en el período</p>
          ) : (
            <div className="divide-y divide-cream">
              {objeciones.map((o, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <span className="text-neg font-bold mt-0.5 flex-shrink-0">→</span>
                  <div>
                    <p className="text-sm text-ink-2 leading-relaxed">{o.text}</p>
                    {o.count > 1 && (
                      <p className="text-xs text-ink-3 mt-0.5">Mencionado {o.count} veces</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-ink-3 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
