'use client';
import { useState, useCallback, useMemo, useEffect } from 'react';
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

const esUSAMet   = met => /stripe|wise|paypal|payoneer|cripto|crypto/i.test(met || '');
const esDolarApp = met => /dolarapp|dólarapp/i.test(met || '');

function mesLabel(yyyyMM) {
  if (!yyyyMM) return '';
  const [y, m] = yyyyMM.split('-');
  const ns = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${ns[parseInt(m) - 1]} ${y}`;
}

// Clasifica un método de pago en: ar | usd | dolarapp | efectivo
function clasiMet(met) {
  const s = String(met || '').toUpperCase();
  if (esDolarApp(met))                                          return 'dolarapp';
  if (s.includes('EFECTIVO'))                                   return 'efectivo';
  if (/STRIPE|WISE|PAYPAL|PAYONEER|CRIPTO|CRYPTO/.test(s))     return 'usd';
  return 'ar';
}

const CHIP = {
  ar:       'bg-blue-100 text-blue-700',
  usd:      'bg-indigo-100 text-indigo-700',
  dolarapp: 'bg-teal-100 text-teal-700',
  efectivo: 'bg-amber-100 text-amber-700',
};
const CHIP_LABEL = { ar: 'AR', usd: 'USD', dolarapp: 'DA', efectivo: 'Cash' };

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
                            <span className={`px-1.5 py-0.5 rounded-md text-xs font-semibold ${CHIP[clasiMet(p.met1)]}`}>
                              {CHIP_LABEL[clasiMet(p.met1)]}
                            </span>
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
  const [reporteModal, setReporteModal] = useState(false);
  const [textoReporte, setTextoReporte] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorSlack, setErrorSlack] = useState('');
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

  const generarReporteCompleto = () => {
    const activos = deudores.filter(d => d.estado !== 'Saldado');
    const totalMora = activos.reduce((s, d) => s + d.monto, 0);
    const CATS = [
      { estado: 'Incobrable', emoji: '🔴', titulo: 'INCOBRABLES' },
      { estado: 'Moroso',     emoji: '🟡', titulo: 'MOROSOS' },
      { estado: 'En gestión', emoji: '🔵', titulo: 'EN GESTIÓN' },
      { estado: '',           emoji: '⚪', titulo: 'SIN CLASIFICAR' },
    ];
    let texto = `📋 *Reporte semanal de cobranzas*\n`;
    texto += `${activos.length} deudores pendientes — Total: ${fmt(totalMora)} USD\n`;
    for (const cat of CATS) {
      const lista = activos.filter(d => d.estado === cat.estado)
        .sort((a, b) => (b.diasMora ?? -1) - (a.diasMora ?? -1));
      if (!lista.length) continue;
      const totalCat = lista.reduce((s, d) => s + d.monto, 0);
      texto += `\n${cat.emoji} *${cat.titulo}* (${lista.length}) — ${fmt(totalCat)}\n`;
      for (const d of lista) {
        const mora = d.diasMora !== null ? `${d.diasMora}d de mora` : 'sin fecha';
        texto += `${d.nombre}  •  ${fmt(d.monto)}  •  cuota ${d.cuota}  •  ${mora}\n`;
        const sa = parseCom(d.comentario).sa;
        if (sa) texto += `${sa}\n`;
      }
    }
    if (semana) {
      const pendientes = Object.values(semana.dias).flat().filter(c => !c.pagado);
      if (pendientes.length > 0) {
        const totalPend = pendientes.reduce((s, c) => s + c.monto, 0);
        const label = semana.esActual ? 'esta semana' : semana.label;
        texto += `\n📅 *Cobros pendientes ${label}*\nTotal pendiente: ${fmt(totalPend)}\n\n`;
        for (const c of pendientes) {
          texto += `⏳ ${c.nombre}  •  ${fmt(c.monto)}  •  cuota ${c.cuota}  •  ${c.fecha || '—'}\n`;
          const d = activos.find(x => x.rowIndex === c.rowIndex && x.cuota === c.cuota);
          const sa = d ? parseCom(d.comentario).sa : '';
          if (sa) texto += `${sa}\n`;
        }
      }
    }
    return texto.trim();
  };

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
        <button
          onClick={() => { setTextoReporte(generarReporteCompleto()); setReporteModal(true); setEnviado(false); setErrorSlack(''); }}
          title="Generar reporte Slack"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors text-sm">
          📤
        </button>
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

      {/* Modal reporte Slack */}
      {reporteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => { setReporteModal(false); setEnviado(false); setErrorSlack(''); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Reporte semanal</h3>
                <p className="text-xs text-gray-400 mt-0.5">{semana?.esActual ? 'Esta semana' : semana?.label}</p>
              </div>
              <button onClick={() => { setReporteModal(false); setEnviado(false); setErrorSlack(''); }}
                className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="p-5">
              <textarea
                value={textoReporte}
                onChange={e => { setTextoReporte(e.target.value); setEnviado(false); }}
                rows={14}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 bg-gray-50 focus:outline-none resize-none focus:border-blue-300"
              />
            </div>
            {errorSlack && <p className="px-5 pb-2 text-red-600 text-xs">{errorSlack}</p>}
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button onClick={() => navigator.clipboard.writeText(textoReporte)}
                className="px-4 py-2 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Copiar
              </button>
              <button
                disabled={enviando || enviado}
                onClick={async () => {
                  setEnviando(true); setErrorSlack(''); setEnviado(false);
                  try {
                    const res = await fetch('/api/slack', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: textoReporte }),
                    });
                    if (!res.ok) throw new Error((await res.json()).error || 'Error al enviar');
                    setEnviado(true);
                  } catch (err) {
                    setErrorSlack(err.message);
                  } finally {
                    setEnviando(false);
                  }
                }}
                className={`px-4 py-2 text-xs rounded-lg font-semibold transition-colors ${
                  enviado ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60'
                }`}
              >
                {enviado ? '✓ Enviado a Slack' : enviando ? 'Enviando…' : '📤 Enviar a Slack'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pagos recibidos (reconciliación bancaria) ─────────────────────────────────

const CUOTAS_FULL = [
  { monto: 'Primer pago',  fecha: 'Fecha de ingreso(1er pago)', metodo: 'Met pago 1',  estado: 'Estado pago 1'   },
  { monto: 'Segundo pago', fecha: 'Fecha 2do pago',             metodo: 'Met pago 2',  estado: 'Estado pago 2'   },
  { monto: 'Tercer pago',  fecha: 'Fecha 3er pago',             metodo: 'Met pago 3',  estado: 'Estado pago 3'   },
  { monto: 'Cuarto Pago',  fecha: 'Fecha 4to pago',             metodo: 'Met pago 4',  estado: 'Estado 4to pago' },
];

function normMes(val) {
  const s = String(val ?? '').trim();
  if (!s) return '';
  const iso = s.match(/^(\d{4})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}`;
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}`;
  return '';
}

const VERF_KEY    = 'pagos_verificados_v1';
const SPLITS_KEY  = 'pagos_splits_v1';
const MATCHES_KEY = 'pagos_matches_v1';
const METODOS_SPLIT = ['Transferencia', 'Efectivo', 'Wise', 'Stripe', 'DolarApp', 'Cripto', 'Otro'];

function VistaPagos({ clientes = [] }) {
  const [verificados, setVerificados] = useState(new Set());
  const [splits, setSplits]           = useState({});
  const [splitModal, setSplitModal]   = useState(null); // null | { mes, p }
  const [splitDraft, setSplitDraft]   = useState([]);   // [{monto, metodo}]
  const [matches, setMatches]         = useState({});
  const [trackerPagos, setTrackerPagos] = useState([]);
  const [matchModal, setMatchModal]   = useState(null); // null | { mes, p }
  const [showExtracto, setShowExtracto] = useState(false);

  useEffect(() => {
    try { setVerificados(new Set(JSON.parse(localStorage.getItem(VERF_KEY) || '[]'))); } catch {}
    try { setSplits(JSON.parse(localStorage.getItem(SPLITS_KEY) || '{}')); } catch {}
    try { setMatches(JSON.parse(localStorage.getItem(MATCHES_KEY) || '{}')); } catch {}
    fetch('/api/tracker-pagos').then(r => r.json()).then(d => setTrackerPagos(d.movimientos || [])).catch(() => {});
  }, []);

  function toggleVerif(mes, p) {
    const key = `${mes}|${p.nombre}|${p.cuota}`;
    setVerificados(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem(VERF_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function abrirSplit(mes, p) {
    const key = `${mes}|${p.nombre}|${p.cuota}`;
    const existente = splits[key];
    setSplitDraft(existente ? existente.map(pt => ({ ...pt })) : [
      { monto: p.monto, metodo: p.metodo || 'Transferencia' },
    ]);
    setSplitModal({ mes, p });
  }

  function saveSplit() {
    const { mes, p } = splitModal;
    const key   = `${mes}|${p.nombre}|${p.cuota}`;
    const partes = splitDraft.filter(pt => pt.monto > 0);
    setSplits(prev => {
      const next = { ...prev, [key]: partes };
      try { localStorage.setItem(SPLITS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setSplitModal(null);
  }

  function removeSplit() {
    const { mes, p } = splitModal;
    const key = `${mes}|${p.nombre}|${p.cuota}`;
    setSplits(prev => {
      const next = { ...prev };
      delete next[key];
      try { localStorage.setItem(SPLITS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setSplitModal(null);
  }

  function abrirMatch(mes, p) { setMatchModal({ mes, p }); }

  function saveMatch(mov) {
    const { mes, p } = matchModal;
    const key = `${mes}|${p.nombre}|${p.cuota}`;
    setMatches(prev => {
      const next = { ...prev, [key]: mov };
      try { localStorage.setItem(MATCHES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setMatchModal(null);
  }

  function removeMatch(mes, p) {
    const key = `${mes}|${p.nombre}|${p.cuota}`;
    setMatches(prev => {
      const next = { ...prev };
      delete next[key];
      try { localStorage.setItem(MATCHES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function updateParte(i, field, val) {
    setSplitDraft(prev => prev.map((pt, idx) =>
      idx === i ? { ...pt, [field]: field === 'monto' ? (parseFloat(val) || 0) : val } : pt
    ));
  }

  const pagosPorMes = useMemo(() => {
    const pm = {};
    for (const c of clientes) {
      CUOTAS_FULL.forEach((q, i) => {
        if (!isPaid(c[q.estado])) return;
        const monto = parseM(c[q.monto]);
        if (!monto) return;
        const mes = normMes(c[q.fecha]);
        if (!mes) return;
        if (!pm[mes]) pm[mes] = [];
        pm[mes].push({
          nombre:   (c['Nombre']   || '').trim(),
          programa: (c['Programa'] || '').trim(),
          cuota:    i + 1,
          monto,
          fecha:    c[q.fecha] || '',
          metodo:   c[q.metodo] || 'Sin especificar',
        });
      });
    }
    return pm;
  }, [clientes]);

  const mesesDisp = useMemo(() =>
    Object.keys(pagosPorMes).sort().reverse().map(m => ({ mes: m, label: mesLabel(m) })),
    [pagosPorMes]
  );

  const hoy    = new Date();
  const mesHoy = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`;
  const [mesSel, setMesSel] = useState(() => {
    const keys = Object.keys(pagosPorMes).sort();
    return keys.includes(mesHoy) ? mesHoy : (keys[keys.length - 1] ?? '');
  });
  const [filtroMet, setFiltroMet] = useState('');

  const pagos = useMemo(() =>
    (pagosPorMes[mesSel] || []).slice().sort((a,b) => String(a.fecha).localeCompare(String(b.fecha))),
    [pagosPorMes, mesSel]
  );

  // Totales usan desglose cuando existe
  const totales = useMemo(() => {
    const t = { ar:0, usd:0, dolarapp:0, efectivo:0, total:0 };
    for (const p of pagos) {
      const partes = splits[`${mesSel}|${p.nombre}|${p.cuota}`];
      if (partes?.length) {
        for (const pt of partes) { const c = clasiMet(pt.metodo); t[c] += pt.monto; t.total += pt.monto; }
      } else {
        const c = clasiMet(p.metodo); t[c] += p.monto; t.total += p.monto;
      }
    }
    return t;
  }, [pagos, splits, mesSel]);

  const metodos   = useMemo(() => [...new Set(pagos.map(p => p.metodo))].sort(), [pagos]);
  const pagosFilt = filtroMet ? pagos.filter(p => p.metodo === filtroMet) : pagos;
  const totalFilt = pagosFilt.reduce((a,p) => a+p.monto, 0);

  const trackerDelMes = useMemo(() =>
    trackerPagos.filter(m => normMes(m['Fecha de ingreso'] ?? m['Fecha'] ?? '') === mesSel),
    [trackerPagos, mesSel]
  );

  const matchedIdx = useMemo(() => {
    const s = new Set();
    for (const mov of Object.values(matches)) { if (mov?._rowIndex) s.add(mov._rowIndex); }
    return s;
  }, [matches]);

  if (mesesDisp.length === 0) return <div className="text-gray-400 text-sm py-10 text-center">No hay pagos registrados.</div>;

  // Cálculo para el modal de desglose
  const splitTotal     = splitDraft.reduce((a, pt) => a + (pt.monto || 0), 0);
  const splitRestante  = splitModal ? Math.round((splitModal.p.monto - splitTotal) * 100) / 100 : 0;
  const splitOk        = Math.abs(splitRestante) < 0.01;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Selector de mes */}
      <div className="flex gap-1 flex-wrap">
        {mesesDisp.slice(0, 12).map(m => (
          <button key={m.mes} onClick={() => { setMesSel(m.mes); setFiltroMet(''); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              m.mes === mesSel ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>{m.label}</button>
        ))}
      </div>

      {/* Cards resumen por categoría */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key:'ar',       label:'AR',       sub:'Transferencias', cls:'blue'   },
          { key:'usd',      label:'USD',      sub:'Stripe / Wise',  cls:'indigo' },
          { key:'dolarapp', label:'DolarApp', sub:'USD → Pesos',    cls:'teal'   },
          { key:'efectivo', label:'Efectivo', sub:'Cash',           cls:'amber'  },
        ].map(({ key, label, sub, cls }) => (
          <div key={key} className={`bg-${cls}-50 border border-${cls}-200 rounded-xl p-4`}>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-bold text-${cls}-700`}>{fmt(totales[key])}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabla de pagos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-800">Pagos recibidos — {mesLabel(mesSel)}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {pagosFilt.length} pagos · {fmt(totalFilt)}
              {(() => {
                const vCount = pagosFilt.filter(p => verificados.has(`${mesSel}|${p.nombre}|${p.cuota}`)).length;
                return vCount > 0
                  ? <span className="ml-2 text-emerald-600 font-medium">· {vCount}/{pagosFilt.length} verificados</span>
                  : null;
              })()}
            </p>
          </div>
          <p className="text-xl font-bold text-emerald-700">{fmt(totales.total)}</p>
        </div>

        {/* Filtro por método */}
        {metodos.length > 1 && (
          <div className="px-5 py-3 border-b border-gray-50 flex gap-2 flex-wrap">
            <button onClick={() => setFiltroMet('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filtroMet ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Todos
            </button>
            {metodos.map(m => (
              <button key={m} onClick={() => setFiltroMet(f => f === m ? '' : m)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtroMet === m ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {m}
                <span className="ml-1 opacity-60">{fmt(pagos.filter(p=>p.metodo===m).reduce((a,p)=>a+p.monto,0))}</span>
              </button>
            ))}
          </div>
        )}

        {pagosFilt.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">No hay pagos para este mes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha','Cliente','Programa','Cuota','Método','Monto',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagosFilt.map((p, i) => {
                  const pKey   = `${mesSel}|${p.nombre}|${p.cuota}`;
                  const partes = splits[pKey];
                  const hasSplit = partes?.length > 0;
                  const cat    = hasSplit ? null : clasiMet(p.metodo);
                  const verf   = verificados.has(pKey);
                  const rowBg  = verf ? 'bg-emerald-50' : hasSplit ? 'bg-violet-50' : '';
                  return (
                    <>
                      <tr key={i} className={`border-t border-gray-100 transition-colors ${rowBg} hover:brightness-95`}>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatFecha(p.fecha)}</td>
                        <td className={`px-4 py-3 font-medium ${verf ? 'text-emerald-800' : 'text-gray-900'}`}>
                          {p.nombre}
                          {matches[pKey] && (
                            <span className="block text-xs text-blue-500 font-normal mt-0.5">
                              ⇌ {matches[pKey]['Concepto'] || matches[pKey]['Fecha de ingreso'] || 'Conciliado'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">{p.programa}</span></td>
                        <td className="px-4 py-3 text-gray-500">C{p.cuota}</td>
                        <td className="px-4 py-3">
                          {hasSplit
                            ? <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-700 text-xs font-semibold">Desglosado</span>
                            : <span className={`px-2 py-0.5 rounded text-xs font-semibold ${CHIP[cat]}`}>{p.metodo}</span>
                          }
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-700 whitespace-nowrap">{fmt(p.monto)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {/* Botón desglosar */}
                            <button
                              onClick={() => abrirSplit(mesSel, p)}
                              title="Desglosar por método de pago"
                              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all text-xs font-bold ${
                                hasSplit
                                  ? 'bg-violet-500 border-violet-500 text-white'
                                  : 'border-gray-300 text-gray-400 hover:border-violet-400 hover:text-violet-500'
                              }`}
                            >
                              ÷
                            </button>
                            {/* Botón verificar */}
                            <button
                              onClick={() => toggleVerif(mesSel, p)}
                              title={verf ? 'Quitar verificación' : 'Marcar como verificado en banco'}
                              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all text-xs font-bold ${
                                verf
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-gray-300 text-transparent hover:border-emerald-400 hover:text-emerald-300'
                              }`}
                            >
                              ✓
                            </button>
                            {/* Botón conciliar con banco */}
                            <button
                              onClick={() => matches[pKey] ? removeMatch(mesSel, p) : abrirMatch(mesSel, p)}
                              title={matches[pKey] ? 'Quitar conciliación' : 'Conciliar con banco'}
                              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all text-xs font-bold ${
                                matches[pKey]
                                  ? 'bg-blue-500 border-blue-500 text-white'
                                  : 'border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-400'
                              }`}
                            >
                              ⇌
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Fila de desglose */}
                      {hasSplit && (
                        <tr className={`${rowBg}`}>
                          <td />
                          <td colSpan={6} className="px-4 pb-3 pt-0">
                            <div className="flex gap-2 flex-wrap">
                              {partes.map((pt, pi) => (
                                <span key={pi} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${CHIP[clasiMet(pt.metodo)]}`}>
                                  {pt.metodo}: {fmt(pt.monto)}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-3 font-bold text-emerald-700">{fmt(totalFilt)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Panel extracto bancario */}
      {trackerDelMes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowExtracto(v => !v)}
            className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div>
              <span className="font-semibold text-gray-800 text-sm">Extracto del banco — {mesLabel(mesSel)}</span>
              <span className="block text-xs text-gray-400 mt-0.5">
                {trackerDelMes.length} movimientos
                {trackerDelMes.filter(m => !matchedIdx.has(m._rowIndex)).length > 0 && (
                  <span className="ml-2 text-amber-600 font-medium">
                    · {trackerDelMes.filter(m => !matchedIdx.has(m._rowIndex)).length} sin conciliar
                  </span>
                )}
                {trackerDelMes.filter(m => matchedIdx.has(m._rowIndex)).length > 0 && (
                  <span className="ml-2 text-emerald-600 font-medium">
                    · {trackerDelMes.filter(m => matchedIdx.has(m._rowIndex)).length} conciliados
                  </span>
                )}
              </span>
            </div>
            <span className="text-gray-400 text-xs">{showExtracto ? '▲' : '▼'}</span>
          </button>
          {showExtracto && (
            <div className="border-t border-gray-100 divide-y divide-gray-100">
              {trackerDelMes.map((mov, i) => {
                const conciliado = matchedIdx.has(mov._rowIndex);
                const matchEntry = Object.entries(matches).find(([, m]) => m._rowIndex === mov._rowIndex);
                const pKey2 = matchEntry?.[0];
                const clienteRef = pKey2 ? `${pKey2.split('|')[1]} · C${pKey2.split('|')[2]}` : null;
                return (
                  <div key={i} className={`px-5 py-3 flex items-center justify-between gap-3 ${conciliado ? 'bg-emerald-50/60' : ''}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${conciliado ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        <span className="text-sm font-semibold text-gray-900">{fmt(parseM(mov['Monto']))}</span>
                        <span className="text-xs text-gray-400">{mov['Fecha de ingreso'] || '—'}</span>
                        {mov['Medio de pago'] && <span className="text-xs text-gray-500">{mov['Medio de pago']}</span>}
                      </div>
                      {mov['Concepto'] && <p className="text-xs text-gray-500 mt-0.5 pl-3.5">{mov['Concepto']}</p>}
                      {mov['Nombre'] && <p className="text-xs text-gray-400 mt-0.5 pl-3.5">{mov['Nombre']}</p>}
                      {clienteRef && <p className="text-xs text-blue-600 mt-0.5 pl-3.5">⇌ {clienteRef}</p>}
                    </div>
                    {!conciliado && <span className="text-xs text-amber-600 font-medium whitespace-nowrap flex-shrink-0">Sin conciliar</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal conciliar con banco */}
      {matchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setMatchModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Conciliar con banco</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {matchModal.p.nombre} · C{matchModal.p.cuota} · {fmt(matchModal.p.monto)}
                </p>
              </div>
              <button onClick={() => setMatchModal(null)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="p-3 max-h-96 overflow-y-auto space-y-2">
              {trackerDelMes.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No hay movimientos cargados para este mes.</p>
              ) : (
                trackerDelMes.map((mov, i) => {
                  const yaUsado = matchedIdx.has(mov._rowIndex);
                  return (
                    <button key={i} onClick={() => !yaUsado && saveMatch(mov)} disabled={yaUsado}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        yaUsado
                          ? 'border-gray-100 bg-gray-50 opacity-40 cursor-default'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                      }`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{fmt(parseM(mov['Monto']))}</span>
                        <span className="text-xs text-gray-400">{mov['Fecha de ingreso'] || '—'}</span>
                      </div>
                      {mov['Concepto'] && <p className="text-xs text-gray-500 mt-0.5">{mov['Concepto']}</p>}
                      <div className="flex gap-3 mt-0.5">
                        {mov['Nombre'] && <span className="text-xs text-gray-400">{mov['Nombre']}</span>}
                        {mov['Medio de pago'] && <span className="text-xs text-gray-400">{mov['Medio de pago']}</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de desglose */}
      {splitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSplitModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Desglosar pago</h3>
                <p className="text-xs text-gray-400 mt-0.5">{splitModal.p.nombre} · C{splitModal.p.cuota} · {fmt(splitModal.p.monto)}</p>
              </div>
              <button onClick={() => setSplitModal(null)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>

            <div className="p-5 space-y-3">
              {splitDraft.map((pt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={pt.monto || ''}
                    onChange={e => updateParte(i, 'monto', e.target.value)}
                    placeholder="Monto"
                    className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <select
                    value={pt.metodo}
                    onChange={e => updateParte(i, 'metodo', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  >
                    {METODOS_SPLIT.map(m => <option key={m}>{m}</option>)}
                  </select>
                  {splitDraft.length > 1 && (
                    <button onClick={() => setSplitDraft(prev => prev.filter((_,idx) => idx !== i))}
                      className="text-gray-400 hover:text-red-500 text-lg px-1 transition-colors">×</button>
                  )}
                </div>
              ))}

              <button onClick={() => setSplitDraft(prev => [...prev, { monto: Math.max(0, splitRestante), metodo: 'Transferencia' }])}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                + Agregar parte
              </button>

              {/* Indicador de restante */}
              <div className={`text-xs font-medium px-3 py-2 rounded-lg ${
                splitOk ? 'bg-emerald-50 text-emerald-700' :
                splitRestante < 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
              }`}>
                {splitOk
                  ? '✓ El total coincide'
                  : splitRestante > 0
                    ? `Faltan ${fmt(splitRestante)} por asignar`
                    : `Excede por ${fmt(Math.abs(splitRestante))}`
                }
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2">
              {splits[`${splitModal.mes}|${splitModal.p.nombre}|${splitModal.p.cuota}`] && (
                <button onClick={removeSplit}
                  className="px-3 py-2 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                  Quitar desglose
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => setSplitModal(null)}
                className="px-4 py-2 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={saveSplit} disabled={!splitOk}
                className="px-4 py-2 text-xs rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors">
                Guardar
              </button>
            </div>
          </div>
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

// ── Conciliación bancaria ─────────────────────────────────────────────────────

const CONC_KEY = 'conciliacion_v1';

function VistaConciliacion({ clientes = [], abonos = [] }) {
  const [trackerPagos, setTrackerPagos]   = useState([]);
  const [conciliaciones, setConciliaciones] = useState({});
  const [asignarModal, setAsignarModal]   = useState(null);
  const [busqueda, setBusqueda]           = useState('');
  const [seleccion, setSeleccion]         = useState(null);
  const [mesSel, setMesSel]               = useState('');
  const [mounted, setMounted]             = useState(false);

  useEffect(() => {
    try { setConciliaciones(JSON.parse(localStorage.getItem(CONC_KEY) || '{}')); } catch {}
    fetch('/api/tracker-pagos')
      .then(r => r.json())
      .then(d => {
        const movs = d.movimientos || [];
        setTrackerPagos(movs);
        const hoy = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
        const meses = [...new Set(movs.map(m => normMes(m['Fecha'] || m['Fecha de ingreso'] || '')).filter(Boolean))].sort();
        setMesSel(meses.includes(hoy) ? hoy : (meses[meses.length - 1] || ''));
      })
      .catch(() => {});
    setMounted(true);
  }, []);

  const mesesDisp = useMemo(() => {
    const s = new Set(trackerPagos.map(m => normMes(m['Fecha'] || m['Fecha de ingreso'] || '')).filter(Boolean));
    return [...s].sort().reverse().map(m => ({ mes: m, label: mesLabel(m) }));
  }, [trackerPagos]);

  const movDelMes = useMemo(() =>
    trackerPagos
      .filter(m => normMes(m['Fecha'] || m['Fecha de ingreso'] || '') === mesSel)
      .sort((a, b) => String(a['Fecha']).localeCompare(String(b['Fecha']))),
    [trackerPagos, mesSel]
  );

  const totalMes  = movDelMes.reduce((s, m) => s + parseM(m['Monto']), 0);
  const totalConc = movDelMes.filter(m => conciliaciones[m._rowIndex]).reduce((s, m) => s + parseM(m['Monto']), 0);
  const nConc     = movDelMes.filter(m => conciliaciones[m._rowIndex]).length;

  const señasIngresadas = useMemo(() =>
    abonos.filter(a => {
      const est = String(a['Estado'] || a['estado'] || '').trim();
      return est === 'Ingresó' || est === 'Ingreso';
    }),
    [abonos]
  );

  const clientesFilt = busqueda.length > 1
    ? clientes.filter(c => String(c['Nombre'] || '').toLowerCase().includes(busqueda.toLowerCase())).slice(0, 6)
    : [];

  const señasFilt = busqueda.length > 1
    ? señasIngresadas.filter(a =>
        String(a['Nombre'] || a['nombre'] || '').toLowerCase().includes(busqueda.toLowerCase())
      ).slice(0, 5)
    : [];

  function abrirAsignar(mov) { setAsignarModal(mov); setBusqueda(''); setSeleccion(null); }

  function cerrarModal() { setAsignarModal(null); setSeleccion(null); setBusqueda(''); }

  function guardar() {
    if (!seleccion || !asignarModal) return;
    setConciliaciones(prev => {
      const next = { ...prev, [asignarModal._rowIndex]: seleccion };
      try { localStorage.setItem(CONC_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    cerrarModal();
  }

  function quitar(mov) {
    setConciliaciones(prev => {
      const next = { ...prev };
      delete next[mov._rowIndex];
      try { localStorage.setItem(CONC_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  if (!mounted) return null;

  if (mesesDisp.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-16 text-center">
        <p className="text-gray-400 text-sm">No hay movimientos en el Tracker pagos.</p>
        <p className="text-gray-300 text-xs mt-1">Cargá movimientos en la hoja "Tracker pagos" del sheet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Selector de mes */}
      <div className="flex gap-1 flex-wrap">
        {mesesDisp.map(m => (
          <button key={m.mes} onClick={() => setMesSel(m.mes)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              m.mes === mesSel ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>{m.label}</button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total del mes', value: totalMes, sub: `${movDelMes.length} movimientos`, cls: 'gray' },
          { label: 'Conciliados',   value: totalConc, sub: `${nConc} movimientos`,            cls: 'emerald' },
          { label: 'Sin conciliar', value: totalMes - totalConc, sub: `${movDelMes.length - nConc} movimientos`, cls: 'amber' },
        ].map(({ label, value, sub, cls }) => (
          <div key={label} className={`bg-${cls}-50 border border-${cls}-200 rounded-xl p-4 shadow-sm`}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-bold text-${cls}-700`}>{fmt(value)}</p>
            <p className={`text-xs text-${cls}-500 mt-0.5`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabla de movimientos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Movimientos del banco — {mesLabel(mesSel)}</h3>
        </div>
        {movDelMes.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">No hay movimientos para este mes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha','Monto','Medio de Pago','Concepto','Cliente / Seña',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movDelMes.map((mov, i) => {
                  const conc   = conciliaciones[mov._rowIndex];
                  const metodo = mov['Medio de Pago'] || mov['Medio de pago'] || '';
                  return (
                    <tr key={i} className={`border-t border-gray-100 transition-colors ${conc ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{mov['Fecha'] || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{fmt(parseM(mov['Monto']))}</td>
                      <td className="px-4 py-3">
                        {metodo
                          ? <span className={`px-2 py-0.5 rounded text-xs font-semibold ${CHIP[clasiMet(metodo)]}`}>{metodo}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{mov['Concepto'] || '—'}</td>
                      <td className="px-4 py-3">
                        {conc ? (
                          <div>
                            <p className="text-sm font-medium text-emerald-800">{conc.nombre}</p>
                            <p className="text-xs text-emerald-600">
                              {conc.tipo === 'seña' ? 'Seña' : `C${conc.cuota}`}
                              {conc.fecha ? ` · ${formatFecha(conc.fecha)}` : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {conc ? (
                          <button onClick={() => quitar(mov)}
                            className="text-gray-300 hover:text-red-400 transition-colors text-lg px-1">×</button>
                        ) : (
                          <button onClick={() => abrirAsignar(mov)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap">
                            Asignar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal asignar */}
      {asignarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cerrarModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900">Asignar ingreso</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmt(parseM(asignarModal['Monto']))} · {asignarModal['Fecha'] || '—'} · {asignarModal['Medio de Pago'] || asignarModal['Medio de pago'] || '—'}
                </p>
              </div>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>

            <div className="p-4 flex-shrink-0">
              <input autoFocus value={busqueda} onChange={e => { setBusqueda(e.target.value); setSeleccion(null); }}
                placeholder="Buscar cliente o seña…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
              {busqueda.length < 2 ? (
                <p className="text-xs text-gray-400 text-center py-6">Escribí para buscar…</p>
              ) : clientesFilt.length === 0 && señasFilt.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Sin resultados</p>
              ) : (
                <>
                  {/* Cuotas */}
                  {clientesFilt.map(c => {
                    const cuotas = CUOTAS_FULL
                      .map((q, idx) => ({ cuota: idx+1, monto: parseM(c[q.monto]), fecha: c[q.fecha] }))
                      .filter(x => x.monto > 0);
                    if (!cuotas.length) return null;
                    return (
                      <div key={c._rowIndex} className="mb-2">
                        <p className="text-xs font-semibold text-gray-500 px-2 py-1">{c['Nombre']}</p>
                        {cuotas.map(x => {
                          const sel = seleccion?.tipo === 'cuota' && seleccion?.rowIndex === c._rowIndex && seleccion?.cuota === x.cuota;
                          return (
                            <button key={x.cuota}
                              onClick={() => setSeleccion({ tipo: 'cuota', nombre: (c['Nombre']||'').trim(), cuota: x.cuota, fecha: x.fecha, monto: x.monto, rowIndex: c._rowIndex })}
                              className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 border-2 transition-all ${sel ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-800">C{x.cuota} — {fmt(x.monto)}</span>
                                <span className="text-xs text-gray-400">{formatFecha(x.fecha)}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  }).filter(Boolean)}

                  {/* Señas */}
                  {señasFilt.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-gray-500 px-2 py-1">Señas</p>
                      {señasFilt.map((a, idx) => {
                        const nombre = String(a['Nombre'] || a['nombre'] || '').trim();
                        const monto  = parseM(a['Monto'] || a['monto']);
                        const fecha  = a['Fecha'] || a['fecha'] || '';
                        const sel    = seleccion?.tipo === 'seña' && seleccion?.rowIndex === a._rowIndex;
                        return (
                          <button key={idx}
                            onClick={() => setSeleccion({ tipo: 'seña', nombre, fecha, monto, rowIndex: a._rowIndex })}
                            className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 border-2 transition-all ${sel ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-800">{nombre} — Seña {fmt(monto)}</span>
                              <span className="text-xs text-gray-400">{formatFecha(fecha)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {seleccion && (
              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <div className="bg-blue-50 rounded-lg px-3 py-2 mb-3 text-xs text-blue-800">
                  <strong>{seleccion.nombre}</strong> · {seleccion.tipo === 'seña' ? 'Seña' : `C${seleccion.cuota}`} · {formatFecha(seleccion.fecha)}
                </div>
                <button onClick={guardar}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Confirmar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Cobranzas({ cobranzas, pendientesPorMes, proyeccion = [], proyeccionAnual = [], deudores = [], clientes = [], abonos = [] }) {
  const [subTab, setSubTab] = useState('mensual');
  const deudoresActivos = deudores.filter(d => d.estado !== 'Saldado');

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex gap-2 items-center flex-wrap border-b border-gray-200 pb-0">
        {[['mensual','Resumen mensual'],['pagos','Pagos recibidos'],['semanal','Pagos semanales'],['deudores','Deudores'],['conciliacion','Conciliación']].map(([v, l]) => (
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
        {subTab === 'mensual'      && <VistaResumenMensual cobranzas={cobranzas} pendientesPorMes={pendientesPorMes} proyeccionAnual={proyeccionAnual} />}
        {subTab === 'pagos'        && <VistaPagos clientes={clientes} />}
        {subTab === 'semanal'      && <VistaSemanal proyeccion={proyeccion} deudores={deudores} clientes={clientes} />}
        {subTab === 'deudores'     && <VistaDeudores deudores={deudores} clientes={clientes} />}
        {subTab === 'conciliacion' && <VistaConciliacion clientes={clientes} abonos={abonos} />}
      </div>
    </div>
  );
}
