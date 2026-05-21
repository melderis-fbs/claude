'use client';
import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MonthSelector from '../ui/MonthSelector.jsx';
import StatCard from '../ui/StatCard.jsx';
import { TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

function ars(n) { return `$ ${Number(n || 0).toLocaleString('es-AR')}`; }

const CAT_COLORS = {
  sueldos:     '#B8960C',
  publicidad:  '#C4B49A',
  apps:        '#8B6E09',
  gastosAdmin: '#A8A29E',
  formacion:   '#6B6560',
  impuestos:   '#7A4A42',
  extras:      '#E8E2D9',
};
const CAT_LABELS = {
  sueldos: 'Sueldos', publicidad: 'Publicidad', apps: 'APPS',
  gastosAdmin: 'Gastos admin.', formacion: 'Formación',
  impuestos: 'Impuestos', extras: 'Extras',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-cream rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-ink-2">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{ars(payload[0].value)}</p>
    </div>
  );
};

const ESTADO_STYLE = {
  'Cobrado':  { bg: 'bg-pos-light',  text: 'text-pos',       icon: CheckCircle },
  'Pendiente':{ bg: 'bg-gold-light', text: 'text-gold-dark', icon: Clock        },
  'Vencido':  { bg: 'bg-neg-light',  text: 'text-neg',       icon: AlertCircle  },
};

const STATUS_ORDER = { Vencido: 0, Pendiente: 1, Cobrado: 2 };

