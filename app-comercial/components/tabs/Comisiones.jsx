'use client';
import { useState } from 'react';

const $ = n => `$${Math.round(n).toLocaleString('es-AR')}`;

export default function Comisiones({ comisiones }) {
  const [mesSel, setMesSel] = useState(comisiones[comisiones.length - 1]?.mes ?? '');
  const mes = comisiones.find(m => m.mes === mesSel);

  if (!comisiones.length) return <p className="text-slate-500 text-sm">Sin datos de comisiones.</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-400">Mes:</span>
        <div className="flex gap-1 flex-wrap">
          {comisiones.map(m => (
            <button key={m.mes} onClick={() => setMesSel(m.mes)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                m.mes === mesSel ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mes && (
        <>
          {/* Cards totales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Cash Front Cobrado</p>
              <p className="text-2xl font-bold text-white">{$(mes.totalCash)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Comisiones (8%)</p>
              <p className="text-2xl font-bold text-blue-400">{$(mes.totalComisiones)}</p>
            </div>
          </div>

          {/* Tabla por closer */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="font-semibold text-white">Comisiones {mes.label}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Base: cash collected front del mes · Tasa: 8%</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  {['Closer','Cash Front Cobrado','Comisión (8%)','% del total'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {mes.detalle.map(d => (
                  <tr key={d.closer} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-white">{d.closer}</td>
                    <td className="px-5 py-4 text-slate-300">{$(d.cash)}</td>
                    <td className="px-5 py-4">
                      <span className="text-blue-400 font-semibold text-base">{$(d.comision)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-1.5 max-w-24">
                          <div className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${mes.totalCash > 0 ? (d.cash/mes.totalCash)*100 : 0}%` }} />
                        </div>
                        <span className="text-slate-400 text-xs">
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
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="font-semibold text-white">Histórico de comisiones</h3>
        </div>
        <table className="w-full text-sm min-w-max">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Mes</th>
              {[...new Set(comisiones.flatMap(m => m.detalle.map(d => d.closer)))].sort().map(c => (
                <th key={c} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{c}</th>
              ))}
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {[...comisiones].reverse().map(m => {
              const closerSet = [...new Set(comisiones.flatMap(x => x.detalle.map(d => d.closer)))].sort();
              return (
                <tr key={m.mes} onClick={() => setMesSel(m.mes)}
                  className={`cursor-pointer transition-colors ${m.mes === mesSel ? 'bg-blue-500/10' : 'hover:bg-slate-800/30'}`}>
                  <td className="px-5 py-3 font-medium text-white">{m.label}</td>
                  {closerSet.map(cl => {
                    const d = m.detalle.find(x => x.closer === cl);
                    return <td key={cl} className="px-5 py-3 text-slate-300">{d ? $(d.comision) : '—'}</td>;
                  })}
                  <td className="px-5 py-3 font-semibold text-blue-400">{$(m.totalComisiones)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
