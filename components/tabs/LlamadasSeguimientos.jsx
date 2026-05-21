'use client';
import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Phone, Target, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import DataTable from '../ui/DataTable.jsx';
import clsx from 'clsx';

const RESULTADO_BADGE = {
  Cerrado: 'bg-gold-light text-gold-dark',
  Interesado: 'bg-cream text-ink-2',
  Seguimiento: 'bg-gold-light text-gold-dark',
  'No interesado': 'bg-neg-light text-neg',
  'Sin respuesta': 'bg-cream text-ink-3',
};

function formatDate(d) {
  try {
    return format(parseISO(d), 'yyyy-MM-dd');
  } catch { return d; }
}

function getTodayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

export default function LlamadasSeguimientos({ data }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (!data || data.length === 0) return getTodayStr();
    const dates = [...new Set(data.map(l => l.fecha).filter(Boolean).map(d => {
      try { return format(parseISO(d), 'yyyy-MM-dd'); } catch { return d; }
    }))].sort().reverse();
    return dates[0] || getTodayStr();
  });
  const [ocultarClientes, setOcultar]     = useState(true);

  const allDates = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.map(l => l.fecha).filter(Boolean).map(formatDate));
    return [...set].sort().reverse();
  }, [data]);

  const filteredByDate = useMemo(() => {
    if (!data) return [];
    return data.filter(l => formatDate(l.fecha) === selectedDate);
  }, [data, selectedDate]);

  const filtered = useMemo(() => {
    if (ocultarClientes) return filteredByDate.filter(l => !l.esCliente);
    return filteredByDate;
  }, [filteredByDate, ocultarClientes]);

  const clientesHoy = useMemo(() => filteredByDate.filter(l => l.esCliente).length, [filteredByDate]);

  const totalLlamadas = filtered.length;
  const totalCierres = filtered.filter(l => l.resultado === 'Cerrado').length;
  const tasaCierre = totalLlamadas > 0 ? ((totalCierres / totalLlamadas) * 100).toFixed(1) : '0.0';

  const patrones = useMemo(() => {
    const obs = filtered.filter(l => l.observaciones && l.observaciones !== '-');
    const patterns = {};
    obs.forEach(l => {
      const key = l.observaciones.substring(0, 40);
      if (!patterns[key]) patterns[key] = { text: l.observaciones, count: 0 };
      patterns[key].count++;
    });
    return Object.values(patterns).slice(0, 5);
  }, [filtered]);

  const dateIdx = allDates.indexOf(selectedDate);

  function prevDate() {
    if (dateIdx < allDates.length - 1) setSelectedDate(allDates[dateIdx + 1]);
  }
  function nextDate() {
    if (dateIdx > 0) setSelectedDate(allDates[dateIdx - 1]);
  }

  const columns = [
    { key: 'closer', label: 'Closer', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true,
      render: (v) => (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-cream text-ink-2">{v}</span>
      )
    },
    { key: 'nombre', label: 'Nombre', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-1.5">
          <span>{v}</span>
          {row.esCliente && (
            <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-pos-light text-pos font-medium">
              <CheckCircle2 size={10} /> Cliente
            </span>
          )}
        </div>
      )
    },
    {
      key: 'resultado', label: 'Resultado', sortable: true,
      render: (v) => (
        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', RESULTADO_BADGE[v] || 'bg-cream text-ink-2')}>
          {v}
        </span>
      )
    },
    { key: 'proximoPaso', label: 'Próximo paso' },
    { key: 'fechaProximoContacto', label: 'Próx. contacto', sortable: true },
    { key: 'observaciones', label: 'Observaciones' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-cream p-3 flex items-center justify-between shadow-sm">
        <button
          onClick={prevDate}
          disabled={dateIdx >= allDates.length - 1}
          className="p-2 rounded-lg hover:bg-cream disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <select
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-sm font-semibold text-ink-1 bg-transparent border-none outline-none cursor-pointer text-center"
          >
            {allDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <p className="text-xs text-ink-3">Seleccioná una fecha</p>
        </div>
        <button
          onClick={nextDate}
          disabled={dateIdx <= 0}
          className="p-2 rounded-lg hover:bg-cream disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-cream p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1 text-ink-3 mb-1">
            <Phone size={14} />
            <span className="text-xs">Llamadas</span>
          </div>
          <div className="text-2xl font-bold text-ink-1">{totalLlamadas}</div>
        </div>
        <div className="bg-white rounded-xl border border-cream p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1 text-ink-3 mb-1">
            <Target size={14} />
            <span className="text-xs">Cierres</span>
          </div>
          <div className="text-2xl font-bold text-gold-dark">{totalCierres}</div>
        </div>
        <div className="bg-white rounded-xl border border-cream p-4 text-center shadow-sm">
          <div className="text-xs text-ink-3 mb-1">Tasa</div>
          <div className={clsx('text-2xl font-bold', parseFloat(tasaCierre) >= 30 ? 'text-gold-dark' : 'text-ink-1')}>
            {tasaCierre}%
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold tracking-widest uppercase text-ink-3">Detalle de llamadas</h3>
          <button
            onClick={() => setOcultar(o => !o)}
            className={clsx(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
              ocultarClientes
                ? 'bg-pos-light text-pos border-pos/30'
                : 'bg-white text-ink-2 border-cream'
            )}
          >
            <CheckCircle2 size={12} />
            {ocultarClientes
              ? `Clientes ocultos${clientesHoy > 0 ? ` (${clientesHoy})` : ''}`
              : 'Mostrar clientes'}
          </button>
        </div>
        <DataTable columns={columns} data={filtered} />
      </div>

      {patrones.length > 0 && (
        <div className="bg-gold-light rounded-xl border border-gold/30 p-4">
          <h3 className="text-sm font-semibold text-gold-dark mb-3">💡 Lo que se puede mejorar</h3>
          <div className="space-y-2">
            {patrones.map((p, i) => (
              <div key={i} className="flex items-start gap-2 bg-white rounded-lg p-3 border border-cream">
                <span className="text-gold-dark mt-0.5 flex-shrink-0">→</span>
                <p className="text-sm text-ink-2">{p.text}</p>
                {p.count > 1 && (
                  <span className="ml-auto flex-shrink-0 text-xs bg-gold-light text-gold-dark px-2 py-0.5 rounded-full">x{p.count}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-ink-3 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
