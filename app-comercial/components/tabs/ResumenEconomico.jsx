'use client';
import { useState } from 'react';

const fmt = n => n == null ? '—' : `$${Math.round(n).toLocaleString('es-AR')}`;
const pct = n => n == null ? '—' : `${n.toFixed(1)}%`;

const COST_CATS = ['Sueldos','Publicidad','Apps','Impuestos','Formación','Gastos Admin','Extras','Retiros'];

function Card({ label, value, sub, color = 'blue' }) {
  const styles = {
    blue:   'bg-blue-50 border-blue-200',
    green:  'bg-emerald-50 border-emerald-200',
    purple: 'bg-purple-50 border-purple-200',
    amber:  'bg-amber-50 border-amber-200',
    red:    'bg-red-50 border-red-200',
  };
  const textStyles = {
    blue:   'text-blue-700',
    green:  'text-emerald-700',
    purple: 'text-purple-700',
    amber:  'text-amber-700',
    red:    'text-red-700',
  };
  return (
    <div className={`rounded-xl border p-5 ${styles[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textStyles[color]}`}>{value}</p>
      {sub && <p className="text-xs mt-1 text-gray-500">{sub}</p>}
    </div>
  );
}

function BarSplit({ a, b, labelA, labelB, colorA = 'bg-blue-500', colorB = 'bg-gray-200' }) {
  const total = a + b;
  if (!total) return null;
  const pctA = Math.round((a / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div className={`${colorA} transition-all`} style={{ width: `${pctA}%` }} />
        <div className={`${colorB} flex-1`} />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{labelA} {pctA}%</span>
        <span>{labelB} {100 - pctA}%</span>
      </div>
    </div>
  );
}

export default function ResumenEconomico({ resumen, cobrosSemanales }) {
  const [mesSel, setMesSel] = useState(resumen[resumen.length - 1]?.mes ?? '');
  const m = resumen.find(r => r.mes === mesSel) ?? resumen[resumen.length - 1];

  const cobradoSemana  = cobrosSemanales.filter(c => c.pagado).reduce((a,c) => a+c.monto, 0);
  const esperadoSemana = cobrosSemanales.reduce((a,c) => a+c.monto, 0);

  if (!m) return <p className="text-gray-400 text-sm">Sin datos disponibles.</p>;

  const hayCostos = Object.keys(m.costos).length > 0;
  const totalVentasConMet = (m.ventasAR || 0) + (m.ventasExt || 0);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Selector de mes */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Mes:</span>
        {resumen.map(r => (
          <button key={r.mes} onClick={() => setMesSel(r.mes)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              r.mes === mesSel
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Ventas nuevas"      value={m.ventasNuevas} sub={fmt(m.montoFront)} color="blue" />
        <Card label="Recolección"        value={fmt(m.cashTotal)} sub={`${pct(m.pctCC)} de cobro`} color="green" />
        <Card label="Ganancia"           value={fmt(m.ganancia)} sub={hayCostos ? `Rent. ${pct(m.rentabilidad)}` : 'Sin datos de costos'} color={m.ganancia >= 0 ? 'purple' : 'red'} />
        <Card label="Cobros esta semana" value={fmt(cobradoSemana)} sub={`de ${fmt(esperadoSemana)} esperados`} color="amber" />
      </div>

      {/* Detalle del mes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Ventas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Ventas — {m.label}</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Ventas nuevas</span>
              <span className="font-semibold text-gray-900">{m.ventasNuevas}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Ventas back</span>
              <span className="font-semibold text-gray-900">{m.ventasBack}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Monto front</span>
              <span className="font-semibold text-gray-900">{fmt(m.montoFront)}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Monto back</span>
              <span className="font-semibold text-gray-900">{fmt(m.montoBack)}</span>
            </div>

            {/* Argentina vs Exterior */}
            {totalVentasConMet > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Origen de ventas nuevas</p>
                <BarSplit
                  a={m.ventasAR || 0} b={m.ventasExt || 0}
                  labelA="Argentina" labelB="Exterior"
                  colorA="bg-blue-500" colorB="bg-indigo-300"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium">Argentina</p>
                    <p className="text-sm font-bold text-blue-800">{m.ventasAR || 0} ventas</p>
                    <p className="text-xs text-blue-600">{fmt(m.montoAR || 0)}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-100">
                    <p className="text-xs text-indigo-600 font-medium">Exterior</p>
                    <p className="text-sm font-bold text-indigo-800">{m.ventasExt || 0} ventas</p>
                    <p className="text-xs text-indigo-600">{fmt(m.montoExt || 0)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recolección */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recolección — {m.label}</h3>

          {/* Progreso de cobro */}
          <div className="mb-5">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500">Cobrado de ventas front</span>
              <span className="font-bold text-emerald-600">{pct(m.pctCC)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-3 bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(m.pctCC || 0, 100)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{fmt(m.cashFront)} cobrado</span>
              <span>de {fmt(m.montoFront)}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              ['Recolección front', fmt(m.cashFront), 'text-emerald-600'],
              ['Recolección back',  fmt(m.cashBack),  'text-gray-700'],
              ['Total recolectado', fmt(m.cashTotal),  'text-gray-900 font-bold'],
            ].map(([label, val, cls]) => (
              <div key={label} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-gray-500">{label}</span>
                <span className={cls}>{val}</span>
              </div>
            ))}
          </div>

          {Object.keys(m.cashPorMetodo).length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Por método de pago</p>
              <div className="space-y-2">
                {Object.entries(m.cashPorMetodo).sort(([,a],[,b])=>b-a).map(([met, val]) => {
                  const pctMet = m.cashTotal > 0 ? (val / m.cashTotal) * 100 : 0;
                  return (
                    <div key={met}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{met}</span>
                        <span className="font-medium text-gray-800">{fmt(val)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-1.5 bg-blue-400 rounded-full" style={{ width: `${pctMet}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Costos */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Costos — {m.label}</h3>
          {hayCostos ? (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {COST_CATS.map(cat => {
                  const entry = Object.entries(m.costos).find(([k]) => k.toLowerCase().includes(cat.toLowerCase()));
                  const val = entry?.[1] ?? 0;
                  const pctVal = m.cashFront > 0 ? (val/m.cashFront)*100 : 0;
                  return (
                    <tr key={cat}>
                      <td className="py-2 text-gray-500">{cat}</td>
                      <td className="py-2 text-right font-medium text-gray-800">{fmt(val)}</td>
                      <td className="py-2 text-right text-gray-400 w-14">{pct(pctVal)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-300 font-semibold">
                  <td className="py-2 text-gray-900">TOTAL COSTOS</td>
                  <td className="py-2 text-right text-gray-900">{fmt(m.totalCostos)}</td>
                  <td className="py-2 text-right text-gray-500">{m.cashFront > 0 ? pct((m.totalCostos/m.cashFront)*100) : '—'}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400 text-sm">Sin datos de egresos.<br/><span className="text-xs">Verificá la conexión con la planilla de egresos.</span></p>
          )}
        </div>

        {/* Resultado */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Resultado — {m.label}</h3>
          <div className="space-y-3">
            <div className={`rounded-lg p-4 ${m.ganancia >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <p className="text-xs text-gray-500 mb-1">Ganancia venta nueva</p>
              <p className={`text-3xl font-bold ${m.ganancia >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(m.ganancia)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Rentabilidad</p>
              <p className="text-3xl font-bold text-blue-700">{hayCostos ? pct(m.rentabilidad) : '—'}</p>
            </div>
          </div>
          {cobrosSemanales.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cobros esta semana</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {cobrosSemanales.map((c,i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${c.pagado ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <span className="text-gray-700 truncate max-w-32">{c.nombre}</span>
                      <span className="text-gray-400 text-xs">C{c.cuota}</span>
                    </div>
                    <span className="font-medium text-gray-800">{fmt(c.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Histórico mensual</h3>
        </div>
        <table className="w-full text-sm min-w-max">
          <thead className="bg-gray-50">
            <tr>
              {['Mes','Ventas','Monto Front','Arg / Ext','Recolección','% cobro','Costos','Ganancia','Rent.'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...resumen].reverse().map(r => (
              <tr key={r.mes} onClick={() => setMesSel(r.mes)}
                className={`cursor-pointer transition-colors ${r.mes === mesSel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                <td className="px-5 py-3 font-semibold text-gray-800">{r.label}</td>
                <td className="px-5 py-3 text-gray-600">{r.ventasNuevas} nuevas · {r.ventasBack} back</td>
                <td className="px-5 py-3 text-gray-700">{fmt(r.montoFront)}</td>
                <td className="px-5 py-3 text-gray-600">
                  <span className="text-blue-600">{r.ventasAR || 0} AR</span>
                  <span className="text-gray-300 mx-1">/</span>
                  <span className="text-indigo-600">{r.ventasExt || 0} Ext</span>
                </td>
                <td className="px-5 py-3 text-gray-700">{fmt(r.cashTotal)}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.pctCC>=80?'bg-emerald-100 text-emerald-700':r.pctCC>=50?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                    {pct(r.pctCC)}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-700">{fmt(r.totalCostos)}</td>
                <td className={`px-5 py-3 font-semibold ${r.ganancia>=0?'text-emerald-600':'text-red-600'}`}>{fmt(r.ganancia)}</td>
                <td className="px-5 py-3 text-gray-600">{Object.keys(r.costos).length>0?pct(r.rentabilidad):'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
