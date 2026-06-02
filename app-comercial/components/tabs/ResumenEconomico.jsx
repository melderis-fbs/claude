'use client';
import { useState } from 'react';

const $ = (n) => n == null ? '—' : `$${Math.round(n).toLocaleString('es-AR')}`;
const pct = (n) => n == null ? '—' : `${n.toFixed(1)}%`;
const num = (n) => n == null ? '—' : n.toLocaleString('es-AR');

const COST_CATS = ['Sueldos','Publicidad','Apps','Impuestos','Formación','Gastos Admin','Extras','Retiros'];

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green:  'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    amber:  'bg-amber-500/10 border-amber-500/30 text-amber-400',
    red:    'bg-red-500/10 border-red-500/30 text-red-400',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
  );
}

export default function ResumenEconomico({ resumen, cobrosSemanales }) {
  const [mesSel, setMesSel] = useState(resumen[resumen.length - 1]?.mes ?? '');
  const m = resumen.find(r => r.mes === mesSel) ?? resumen[resumen.length - 1];

  const totalCobradoSemana = cobrosSemanales.filter(c => c.pagado).reduce((a,c) => a+c.monto, 0);
  const totalEsperadoSemana = cobrosSemanales.reduce((a,c) => a+c.monto, 0);

  if (!m) return <p className="text-slate-500 text-sm">Sin datos disponibles.</p>;

  const hayCostos = Object.keys(m.costos).length > 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Selector de mes */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-400">Mes:</span>
        <div className="flex gap-1 flex-wrap">
          {resumen.map(r => (
            <button key={r.mes} onClick={() => setMesSel(r.mes)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                r.mes === mesSel
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Ventas nuevas"   value={num(m.ventasNuevas)} sub={$(m.montoFront)} color="blue" />
        <StatCard label="Cash Collected"  value={$(m.cashTotal)}      sub={`${pct(m.pctCC)} de cobro`} color="green" />
        <StatCard label="Ganancia"        value={$(m.ganancia)}       sub={hayCostos ? `Rent. ${pct(m.rentabilidad)}` : 'Sin datos de costos'} color={m.ganancia >= 0 ? 'purple' : 'red'} />
        <StatCard label="Cobros esta semana" value={$(totalCobradoSemana)} sub={`de ${$(totalEsperadoSemana)} esperados`} color="amber" />
      </div>

      {/* Tabla resumen del mes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ventas */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Ventas — {m.label}</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-800">
              {[
                ['Ventas nuevas (cant.)', num(m.ventasNuevas)],
                ['Ventas back (cant.)',   num(m.ventasBack)],
                ['Total ventas',          num(m.ventasTotal)],
                null,
                ['Monto front',  $(m.montoFront)],
                ['Monto back',   $(m.montoBack)],
                ['Total monto',  $(m.montoTotal)],
              ].map((row, i) => row === null ? (
                <tr key={i}><td colSpan={2} className="py-1" /></tr>
              ) : (
                <tr key={i}>
                  <td className="py-2 text-slate-400">{row[0]}</td>
                  <td className="py-2 text-right font-medium text-white">{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cash Collected */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Cash Collected — {m.label}</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-800">
              {[
                ['Cash front',   $(m.cashFront)],
                ['Cash back',    $(m.cashBack)],
                ['Total CC',     $(m.cashTotal)],
                ['% CC (front)', pct(m.pctCC)],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td className="py-2 text-slate-400">{label}</td>
                  <td className="py-2 text-right font-medium text-white">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {Object.keys(m.cashPorMetodo).length > 0 && (
            <>
              <p className="text-xs text-slate-500 uppercase tracking-wider mt-4 mb-2">Por método de pago</p>
              <div className="space-y-1">
                {Object.entries(m.cashPorMetodo)
                  .sort(([,a],[,b]) => b - a)
                  .map(([met, val]) => (
                    <div key={met} className="flex justify-between text-xs">
                      <span className="text-slate-400">{met}</span>
                      <span className="text-slate-200">{$(val)}</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>

        {/* Costos */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Costos — {m.label}</h3>
          {hayCostos ? (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-800">
                {COST_CATS.map(cat => {
                  const val = Object.entries(m.costos).find(([k]) => k.toLowerCase().includes(cat.toLowerCase()))?.[1] ?? 0;
                  const pctVal = m.cashFront > 0 ? (val / m.cashFront) * 100 : 0;
                  return (
                    <tr key={cat}>
                      <td className="py-2 text-slate-400">{cat}</td>
                      <td className="py-2 text-right text-white">{$(val)}</td>
                      <td className="py-2 text-right text-slate-500 w-16">{pct(pctVal)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-slate-700">
                  <td className="py-2 font-semibold text-white">TOTAL COSTOS</td>
                  <td className="py-2 text-right font-bold text-white">{$(m.totalCostos)}</td>
                  <td className="py-2 text-right text-slate-400">{m.cashFront > 0 ? pct((m.totalCostos/m.cashFront)*100) : '—'}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm">Sin datos de egresos para este mes.<br/>
              <span className="text-xs">Verificá la conexión con la planilla de egresos.</span>
            </p>
          )}
        </div>

        {/* Resultado */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Resultado — {m.label}</h3>
          <div className="space-y-4">
            <div className={`rounded-lg p-4 ${m.ganancia >= 0 ? 'bg-emerald-950/50 border border-emerald-800' : 'bg-red-950/50 border border-red-800'}`}>
              <p className="text-xs text-slate-400 mb-1">Ganancia venta nueva</p>
              <p className={`text-3xl font-bold ${m.ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{$(m.ganancia)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Rentabilidad</p>
              <p className="text-3xl font-bold text-blue-400">{hayCostos ? pct(m.rentabilidad) : '—'}</p>
            </div>
          </div>

          {/* Cobros semana */}
          {cobrosSemanales.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Cobros esta semana</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {cobrosSemanales.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${c.pagado ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      <span className="text-slate-300 truncate max-w-32">{c.nombre}</span>
                      <span className="text-slate-500">C{c.cuota}</span>
                    </div>
                    <span className="text-slate-200 font-medium">{$(c.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla histórica */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Histórico mensual</h3>
        </div>
        <table className="w-full text-sm min-w-max">
          <thead className="bg-slate-800/50">
            <tr>
              {['Mes','Ventas','Monto Front','Cash CC','% CC','Costos','Ganancia','Rent.'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {[...resumen].reverse().map(r => (
              <tr key={r.mes} onClick={() => setMesSel(r.mes)}
                className={`cursor-pointer transition-colors ${r.mes === mesSel ? 'bg-blue-500/10' : 'hover:bg-slate-800/40'}`}>
                <td className="px-4 py-3 font-medium text-white">{r.label}</td>
                <td className="px-4 py-3 text-slate-300">{r.ventasNuevas} nuevas · {r.ventasBack} back</td>
                <td className="px-4 py-3 text-slate-300">{$(r.montoFront)}</td>
                <td className="px-4 py-3 text-slate-300">{$(r.cashTotal)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.pctCC >= 80 ? 'bg-emerald-900/60 text-emerald-400' : r.pctCC >= 50 ? 'bg-amber-900/60 text-amber-400' : 'bg-red-900/60 text-red-400'}`}>
                    {pct(r.pctCC)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{$(r.totalCostos)}</td>
                <td className={`px-4 py-3 font-medium ${r.ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{$(r.ganancia)}</td>
                <td className="px-4 py-3 text-slate-300">{Object.keys(r.costos).length > 0 ? pct(r.rentabilidad) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
