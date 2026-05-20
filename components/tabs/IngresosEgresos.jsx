'use client';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MonthSelector from '../ui/MonthSelector.jsx';
import StatCard from '../ui/StatCard.jsx';
import { TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react';

function ars(n) { return `$ ${Number(n || 0).toLocaleString('es-AR')}`; }

const CAT_COLORS = {
  sueldos:     '#0F766E',
  publicidad:  '#3B82F6',
  apps:        '#8B5CF6',
  gastosAdmin: '#F59E0B',
  formacion:   '#EC4899',
  impuestos:   '#EF4444',
  extras:      '#94A3B8',
};
const CAT_LABELS = {
  sueldos: 'Sueldos', publicidad: 'Publicidad', apps: 'APPS',
  gastosAdmin: 'Gastos admin.', formacion: 'Formación',
  impuestos: 'Impuestos', extras: 'Extras',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{ars(payload[0].value)}</p>
    </div>
  );
};

const ESTADO_STYLE = {
  'Cobrado':  { bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle },
  'Pendiente':{ bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock        },
  'Vencido':  { bg: 'bg-red-50',    text: 'text-red-600',    icon: AlertCircle  },
};

export default function IngresosEgresos({ data = {}, months = [], selectedMonth, onMonthChange }) {
  const { egresos = [], cobranzas = [] } = data;

  const mesEgresos = useMemo(
    () => egresos.find(r => r.mes === selectedMonth) || egresos[0] || {},
    [egresos, selectedMonth]
  );

  const mesCobranzas = useMemo(
    () => cobranzas.filter(r => r.mes === selectedMonth).sort((a, b) => (a.fechaSort || '').localeCompare(b.fechaSort || '')),
    [cobranzas, selectedMonth]
  );

  const pieData = useMemo(() => {
    return Object.keys(CAT_COLORS)
      .filter(k => mesEgresos[k] > 0)
      .map(k => ({ name: CAT_LABELS[k], value: mesEgresos[k], fill: CAT_COLORS[k] }));
  }, [mesEgresos]);

  // Totales cobranzas
  const cobStats = useMemo(() => {
    const cobrado  = mesCobranzas.filter(c => c.estado === 'Cobrado').reduce((s, c) => s + (c.montoCuota || 0), 0);
    const pendiente= mesCobranzas.filter(c => c.estado === 'Pendiente').reduce((s, c) => s + (c.montoCuota || 0), 0);
    const vencido  = mesCobranzas.filter(c => c.estado === 'Vencido').reduce((s, c) => s + (c.montoCuota || 0), 0);
    return { cobrado, pendiente, vencido };
  }, [mesCobranzas]);

  return (
    <div className="space-y-5">
      <MonthSelector months={months} selected={selectedMonth} onChange={onMonthChange} />

      {/* Resumen egresos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={TrendingDown} label="Total egresos"  value={ars(mesEgresos.total)}      accent="red"    />
        <StatCard icon={TrendingDown} label="Sueldos"        value={ars(mesEgresos.sueldos)}     accent="teal"   />
        <StatCard icon={TrendingDown} label="Publicidad"     value={ars(mesEgresos.publicidad)}  accent="blue"   />
        <StatCard icon={TrendingDown} label="Impuestos"      value={ars(mesEgresos.impuestos)}   accent="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut egresos */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Egresos por categoría</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={v => <span className="text-xs text-gray-600">{v}</span>} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detalle egresos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Detalle egresos</h3>
          <div className="space-y-2">
            {Object.keys(CAT_LABELS).map(k => (
              <div key={k} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[k] }} />
                  <span className="text-sm text-gray-600">{CAT_LABELS[k]}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{ars(mesEgresos[k] || 0)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-100 mt-2">
              <span className="text-sm font-semibold text-red-700">Total</span>
              <span className="text-sm font-bold text-red-700">{ars(mesEgresos.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cobranzas */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Cobranzas del mes</h3>

        {/* Resumen cobranzas */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Cobrado',   val: cobStats.cobrado,   color: 'green',  icon: CheckCircle },
            { label: 'Pendiente', val: cobStats.pendiente, color: 'yellow', icon: Clock       },
            { label: 'Vencido',   val: cobStats.vencido,   color: 'red',    icon: AlertCircle },
          ].map(({ label, val, color, icon: Icon }) => (
            <div key={label} className={`bg-${color}-50 rounded-xl p-3 text-center`}>
              <Icon size={16} className={`text-${color}-600 mx-auto mb-1`} />
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-sm font-bold text-${color}-700`}>{ars(val)}</p>
            </div>
          ))}
        </div>

        {/* Tabla cobranzas */}
        {mesCobranzas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin cobranzas para este mes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Nombre','Programa','Cuota','Monto','Fecha','Medio','Estado'].map(h => (
                    <th key={h} className="pb-2 px-3 text-left text-xs text-gray-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mesCobranzas.map((c, i) => {
                  const est = ESTADO_STYLE[c.estado] || { bg: 'bg-gray-50', text: 'text-gray-600', icon: Clock };
                  const Icon = est.icon;
                  return (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="py-2.5 px-3 font-medium text-gray-800 whitespace-nowrap">{c.nombre}</td>
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{c.programa}</td>
                      <td className="py-2.5 px-3 text-gray-500">{c.nCuota}/{c.cantCuotas}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">{ars(c.montoCuota)}</td>
                      <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{c.fechaCuota}</td>
                      <td className="py-2.5 px-3 text-gray-500">{c.medio}</td>
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

      <p className="text-center text-xs text-gray-400 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
