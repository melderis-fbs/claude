'use client';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ── Helpers compartidos ───────────────────────────────────────────────────────

function formatFecha(val) {
  if (!val) return '—';
  const s = String(val).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return s;
}

const fmt = n => `$${Math.round(n).toLocaleString('es-AR')}`;
const pct = n => `${n.toFixed(1)}%`;

const DIAS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const ESTADOS = [
  { value: '',           label: 'Sin clasificar', color: 'bg-gray-100 text-gray-500'       },
  { value: 'Moroso',     label: 'Moroso',          color: 'bg-amber-100 text-amber-700'     },
  { value: 'En gestión', label: 'En gestión',       color: 'bg-blue-100 text-blue-700'      },
  { value: 'Incobrable', label: 'Incobrable',       color: 'bg-red-100 text-red-700'        },
  { value: 'Saldado',    label: 'Saldado',          color: 'bg-emerald-100 text-emerald-700'},
];

const estadoStyle = val => ESTADOS.find(e => e.value === val) || ESTADOS[0];

const CUOTAS_KEYS = [
  { monto: 'Primer pago',  estado: 'Estado pago 1',   campoEstado: 'Estado pago 1'  },
  { monto: 'Segundo pago', estado: 'Estado pago 2',   campoEstado: 'Estado pago 2'  },
  { monto: 'Tercer pago',  estado: 'Estado pago 3',   campoEstado: 'Estado pago 3'  },
  { monto: 'Cuarto Pago',  estado: 'Estado 4to pago', campoEstado: 'Estado 4to pago' },
];

function isPaid(val) {
  if (val === true) return true;
  const s = String(val || '').toUpperCase().trim();
  return s === 'SI' || s === 'SÍ' || s === 'YES' || s === '1' || s === 'TRUE';
}

