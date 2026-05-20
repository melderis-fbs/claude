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
    <div className="bg-white border border-cream rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-ink-2 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {ars(p.value)}</p>
      ))}
    </div>
  );
};

function ProgressBar({ label, value, max, color = 'gold' }) {
  const pv = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const cls = { gold: 'bg-gold', green: 'bg-pos', red: 'bg-neg', orange: 'bg-gold' };
  return (
    <div>
      <div className="flex justify-between text-xs text-ink-3 mb-1">
        <span>{label}</span>
        <span className="font-medium text-ink-2">{pv.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-cream rounded-full overflow-hidden">
        <div className={`h-full ${cls[color] || 'bg-gold'} rounded-full`} style={{ width: `${pv}%` }} />
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

  if (!mes.mes) return <p className="text-sm text-ink-3 py-8 text-center">Sin datos de negocio para este mes</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ShoppingCart} label="Ventas totales"    value={mes.ventasTotales}            accent="teal"   />
        <StatCard icon={DollarSign}   label="Cash Collected"    value={ars(mes.cashCollected)}        accent="green"  />
        <StatCard icon={TrendingDown} label="Costos totales"    value={ars(mes.costosTotal)}           accent="red"    />
        <StatCard icon={TrendingUp}   label="Ganancia"          value={ars(mes.gananciaVentaNueva)}    accent={mes.gananciaVentaNueva >= 0 ? 'green' : 'red'} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={BarChart2}    label="Rentabilidad"      value={pct(mes.rentabilidadVentaNueva)} accent="blue"   />
        <StatCard icon={Target}       label="% Cash Collection" value={pct(mes.pctCC)}                  accent="purple" />
        <StatCard icon={Users}        label="Mejor closer"      value={topCloser?.closer || '-'}        accent="orange" />
        <StatCard icon={CheckCircle}  label="ROAS"              value={mesAds.roas ?? '-'}               accent="teal"   />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-cream shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-semibold text-ink-2">Objetivos del mes</h2>
          <ProgressBar
            label={`Ventas: ${mes.ventasTotales} / ${mes.objetivoVentas}`}
            value={mes.ventasTotales} max={mes.objetivoVentas}
            color={mes.faltanteVentas === 0 ? 'green' : 'gold'}
          />
          <ProgressBar
            label={`Objetivo $: ${ars(mes.ventasTotal)} / ${ars(mes.objetivoPesos)}`}
            value={mes.ventasTotal} max={mes.objetivoPesos}
            color={mes.faltanteObj === 0 ? 'green' : 'gold'}
          />
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: 'Faltante ventas', val: mes.faltanteVentas,        fmt: v => v, bad: v => v > 0 },
              { label: 'Faltante obj $',  val: mes.faltanteObj,            fmt: ars,    bad: v => v > 0 },
              { label: 'Faltante gastos', val: mes.faltanteCubrirGastos,   fmt: v => v > 0 ? ars(v) : '✓ Cubierto', bad: v => v > 0 },
            ].map(({ label, val, fmt, bad }) => (
              <div key={label} className={`${bad(val) ? 'bg-gold-light' : 'bg-pos-light'} rounded-lg p-3 text-center`}>
                <p className="text-xs text-ink-3">{label}</p>
                <p className={`text-sm font-bold ${bad(val) ? 'text-gold-dark' : 'text-pos'}`}>{fmt(val)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h2 className="text-sm font-semibold text-ink-2 mb-3">Desglose del mes</h2>
          <div className="space-y-2">
            {[
              { label: 'Ventas nuevas', count: mes.cantVentasNuevas, monto: mes.ventasFront },
              { label: 'Ventas back',   count: mes.cantVentasBack,   monto: mes.ventasBack  },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between p-2 rounded-lg bg-page">
                <span className="text-sm text-ink-2">{row.label}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-ink-1 mr-3">{row.count} ventas</span>
                  <span className="text-sm font-bold text-gold-dark">{ars(row.monto)}</span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-cream">
              <p className="text-xs text-ink-3 font-medium mb-1">Recolección</p>
              {[
                { label: 'Venta nueva',       val: mes.recoleccionVentaNueva        },
                { label: 'Recurrente front',  val: mes.recoleccionRecurrenteFront   },
                { label: 'Back',              val: mes.recoleccionBack              },
                { label: 'Recurrente back',   val: mes.recoleccionRecurrenteBack    },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-xs py-1 border-b border-cream/50">
                  <span className="text-ink-3">{label}</span>
                  <span className="font-medium text-ink-2">{ars(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
        <h2 className="text-sm font-semibold text-ink-2 mb-4">Tendencia mensual</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={18} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#A8A29E' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} />
            <Tooltip content={<TooltipARS />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Ventas" fill="#B8960C" radius={[4,4,0,0]} />
            <Bar dataKey="Cash"   fill="#C4B49A" radius={[4,4,0,0]} />
            <Bar dataKey="Costos" fill="#7A4A42" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {mesClosers.length > 0 && (
        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h2 className="text-sm font-semibold text-ink-2 mb-3">Resumen closers</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-cream">
                  {['Closer','Agendadas','Asistencias','Ofertas','Cierres','% Cierre','% Asistencia'].map(h => (
                    <th key={h} className="pb-2 px-2 text-left text-xs text-ink-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...mesClosers].sort((a,b) => b.cierres - a.cierres).map((c, i) => (
                  <tr key={c.closer} className="border-b border-cream/50">
                    <td className="py-2.5 px-2 font-medium text-ink-1">{['🥇','🥈','🥉'][i] || ''} {c.closer}</td>
                    <td className="py-2.5 px-2 text-ink-2">{c.agendadas}</td>
                    <td className="py-2.5 px-2 text-ink-2">{c.asistencias}</td>
                    <td className="py-2.5 px-2 text-ink-2">{c.ofertas}</td>
                    <td className="py-2.5 px-2 font-semibold text-ink-1">{c.cierres}</td>
                    <td className="py-2.5 px-2"><span className="text-gold-dark font-semibold">{c.pctCierre}%</span></td>
                    <td className="py-2.5 px-2 text-ink-2">{c.pctAsistencia}%</td>
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
