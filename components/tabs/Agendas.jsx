'use client';
import { useState, useMemo } from 'react';
import { Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

const NICHO_COLORS = {
  Fitness: 'border-green-400 bg-green-50',
  Coaching: 'border-blue-400 bg-blue-50',
  Inmobiliario: 'border-purple-400 bg-purple-50',
  'E-commerce': 'border-orange-400 bg-orange-50',
};
const NICHO_BADGE = {
  Fitness: 'bg-green-100 text-green-700',
  Coaching: 'bg-blue-100 text-blue-700',
  Inmobiliario: 'bg-purple-100 text-purple-700',
  'E-commerce': 'bg-orange-100 text-orange-700',
};
const ESTADO_BADGE = {
  Confirmada: 'bg-teal-100 text-teal-700',
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Cancelada: 'bg-red-100 text-red-600',
};

const FILTERS = [
  { id: 'today', label: 'Hoy' },
  { id: 'tomorrow', label: 'Mañana' },
  { id: 'week', label: 'Esta semana' },
  { id: 'all', label: 'Todos' },
];

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function Agendas({ data }) {
  const [filter, setFilter] = useState('today');
  const [showPast, setShowPast] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(agenda => {
      const d = parseISO(agenda.fecha);
      d.setHours(0, 0, 0, 0);
      const isPast = d < today;

      if (isPast && !showPast) return false;

      if (filter === 'today') return isToday(d);
      if (filter === 'tomorrow') return isTomorrow(d);
      if (filter === 'week') {
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      }
      return true;
    });
  }, [data, filter, showPast, today]);

  // Group by date then nicho
  const grouped = useMemo(() => {
    const byDate = {};
    filtered.forEach(a => {
      if (!byDate[a.fecha]) byDate[a.fecha] = {};
      if (!byDate[a.fecha][a.nicho]) byDate[a.fecha][a.nicho] = [];
      byDate[a.fecha][a.nicho].push(a);
    });
    return byDate;
  }, [filtered]);

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      {/* Filter pills */}
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

      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
          Sin agendas para el período seleccionado
        </div>
      ) : (
        sortedDates.map(date => {
          const dateObj = parseISO(date);
          const dateLabel = capitalize(format(dateObj, "EEEE dd 'de' MMMM", { locale: es }));
          const nichos = grouped[date];

          return (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-700">{dateLabel}</span>
                {isToday(dateObj) && (
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">Hoy</span>
                )}
                {isTomorrow(dateObj) && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Mañana</span>
                )}
              </div>

              {Object.entries(nichos).map(([nicho, agendas]) => (
                <div key={nicho} className={clsx(
                  'mb-3 rounded-xl border-l-4 overflow-hidden',
                  NICHO_COLORS[nicho] || 'border-gray-400 bg-gray-50'
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
                      <div key={i} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock size={13} />
                            <span className="text-sm font-mono font-medium">{a.hora}</span>
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{a.cliente}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <User size={12} />
                            <span>{a.closer}</span>
                          </div>
                          <span className={clsx(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            ESTADO_BADGE[a.estado] || 'bg-gray-100 text-gray-600'
                          )}>
                            {a.estado}
                          </span>
                        </div>
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
