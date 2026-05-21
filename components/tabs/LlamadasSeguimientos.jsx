'use client';
import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, GitCompare } from 'lucide-react';
import clsx from 'clsx';

// Normaliza cualquier formato de fecha a 'yyyy-MM-dd'
function normalizeDate(d) {
  if (!d) return '';
  const s = String(d).trim();
  // yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // ISO datetime: 2026-05-21T...
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  // DD/MM/YYYY (formato argentino)
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  // MM/DD/YYYY
  try { const p = parseISO(s); if (!isNaN(p)) return format(p, 'yyyy-MM-dd'); } catch {}
  try { const p = new Date(s); if (!isNaN(p)) return format(p, 'yyyy-MM-dd'); } catch {}
  return s;
}

function getTodayStr() { return format(new Date(), 'yyyy-MM-dd'); }

const RESULT_GROUPS = [
  { label: 'Cerrados',     keys: ['Cerrado'],                   color: 'text-pos',       bar: 'bg-pos'       },
  { label: 'Seguimientos', keys: ['Seguimiento', 'Reagendado'], color: 'text-gold-dark', bar: 'bg-gold'      },
  { label: 'Perdidos',     keys: ['No interesado'],             color: 'text-neg',       bar: 'bg-neg'       },
  { label: 'No show',      keys: ['Sin respuesta'],             color: 'text-ink-3',     bar: 'bg-cream-dark'},
];

function normalizeResult(r) { return (r || '').trim(); }

