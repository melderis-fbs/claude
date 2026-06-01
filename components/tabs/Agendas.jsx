'use client';
import { useState, useMemo } from 'react';
import {
  parseISO, isToday, isTomorrow,
  startOfWeek, endOfWeek, isWithinInterval,
  eachDayOfInterval, format, addWeeks, endOfMonth, startOfMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

const FUENTES = [
  { key: 'Confirmar nicho', short: 'Confirmar' },
  { key: 'IA setter',       short: 'IA setter'  },
  { key: 'Automática',      short: 'Automática' },
  { key: 'Bio IG',          short: 'Bio IG'     },
];

const FUENTE_COLORS = {
  'Confirmar nicho': 'bg-gold-light text-gold-dark',
  'IA setter':       'bg-pos-light text-pos',
  'Automática':      'bg-cream text-ink-2',
  'Bio IG':          'bg-neg-light text-neg',
};

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function dayStr(d) { return format(d, 'yyyy-MM-dd'); }

const PERIODS = [
  { id: 'week',      label: 'Esta semana'  },
  { id: 'twoweeks',  label: '2 semanas'    },
  { id: 'month',     label: 'Este mes'     },
  { id: 'all',       label: 'Todo'         },
];

export default function Agendas({ data = [] }) {
  const [period, setPeriod]   = useState('week');
  const [showPast, setShowPast] = useState(false);

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const weekStart  = useMemo(() => startOfWeek(todayStart, { weekStartsOn: 1 }), [todayStart]);
  const weekEnd    = useMemo(() => endOfWeek(todayStart,   { weekStartsOn: 1 }), [todayStart]);

  // Days to show in the list
  const daysToShow = useMemo(() => {
    if (period === 'week') return eachDayOfInterval({ start: weekStart, end: weekEnd });
    if (period === 'twoweeks') {
      return eachDayOfInterval({ start: weekStart, end: endOfWeek(addWeeks(weekStart, 1), { weekStartsOn: 1 }) });
    }
    if (period === 'month') {
      return eachDayOfInterval({ start: startOfMonth(todayStart), end: endOfMonth(todayStart) });
    }
    // all: every date that has an agenda
    const allKeys = new Set(data.map(a => a.fechaReunion).filter(Boolean));
    let keys = [...allKeys].sort();
    if (!showPast) keys = keys.filter(k => k >= dayStr(todayStart));
    return keys.map(k => { const d = parseISO(k); d.setHours(0,0,0,0); return d; });
  }, [period, showPast, todayStart, weekStart, weekEnd, data]);

  // Week stats (always current week)
  const weekAgendas = useMemo(() =>
    data.filter(a => {
      if (!a.fechaReunion) return false;
      try { const d = parseISO(a.fechaReunion); return isWithinInterval(d, { start: weekStart, end: weekEnd }); }
      catch { return false; }
    }),
  [data, weekStart, weekEnd]);

  const weekFuenteStats = useMemo(() => {
    const total = weekAgendas.length;
    return FUENTES.map(f => ({
      ...f,
      count: weekAgendas.filter(a => a.fuente === f.key).length,
      pct: total > 0 ? Math.round((weekAgendas.filter(a => a.fuente === f.key).length / total) * 100) : 0,
    }));
  }, [weekAgendas]);

  return (
    <div className="space-y-5">

      {/* Period filter */}
      <div className="flex gap-2 overflow-x-auto">
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              period === p.id ? 'bg-ink-1 text-white' : 'bg-white text-ink-2 border border-cream'
            )}>
            {p.label}
          </button>
        ))}
        {period === 'all' && (
          <button onClick={() => setShowPast(x => !x)}
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
              showPast ? 'bg-ink-1 text-white border-ink-1' : 'bg-white text-ink-2 border-cream'
            )}>
            {showPast ? 'Ocultar pasadas' : 'Ver pasadas'}
          </button>
        )}
      </div>

      {/* SEM · AGENDAS — always current week */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Sem · Agendas</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-xl bg-ink-1 p-4 col-span-2">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-white/50 mb-1">Total esta semana</p>
                <p className="text-4xl font-bold text-white leading-none">{weekAgendas.length}</p>
                <p className="text-xs text-white/40 mt-1">agendas</p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right">
                {weekFuenteStats.map(f => (
                  <div key={f.key}>
                    <p className="text-xs text-white/40">{f.short}</p>
                    <p className="text-sm font-bold text-white">{f.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fuentes bar */}
        <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
          {weekFuenteStats.map((f, i) => (
            <div key={f.key} className={clsx('px-4 py-3 flex items-center gap-3', i > 0 && 'border-t border-cream')}>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 w-28 text-center', FUENTE_COLORS[f.key] || 'bg-cream text-ink-2')}>{f.key}</span>
              <div className="flex-1 h-1.5 bg-cream rounded-full overflow-hidden">
                <div className="h-full bg-ink-1 rounded-full" style={{ width: `${f.pct}%` }} />
              </div>
              <span className="text-sm font-semibold text-ink-1 tabular-nums w-6 text-right">{f.count}</span>
              <span className="text-xs text-ink-3 tabular-nums w-8 text-right">{f.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Agendas por día */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Agendas por día</p>
        <div className="space-y-2">
          {daysToShow.map(day => {
            const key = dayStr(day);
            const agendas = data.filter(a => a.fechaReunion === key);
            if (agendas.length === 0) return null;

            // Group by nicho
            const nichos = {};
            agendas.forEach(a => {
              const n = a.nicho || 'Sin nicho';
              nichos[n] = (nichos[n] || 0) + 1;
            });
            const nichoList = Object.entries(nichos).sort((a, b) => b[1] - a[1]);

            const label = cap(format(day, "EEEE dd 'de' MMMM", { locale: es }));

            return (
              <div key={key} className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-cream bg-page">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink-1">{label}</span>
                    {isToday(day) && <span className="text-xs bg-gold-light text-gold-dark px-2 py-0.5 rounded-full font-medium">Hoy</span>}
                    {isTomorrow(day) && <span className="text-xs bg-cream text-ink-2 px-2 py-0.5 rounded-full font-medium">Mañana</span>}
                  </div>
                  <span className="text-sm font-bold text-ink-1">{agendas.length}</span>
                </div>
                <div className="divide-y divide-cream">
                  {nichoList.map(([nicho, count]) => (
                    <div key={nicho} className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-sm text-ink-2">{nicho}</span>
                      <span className="text-sm font-semibold text-ink-1">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {daysToShow.filter(d => data.some(a => a.fechaReunion === dayStr(d))).length === 0 && (
            <div className="bg-white rounded-xl border border-cream p-8 text-center text-sm text-ink-3">
              Sin agendas para el período seleccionado
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
