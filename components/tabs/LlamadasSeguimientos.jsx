'use client';
import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, GitCompare } from 'lucide-react';
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

function computeStats(calls) {
  const total   = calls.length;
  const cierres = calls.filter(l => l.resultado === 'Cerrado').length;
  const tasa    = total > 0 ? ((cierres / total) * 100).toFixed(1) : '0.0';
  const groups  = RESULT_GROUPS.map(g => {
    const count = calls.filter(l => g.keys.includes(l.resultado)).length;
    return { ...g, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
  });
  const reportes = calls.filter(l => l.resultado === 'Cerrado' && l.observaciones && l.observaciones !== '-');
  const objMap = {};
  calls.filter(l => l.resultado === 'No interesado' && l.observaciones && l.observaciones !== '-')
    .forEach(l => {
      const key = l.observaciones.substring(0, 50);
      if (!objMap[key]) objMap[key] = { text: l.observaciones, count: 0 };
      objMap[key].count++;
    });
  const objeciones = Object.values(objMap).sort((a, b) => b.count - a.count).slice(0, 4);
  return { total, cierres, tasa, groups, reportes, objeciones };
}

function DatePicker({ date, allDates, onChange }) {
  const idx = allDates.indexOf(date);
  return (
    <div className="bg-white rounded-xl border border-cream p-2.5 flex items-center justify-between shadow-sm">
      <button onClick={() => idx < allDates.length - 1 && onChange(allDates[idx + 1])}
        disabled={idx >= allDates.length - 1}
        className="p-1.5 rounded-lg hover:bg-cream disabled:opacity-30 transition-colors">
        <ChevronLeft size={16} />
      </button>
      <select value={date} onChange={e => onChange(e.target.value)}
        className="text-sm font-semibold text-ink-1 bg-transparent border-none outline-none cursor-pointer text-center">
        {allDates.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <button onClick={() => idx > 0 && onChange(allDates[idx - 1])}
        disabled={idx <= 0}
        className="p-1.5 rounded-lg hover:bg-cream disabled:opacity-30 transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function DayView({ stats }) {
  const { total, cierres, tasa, groups, reportes, objeciones } = stats;
  return (
    <div className="space-y-4">
      {/* Números rápidos */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Llamadas', val: total,   cls: 'text-ink-1' },
          { label: 'Cierres',  val: cierres, cls: 'text-pos'   },
          { label: 'Tasa',     val: `${tasa}%`, cls: parseFloat(tasa) >= 30 ? 'text-pos' : 'text-ink-1' },
        ].map(({ label, val, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-cream p-3 text-center shadow-sm">
            <p className="text-xs text-ink-3 mb-1">{label}</p>
            <p className={clsx('text-xl font-bold', cls)}>{val}</p>
          </div>
        ))}
      </div>

      {/* Resultados */}
      <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 px-4 pt-3 pb-2">Resultados</p>
        {groups.map((g, i) => (
          <div key={g.label} className={clsx('relative px-4 py-3 overflow-hidden', i > 0 && 'border-t border-cream')}>
            <div className={clsx('absolute inset-y-0 left-0 opacity-[0.08]', g.bar)} style={{ width: `${g.pct}%` }} />
            <div className="relative flex items-center justify-between">
              <span className="text-sm text-ink-2">{g.label}</span>
              <span className={clsx('text-sm font-bold tabular-nums', g.color)}>{g.count} · {g.pct}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Reportes */}
      <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 px-4 pt-3 pb-2">Reportes</p>
        {reportes.length === 0 ? (
          <p className="text-xs text-ink-3 text-center py-4 pb-5">Sin reportes</p>
        ) : (
          <div className="divide-y divide-cream">
            {reportes.map((r, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-ink-1">{r.nombre}</span>
                  <span className="text-xs text-pos">{r.closer}</span>
                </div>
                <p className="text-xs text-ink-3 leading-relaxed">{r.observaciones}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Objeciones */}
      {objeciones.length > 0 && (
        <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 px-4 pt-3 pb-2">Objeciones</p>
          <div className="divide-y divide-cream">
            {objeciones.map((o, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-2">
                <span className="text-neg font-bold mt-0.5 flex-shrink-0">→</span>
                <div>
                  <p className="text-sm text-ink-2">{o.text}</p>
                  {o.count > 1 && <p className="text-xs text-ink-3 mt-0.5">×{o.count}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LlamadasSeguimientos({ data }) {
  const allDates = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.map(l => l.fecha).filter(Boolean).map(formatDate));
    return [...set].sort().reverse();
  }, [data]);

  const [selectedDate, setSelectedDate] = useState(() => allDates[0] || getTodayStr());
  const [compareDate, setCompareDate]   = useState(() => allDates[1] || getTodayStr());
  const [compareMode, setCompareMode]   = useState(false);

  const filteredA = useMemo(() =>
    data ? data.filter(l => formatDate(l.fecha) === selectedDate) : [],
  [data, selectedDate]);

  const filteredB = useMemo(() =>
    compareMode && data ? data.filter(l => formatDate(l.fecha) === compareDate) : [],
  [data, compareDate, compareMode]);

  const statsA = useMemo(() => computeStats(filteredA), [filteredA]);
  const statsB = useMemo(() => computeStats(filteredB), [filteredB]);

  return (
    <div className="space-y-5">

      {/* Controles */}
      {compareMode ? (
        <div className="grid grid-cols-2 gap-3">
          <DatePicker date={selectedDate} allDates={allDates} onChange={setSelectedDate} />
          <DatePicker date={compareDate}  allDates={allDates} onChange={setCompareDate}  />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-cream p-3 flex items-center justify-between shadow-sm">
          <button onClick={() => { const i = allDates.indexOf(selectedDate); if (i < allDates.length - 1) setSelectedDate(allDates[i + 1]); }}
            disabled={allDates.indexOf(selectedDate) >= allDates.length - 1}
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
          <button onClick={() => { const i = allDates.indexOf(selectedDate); if (i > 0) setSelectedDate(allDates[i - 1]); }}
            disabled={allDates.indexOf(selectedDate) <= 0}
            className="p-2 rounded-lg hover:bg-cream disabled:opacity-30 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Toggle comparar */}
      <div className="flex justify-end">
        <button
          onClick={() => setCompareMode(m => !m)}
          className={clsx(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
            compareMode ? 'bg-ink-1 text-white border-ink-1' : 'bg-white text-ink-2 border-cream'
          )}
        >
          <GitCompare size={12} />
          {compareMode ? 'Salir de comparación' : 'Comparar fechas'}
        </button>
      </div>

      {/* Stats */}
      {compareMode ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-ink-3 mb-3 text-center">{selectedDate}</p>
            <DayView stats={statsA} />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-3 mb-3 text-center">{compareDate}</p>
            <DayView stats={statsB} />
          </div>
        </div>
      ) : (
        <DayView stats={statsA} />
      )}

      <p className="text-center text-xs text-ink-3 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