function parseM(val) {
  if (!val && val !== 0) return 0;
  const n = parseFloat(String(val).replace(/[$,\s]/g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function parseCom(raw) {
  if (!raw) return { uc: '', sa: '', dc: '' };
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === 'object') return { uc: p.uc || '', sa: p.sa || '', dc: p.dc || '' };
  } catch {}
  return { uc: '', sa: String(raw), dc: '' };
}

function serializeCom({ uc, sa, dc }) {
  if (!uc && !sa && !dc) return '';
  return JSON.stringify({ uc, sa, dc });
}

function displayCom(raw) {
  const p = parseCom(raw);
  return [p.uc && `Contacto: ${p.uc}`, p.sa, p.dc].filter(Boolean).join(' · ');
}

const esUSAMet = met => /stripe|wise|paypal|payoneer|cripto|crypto/i.test(met || '');

// ── Resumen mensual ───────────────────────────────────────────────────────────

function VistaResumenMensual({ cobranzas, pendientesPorMes, proyeccionAnual = [] }) {
  const router = useRouter();
  const meses = cobranzas.map(m => m.mes);
  const [mesSel, setMesSel] = useState(meses[meses.length - 1] ?? '');
  const [marcando, setMarcando] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState('');

  const mesActual = cobranzas.find(x => x.mes === mesSel);
  const pendientes = (pendientesPorMes[mesSel] ?? [])
    .filter(p => !marcando.has(`${p.rowIndex}-${p.cuota}`));

  const marcarPagado = useCallback(async (p) => {
    const key = `${p.rowIndex}-${p.cuota}`;
    setMarcando(prev => new Set([...prev, key]));
    setErrorMsg('');
    try {
      const res = await fetch('/api/update-pago', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: p.rowIndex, headerName: p.campoEstado, value: 'SI' }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error al actualizar');
      router.refresh();
    } catch (err) {
      setMarcando(prev => { const s = new Set(prev); s.delete(key); return s; });
      setErrorMsg(err.message);
    }
  }, [router]);

  return (
    <div className="space-y-5">
      {errorMsg && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{errorMsg}</div>}

      <div className="flex gap-1 flex-wrap">
        {cobranzas.map(m => (
          <button key={m.mes} onClick={() => setMesSel(m.mes)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              m.mes === mesSel ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>{m.label}</button>
        ))}
      </div>

      {mesActual && (
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
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Pagos pendientes — {mesActual.label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{pendientes.length} pagos pendientes</p>
            </div>
            {pendientes.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">No hay pagos pendientes para este mes.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Cliente','Programa','Closer','Cuota','Monto','Fecha','Método','Origen',''].map((h,i) => (
                        <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
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
                        <td className="px-4 py-3 text-gray-500">{formatFecha(p.fecha)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{p.metodo || '—'}</td>
                        <td className="px-4 py-3">
                          {p.met1 ? (
                            esUSAMet(p.met1)
                              ? <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold">USD</span>
                              : <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">AR</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => marcarPagado(p)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
                            ✓ Marcar pagado
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Histórico mensual</h3>
            </div>
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
                    className={`cursor-pointer transition-colors ${m.mes === mesSel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3 font-semibold text-gray-800">{m.label}</td>
                    <td className="px-5 py-3 text-gray-700">{fmt(m.aCobrar)}</td>
                    <td className="px-5 py-3 text-emerald-600 font-medium">{fmt(m.cobrado)}</td>
                    <td className="px-5 py-3 text-red-500 font-medium">{fmt(m.pendiente)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-20">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(m.pctCobrado, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${m.pctCobrado >= 80 ? 'text-emerald-600' : m.pctCobrado >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
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

      {proyeccionAnual.length > 0 && (
        <div className="space-y-5">
          {/* Table 1 - Por tipo de pago */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Proyección anual — Por tipo de pago</h3>
            </div>
            <table className="w-full text-sm min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  {['Mes','Venta PU','%PU','Venta Cuotas','%Cuotas','Front','Back','Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proyeccionAnual.map(r => {
                  const totalFront = r.ventaFront;
                  const pctPU = totalFront > 0 ? (r.ventaPU / totalFront) * 100 : 0;
                  const pctC  = totalFront > 0 ? (r.ventaCuotas / totalFront) * 100 : 0;
                  return (
                    <tr key={r.mes} className={r.esFuturo ? 'opacity-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">
                        {r.label}{r.esFuturo && <span className="ml-1 text-xs text-gray-400 font-normal">proy.</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{fmt(r.ventaPU)}</td>
                      <td className="px-4 py-2.5 text-gray-500">{pct(pctPU)}</td>
                      <td className="px-4 py-2.5 text-gray-700">{fmt(r.ventaCuotas)}</td>
                      <td className="px-4 py-2.5 text-gray-500">{pct(pctC)}</td>
                      <td className="px-4 py-2.5 text-gray-700">{fmt(r.ventaFront)}</td>
                      <td className="px-4 py-2.5 text-gray-700">{fmt(r.ventaBack)}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{fmt(r.total)}</td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="px-4 py-2.5 text-gray-900">TOTAL</td>
                  <td className="px-4 py-2.5 text-gray-900">{fmt(proyeccionAnual.reduce((a,r) => a+r.ventaPU,0))}</td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {(() => { const t = proyeccionAnual.reduce((a,r)=>a+r.ventaFront,0); const pu = proyeccionAnual.reduce((a,r)=>a+r.ventaPU,0); return t>0?pct((pu/t)*100):'0%'; })()}
                  </td>
                  <td className="px-4 py-2.5 text-gray-900">{fmt(proyeccionAnual.reduce((a,r) => a+r.ventaCuotas,0))}</td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {(() => { const t = proyeccionAnual.reduce((a,r)=>a+r.ventaFront,0); const c = proyeccionAnual.reduce((a,r)=>a+r.ventaCuotas,0); return t>0?pct((c/t)*100):'0%'; })()}
                  </td>
                  <td className="px-4 py-2.5 text-gray-900">{fmt(proyeccionAnual.reduce((a,r) => a+r.ventaFront,0))}</td>
                  <td className="px-4 py-2.5 text-gray-900">{fmt(proyeccionAnual.reduce((a,r) => a+r.ventaBack,0))}</td>
                  <td className="px-4 py-2.5 text-gray-900">{fmt(proyeccionAnual.reduce((a,r) => a+r.total,0))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table 2 - AR vs USA */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Proyección anual — AR vs USA</h3>
            </div>
            <table className="w-full text-sm min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wider whitespace-nowrap">Venta AR</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-400 uppercase tracking-wider">%AR</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-500 uppercase tracking-wider whitespace-nowrap">Venta USA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">%USA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">│</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wider whitespace-nowrap">Ingreso AR</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-400 uppercase tracking-wider">%AR</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-500 uppercase tracking-wider whitespace-nowrap">Ingreso USA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">%USA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Total ingreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proyeccionAnual.map(r => {
                  const pVAR  = r.total > 0 ? (r.ventaAR  / r.total) * 100 : 0;
                  const pVUSA = r.total > 0 ? (r.ventaUSA / r.total) * 100 : 0;
                  const pIAR  = r.totalIngreso > 0 ? (r.ingresoAR  / r.totalIngreso) * 100 : 0;
                  const pIUSA = r.totalIngreso > 0 ? (r.ingresoUSA / r.totalIngreso) * 100 : 0;
                  return (
                    <tr key={r.mes} className={r.esFuturo ? 'opacity-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">
                        {r.label}{r.esFuturo && <span className="ml-1 text-xs text-gray-400 font-normal">proy.</span>}
                      </td>
                      <td className="px-4 py-2.5 text-blue-700 font-medium">{fmt(r.ventaAR)}</td>
                      <td className="px-4 py-2.5 text-blue-500 text-xs">{pct(pVAR)}</td>
                      <td className="px-4 py-2.5 text-indigo-700 font-medium">{fmt(r.ventaUSA)}</td>
                      <td className="px-4 py-2.5 text-indigo-500 text-xs">{pct(pVUSA)}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{fmt(r.total)}</td>
                      <td className="px-4 py-2.5 text-gray-200">│</td>
                      <td className="px-4 py-2.5 text-blue-700 font-medium">{fmt(r.ingresoAR)}</td>
                      <td className="px-4 py-2.5 text-blue-500 text-xs">{pct(pIAR)}</td>
                      <td className="px-4 py-2.5 text-indigo-700 font-medium">{fmt(r.ingresoUSA)}</td>
                      <td className="px-4 py-2.5 text-indigo-500 text-xs">{pct(pIUSA)}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{fmt(r.totalIngreso)}</td>
                    </tr>
                  );
                })}
                {/* Total row */}
                {(() => {
                  const tVAR = proyeccionAnual.reduce((a,r)=>a+r.ventaAR,0);
                  const tVUSA = proyeccionAnual.reduce((a,r)=>a+r.ventaUSA,0);
                  const tV = proyeccionAnual.reduce((a,r)=>a+r.total,0);
                  const tIAR = proyeccionAnual.reduce((a,r)=>a+r.ingresoAR,0);
                  const tIUSA = proyeccionAnual.reduce((a,r)=>a+r.ingresoUSA,0);
                  const tI = proyeccionAnual.reduce((a,r)=>a+r.totalIngreso,0);
                  return (
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                      <td className="px-4 py-2.5 text-gray-900">TOTAL</td>
                      <td className="px-4 py-2.5 text-blue-800">{fmt(tVAR)}</td>
                      <td className="px-4 py-2.5 text-blue-600 text-xs">{tV>0?pct((tVAR/tV)*100):'—'}</td>
                      <td className="px-4 py-2.5 text-indigo-800">{fmt(tVUSA)}</td>
                      <td className="px-4 py-2.5 text-indigo-600 text-xs">{tV>0?pct((tVUSA/tV)*100):'—'}</td>
                      <td className="px-4 py-2.5 text-gray-900">{fmt(tV)}</td>
                      <td className="px-4 py-2.5 text-gray-200">│</td>
                      <td className="px-4 py-2.5 text-blue-800">{fmt(tIAR)}</td>
                      <td className="px-4 py-2.5 text-blue-600 text-xs">{tI>0?pct((tIAR/tI)*100):'—'}</td>
                      <td className="px-4 py-2.5 text-indigo-800">{fmt(tIUSA)}</td>
                      <td className="px-4 py-2.5 text-indigo-600 text-xs">{tI>0?pct((tIUSA/tI)*100):'—'}</td>
                      <td className="px-4 py-2.5 text-gray-900">{fmt(tI)}</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pagos semanales ───────────────────────────────────────────────────────────

function VistaSemanal({ proyeccion, deudores = [], clientes = [] }) {
  const [offset, setOffset] = useState(0);
  const [marcando, setMarcando] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState('');
  const [editandoKey, setEditandoKey] = useState(null);
  const [textoEdit, setTextoEdit] = useState('');
  const [notasLocal, setNotasLocal] = useState(() => {
    const m = {};
    for (const c of clientes) {
      const nota = c['Notas'];
      if (nota) m[c._rowIndex] = nota;
    }
    return m;
  });
  const router = useRouter();

  const idx = Math.max(0, Math.min(proyeccion.length - 1,
    proyeccion.findIndex(s => s.offset === 0) + offset));
  const semana = proyeccion[idx];

  const abrirNota = (cobro) => {
    setTextoEdit(notasLocal[cobro.rowIndex] || '');
    setEditandoKey(`${cobro.rowIndex}-${cobro.cuota}`);
  };

  const guardarNota = async (cobro) => {
    setErrorMsg('');
    try {
      const res = await fetch('/api/update-pago', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: cobro.rowIndex, headerName: 'Notas', value: textoEdit }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar');
      setNotasLocal(prev => ({ ...prev, [cobro.rowIndex]: textoEdit }));
      setEditandoKey(null);
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const marcarPagado = useCallback(async (cobro) => {
    const key = `${cobro.rowIndex}-${cobro.cuota}`;
    setMarcando(prev => new Set([...prev, key]));
    setErrorMsg('');
    try {
      const res = await fetch('/api/update-pago', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: cobro.rowIndex, headerName: cobro.campoEstado, value: 'SI' }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      router.refresh();
    } catch (err) {
      setMarcando(prev => { const s = new Set(prev); s.delete(key); return s; });
      setErrorMsg(err.message);
    }
  }, [router]);

  if (!semana) return <p className="text-gray-400 text-sm">Sin datos de proyección.</p>;

  const diasEntries = Object.entries(semana.dias);
  const tieneAlgo = diasEntries.some(([, cobros]) => cobros.length > 0);

  return (
    <div className="space-y-5 max-w-4xl">
      {errorMsg && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{errorMsg}</div>}

      <div className="flex items-center gap-3">
        <button onClick={() => setOffset(o => o - 1)} disabled={idx === 0}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-xl leading-none">‹</button>
        <div className="flex-1 text-center">
          <p className={`text-sm font-semibold ${semana.esActual ? 'text-blue-600' : 'text-gray-700'}`}>
            {semana.esActual ? '● Esta semana' : semana.label}
          </p>
          {semana.esActual && <p className="text-xs text-gray-400 mt-0.5">{semana.label}</p>}
        </div>
        <button onClick={() => setOffset(o => o + 1)} disabled={idx === proyeccion.length - 1}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-xl leading-none">›</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Esperado</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(semana.totalEsperado)}</p>
          <p className="text-xs text-gray-400 mt-1">{Object.values(semana.dias).flat().length} cobros</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cobrado</p>
          <p className="text-2xl font-bold text-emerald-700">{fmt(semana.totalCobrado)}</p>
          <p className="text-xs text-emerald-600 mt-1">{Object.values(semana.dias).flat().filter(c => c.pagado).length} pagos</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pendiente</p>
          <p className="text-2xl font-bold text-red-600">{fmt(semana.totalPendiente)}</p>
          <p className="text-xs text-red-400 mt-1">{Object.values(semana.dias).flat().filter(c => !c.pagado).length} pendientes</p>
        </div>
      </div>

      {!tieneAlgo ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-12 text-center text-gray-400 text-sm">
          No hay cobros programados para esta semana.
        </div>
      ) : (
        <div className="space-y-3">
          {diasEntries.map(([fechaKey, cobros], dIdx) => {
            const visibles = cobros.filter(c => !marcando.has(`${c.rowIndex}-${c.cuota}`));
            if (!visibles.length) return null;
            const [, mm, dd] = fechaKey.split('-');
            const diaLabel = `${DIAS[dIdx]}  ${dd}/${mm}`;
            const cobradoHoy   = visibles.filter(c => c.pagado).reduce((a,c) => a + c.monto, 0);
            const pendienteHoy = visibles.filter(c => !c.pagado).reduce((a,c) => a + c.monto, 0);
            return (
              <div key={fechaKey} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
                  <span className="text-sm font-semibold text-gray-700">{diaLabel}</span>
                  <div className="flex gap-3 text-xs">
                    {cobradoHoy > 0 && <span className="text-emerald-600 font-medium">{fmt(cobradoHoy)} cobrado</span>}
                    {pendienteHoy > 0 && <span className="text-red-500 font-medium">{fmt(pendienteHoy)} pendiente</span>}
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {visibles.map((co, j) => {
                    const editKey = `${co.rowIndex}-${co.cuota}`;
                    const nota = notasLocal[co.rowIndex];
                    const isEditing = editandoKey === editKey;
                    return (
                    <div key={j} className="px-5 py-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${co.pagado ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{co.nombre}</p>
                            <p className="text-xs text-gray-400">
                              {co.programa} · {co.esSeña ? 'Seña' : `Cuota ${co.cuota}`} · {co.closer || '—'}
                              {co.metodo ? ` · ${co.metodo}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-sm font-bold ${co.pagado ? 'text-emerald-600' : 'text-gray-800'}`}>{fmt(co.monto)}</span>
                          {co.pagado
                            ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">✓ Cobrado</span>
                            : <button onClick={() => marcarPagado(co)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors">
                                ✓ Cobrado
                              </button>
                          }
                        </div>
                      </div>
                      <div className="ml-5">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <textarea value={textoEdit} onChange={e => setTextoEdit(e.target.value)} autoFocus rows={2}
                              placeholder="Ej: Llamó, prometió pagar el viernes…"
                              className="w-full border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 resize-none" />
                            <div className="flex gap-2">
                              <button onClick={() => guardarNota(co)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                Guardar
                              </button>
                              <button onClick={() => setEditandoKey(null)}
                                className="px-3 py-1 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => abrirNota(co)} className="text-xs italic text-left w-full hover:text-blue-500 transition-colors">
                            {nota
                              ? <span className="text-gray-500">{nota}</span>
                              : <span className="text-gray-300">+ Agregar nota de gestión…</span>
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Deudores ──────────────────────────────────────────────────────────────────

function VistaDeudores({ deudores: initialDeudores, clientes = [] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialDeudores);
  const [editando, setEditando] = useState(null);
  const [marcando, setMarcando] = useState(new Set());
  const [reporteModal, setReporteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mostrarSaldados, setMostrarSaldados] = useState(false);

  const [agregarModal, setAgregarModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [clienteSel, setClienteSel] = useState(null);
  const [cuotaSel, setCuotaSel] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [nuevoUc, setNuevoUc] = useState('');
  const [nuevoSa, setNuevoSa] = useState('');
  const [nuevoDc, setNuevoDc] = useState('');
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);

  const clientesFiltrados = busqueda.length > 1
    ? clientes.filter(cl => String(cl['Nombre'] || '').toLowerCase().includes(busqueda.toLowerCase())).slice(0, 8)
    : [];

  const cuotasDisponibles = clienteSel
    ? CUOTAS_KEYS.map((q, i) => {
        const monto = parseM(clienteSel[q.monto]);
        return { cuota: i + 1, monto, q };
      }).filter(x => x.monto > 0 && !isPaid(clienteSel[x.q.estado]))
    : [];

  const abrirAgregar = () => {
    setBusqueda(''); setClienteSel(null); setCuotaSel(null);
    setNuevoEstado(''); setNuevoUc(''); setNuevoSa(''); setNuevoDc('');
    setAgregarModal(true);
  };

  const agregarDeudor = async () => {
    if (!clienteSel || !cuotaSel) return;
    setGuardandoNuevo(true);
    try {
      const res = await fetch('/api/deudores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: clienteSel._rowIndex, cuotaNum: cuotaSel.cuota, estado: nuevoEstado, comentario: serializeCom({ uc: nuevoUc, sa: nuevoSa, dc: nuevoDc }) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      const yaExiste = items.some(d => d.rowIndex === clienteSel._rowIndex && d.cuota === cuotaSel.cuota);
      if (!yaExiste) {
        setItems(prev => [...prev, {
          nombre: (clienteSel['Nombre'] || '').trim(), programa: (clienteSel['Programa'] || '').trim(),
          closer: (clienteSel['CLOSER'] || '').trim(), cuota: cuotaSel.cuota, monto: cuotaSel.monto,
          fecha: '', diasMora: null, rowIndex: clienteSel._rowIndex, campoEstado: cuotaSel.q.campoEstado,
          estado: nuevoEstado, comentario: serializeCom({ uc: nuevoUc, sa: nuevoSa, dc: nuevoDc }), fechaUpdate: '',
        }]);
      }
      setAgregarModal(false);
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setGuardandoNuevo(false);
    }
  };

  const visibles = items.filter(d => mostrarSaldados || d.estado !== 'Saldado');
  const totalMora = visibles.filter(d => d.estado !== 'Saldado').reduce((a,d) => a + d.monto, 0);
  const sinClasificar = visibles.filter(d => !d.estado).length;

  const guardarEstado = useCallback(async () => {
    if (!editando) return;
    try {
      const res = await fetch('/api/deudores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: editando.rowIndex, cuotaNum: editando.cuota, estado: editando.estado, comentario: serializeCom({ uc: editando.uc, sa: editando.sa, dc: editando.dc }) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      const comentarioGuardado = serializeCom({ uc: editando.uc, sa: editando.sa, dc: editando.dc });
      setItems(prev => prev.map(d =>
        d.rowIndex === editando.rowIndex && d.cuota === editando.cuota
          ? { ...d, estado: editando.estado, comentario: comentarioGuardado } : d
      ));
      setEditando(null);
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message);
    }
  }, [editando, router]);

  const marcarPagado = useCallback(async (d) => {
    const key = `${d.rowIndex}-${d.cuota}`;
    setMarcando(prev => new Set([...prev, key]));
    setErrorMsg('');
    try {
      const res = await fetch('/api/update-pago', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: d.rowIndex, headerName: d.campoEstado, value: 'SI' }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      setItems(prev => prev.filter(x => !(x.rowIndex === d.rowIndex && x.cuota === d.cuota)));
      router.refresh();
    } catch (err) {
      setMarcando(prev => { const s = new Set(prev); s.delete(key); return s; });
      setErrorMsg(err.message);
    }
  }, [router]);

  const generarReporte = () => {
    const hoy = new Date().toLocaleDateString('es-AR');
    const grupos = { 'Incobrable': [], 'Moroso': [], 'En gestión': [], '': [] };
    for (const d of visibles) {
      if (d.estado === 'Saldado') continue;
      (grupos[d.estado] !== undefined ? grupos[d.estado] : grupos['']).push(d);
    }
    const emojiMap  = { 'Incobrable':'🔴','Moroso':'🟡','En gestión':'🔵','':'⚪' };
    const tituloMap = { 'Incobrable':'INCOBRABLES','Moroso':'MOROSOS','En gestión':'EN GESTIÓN','':'SIN CLASIFICAR' };
    let texto = `📋 *Reporte de Deudores — ${hoy}*\n━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `💰 Total en mora: ${fmt(totalMora)} | ${visibles.filter(d => d.estado !== 'Saldado').length} deudores\n\n`;
    for (const [estado, lista] of Object.entries(grupos)) {
      if (!lista.length) continue;
      texto += `${emojiMap[estado]} *${tituloMap[estado]}* (${lista.length})\n`;
      for (const d of lista) {
        const mora = d.diasMora !== null ? `${d.diasMora} días` : 'sin fecha';
        texto += `• ${d.nombre} — Cuota ${d.cuota} — ${fmt(d.monto)} — ${mora}\n`;
        const com = parseCom(d.comentario);
        if (com.uc) texto += `  📅 Último contacto: ${com.uc}\n`;
        if (com.sa) texto += `  📍 Situación: ${com.sa}\n`;
        if (com.dc) texto += `  📝 Descripción: ${com.dc}\n`;
      }
      texto += '\n';
    }
    return texto.trim();
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {errorMsg && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{errorMsg}</div>}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total en mora</p>
          <p className="text-2xl font-bold text-red-600">{fmt(totalMora)}</p>
          <p className="text-xs text-red-400 mt-1">{visibles.filter(d => d.estado !== 'Saldado').length} deudores</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sin clasificar</p>
          <p className="text-2xl font-bold text-amber-600">{sinClasificar}</p>
          <p className="text-xs text-amber-500 mt-1">necesitan estado</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Incobrables</p>
          <p className="text-2xl font-bold text-gray-800">{items.filter(d => d.estado === 'Incobrable').length}</p>
          <p className="text-xs text-gray-400 mt-1">{fmt(items.filter(d => d.estado === 'Incobrable').reduce((a,d) => a+d.monto, 0))}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => setReporteModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          📤 Generar reporte Slack
        </button>
        <button onClick={abrirAgregar}
          className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
          + Agregar deudor
        </button>
        <button onClick={() => setMostrarSaldados(v => !v)}
          className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors">
          {mostrarSaldados ? 'Ocultar saldados' : 'Mostrar saldados'}
        </button>
      </div>

      {visibles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-16 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-gray-700 font-semibold">Sin deudores</p>
          <p className="text-gray-400 text-sm mt-1">No hay pagos vencidos pendientes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Cliente','Programa','Cuota','Monto','Mora','Closer','Estado',''].map((h,i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibles.map((d, i) => {
                  const es = estadoStyle(d.estado);
                  const enProceso = marcando.has(`${d.rowIndex}-${d.cuota}`);
                  return (
                    <tr key={i} className={`hover:bg-gray-50 ${d.estado === 'Saldado' ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{d.nombre}</p>
                        {d.comentario && <p className="text-xs text-gray-400 italic truncate max-w-48">{displayCom(d.comentario)}</p>}
                      </td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">{d.programa}</span></td>
                      <td className="px-4 py-3 text-gray-500 font-medium">C{d.cuota}</td>
                      <td className="px-4 py-3 font-semibold text-red-600">{fmt(d.monto)}</td>
                      <td className="px-4 py-3">
                        {d.diasMora === null
                          ? <span className="text-xs text-gray-400 italic">Sin fecha</span>
                          : <span className={`text-xs font-bold ${d.diasMora > 30 ? 'text-red-600' : d.diasMora > 14 ? 'text-amber-600' : 'text-gray-500'}`}>{d.diasMora}d</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{d.closer || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { const com = parseCom(d.comentario); setEditando({ rowIndex: d.rowIndex, cuota: d.cuota, estado: d.estado, uc: com.uc, sa: com.sa, dc: com.dc }); }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${es.color} hover:opacity-80 transition-opacity`}>
                          {es.label}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {!enProceso && d.estado !== 'Saldado' && (
                          <button onClick={() => marcarPagado(d)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
                            ✓ Pagado
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal estado */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Actualizar estado</h3>
              <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Estado</label>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS.map(e => (
                    <button key={e.value} onClick={() => setEditando(prev => ({ ...prev, estado: e.value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                        editando.estado === e.value ? `${e.color} border-current` : 'bg-white border-transparent text-gray-500 hover:border-gray-200'
                      }`}>{e.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Último contacto</label>
                <input value={editando.uc} onChange={e => setEditando(prev => ({ ...prev, uc: e.target.value }))}
                  placeholder="Ej: 01/06 · WhatsApp"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Situación actual</label>
                <textarea value={editando.sa} onChange={e => setEditando(prev => ({ ...prev, sa: e.target.value }))}
                  placeholder="Ej: Prometió pagar el viernes..." rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción del caso</label>
                <textarea value={editando.dc} onChange={e => setEditando(prev => ({ ...prev, dc: e.target.value }))}
                  placeholder="Ej: Está esperando que se concrete una venta..." rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditando(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button onClick={guardarEstado} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar deudor */}
      {agregarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAgregarModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Agregar deudor</h3>
              <button onClick={() => setAgregarModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">Buscar cliente</label>
                {clienteSel ? (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">{clienteSel['Nombre']}</p>
                      <p className="text-xs text-blue-600">{clienteSel['Programa'] || '—'} · {clienteSel['CLOSER'] || '—'}</p>
                    </div>
                    <button onClick={() => { setClienteSel(null); setCuotaSel(null); setBusqueda(''); }}
                      className="text-blue-400 hover:text-blue-700 text-lg ml-2">×</button>
                  </div>
                ) : (
                  <>
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)} autoFocus
                      placeholder="Escribí el nombre del cliente…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    {clientesFiltrados.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {clientesFiltrados.map(cl => (
                          <button key={cl._rowIndex} onClick={() => { setClienteSel(cl); setBusqueda(''); setCuotaSel(null); }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0">
                            <p className="font-medium text-gray-900">{cl['Nombre']}</p>
                            <p className="text-xs text-gray-400">{cl['Programa'] || '—'} · {cl['CLOSER'] || '—'}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {busqueda.length > 1 && clientesFiltrados.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">Sin resultados</p>
                    )}
                  </>
                )}
              </div>

              {clienteSel && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Cuota pendiente</label>
                  {cuotasDisponibles.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Este cliente no tiene cuotas pendientes con monto.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {cuotasDisponibles.map(x => (
                        <button key={x.cuota} onClick={() => setCuotaSel(x)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                            cuotaSel?.cuota === x.cuota ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                          }`}>
                          C{x.cuota} — ${Math.round(x.monto).toLocaleString('es-AR')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {cuotaSel && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Estado inicial</label>
                    <div className="flex flex-wrap gap-2">
                      {ESTADOS.map(e => (
                        <button key={e.value} onClick={() => setNuevoEstado(e.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                            nuevoEstado === e.value ? `${e.color} border-current` : 'bg-white border-transparent text-gray-500 hover:border-gray-200'
                          }`}>{e.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Último contacto</label>
                    <input value={nuevoUc} onChange={e => setNuevoUc(e.target.value)} placeholder="Ej: 01/06 · WhatsApp"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Situación actual</label>
                    <textarea value={nuevoSa} onChange={e => setNuevoSa(e.target.value)}
                      placeholder="Ej: Prometió pagar el viernes..." rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Descripción del caso</label>
                    <textarea value={nuevoDc} onChange={e => setNuevoDc(e.target.value)}
                      placeholder="Ej: Esperando que venda para pagarnos..." rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 resize-none" />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setAgregarModal(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button onClick={agregarDeudor} disabled={!clienteSel || !cuotaSel || guardandoNuevo}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40">
                  {guardandoNuevo ? 'Guardando…' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal reporte */}
      {reporteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setReporteModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Reporte Slack</h3>
              <button onClick={() => setReporteModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="p-5 space-y-3">
              <textarea readOnly value={generarReporte()} rows={14}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 bg-gray-50 focus:outline-none resize-none" />
              <button onClick={() => navigator.clipboard.writeText(generarReporte())}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                📋 Copiar al portapapeles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Cobranzas({ cobranzas, pendientesPorMes, proyeccion = [], proyeccionAnual = [], deudores = [], clientes = [] }) {
  const [subTab, setSubTab] = useState('mensual');
  const deudoresActivos = deudores.filter(d => d.estado !== 'Saldado');

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex gap-2 items-center flex-wrap border-b border-gray-200 pb-0">
        {[['mensual','Resumen mensual'],['semanal','Pagos semanales'],['deudores','Deudores']].map(([v, l]) => (
          <button key={v} onClick={() => setSubTab(v)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              subTab === v ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>{l}</button>
        ))}
        {deudoresActivos.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full -mt-1">
            {deudoresActivos.length}
          </span>
        )}
      </div>

      <div>
        {subTab === 'mensual'  && <VistaResumenMensual cobranzas={cobranzas} pendientesPorMes={pendientesPorMes} proyeccionAnual={proyeccionAnual} />}
        {subTab === 'semanal'  && <VistaSemanal proyeccion={proyeccion} deudores={deudores} clientes={clientes} />}
        {subTab === 'deudores' && <VistaDeudores deudores={deudores} clientes={clientes} />}
      </div>
    </div>
  );
}
