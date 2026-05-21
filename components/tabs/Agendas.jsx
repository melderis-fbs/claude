'use client';
import { useState, useMemo } from 'react';
import { Calendar, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import {
  parseISO, isToday, isTomorrow,
  startOfWeek, endOfWeek, isWithinInterval,
  eachDayOfInterval, format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

const FILTERS = [
  { id: 'today',    label: 'Hoy'         },
  { id: 'tomorrow', label: 'Mañana'      },
  { id: 'week',     label: 'Esta semana' },
  { id: 'all',      label: 'Todos'       },
];

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function dayStr(d) { return format(d, 'yyyy-MM-dd'); }

export default function Agendas({ data = [] }) {
  const [filter, setFilter]     = useState('today');
  const [showPast, setShowPast] = useState(false);

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const weekStart  = useMemo(() => startOfWeek(todayStart, { weekStartsOn: 1 }), [todayStart]);
  const weekEnd    = useMemo(() => endOfWeek(todayStart,   { weekStartsOn: 1 }), [todayStart]);

  // ── Stats de la semana (siempre semana actual, basado en fechaReunion) ──
  const weekAgendas = useMemo(() =>
    data.filter(a => {
      if (!a.fechaReunion) return false;
      const d = parseISO(a.fechaReunion);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    }),
  [data, weekStart, weekEnd]);

  const weekStats = useMemo(() => ({
    total:    weekAgendas.length,
    anuncios: weekAgendas.filter(a => a.fuente === 'Anuncios').length,
    bioIG:    weekAgendas.filter(a => a.fuente === 'Bio IG').length,
  }), [weekAgendas]);

  // ── Días a mostrar según filtro ──
  const daysToShow = useMemo(() => {
    if (filter === 'today') return [todayStart];
    if (filter === 'tomorrow') {
      const d = new Date(todayStart); d.setDate(d.getDate() + 1); return [d];
    }
    if (filter === 'week') return eachDayOfInterval({ start: weekStart, end: weekEnd });

    // "all": unión de días con reuniones o ingresos, opcionalmente filtrar pasadas
    const allKeys = new Set([
      ...data.map(a => a.fechaReunion).filter(Boolean),
      ...data.map(a => a.fecha).filter(Boolean),
    ]);
    let keys = [...allKeys].sort();
    const todayKey = dayStr(todayStart);
    if (!showPast) keys = keys.filter(k => k >= todayKey);
    return keys.map(k => { const d = parseISO(k); d.setHours(0,0,0,0); return d; });
  }, [filter, showPast, todayStart, weekStart, weekEnd, data]);

  // ── Agendas del período seleccionado (para fuentes) ──
  const periodAgendas = useMemo(() => {
    return data.filter(a => {
      if (!a.fechaReunion) return false;
      const d = parseISO(a.fechaReunion); d.setHours(0,0,0,0);
      if (!showPast && d < todayStart) return false;
      if (filter === 'today')    return isToday(d);
      if (filter === 'tomorrow') return isTomorrow(d);
      if (filter === 'week')     return isWithinInterval(d, { start: weekStart, end: weekEnd });
      return true;
    });
  }, [data, filter, showPast, todayStart, weekStart, weekEnd]);

  const fuenteStats = useMemo(() => {
    const total    = periodAgendas.length;
    const anuncios = periodAgendas.filter(a => a.fuente === 'Anuncios').length;
    const bioIG    = periodAgendas.filter(a => a.fuente === 'Bio IG').length;
    return { total, anuncios, bioIG };
  }, [periodAgendas]);

  // ── Nichos del día seleccionado (hoy o primer día del filtro) ──
  const nichosDayStr = dayStr(daysToShow[0] || todayStart);
  const nichosDia = useMemo(() => {
    const counts = {};
    data.filter(a => a.fechaReunion === nichosDayStr && a.nicho)
        .forEach(a => { counts[a.nicho] = (counts[a.nicho] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [data, nichosDayStr]);

  // ── Datos por día ──
  function getDayData(day) {
    const key = dayStr(day);
    return {
      reuniones:  data.filter(a => a.fechaReunion === key),
      ingresadas: data.filter(a => a.fecha === key),
    };
  }

  return (
    <div className="space-y-5">

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === f.id ? 'bg-ink-1 text-white' : 'bg-white text-ink-2 border border-cream hover:border-cream-dark'
            )}>
            {f.label}
          </button>
        ))}
        <button onClick={() => setShowPast(p => !p)}
          className={clsx(
            'flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            showPast ? 'bg-ink-1 text-white' : 'bg-white text-ink-2 border border-cream'
          )}>
          {showPast ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Pasadas
        </button>
      </div>

      {/* SEM · AGENDAS */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Sem · Agendas</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-ink-1 p-4">
            <p className="text-xs text-white/50 mb-2">Total semana</p>
            <p className="text-3xl font-bold text-white leading-none">{weekStats.total}</p>
            <p className="text-xs text-white/40 mt-1">agendas</p>
          </div>
          <div className="rounded-xl bg-white border border-cream shadow-sm p-4">
            <p className="text-xs text-ink-3 mb-2">Anuncios</p>
            <p className="text-3xl font-bold text-ink-1 leading-none">{weekStats.anuncios}</p>
            <p className="text-xs text-ink-3 mt-1">landing / formulario</p>
          </div>
          <div className="rounded-xl bg-white border border-cream shadow-sm p-4">
            <p className="text-xs text-ink-3 mb-2">Bio IG</p>
            <p className="text-3xl font-bold text-ink-1 leading-none">{weekStats.bioIG}</p>
            <p className="text-xs text-ink-3 mt-1">desde Instagram</p>
          </div>
        </div>
      </div>

      {/* FUENTES · ACUMULADO */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Fuentes · Acumulado</p>
        <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
          {[
            { label: 'Anuncios (landing/form)', count: fuenteStats.anuncios },
            { label: 'Bio IG',                  count: fuenteStats.bioIG    },
          ].map(({ label, count }, i) => (
            <div key={label} className={clsx('px-4 py-3', i > 0 && 'border-t border-cream')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-ink-2">{label}</span>
                <span className="text-sm font-semibold text-ink-1">{count} agendas</span>
              </div>
              <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                <div className="h-full bg-ink-1 rounded-full transition-all"
                     style={{ width: fuenteStats.total > 0 ? `${(count / fuenteStats.total) * 100}%` : '0%' }} />
              </div>
              <p className="text-xs text-ink-3 mt-1 text-right">
                {fuenteStats.total > 0 ? Math.round((count / fuenteStats.total) * 100) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* NICHOS DE HOY */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Nichos de hoy</p>
        {nichosDia.length === 0 ? (
          <div className="bg-white rounded-xl border border-cream p-5 text-center text-sm text-ink-3">Sin datos</div>
        ) : (
          <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
            {nichosDia.map(([nicho, count], i) => (
              <div key={nicho} className={clsx('flex items-center justify-between px-4 py-3', i > 0 && 'border-t border-cream')}>
                <span className="text-sm text-ink-2">{nicho}</span>
                <span className="text-sm font-semibold text-ink-1">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETALLE DE AGENDAS */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Detalle de agendas</p>
        {daysToShow.length === 0 ? (
          <div className="bg-white rounded-xl border border-cream p-8 text-center text-sm text-ink-3">
            Sin agendas para el período seleccionado
          </div>
        ) : (
          <div className="space-y-5">
            {daysToShow.map(day => {
              const { reuniones, ingresadas } = getDayData(day);
              if (reuniones.length === 0 && ingresadas.length === 0) return null;
              const label = cap(format(day, "EEEE dd 'de' MMMM", { locale: es }));

              return (
                <div key={dayStr(day)}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} className="text-gold-dark" />
                    <span className="text-sm font-semibold text-ink-2">{label}</span>
                    <span className="text-xs text-ink-3">({reuniones.length + ingresadas.length})</span>
                    {isToday(day) && (
                      <span className="text-xs bg-gold-light text-gold-dark px-2 py-0.5 rounded-full font-medium">Hoy</span>
                    )}
                    {isTomorrow(day) && (
                      <span className="text-xs bg-cream text-ink-2 px-2 py-0.5 rounded-full font-medium">Mañana</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Llamada ese día */}
                    <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-cream flex items-center justify-between bg-page">
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-3">Llamada este día</span>
                        <span className="text-xs font-bold text-ink-1">{reuniones.length}</span>
                      </div>
                      {reuniones.length === 0 ? (
                        <p className="text-xs text-ink-3 text-center py-5">Sin llamadas</p>
                      ) : (
                        <div className="divide-y divide-cream">
                          {reuniones.map((a, i) => (
                            <div key={i} className="px-4 py-2.5 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-sm font-medium text-ink-1">{a.nombre}</span>
                                {a.nicho && <span className="ml-2 text-xs text-ink-3">{a.nicho}</span>}
                              </div>
                              <span className={clsx(
                                'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                                a.fuente === 'Anuncios' ? 'bg-gold-light text-gold-dark' : 'bg-cream text-ink-2'
                              )}>{a.fuente}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ingresaron ese día */}
                    <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-cream flex items-center justify-between bg-page">
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-3">Ingresaron este día</span>
                        <span className="text-xs font-bold text-ink-1">{ingresadas.length}</span>
                      </div>
                      {ingresadas.length === 0 ? (
                        <p className="text-xs text-ink-3 text-center py-5">Sin ingresos</p>
                      ) : (
                        <div className="divide-y divide-cream">
                          {ingresadas.map((a, i) => (
                            <div key={i} className="px-4 py-2.5 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-sm font-medium text-ink-1">{a.nombre}</span>
                                {a.nicho && <span className="ml-2 text-xs text-ink-3">{a.nicho}</span>}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 text-xs text-ink-3">
                                <ArrowRight size={10} />
                                {a.fechaReunion ? format(parseISO(a.fechaReunion), 'dd/MM', { locale: es }) : '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-ink-3 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
