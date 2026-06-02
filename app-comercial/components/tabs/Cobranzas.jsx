'use client';
import { useState } from 'react';

const fmt = n => `$${Math.round(n).toLocaleString('es-AR')}`;
const pct = n => `${n.toFixed(1)}%`;

export default function Cobranzas({ cobranzas, pendientesPorMes }) {
  const [vista, setVista] = useState('mensual');
  const meses = cobranzas.map(m => m.mes);
  const [mesSel, setMesSel] = useState(meses[meses.length - 1] ?? '');

  const mesActual = cobranzas.find(x => x.mes === mesSel);
  const pendientes = pendientesPorMes[mesSel] ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Toggle */}
      <div className="flex gap-2">
        {[['mensual','Resumen mensual'],['pendientes','Pagos pendientes']].map(([v,l]) => (
          <button key={v} onClick={() => setVista(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vista===v ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>{l}</button>
        ))}
      </div>

      {/* Selector de mes */}
      <div className="flex gap-1 flex-wrap">
        {cobranzas.map(m => (
          <button key={m.mes} onClick={() => setMesSel(m.mes)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              m.mes===mesSel ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>{m.label}</button>
        ))}
      </div>

      {vista === 'mensual' && mesActual && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">A cobrar</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(mesActual.aCobrar)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cobrado</p>
              <p className="text-2xl font-bold text-emerald-700">{fmt(mesActual.cobrado)}</p>
              <p className="text-xs text-gray-500 mt-1">{pct(mesActual.pctCobrado)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pendiente</p>
              <p className="text-2xl font-bold text-red-600">{fmt(mesActual.pendiente)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Mes','A cobrar','Cobrado','Pendiente','% cobrado'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...cobranzas].reverse().map(m => (
                  <tr key={m.mes} onClick={() => setMesSel(m.mes)}
                    className={`cursor-pointer transition-colors ${m.mes===mesSel?'bg-blue-50':'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3 font-semibold text-gray-800">{m.label}</td>
                    <td className="px-5 py-3 text-gray-700">{fmt(m.aCobrar)}</td>
                    <td className="px-5 py-3 text-emerald-600 font-medium">{fmt(m.cobrado)}</td>
                    <td className="px-5 py-3 text-red-500 font-medium">{fmt(m.pendiente)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-20">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(m.pctCobrado,100)}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${m.pctCobrado>=80?'text-emerald-600':m.pctCobrado>=50?'text-amber-600':'text-red-500'}`}>
                          {pct(m.pctCobrado)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {vista === 'pendientes' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Pagos pendientes — {mesActual?.label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{pendientes.length} pagos pendientes</p>
          </div>
          {pendientes.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">No hay pagos pendientes para este mes.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Cliente','Programa','Closer','Cuota','Monto','Fecha','Método'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendientes.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">{p.programa}</span></td>
                    <td className="px-4 py-3 text-gray-700">{p.closer || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">Cuota {p.cuota}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{fmt(p.monto)}</td>
                    <td className="px-4 py-3 text-gray-500">{p.fecha || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.metodo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
