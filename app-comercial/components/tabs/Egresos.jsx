'use client';
import { useState, useEffect, useMemo, useRef } from 'react';

const CATEGORIAS = [
  'Sueldos', 'Publicidad', 'APPS', 'Gastos Administrativos',
  'Formación', 'Impuestos', 'Extras', 'Retiros Personales',
];
const MEDIOS_PAGO = ['Transferencia', 'Efectivo', 'Tarjeta', 'Wise', 'Stripe', 'Cripto', 'Otro'];
const MES_LABELS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const fmt = n => `$${Math.round(n || 0).toLocaleString('es-AR')}`;
const pct = n => n == null ? '—' : `${Number(n).toFixed(1)}%`;

function getMeses(anio) {
  return Array.from({ length: 12 }, (_, i) => ({
    mes:   `${anio}-${String(i + 1).padStart(2, '0')}`,
    label: MES_LABELS[i],
  }));
}

function getMesAnterior(mesKey) {
  const [y, m] = mesKey.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

// Accede a un campo tolerando variantes de nombre (acentos, case)
function g(row, ...names) {
  for (const n of names) {
    const v = row[n];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

const getCat   = r => g(r, 'Categoría','Categoria','categoria','CATEGORIA') || 'Sin categoría';
const getMonto = r => Number(g(r, 'Monto','monto','MONTO','Amount') || 0);

function groupByCat(rows) {
  const m = {};
  for (const r of rows) {
    const cat   = getCat(r);
    const monto = getMonto(r);
    if (monto) m[cat] = (m[cat] || 0) + monto;
  }
  return m;
}

// Convierte cualquier formato de fecha a clave YYYY-MM
function parseMesKey(val) {
  const s = String(val ?? '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY — formato argentino que devuelve el GAS
  const ddmm = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmm) return `${ddmm[3]}-${ddmm[2].padStart(2, '0')}`;
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  } catch {}
  return s;
}

async function loadRegistros() {
  const res = await fetch('/api/egresos/registros');
  if (!res.ok) throw new Error((await res.json()).error || 'Error');
  return (await res.json()).rows || [];
}

// ── Presupuesto en localStorage ───────────────────────────────────────────────
const loadPresupuesto = () => { try { return JSON.parse(localStorage.getItem('egresos_presupuesto') || '{}'); } catch { return {}; } };
const savePresupuesto = d  => { localStorage.setItem('egresos_presupuesto', JSON.stringify(d)); };

// ── BudgetInput inline ────────────────────────────────────────────────────────
function BudgetInput({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');
  function startEdit() { setDraft(value > 0 ? String(Math.round(value)) : ''); setEditing(true); }
  function commit()    { const n = Number(String(draft).replace(/[^0-9.]/g,'')); onChange(isNaN(n) ? 0 : n); setEditing(false); }
  if (editing) return (
    <input type="number" min="0" value={draft} autoFocus
      onChange={e => setDraft(e.target.value)}
      onBlur={commit} onKeyDown={e => { if (e.key==='Enter') commit(); if (e.key==='Escape') setEditing(false); }}
      className="w-24 text-right text-xs font-bold text-amber-700 border border-amber-300 rounded px-1 py-0.5 focus:outline-none bg-amber-50" />
  );
  return (
    <button onClick={startEdit} className="group flex items-center gap-0.5 text-right">
      <span className={`text-xs font-semibold ${value > 0 ? 'text-amber-700' : 'text-gray-300'}`}>
        {value > 0 ? fmt(value) : 'Fijar'}
      </span>
      <span className="text-[9px] text-gray-300 group-hover:text-amber-400">✎</span>
    </button>
  );
}

// ── AddModal ──────────────────────────────────────────────────────────────────
function AddModal({ mesSel, categoriaPre, onClose, onSaved }) {
  const [gasto,     setGasto]     = useState('');
  const [categoria, setCategoria] = useState(categoriaPre || '');
  const [subcat,    setSubcat]    = useState('');
  const [monto,     setMonto]     = useState('');
  const [medioPago, setMedioPago] = useState('');
  const [pais,      setPais]      = useState('AR');
  const [fechaVto,  setFechaVto]  = useState('');
  const [dondePaga, setDondePaga] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  async function handleSave(e) {
    e.preventDefault();
    if (!categoria)                     { setError('Elegí una categoría'); return; }
    if (!monto || isNaN(Number(monto))) { setError('Ingresá un monto válido'); return; }
    if (!medioPago)                     { setError('Elegí un medio de pago'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/egresos/registros', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mes: mesSel, categoria, subcategoria: subcat, detalle: gasto, monto: Number(monto), medioPago, pais, fechaVto, dondePaga }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      onSaved();
    } catch (err) { setError(err.message); }
    finally       { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Añadir gasto{categoria ? ` — ${categoria}` : ''}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Detalle</label>
              <input value={gasto} onChange={e => setGasto(e.target.value)} autoFocus placeholder="ej. Kevin, Meta Ads…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Categoría *</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}
                disabled={!!categoriaPre}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 disabled:bg-gray-50">
                <option value="">Seleccioná</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Sub categoría <span className="text-gray-400">(opc.)</span></label>
              <input value={subcat} onChange={e => setSubcat(e.target.value)} placeholder="ej. Comercial, Loom…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Donde se paga <span className="text-gray-400">(opc.)</span></label>
              <input value={dondePaga} onChange={e => setDondePaga(e.target.value)} placeholder="ej. Banco Galicia…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Monto *</label>
              <input type="number" min="0" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">País</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {['AR','USA'].map(p => (
                  <button key={p} type="button" onClick={() => setPais(p)}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${pais===p ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha vto <span className="text-gray-400">(opc.)</span></label>
              <input type="date" value={fechaVto} onChange={e => setFechaVto(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Medio de pago *</label>
            <div className="flex flex-wrap gap-2">
              {MEDIOS_PAGO.map(m => (
                <button key={m} type="button" onClick={() => setMedioPago(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${medioPago===m ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>{m}</button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors">
              {loading ? 'Guardando…' : 'Guardar gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Egresos({ ventasPorMes = [] }) {
  const anio      = new Date().getFullYear();
  const meses     = useMemo(() => getMeses(anio), [anio]);
  const mesActual = `${anio}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const [mesSel,      setMesSel]      = useState(mesActual);
  const [registros,   setRegistros]   = useState([]);
  const [regAnt,      setRegAnt]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadErr,     setLoadErr]     = useState('');
  const [catFilter,   setCatFilter]   = useState('');
  const [addCat,      setAddCat]      = useState(null);
  const [slackState,  setSlackState]  = useState('idle');
  const [refreshKey,  setRefreshKey]  = useState(0);
  const [presupuesto, setPresupuesto] = useState(() => loadPresupuesto());

  useEffect(() => {
    setLoading(true); setLoadErr('');
    const mesAnt = getMesAnterior(mesSel);
    loadRegistros()
      .then(allRows => {
        setRegistros(allRows.filter(r => parseMesKey(r['Mes'] ?? r['mes'] ?? '') === mesSel));
        setRegAnt(allRows.filter(r => parseMesKey(r['Mes'] ?? r['mes'] ?? '') === mesAnt));
      })
      .catch(err => setLoadErr(err.message))
      .finally(() => setLoading(false));
  }, [mesSel, refreshKey]);

  const mesLabelSel = meses.find(m => m.mes === mesSel)?.label ?? '';
  const mesLabelAnt = meses.find(m => m.mes === getMesAnterior(mesSel))?.label ?? 'mes ant.';

  // Solo registros manuales (no del Consolidado)
  const registrosApp = useMemo(() => registros.filter(r => r._source !== 'consolidado'), [registros]);
  const realPorCat   = useMemo(() => groupByCat(registrosApp), [registrosApp]);
  const antPorCat    = useMemo(() => groupByCat(regAnt),       [regAnt]);

  const totalReal   = useMemo(() => Object.values(realPorCat).reduce((a,b) => a+b, 0), [realPorCat]);
  const presupMes   = presupuesto[mesSel] || {};
  const totalPresup = Object.values(presupMes).reduce((a,b) => a+b, 0);

  const ventasMes  = useMemo(() => ventasPorMes.find(m => m.mes === mesSel)?.montoFront ?? 0, [ventasPorMes, mesSel]);
  const rentReal   = ventasMes > 0 ? ((ventasMes - totalReal)   / ventasMes) * 100 : null;
  const rentPresup = ventasMes > 0 && totalPresup > 0 ? ((ventasMes - totalPresup) / ventasMes) * 100 : null;

  const diasRestantes = mesSel === mesActual ? (() => {
    const hoy = new Date();
    return new Date(anio, hoy.getMonth() + 1, 0).getDate() - hoy.getDate();
  })() : null;
  const mostrarAlerta = diasRestantes !== null && diasRestantes <= 14 && rentPresup !== null && rentPresup < 40;

  // Categorías que aparecen en los datos
  const catsEnDatos = useMemo(() => {
    const s = new Set([...Object.keys(realPorCat), ...Object.keys(antPorCat)]);
    return [...CATEGORIAS, ...[...s].filter(c => !CATEGORIAS.includes(c))];
  }, [realPorCat, antPorCat]);

  const registrosFiltrados = useMemo(
    () => catFilter ? registrosApp.filter(r => getCat(r) === catFilter) : registrosApp,
    [registrosApp, catFilter]
  );

  function setPresupuestoCat(cat, monto) {
    const next = { ...presupuesto, [mesSel]: { ...(presupuesto[mesSel] || {}), [cat]: monto } };
    setPresupuesto(next); savePresupuesto(next);
  }

  function generarMensaje(esAlerta) {
    let t = `${esAlerta ? '⚠️' : '📊'} *${esAlerta ? 'ALERTA Rentabilidad' : 'Reporte de Egresos'} — ${mesLabelSel} ${anio}*\n\n`;
    t += `Ventas nuevas: ${fmt(ventasMes)}\nEgresos reales: ${fmt(totalReal)}\n`;
    if (totalPresup > 0) t += `Presupuesto: ${fmt(totalPresup)}\n`;
    if (rentReal   !== null) t += `Rentabilidad real: ${pct(rentReal)}\n`;
    if (rentPresup !== null) t += `Rentabilidad proyectada: ${pct(rentPresup)} (objetivo ≥40%)\n`;
    if (esAlerta && diasRestantes !== null) t += `\n⚠️ *Quedan ${diasRestantes} días para fin de mes.*\n`;
    t += '\n*Por categoría:*\n';
    for (const cat of CATEGORIAS) {
      const r = realPorCat[cat] || 0, p = presupMes[cat] || 0, a = antPorCat[cat] || 0;
      if (!r && !p && !a) continue;
      t += `• ${cat}: ${fmt(r)} real${p ? ` / ${fmt(p)} presup.` : ''}${a ? ` / ${fmt(a)} ${mesLabelAnt}` : ''}\n`;
    }
    return t.trim();
  }

  async function enviarSlack(esAlerta) {
    setSlackState('loading');
    try {
      const res  = await fetch('/api/slack', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: generarMensaje(esAlerta) }) });
      setSlackState((await res.json()).ok ? 'ok' : 'error');
    } catch { setSlackState('error'); }
    finally   { setTimeout(() => setSlackState('idle'), 3000); }
  }

  return (
    <div className="space-y-4 max-w-5xl">

      {/* Month selector */}
      <div className="flex gap-2 flex-wrap">
        {meses.map(m => (
          <button key={m.mes} onClick={() => { setMesSel(m.mes); setCatFilter(''); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${
              m.mes === mesSel ? 'bg-gray-800 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {m.label}
            {m.mes === mesActual && m.mes !== mesSel && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />}
          </button>
        ))}
      </div>

      {/* Alert banner */}
      {mostrarAlerta && (
        <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <div>
            <p className="font-semibold text-red-700 text-sm">⚠️ Rentabilidad proyectada {pct(rentPresup)} — objetivo ≥40%</p>
            <p className="text-xs text-red-500 mt-0.5">Quedan {diasRestantes} días para fin de mes.</p>
          </div>
          <button onClick={() => enviarSlack(true)} disabled={slackState==='loading'}
            className={`shrink-0 text-xs px-4 py-2 rounded-lg font-semibold border transition-colors ${slackState==='ok' ? 'bg-green-50 border-green-300 text-green-700' : slackState==='error' ? 'bg-red-100 border-red-400 text-red-800' : 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'}`}>
            {slackState==='loading' ? 'Enviando…' : slackState==='ok' ? '✓ Enviado' : slackState==='error' ? 'Error' : '📤 Alerta Slack'}
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Ventas nuevas</p>
          <p className="text-2xl font-bold text-blue-700">{fmt(ventasMes)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{mesLabelSel} {anio}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Egresos reales</p>
          <p className="text-2xl font-bold text-red-700">{fmt(totalReal)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{registrosApp.length} registros cargados</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Presupuesto mes</p>
          <p className="text-2xl font-bold text-amber-700">{totalPresup > 0 ? fmt(totalPresup) : '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{totalPresup > 0 ? `${Math.round((totalReal/totalPresup)*100)}% ejecutado` : 'fijá por categoría abajo'}</p>
        </div>
        <div className={`rounded-xl p-4 border ${rentPresup===null ? 'bg-gray-50 border-gray-200' : rentPresup>=40 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-300'}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Rent. proyectada</p>
          <p className={`text-2xl font-bold ${rentPresup===null ? 'text-gray-300' : rentPresup>=40 ? 'text-emerald-700' : 'text-red-600'}`}>{rentPresup!==null ? pct(rentPresup) : '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{rentReal!==null ? `real: ${pct(rentReal)}` : 'fijá el presupuesto'}</p>
        </div>
      </div>

      {/* Presupuesto por categoría (foldable) */}
      <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
        <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none list-none hover:bg-gray-50 transition-colors">
          <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform text-[10px] text-gray-400">▶</span>
            Presupuesto por categoría
            {totalPresup > 0 && <span className="text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{fmt(totalPresup)} total</span>}
          </span>
          <span className="text-xs text-gray-400">{mesLabelAnt} como referencia</span>
        </summary>
        <div className="border-t border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Categoría</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Presupuesto</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Real hasta hoy</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{mesLabelAnt}</th>
                <th className="px-4 py-2 min-w-[100px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {CATEGORIAS.map(cat => {
                const real  = realPorCat[cat]  || 0;
                const pres  = presupMes[cat]   || 0;
                const ant   = antPorCat[cat]   || 0;
                const exec  = pres > 0 ? Math.min(100,(real/pres)*100) : 0;
                const color = exec>=100 ? 'bg-red-400' : exec>=80 ? 'bg-amber-400' : 'bg-emerald-400';
                return (
                  <tr key={cat} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{cat}</td>
                    <td className="px-4 py-3 text-right">
                      <BudgetInput value={pres} onChange={v => setPresupuestoCat(cat, v)} />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{real > 0 ? fmt(real) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400">{ant > 0 ? fmt(ant) : '—'}</td>
                    <td className="px-4 py-3">
                      {pres > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{width:`${exec}%`}} />
                          </div>
                          <span className="text-[10px] text-gray-400 w-7">{Math.round(exec)}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      {/* Gastos del mes — tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-800">
              Gastos — {mesLabelSel}
              {loading && <span className="ml-2 text-xs text-gray-400 font-normal animate-pulse">cargando…</span>}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {registrosFiltrados.length} registros · {fmt(registrosFiltrados.reduce((s,r) => s+getMonto(r), 0))}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button onClick={() => enviarSlack(false)} disabled={slackState==='loading'}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${slackState==='ok' ? 'bg-green-50 border-green-200 text-green-700' : slackState==='error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {slackState==='loading' ? 'Enviando…' : slackState==='ok' ? '✓ Enviado' : slackState==='error' ? 'Error' : '📤 Reporte Slack'}
            </button>
            <button onClick={() => setAddCat('')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors">
              + Agregar gasto
            </button>
          </div>
        </div>

        {/* Category filter chips */}
        {catsEnDatos.length > 0 && (
          <div className="px-5 py-3 border-b border-gray-50 flex gap-2 flex-wrap">
            <button onClick={() => setCatFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!catFilter ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Todos
            </button>
            {catsEnDatos.map(cat => (
              <button key={cat} onClick={() => setCatFilter(f => f===cat ? '' : cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${catFilter===cat ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat}
                {realPorCat[cat] > 0 && <span className="ml-1 opacity-60">{fmt(realPorCat[cat])}</span>}
              </button>
            ))}
          </div>
        )}

        {loadErr && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-xs text-red-600">{loadErr}</div>
        )}

        {!loading && registrosFiltrados.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-gray-400 text-sm">No hay gastos cargados{catFilter ? ` en ${catFilter}` : ''} para {mesLabelSel}.</p>
            <button onClick={() => setAddCat(catFilter || '')} className="mt-3 text-sm text-blue-600 hover:underline">+ Agregar el primero</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Categoría','Detalle','Sub categoría','Monto','Medio de pago','País','Dónde se paga'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {registrosFiltrados.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 whitespace-nowrap">
                        {getCat(r)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{g(r,'Detalle','detalle') || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{g(r,'Subcategoría','Subcategoria','subcategoria') || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{fmt(getMonto(r))}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{g(r,'Medio de pago','Medio','medioPago') || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{g(r,'País','Pais','pais') || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{g(r,'Donde se paga','Dónde se paga') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addCat !== null && (
        <AddModal
          mesSel={mesSel}
          categoriaPre={addCat}
          onClose={() => setAddCat(null)}
          onSaved={() => { setAddCat(null); setRefreshKey(k => k+1); }}
        />
      )}
    </div>
  );
}
