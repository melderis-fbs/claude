'use client';
import { useState } from 'react';
import { CUOTAS_DEF, parseMonto, normalizarMes, mesLabel } from '../../lib/calculos.js';

const $ = n => `$${Math.round(n).toLocaleString('es-AR')}`;
const pct = n => `${n.toFixed(1)}%`;

export default function Cobranzas({ cobranzas, clientes }) {
  const [vista, setVista] = useState('mensual');
  const [mesSel, setMesSel] = useState(cobranzas[cobranzas.length - 1]?.mes ?? '');

  // Detalle de pendientes del mes seleccionado
  const pendientesMes = clientes.filter(c => {
    return CUOTAS_DEF.some(q => {
      if ((c[q.estado]||'').toUpperCase() === 'SI') return false;
      const monto = parseMonto(c[q.monto]);
      if (!monto) return false;
      const mes = normalizarMes(c[q.fecha]);
      return mes === mesSel;
    });
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toggle vista */}
      <div className="flex gap-2">
        {['mensual','pendientes'].map(v => (
          <button key={v} onClick={() => setVista(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              vista === v ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}>{v}</button>
        ))}
      </div>

      {vista === 'mensual' && (
        <>
          {/* Cards resumen del mes */}
          <div className="flex gap-2 flex-wrap">
            {cobranzas.map(m => (
              <button key={m.mes} onClick={() => setMesSel(m.mes)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  m.mes === mesSel ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}>{m.label}</button>
            ))}
          </div>

          {(() => {
            const m = cobranzas.find(x => x.mes === mesSel);
            if (!m) return null;
            return (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">A cobrar</p>
                  <p className="text-2xl font-bold text-white">{$(m.aCobrar)}</p>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Cobrado</p>
                  <p className="text-2xl font-bold text-emerald-400">{$(m.cobrado)}</p>
                  <p className="text-xs text-slate-500 mt-1">{pct(m.pctCobrado)} del total</p>
                </div>
                <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Pendiente</p>
                  <p className="text-2xl font-bold text-red-400">{$(m.pendiente)}</p>
                </div>
              </div>
            );
          })()}

          {/* Tabla mensual */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  {['Mes','A cobrar','Cobrado','Pendiente','% cobrado'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[...cobranzas].reverse().map(m => (
                  <tr key={m.mes} onClick={() => setMesSel(m.mes)}
                    className={`cursor-pointer transition-colors ${m.mes === mesSel ? 'bg-blue-500/10' : 'hover:bg-slate-800/30'}`}>
                    <td className="px-5 py-3 font-medium text-white">{m.label}</td>
                    <td className="px-5 py-3 text-slate-300">{$(m.aCobrar)}</td>
                    <td className="px-5 py-3 text-emerald-400">{$(m.cobrado)}</td>
                    <td className="px-5 py-3 text-red-400">{$(m.pendiente)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-1.5 max-w-24">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${m.pctCobrado}%` }} />
                        </div>
                        <span className={`text-xs font-medium ${m.pctCobrado >= 80 ? 'text-emerald-400' : m.pctCobrado >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
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
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {cobranzas.map(m => (
              <button key={m.mes} onClick={() => setMesSel(m.mes)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  m.mes === mesSel ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}>{m.label}</button>
            ))}
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="font-semibold text-white">Pagos pendientes — {mesLabel(mesSel)}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{pendientesMes.length} clientes con pagos pendientes este mes</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  {['Cliente','Programa','Closer','Cuota','Monto','Fecha','Método'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pendientesMes.flatMap(c =>
                  CUOTAS_DEF.map((q, i) => {
                    if ((c[q.estado]||'').toUpperCase() === 'SI') return null;
                    const monto = parseMonto(c[q.monto]);
                    if (!monto) return null;
                    if (normalizarMes(c[q.fecha]) !== mesSel) return null;
                    return (
                      <tr key={`${c._rowIndex}-${i}`} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{c['Nombre']}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">{c['Programa']}</span></td>
                        <td className="px-4 py-3 text-slate-300">{c['CLOSER'] || '—'}</td>
                        <td className="px-4 py-3 text-slate-400">Cuota {i+1}</td>
                        <td className="px-4 py-3 font-medium text-red-400">{$(monto)}</td>
                        <td className="px-4 py-3 text-slate-400">{c[q.fecha] || '—'}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{c[q.metodo] || '—'}</td>
                      </tr>
                    );
                  }).filter(Boolean)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