export default function IngresosEgresos({ data = {}, months = [], selectedMonth, onMonthChange }) {
  const { egresos = [], cobranzas = [], comentarios = [] } = data;
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');

  const mesEgresos = useMemo(
    () => egresos.find(r => r.mes === selectedMonth) || egresos[0] || {},
    [egresos, selectedMonth]
  );

  const pieData = useMemo(() => {
    return Object.keys(CAT_COLORS)
      .filter(k => mesEgresos[k] > 0)
      .map(k => ({ name: CAT_LABELS[k], value: mesEgresos[k], fill: CAT_COLORS[k] }));
  }, [mesEgresos]);

  // Cobranzas: mostrar todas, ordenar vencido > pendiente > cobrado > fecha
  const cobranzasOrdenadas = useMemo(() => {
    return [...cobranzas].sort((a, b) => {
      const so = (STATUS_ORDER[a.estado] ?? 3) - (STATUS_ORDER[b.estado] ?? 3);
      if (so !== 0) return so;
      return (a.fechaSort || '').localeCompare(b.fechaSort || '');
    });
  }, [cobranzas]);

  const cobranzasFiltradas = useMemo(() => {
    if (estadoFiltro === 'Todos') return cobranzasOrdenadas;
    return cobranzasOrdenadas.filter(c => c.estado === estadoFiltro);
  }, [cobranzasOrdenadas, estadoFiltro]);

  const cobStats = useMemo(() => {
    const cobrado   = cobranzas.filter(c => c.estado === 'Cobrado').reduce((s, c) => s + (c.montoCuota || 0), 0);
    const pendiente = cobranzas.filter(c => c.estado === 'Pendiente').reduce((s, c) => s + (c.montoCuota || 0), 0);
    const vencido   = cobranzas.filter(c => c.estado === 'Vencido').reduce((s, c) => s + (c.montoCuota || 0), 0);
    return { cobrado, pendiente, vencido };
  }, [cobranzas]);

  return (
    <div className="space-y-5">
      <MonthSelector months={months} selected={selectedMonth} onChange={onMonthChange} />

      {/* Egresos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={TrendingDown} label="Total egresos"  value={ars(mesEgresos.total)}      accent="red"    />
        <StatCard icon={TrendingDown} label="Sueldos"        value={ars(mesEgresos.sueldos)}     accent="teal"   />
        <StatCard icon={TrendingDown} label="Publicidad"     value={ars(mesEgresos.publicidad)}  accent="blue"   />
        <StatCard icon={TrendingDown} label="Impuestos"      value={ars(mesEgresos.impuestos)}   accent="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
            <h3 className="text-sm font-semibold text-ink-2 mb-2">Egresos por categoría</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={v => <span className="text-xs text-ink-2">{v}</span>} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h3 className="text-sm font-semibold text-ink-2 mb-3">Detalle egresos</h3>
          <div className="space-y-2">
            {Object.keys(CAT_LABELS).map(k => (
              <div key={k} className="flex items-center justify-between p-2.5 rounded-lg bg-page">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[k] }} />
                  <span className="text-sm text-ink-2">{CAT_LABELS[k]}</span>
                </div>
                <span className="text-sm font-semibold text-ink-1">{ars(mesEgresos[k] || 0)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-neg-light border border-neg/20 mt-2">
              <span className="text-sm font-semibold text-neg">Total</span>
              <span className="text-sm font-bold text-neg">{ars(mesEgresos.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cobranzas — muestra todos los pagos, sin filtro de mes */}
      <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
        <h3 className="text-sm font-semibold text-ink-2 mb-3">Cobranzas</h3>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Cobrado',   val: cobStats.cobrado,   key: 'Cobrado'   },
            { label: 'Pendiente', val: cobStats.pendiente, key: 'Pendiente' },
            { label: 'Vencido',   val: cobStats.vencido,   key: 'Vencido'   },
          ].map(({ label, val, key }) => {
            const style = ESTADO_STYLE[key];
            const Icon  = style.icon;
            return (
              <div key={key} className={`${style.bg} rounded-xl p-3 text-center`}>
                <Icon size={16} className={`${style.text} mx-auto mb-1`} />
                <p className="text-xs text-ink-3">{label}</p>
                <p className={`text-sm font-bold ${style.text}`}>{ars(val)}</p>
              </div>
            );
          })}
        </div>

        {/* Filtro por estado */}
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {['Todos', 'Vencido', 'Pendiente', 'Cobrado'].map(f => (
            <button
              key={f}
              onClick={() => setEstadoFiltro(f)}
              className={clsx(
                'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                estadoFiltro === f
                  ? 'bg-ink-1 text-white'
                  : 'bg-page text-ink-2 border border-cream hover:border-cream-dark'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {cobranzasFiltradas.length === 0 ? (
          <p className="text-sm text-ink-3 text-center py-4">Sin cobranzas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-cream">
                  {['Nombre', 'Cuota', 'Monto', 'Fecha', 'Estado'].map(h => (
                    <th key={h} className="pb-2 px-3 text-left text-xs text-ink-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cobranzasFiltradas.map((c, i) => {
                  const est  = ESTADO_STYLE[c.estado] || { bg: 'bg-cream', text: 'text-ink-2', icon: Clock };
                  const Icon = est.icon;
                  return (
                    <tr key={i} className={`border-b border-cream/50 ${i % 2 === 0 ? 'bg-white' : 'bg-cream/50'}`}>
                      <td className="py-2.5 px-3 font-medium text-ink-1 whitespace-nowrap">{c.nombre}</td>
                      <td className="py-2.5 px-3 text-ink-3 text-center">{c.nCuota}/{c.cantCuotas}</td>
                      <td className="py-2.5 px-3 font-semibold text-ink-1 whitespace-nowrap">{ars(c.montoCuota)}</td>
                      <td className="py-2.5 px-3 text-ink-3 whitespace-nowrap">{c.fechaCuota}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${est.bg} ${est.text}`}>
                          <Icon size={11} />
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seguimiento de clientes con comentarios */}
      {comentarios.length > 0 && (
        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h3 className="text-sm font-semibold text-ink-2 mb-3">Seguimiento de clientes</h3>
          <div className="space-y-2">
            {[...comentarios]
              .sort((a, b) => {
                if (a.tieneVencido !== b.tieneVencido) return a.tieneVencido ? -1 : 1;
                return (b.fechaSort || '').localeCompare(a.fechaSort || '');
              })
              .map((c, i) => (
                <div key={i} className={`rounded-xl border p-3 ${c.tieneVencido ? 'border-neg/30 bg-neg-light' : 'border-cream bg-page'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-ink-1">{c.nombre}</span>
                    <div className="flex items-center gap-2">
                      {c.tieneVencido && (
                        <span className="text-xs bg-neg-light text-neg px-2 py-0.5 rounded-full font-medium border border-neg/20">Deudor</span>
                      )}
                      {c.fecha && <span className="text-xs text-ink-3">{c.fecha}</span>}
                    </div>
                  </div>
                  <p className="text-sm text-ink-2">{c.comentario}</p>
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
