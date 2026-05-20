'use client';
import { useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Target, Users,
  ShoppingCart, BarChart2, CheckCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import StatCard from '../ui/StatCard.jsx';

function ars(n) { return `$ ${Number(n || 0).toLocaleString('es-AR')}`; }
function pct(n) { return `${Number(n || 0).toFixed(1)}%`; }

const TooltipARS = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {ars(p.value)}</p>
      ))}
    </div>
  );
};

function ProgressBar({ label, value, max, color = 'teal' }) {
  const pv = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const cls = { teal: 'bg-teal-600', green: 'bg-green-500', red: 'bg-red-400', orange: 'bg-orange-400' };
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className="font-medium text-gray-700">{pv.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${cls[color] || 'bg-teal-600'} rounded-full`} style={{ width: `${pv}%` }} />
      </div>
    </div>
  );
}

export default function Overview({ negocio = [], anuncios = [], closers = [], selectedMonth }) {
  const mes        = useMemo(() => negocio.find(r => r.mes === selectedMonth) || negocio[0] || {}, [negocio, selectedMonth]);
  const mesAds     = useMemo(() => anuncios.find(r => r.mes === selectedMonth) || anuncios[0] || {}, [anuncios, selectedMonth]);
  const mesClosers = useMemo(() => closers.filter(r => r.mes === selectedMonth), [closers, selectedMonth]);
  const topCloser  = useMemo(() => [...mesClosers].sort((a, b) => b.cierres - a.cierres)[0] || null, [mesClosers]);

  const chartData = useMemo(
    () => [...negocio].reverse().slice(-4).map(r => ({
      mes:    r.mesLabel?.split(' ')[0] || r.mes,
      Ventas: r.ventasTotal,
      Cash:   r.cashCollected,
      Costos: r.costosTotal,
    })),
    [negocio]
  );

  if (!mes.mes) return <p className="text-sm text-gray-400 py-8 text-center">Sin datos de negocio para este mes</p>;

  return (
    <div className="space-y-5">
      {/* KPIs fila 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ShoppingCart} label="Ventas totales"    value={mes.ventasTotales}            accent="teal"   />
        <StatCard icon={DollarSign}   label="Cash Collected"    value={ars(mes.cashCollected)}        accent="green"  />
        <StatCard icon={TrendingDown} label="Costos totales"    value={ars(mes.costosTotal)}           accent="red"    />
        <StatCard icon={TrendingUp}   label="Ganancia"          value={ars(mes.gananciaVentaNueva)}    accent={mes.gananciaVentaNueva >= 0 ? 'green' : 'red'} />
      </div>
      {/* KPIs fila 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={BarChart2}    label="Rentabilidad"      value={pct(mes.rentabilidadVentaNueva)} accent="blue"   />
        <StatCard icon={Target}       label="% Cash Collection" value={pct(mes.pctCC)}                  accent="purple" />
        <StatCard icon={Users}        label="Mejor closer"      value={topCloser?.closer || '-'}        accent="orange" />
        <StatCard icon={CheckCircle}  label="ROAS"              value={mesAds.roas ?? '-'}               accent="teal"   />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Objetivos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Objetivos del mes</h2>
          <ProgressBar
            label={`Ventas: ${mes.ventasTotales} / ${mes.objetivoVentas}`}
            value={mes.ventasTotales} max={mes.objetivoVentas}
            color={mes.faltanteVentas === 0 ? 'green' : 'teal'}
          />
          <ProgressBar
            label={`Objetivo $: ${ars(mes.ventasTotal)} / ${ars(mes.objetivoPesos)}`}
            value={mes.ventasTotal} max={mes.objetivoPesos}
            color={mes.faltanteObj === 0 ? 'green' : 'teal'}
          />
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: 'Faltante ventas', val: mes.faltanteVentas,        fmt: v => v, bad: v => v > 0 },
              { label: 'Faltante obj $',  val: mes.faltanteObj,            fmt: ars,    bad: v => v > 0 },
              { label: 'Faltante gastos', val: mes.faltanteCubrirGastos,   fmt: v => v > 0 ? ars(v) : '✓ Cubierto', bad: v => v > 0 },
            ].map(({ label, val, fmt, bad }) => (
              <div key={label} className={`${bad(val) ? 'bg-orange-50' : 'bg-green-50'} rounded-lg p-3 text-center`}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-sm font-bold ${bad(val) ? 'text-orange-600' : 'text-green-600'}`}>{fmt(val)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Desglose */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Desglose del mes</h2>
          <div className="space-y-2">
            {[
              { label: 'Ventas nuevas', count: mes.cantVentasNuevas, monto: mes.ventasFront },
              { label: 'Ventas back',   count: mes.cantVentasBack,   monto: mes.ventasBack  },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-600">{row.label}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-800 mr-3">{row.count} ventas</span>
                  <span className="text-sm font-bold text-teal-700">{ars(row.monto)}</span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Recolección</p>
              {[
                { label: 'Venta nueva',       val: mes.recoleccionVentaNueva        },
                { label: 'Recurrente front',  val: mes.recoleccionRecurrenteFront   },
                { label: 'Back',              val: mes.recoleccionBack              },
                { label: 'Recurrente back',   val: mes.recoleccionRecurrenteBack    },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-xs py-1 border-b border-gray-50">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-700">{ars(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico tendencia */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Tendencia mensual</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={18} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} />
            <Tooltip content={<TooltipARS />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Ventas" fill="#0F766E" radius={[4,4,0,0]} />
            <Bar dataKey="Cash"   fill="#34D399" radius={[4,4,0,0]} />
            <Bar dataKey="Costos" fill="#F87171" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Closers resumido */}
      {mesClosers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Resumen closers</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Closer','Agendadas','Asistencias','Ofertas','Cierres','% Cierre','% Asistencia'].map(h => (
                    <th key={h} className="pb-2 px-2 text-left text-xs text-gray-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...mesClosers].sort((a,b) => b.cierres - a.cierres).map((c, i) => (
                  <tr key={c.closer} className="border-b border-gray-50">
                    <td className="py-2.5 px-2 font-medium text-gray-800">{['🥇','🥈','🥉'][i] || ''} {c.closer}</td>
                    <td className="py-2.5 px-2 text-gray-600">{c.agendadas}</td>
                    <td className="py-2.5 px-2 text-gray-600">{c.asistencias}</td>
                    <td className="py-2.5 px-2 text-gray-600">{c.ofertas}</td>
                    <td className="py-2.5 px-2 font-semibold text-gray-800">{c.cierres}</td>
                    <td className="py-2.5 px-2"><span className="text-teal-700 font-semibold">{c.pctCierre}%</span></td>
                    <td className="py-2.5 px-2 text-gray-600">{c.pctAsistencia}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
