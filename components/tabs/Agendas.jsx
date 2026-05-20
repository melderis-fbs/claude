'use client';
import { useState, useMemo } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { parseISO, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

const NICHO_COLORS = {
  'Fitness':        'border-green-400 bg-green-50',
  'Coaching':       'border-blue-400 bg-blue-50',
  'Inmobiliario':   'border-purple-400 bg-purple-50',
  'E-commerce':     'border-orange-400 bg-orange-50',
  'Founders':       'border-teal-400 bg-teal-50',
  'Bio IG':         'border-pink-400 bg-pink-50',
  'Anuncios':       'border-teal-400 bg-teal-50',
};
const NICHO_BADGE = {
  'Fitness':        'bg-green-100 text-green-700',
  'Coaching':       'bg-blue-100 text-blue-700',
  'Inmobiliario':   'bg-purple-100 text-purple-700',
  'E-commerce':     'bg-orange-100 text-orange-700',
  'Founders':       'bg-teal-100 text-teal-700',
  'Bio IG':         'bg-pink-100 text-pink-700',
  'Anuncios':       'bg-teal-100 text-teal-700',
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

  // Filtrar por fecha de reunión (no por fecha de registro)
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

  // Agrupar por fecha de reunión → nicho
  const grouped = useMemo(() => {
    const byDate = {};
    filtered.forEach(a => {
      const key = a.fechaReunion;
      if (!byDate[key]) byDate[key] = {};
      const nicho = a.nicho || 'Sin nicho';
      if (!byDate[key][nicho]) byDate[key][nicho] = [];
      byDate[key][nicho].push(a);
    });
    return byDate;
  }, [filtered]);

  const sortedDates = Object.keys(grouped).sort();

  // Conteo por nicho (todos los filtrados)
  const nichoCounts = useMemo(() => {
    const counts = {};
    filtered.forEach(a => { const n = a.nicho || 'Sin nicho'; counts[n] = (counts[n] || 0) + 1; });
    return counts;
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === f.id
                ? 'bg-teal-700 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
            )}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setShowPast(p => !p)}
          className={clsx(
            'flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            showPast ? 'bg-gray-700 text-white' : 'bg-white text-gray-500 border border-gray-200'
          )}
        >
          {showPast ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Pasadas
        </button>
      </div>

      {/* Resumen por nicho */}
      {Object.keys(nichoCounts).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(nichoCounts).map(([nicho, count]) => (
            <span key={nicho} className={clsx(
              'text-xs px-2.5 py-1 rounded-full font-medium',
              NICHO_BADGE[nicho] || 'bg-gray-100 text-gray-600'
            )}>
              {nicho}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Lista de agendas */}
      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
          Sin agendas para el período seleccionado
        </div>
      ) : (
        sortedDates.map(dateKey => {
          const dateObj  = parseISO(dateKey);
          const dateLabel = cap(format(dateObj, "EEEE dd 'de' MMMM", { locale: es }));
          const nichos   = grouped[dateKey];
          const totalDia = Object.values(nichos).reduce((s, arr) => s + arr.length, 0);

          return (
            <div key={dateKey}>
              {/* Encabezado de fecha */}
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-teal-600" />
                <span className="text-sm font-semibold text-gray-700">{dateLabel}</span>
                <span className="text-xs text-gray-400">({totalDia} agenda{totalDia !== 1 ? 's' : ''})</span>
                {isToday(dateObj) && (
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">Hoy</span>
                )}
                {isTomorrow(dateObj) && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Mañana</span>
                )}
              </div>

              {/* Grupos por nicho */}
              {Object.entries(nichos).map(([nicho, agendas]) => (
                <div key={nicho} className={clsx(
                  'mb-3 rounded-xl border-l-4 overflow-hidden',
                  NICHO_COLORS[nicho] || 'border-gray-300 bg-gray-50'
                )}>
                  <div className="px-4 py-2 flex items-center gap-2 border-b border-white/50">
                    <span className={clsx(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      NICHO_BADGE[nicho] || 'bg-gray-100 text-gray-600'
                    )}>
                      {nicho}
                    </span>
                    <span className="text-xs text-gray-500">{agendas.length} agenda{agendas.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-white/60">
                    {agendas.map((a, i) => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900 text-sm">{a.nombre}</span>
                        <span className="text-xs text-gray-400">
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

      <p className="text-center text-xs text-gray-400 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
