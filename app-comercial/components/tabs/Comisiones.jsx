'use client';
import { useState } from 'react';

const fmt = n => `$${Math.round(n).toLocaleString('es-AR')}`;

export default function Comisiones({ comisiones }) {
  const [mesSel, setMesSel] = useState(comisiones[comisiones.length - 1]?.mes ?? '');
  const mes = comisiones.find(m => m.mes === mesSel);

  if (!comisiones.length) return <p className="text-gray-400 text-sm">Sin datos de comisiones.</p>;

  const allClosers = [...new Set(comisiones.flatMap(m => m.detalle.map(d => d.closer)))].sort();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Mes:</span>
        {comisiones.map(m => (
          <button key={m.mes} onClick={() => setMesSel(m.mes)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              m.mes === mesSel ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {m.label}
          </button>
        ))}
      </div>

      {mes && (
        <>
          {/* Cards totales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cash Front Cobrado</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(mes.totalCash)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Comisiones (8%)</p>
              <p className="text-2xl font-bold text-blue-700">{fmt(mes.totalComisiones)}</p>
            </div>
          </div>

          {/* Tabla por closer */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Comisiones — {mes.label}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Base: cash collected front del mes · Tasa: 8%</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Closer','Cash Front Cobrado','Comisión (8%)','% del total'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mes.detalle.map(d => (
                  <tr key={d.closer} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">{d.closer}</td>
                    <td className="px-5 py-4 text-gray-600">{fmt(d.cash)}</td>
                    <td className="px-5 py-4">
                      <span className="text-blue-700 font-bold text-base">{fmt(d.comision)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-24">
                          <div className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${mes.totalCash > 0 ? (d.cash/mes.totalCash)*100 : 0}%` }} />
                        </div>
                        <span className="text-gray-500 text-xs font-medium">
                          {mes.totalCash > 0 ? ((d.cash/mes.totalCash)*100).toFixed(1) : 0}%
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

      {/* Histórico */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Histórico de comisiones</h3>
        </div>
        <table className="w-full text-sm min-w-max">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mes</th>
              {allClosers.map(c => (
                <th key={c} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{c}</th>
              ))}
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...comisiones].reverse().map(m => (
              <tr key={m.mes} onClick={() => setMesSel(m.mes)}
                className={`cursor-pointer transition-colors ${m.mes === mesSel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                <td className="px-5 py-3 font-semibold text-gray-800">{m.label}</td>
                {allClosers.map(cl => {
                  const d = m.detalle.find(x => x.closer === cl);
                  return <td key={cl} className="px-5 py-3 text-gray-600">{d ? fmt(d.comision) : '—'}</td>;
                })}
                <td className="px-5 py-3 font-bold text-blue-700">{fmt(m.totalComisiones)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
