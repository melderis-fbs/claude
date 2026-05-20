'use client';
import { useState, useMemo } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { parseISO, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

const FUENTE_COLORS = {
  'Anuncios': 'border-gold bg-gold-light',
  'Bio IG':   'border-cream-dark bg-cream',
};
const FUENTE_BADGE = {
  'Anuncios': 'bg-gold-light text-gold-dark',
  'Bio IG':   'bg-cream text-ink-2',
};

const FILTERS = [
  { id: 'today',    label: 'Hoy' },
  { id: 'tomorrow', label: 'Mañana' },
  { id: 'week',     label: 'Esta semana' },
  { id: 'all',      label: 'Todos' },
];

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

export default function Agendas({ data = [] }) {
  const [filter, setFilter]     = useState('today');
  const [showPast, setShowPast] = useState(false);

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const filtered = useMemo(() => {
    return data.filter(a => {
      if (!a.fechaReunion) return false;
      const reunion = parseISO(a.fechaReunion);
      reunion.setHours(0,0,0,0);
      const isPast = reunion < todayStart;
      if (isPast && !showPast) return false;

      if (filter === 'today')    return isToday(reunion);
      if (filter === 'tomorrow') return isTomorrow(reunion);
      if (filter === 'week') {
        const ws = startOfWeek(todayStart, { weekStartsOn: 1 });
        const we = endOfWeek(todayStart,   { weekStartsOn: 1 });
        return isWithinInterval(reunion, { start: ws, end: we });
      }
      return true;
    });
  }, [data, filter, showPast, todayStart]);

  const grouped = useMemo(() => {
    const byDate = {};
    filtered.forEach(a => {
      const key    = a.fechaReunion;
      const fuente = a.fuente || 'Sin fuente';
      if (!byDate[key]) byDate[key] = {};
      if (!byDate[key][fuente]) byDate[key][fuente] = [];
      byDate[key][fuente].push(a);
    });
    return byDate;
  }, [filtered]);

  const sortedDates = Object.keys(grouped).sort();

  const fuenteCounts = useMemo(() => {
    const counts = {};
    filtered.forEach(a => { const f = a.fuente || 'Sin fuente'; counts[f] = (counts[f] || 0) + 1; });
    return counts;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === f.id
                ? 'bg-ink-1 text-white'
                : 'bg-white text-ink-2 border border-cream hover:border-cream-dark'
            )}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setShowPast(p => !p)}
          className={clsx(
            'flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            showPast ? 'bg-ink-1 text-white' : 'bg-white text-ink-2 border border-cream'
          )}
        >
          {showPast ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Pasadas
        </button>
      </div>

      {Object.keys(fuenteCounts).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(fuenteCounts).map(([fuente, count]) => (
            <span key={fuente} className={clsx(
              'text-xs px-2.5 py-1 rounded-full font-medium',
              FUENTE_BADGE[fuente] || 'bg-cream text-ink-2'
            )}>
              {fuente}: {count}
            </span>
          ))}
        </div>
      )}

      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-xl border border-cream p-8 text-center text-ink-3">
          Sin agendas para el período seleccionado
        </div>
      ) : (
        sortedDates.map(dateKey => {
          const dateObj   = parseISO(dateKey);
          const dateLabel = cap(format(dateObj, "EEEE dd 'de' MMMM", { locale: es }));
          const fuentes   = grouped[dateKey];
          const totalDia  = Object.values(fuentes).reduce((s, arr) => s + arr.length, 0);

          return (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-gold-dark" />
                <span className="text-sm font-semibold text-ink-2">{dateLabel}</span>
                <span className="text-xs text-ink-3">({totalDia} agenda{totalDia !== 1 ? 's' : ''})</span>
                {isToday(dateObj) && (
                  <span className="text-xs bg-gold-light text-gold-dark px-2 py-0.5 rounded-full font-medium">Hoy</span>
                )}
                {isTomorrow(dateObj) && (
                  <span className="text-xs bg-cream text-ink-2 px-2 py-0.5 rounded-full font-medium">Mañana</span>
                )}
              </div>

              {Object.entries(fuentes).map(([fuente, agendas]) => (
                <div key={fuente} className={clsx(
                  'mb-3 rounded-xl border-l-4 overflow-hidden',
                  FUENTE_COLORS[fuente] || 'border-cream-dark bg-cream'
                )}>
                  <div className="px-4 py-2 flex items-center gap-2 border-b border-white/50">
                    <span className={clsx(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      FUENTE_BADGE[fuente] || 'bg-cream text-ink-2'
                    )}>
                      {fuente}
                    </span>
                    <span className="text-xs text-ink-3">{agendas.length} agenda{agendas.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-white/60">
                    {agendas.map((a, i) => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between gap-2">
                        <div>
                          <span className="font-medium text-ink-1 text-sm">{a.nombre}</span>
                          {a.nicho && (
                            <span className="ml-2 text-xs text-ink-3">{a.nicho}</span>
                          )}
                        </div>
                        <span className="text-xs text-ink-3 flex-shrink-0">
                          Agendado: {a.fecha ? format(parseISO(a.fecha), 'dd/MM', { locale: es }) : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}

      <p className="text-center text-xs text-ink-3 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