function computeStats(calls) {
  const total   = calls.length;
  const cierres = calls.filter(l => normalizeResult(l.resultado) === 'Cerrado').length;
  const tasa    = total > 0 ? ((cierres / total) * 100).toFixed(1) : '0.0';
  const groups  = RESULT_GROUPS.map(g => {
    const count = calls.filter(l => g.keys.includes(normalizeResult(l.resultado))).length;
    return { ...g, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
  });
  const reportes = calls.filter(l =>
    normalizeResult(l.resultado) === 'Cerrado' && l.observaciones && l.observaciones.trim() !== '-'
  );
  const objMap = {};
  calls
    .filter(l => normalizeResult(l.resultado) === 'No interesado' && l.observaciones && l.observaciones.trim() !== '-')
    .forEach(l => {
      const key = l.observaciones.substring(0, 50);
      if (!objMap[key]) objMap[key] = { text: l.observaciones, count: 0 };
      objMap[key].count++;
    });
  const objeciones = Object.values(objMap).sort((a, b) => b.count - a.count).slice(0, 4);
  return { total, cierres, tasa, groups, reportes, objeciones };
}

const RESULTADO_BADGE = {
  'Cerrado':        'bg-pos-light text-pos',
  'Seguimiento':    'bg-gold-light text-gold-dark',
  'Reagendado':     'bg-gold-light text-gold-dark',
  'No interesado':  'bg-neg-light text-neg',
  'Sin respuesta':  'bg-cream text-ink-3',
};

function DayView({ stats, seguimientosPendientes }) {
  const { total, cierres, tasa, groups, reportes, objeciones } = stats;
  return (
    <div className="space-y-4">
      {/* Números rápidos */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Llamadas', val: total,      cls: 'text-ink-1' },
          { label: 'Cierres',  val: cierres,    cls: 'text-pos'   },
          { label: 'Tasa',     val: `${tasa}%`, cls: parseFloat(tasa) >= 30 ? 'text-pos' : 'text-ink-1' },
        ].map(({ label, val, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-cream p-3 text-center shadow-sm">
            <p className="text-xs text-ink-3 mb-1">{label}</p>
            <p className={clsx('text-xl font-bold', cls)}>{val}</p>
          </div>
        ))}
      </div>

      {/* Seguimientos pendientes para este día */}
      {seguimientosPendientes.length > 0 && (
        <div className="bg-white rounded-xl border border-gold/30 shadow-sm overflow-hidden">
          <p className="text-xs font-semibold tracking-widest uppercase text-gold-dark px-4 pt-3 pb-2">
            Seguimientos a contactar · {seguimientosPendientes.length}
          </p>
          <div className="divide-y divide-cream">
            {seguimientosPendientes.map((r, i) => (
              <div key={i} className="px-4 py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-1">{r.nombre}</p>
                  {r.proximoPaso && r.proximoPaso !== '-' && (
                    <p className="text-xs text-ink-3 mt-0.5">{r.proximoPaso}</p>
                  )}
                  {r.observaciones && r.observaciones !== '-' && (
                    <p className="text-xs text-ink-2 mt-0.5 italic">{r.observaciones}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                    RESULTADO_BADGE[normalizeResult(r.resultado)] || 'bg-cream text-ink-2'
                  )}>
                    {normalizeResult(r.resultado)}
                  </span>
                  {r.closer && <span className="text-xs text-ink-3">{r.closer}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultados del día */}
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

      {/* Reportes (cierres del día) */}
      <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 px-4 pt-3 pb-2">Reportes del día</p>
        {reportes.length === 0 ? (
          <p className="text-xs text-ink-3 text-center py-4 pb-5">Sin reportes</p>
        ) : (
          <div className="divide-y divide-cream">
            {reportes.map((r, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-ink-1">{r.nombre}</span>
                  <span className="text-xs text-pos font-medium">{r.closer}</span>
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
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 px-4 pt-3 pb-2">Objeciones del día</p>
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
    const set = new Set(data.map(l => normalizeDate(l.fecha)).filter(Boolean));
    return [...set].sort().reverse();
  }, [data]);

  const [selectedDate, setSelectedDate] = useState(() => allDates[0] || getTodayStr());
  const [compareDate, setCompareDate]   = useState(() => allDates[1] || getTodayStr());
  const [compareMode, setCompareMode]   = useState(false);

  // Llamadas HECHAS ese día
  const filteredA = useMemo(() =>
    data ? data.filter(l => normalizeDate(l.fecha) === selectedDate) : [],
  [data, selectedDate]);

  const filteredB = useMemo(() =>
    compareMode && data ? data.filter(l => normalizeDate(l.fecha) === compareDate) : [],
  [data, compareDate, compareMode]);

  // Seguimientos PENDIENTES para ese día (fechaProximoContacto = fecha seleccionada)
  const seguimientosA = useMemo(() =>
    data ? data.filter(l =>
      normalizeDate(l.fechaProximoContacto) === selectedDate &&
      normalizeDate(l.fecha) !== selectedDate
    ) : [],
  [data, selectedDate]);

  const seguimientosB = useMemo(() =>
    compareMode && data ? data.filter(l =>
      normalizeDate(l.fechaProximoContacto) === compareDate &&
      normalizeDate(l.fecha) !== compareDate
    ) : [],
  [data, compareDate, compareMode]);

  const statsA = useMemo(() => computeStats(filteredA), [filteredA]);
  const statsB = useMemo(() => computeStats(filteredB), [filteredB]);

  const dateIdx = allDates.indexOf(selectedDate);

  return (
    <div className="space-y-5">

      {/* Selector de fecha */}
      {compareMode ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            { date: selectedDate, setDate: setSelectedDate },
            { date: compareDate,  setDate: setCompareDate  },
          ].map(({ date, setDate }, col) => {
            const idx = allDates.indexOf(date);
            return (
              <div key={col} className="bg-white rounded-xl border border-cream p-2.5 flex items-center justify-between shadow-sm">
                <button onClick={() => idx < allDates.length - 1 && setDate(allDates[idx + 1])}
                  disabled={idx >= allDates.length - 1}
                  className="p-1.5 rounded-lg hover:bg-cream disabled:opacity-30 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <select value={date} onChange={e => setDate(e.target.value)}
                  className="text-sm font-semibold text-ink-1 bg-transparent border-none outline-none cursor-pointer text-center">
                  {allDates.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button onClick={() => idx > 0 && setDate(allDates[idx - 1])}
                  disabled={idx <= 0}
                  className="p-1.5 rounded-lg hover:bg-cream disabled:opacity-30 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-cream p-3 flex items-center justify-between shadow-sm">
          <button onClick={() => dateIdx < allDates.length - 1 && setSelectedDate(allDates[dateIdx + 1])}
            disabled={dateIdx >= allDates.length - 1}
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
          <button onClick={() => dateIdx > 0 && setSelectedDate(allDates[dateIdx - 1])}
            disabled={dateIdx <= 0}
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

      {/* Contenido */}
      {compareMode ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-ink-3 mb-3 text-center">{selectedDate}</p>
            <DayView stats={statsA} seguimientosPendientes={seguimientosA} />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-3 mb-3 text-center">{compareDate}</p>
            <DayView stats={statsB} seguimientosPendientes={seguimientosB} />
          </div>
        </div>
      ) : (
        <DayView stats={statsA} seguimientosPendientes={seguimientosA} />
      )}

      <p className="text-center text-xs text-ink-3 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
