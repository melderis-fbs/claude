'use client';
import { useState, useEffect, Fragment } from 'react';

const fmt = n => `$${Math.round(n).toLocaleString('es-AR')}`;
const fmtSigno = n => `${n < 0 ? '-' : '+'}$${Math.round(Math.abs(n)).toLocaleString('es-AR')}`;

const fmtFecha = val => {
  if (!val) return '—';
  const s = String(val).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return s;
};

// Ajustes por closer/mes (fijos + variables). Se guardan por navegador; no
// tocan el cálculo del 8%, son una capa arriba solo para este tab.
const COM_ADJ_KEY = 'comisiones_ajustes_v1';
const adjVacio = { fijo: 0, items: [] };
const sumaItems = items => (items || []).reduce((a, i) => a + (Number(i.monto) || 0), 0);
const totalAjuste = adj => (Number(adj?.fijo) || 0) + sumaItems(adj?.items);

export default function Comisiones({ comisiones }) {
  const [mesSel, setMesSel] = useState(comisiones[comisiones.length - 1]?.mes ?? '');
  const [expandido, setExpandido] = useState(null); // closer expandido
  const [ajustes, setAjustes] = useState({});       // { "mes|closer": {fijo, items} }
  const mes = comisiones.find(m => m.mes === mesSel);

  useEffect(() => {
    try { setAjustes(JSON.parse(localStorage.getItem(COM_ADJ_KEY) || '{}')); } catch {}
  }, []);

  if (!comisiones.length) return <p className="text-gray-400 text-sm">Sin datos de comisiones.</p>;

  const allClosers = [...new Set(comisiones.flatMap(m => m.detalle.map(d => d.closer)))].sort();

  const getAdj = closer => ajustes[`${mesSel}|${closer}`] || adjVacio;
  const totalPagarCloser = d => d.comision + totalAjuste(getAdj(d.closer));
  const totalPagarMes = mes ? mes.detalle.reduce((a, d) => a + totalPagarCloser(d), 0) : 0;

  // Guarda el ajuste del closer del mes actual, directo a estado + localStorage.
  function setAdj(closer, updater) {
    const key = `${mesSel}|${closer}`;
    setAjustes(prev => {
      const cur = prev[key] || adjVacio;
      const nextAdj = updater({ fijo: cur.fijo ?? '', items: (cur.items || []).map(i => ({ ...i })) });
      const next = { ...prev, [key]: nextAdj };
      try { localStorage.setItem(COM_ADJ_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cash Front Cobrado</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(mes.totalCash)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Comisiones (8%)</p>
              <p className="text-2xl font-bold text-blue-700">{fmt(mes.totalComisiones)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total a pagar</p>
              <p className="text-2xl font-bold text-emerald-700">{fmt(totalPagarMes)}</p>
              <p className="text-xs text-gray-400 mt-0.5">comisión + fijos + ajustes</p>
            </div>
          </div>

          {/* Tabla por closer */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Comisiones — {mes.label}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Base: cash collected front del mes · Tasa: 8% · Tocá una persona para ver detalle y cargar fijos/ajustes</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Closer','Cash Front Cobrado','Comisión (8%)','% del total'].map((h, hi) => (
                    <th key={hi} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mes.detalle.map(d => {
                  const abierto = expandido === d.closer;
                  return (
                  <Fragment key={d.closer}>
                    <tr onClick={() => setExpandido(abierto ? null : d.closer)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        <span className="text-gray-400 mr-1.5 inline-block w-3">{abierto ? '▾' : '▸'}</span>
                        {d.closer}
                        {d.items?.length > 0 && (
                          <span className="ml-2 text-xs font-normal text-gray-400">{d.items.length} cobros</span>
                        )}
                        {totalAjuste(getAdj(d.closer)) !== 0 && (
                          <span className="block text-xs font-normal text-emerald-600 mt-0.5">
                            A pagar {fmt(totalPagarCloser(d))} <span className="text-gray-400">({fmtSigno(totalAjuste(getAdj(d.closer)))})</span>
                          </span>
                        )}
                      </td>
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
                    {abierto && (
                      <tr className="bg-gray-50/60">
                        <td colSpan={4} className="px-5 py-4 space-y-4">
                          {/* Detalle de cobros */}
                          {d.items?.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-400 mb-2">Cobros que suman a la comisión de {d.closer} — {mes.label}:</div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs min-w-max">
                                  <thead>
                                    <tr className="text-gray-400">
                                      <th className="text-left font-medium pb-1 pr-4">Cliente</th>
                                      <th className="text-left font-medium pb-1 pr-4">Cuota</th>
                                      <th className="text-left font-medium pb-1 pr-4">Método</th>
                                      <th className="text-left font-medium pb-1 pr-4">Fecha</th>
                                      <th className="text-right font-medium pb-1">Monto</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {d.items.map((it, idx) => (
                                      <tr key={idx} className={`border-t border-gray-200 ${it.cuota > 1 ? 'text-amber-700' : 'text-gray-600'}`}>
                                        <td className="py-1.5 pr-4">{it.nombre}</td>
                                        <td className="py-1.5 pr-4">
                                          C{it.cuota}
                                          {it.cuota > 1 && <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1 rounded">no-front</span>}
                                        </td>
                                        <td className="py-1.5 pr-4">{it.metodo || '—'}</td>
                                        <td className="py-1.5 pr-4">{fmtFecha(it.fecha)}</td>
                                        <td className="py-1.5 text-right font-semibold">{fmt(it.monto)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t-2 border-gray-300 font-bold text-gray-800">
                                      <td className="pt-1.5" colSpan={4}>Total {d.closer}</td>
                                      <td className="pt-1.5 text-right">{fmt(d.cash)}</td>
                                    </tr>
                                    {d.items.some(it => it.cuota > 1) && (
                                      <tr className="text-gray-500">
                                        <td className="pt-1" colSpan={4}>Solo front (Cuota 1)</td>
                                        <td className="pt-1 text-right font-semibold text-emerald-700">
                                          {fmt(d.items.filter(it => it.cuota === 1).reduce((a, it) => a + it.monto, 0))}
                                        </td>
                                      </tr>
                                    )}
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Editor de fijos y variables (inline, sin modal) */}
                          {(() => {
                            const adj = getAdj(d.closer);
                            return (
                              <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-md">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Fijos y ajustes</p>

                                <div className="flex items-center gap-2 mb-3">
                                  <label className="text-sm text-gray-600 w-16 flex-shrink-0">Fijo</label>
                                  <span className="text-gray-400">$</span>
                                  <input type="number" inputMode="numeric" value={adj.fijo || ''} placeholder="0"
                                    onChange={e => setAdj(d.closer, a => ({ ...a, fijo: e.target.value }))}
                                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                                </div>

                                <div className="space-y-2">
                                  {(adj.items || []).map((it, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <input value={it.concepto || ''} placeholder="Concepto"
                                        onChange={e => setAdj(d.closer, a => ({ ...a, items: a.items.map((x, xi) => xi === i ? { ...x, concepto: e.target.value } : x) }))}
                                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                                      <input type="number" inputMode="numeric" value={it.monto || ''} placeholder="0"
                                        onChange={e => setAdj(d.closer, a => ({ ...a, items: a.items.map((x, xi) => xi === i ? { ...x, monto: e.target.value } : x) }))}
                                        className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                                      <button onClick={() => setAdj(d.closer, a => ({ ...a, items: a.items.filter((_, xi) => xi !== i) }))}
                                        className="text-gray-300 hover:text-red-400 text-lg px-1 flex-shrink-0">×</button>
                                    </div>
                                  ))}
                                </div>

                                <button onClick={() => setAdj(d.closer, a => ({ ...a, items: [...(a.items || []), { concepto: '', monto: '' }] }))}
                                  className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800">+ Agregar variable</button>
                                <p className="text-[11px] text-gray-400 mt-1">Montos negativos para descuentos/adelantos (ej. -5000). Se guarda solo.</p>

                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Total a pagar</span>
                                  <span className="text-lg font-bold text-emerald-700">{fmt(totalPagarCloser(d))}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                  );
                })}
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
