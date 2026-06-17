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

function groupByCat(rows) {
  const m = {};
  for (const r of rows) {
    const cat   = r['Categoría'] || 'Otros';
    const monto = Number(r['Monto']) || 0;
    if (monto) m[cat] = (m[cat] || 0) + monto;
  }
  return m;
}

async function loadRegistros(mes) {
  const res = await fetch(`/api/egresos/registros${mes ? `?mes=${mes}` : ''}`);
  if (!res.ok) throw new Error((await res.json()).error || 'Error al cargar egresos');
  return (await res.json()).rows || [];
}

// ── Presupuesto local ─────────────────────────────────────────────────────────

function loadPresupuesto() {
  try { return JSON.parse(localStorage.getItem('egresos_presupuesto') || '{}'); }
  catch { return {}; }
}
function savePresupuesto(data) {
  localStorage.setItem('egresos_presupuesto', JSON.stringify(data));
}

// ── AddModal ──────────────────────────────────────────────────────────────────

function AddModal({ registros, mesSel, categoriaPre, onClose, onSaved }) {
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

  const subcatSugg = useMemo(() => {
    if (!categoria) return [];
    return [...new Set(
      registros.filter(r => r['Categoría'] === categoria && r['Subcategoría']).map(r => r['Subcategoría'])
    )];
  }, [registros, categoria]);

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
          <h3 className="font-semibold text-gray-900">
            Añadir gasto{categoria ? ` — ${categoria}` : ''}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Detalle</label>
              <input value={gasto} onChange={e => setGasto(e.target.value)} autoFocus
                placeholder="ej. Kevin, Loom, Meta Ads…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Categoría *</label>
              <select value={categoria} onChange={e => { setCategoria(e.target.value); setSubcat(''); }}
                disabled={!!categoriaPre}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 disabled:bg-gray-50">
                <option value="">Seleccioná</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Sub categoría <span className="text-gray-400">(opcional)</span>
            </label>
            <input value={subcat} onChange={e => setSubcat(e.target.value)} list="subcat-sugg"
              placeholder="ej. Comercial, Meta, Loom…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            <datalist id="subcat-sugg">
              {subcatSugg.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Monto *</label>
              <input type="number" min="0" step="0.01" value={monto}
                onChange={e => setMonto(e.target.value)} placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">País</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {['AR', 'USA'].map(p => (
                  <button key={p} type="button" onClick={() => setPais(p)}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${pais === p ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Medio de pago *</label>
            <div className="flex flex-wrap gap-2">
              {MEDIOS_PAGO.map(m => (
                <button key={m} type="button" onClick={() => setMedioPago(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    medioPago === m ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha vto <span className="text-gray-400">(opc.)</span></label>
              <input type="date" value={fechaVto} onChange={e => setFechaVto(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Donde se paga <span className="text-gray-400">(opc.)</span></label>
              <input value={dondePaga} onChange={e => setDondePaga(e.target.value)}
                placeholder="ej. Banco Galicia…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors">
              {loading ? 'Guardando…' : 'Guardar gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── BudgetInput — edición inline del presupuesto ──────────────────────────────

function BudgetInput({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');
  const inputRef = useRef(null);

  function startEdit() {
    setDraft(value > 0 ? String(Math.round(value)) : '');
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    const n = Number(draft.replace(/[^0-9.]/g, ''));
    onChange(isNaN(n) ? 0 : n);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number" min="0" step="1"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-24 text-right text-sm font-bold text-amber-700 border border-amber-300 rounded px-1 py-0.5 focus:outline-none focus:border-amber-500 bg-amber-50"
        autoFocus
      />
    );
  }

  return (
    <button onClick={startEdit} title="Click para editar presupuesto"
      className="text-right group flex items-center gap-1 justify-end">
      <span className={`text-sm font-bold ${value > 0 ? 'text-amber-700' : 'text-gray-300'}`}>
        {value > 0 ? fmt(value) : 'Fijar'}
      </span>
      <span className="text-[10px] text-gray-300 group-hover:text-amber-400 transition-colors">✎</span>
    </button>
  );
}

// ── CategoryRow ───────────────────────────────────────────────────────────────

function CategoryRow({ cat, items, presupuesto, mesAnterior, onPresupuestoChange, onAdd }) {
  const [open, setOpen] = useState(false);
  const real      = items.reduce((s, r) => s + (Number(r['Monto']) || 0), 0);
  const ejecutado = presupuesto > 0 ? Math.min(100, (real / presupuesto) * 100) : 0;
  const barColor  = ejecutado >= 100 ? 'bg-red-400' : ejecutado >= 80 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${open ? 'border-gray-300 shadow-sm' : 'border-gray-200'}`}>
      <div className="flex items-center gap-3 px-5 py-3.5">
        {/* Toggle + name */}
        <button onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-left min-w-0 shrink">
          <span className={`text-gray-400 text-[10px] transition-transform duration-150 shrink-0 ${open ? 'rotate-90' : ''}`}>▶</span>
          <span className="font-semibold text-gray-900 text-sm">{cat}</span>
          {items.length > 0 && <span className="text-xs text-gray-400 shrink-0">{items.length}×</span>}
        </button>

        <div className="flex-1" />

        {/* Mes anterior (referencia) */}
        <div className="hidden md:block text-right shrink-0 min-w-[80px]">
          <p className="text-xs text-gray-400">Mes ant.</p>
          <p className="text-xs font-medium text-gray-500">{mesAnterior > 0 ? fmt(mesAnterior) : '—'}</p>
        </div>

        {/* Presupuesto editable */}
        <div className="shrink-0 min-w-[90px] text-right">
          <p className="text-xs text-gray-400 mb-0.5">Presupuesto</p>
          <BudgetInput value={presupuesto} onChange={onPresupuestoChange} />
        </div>

        {/* Barra + real */}
        <div className="shrink-0 min-w-[100px] text-right">
          <p className="text-xs text-gray-400 mb-0.5">Real</p>
          <p className={`text-sm font-bold ${real > 0 ? 'text-gray-900' : 'text-gray-300'}`}>{real > 0 ? fmt(real) : '—'}</p>
        </div>

        {presupuesto > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 w-20">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${ejecutado}%` }} />
            </div>
            <span className="text-[10px] text-gray-400 w-7 text-right">{Math.round(ejecutado)}%</span>
          </div>
        )}

        <button onClick={onAdd} title={`Agregar en ${cat}`}
          className="shrink-0 w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center text-gray-500 text-sm font-bold transition-colors">
          +
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100">
          {items.length === 0 ? (
            <p className="px-14 py-4 text-xs text-gray-400 italic">Sin gastos cargados este mes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['Detalle','Sub categoría','Dónde se paga','Monto','Medio de pago'].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{r['Detalle'] || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-400">{r['Subcategoría'] || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-400">{r['Donde se paga'] || '—'}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{fmt(Number(r['Monto']) || 0)}</td>
                      <td className="px-4 py-2.5 text-gray-400">{r['Medio de pago'] || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
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
  const [addCat,      setAddCat]      = useState(null);
  const [slackState,  setSlackState]  = useState('idle');
  const [refreshKey,  setRefreshKey]  = useState(0);
  // Presupuesto manual: { 'YYYY-MM': { Categoría: monto } }
  const [presupuesto, setPresupuesto] = useState(() => loadPresupuesto());

  useEffect(() => {
    setLoading(true); setLoadErr('');
    Promise.all([loadRegistros(mesSel), loadRegistros(getMesAnterior(mesSel))])
      .then(([act, ant]) => { setRegistros(act); setRegAnt(ant); })
      .catch(err => setLoadErr(err.message))
      .finally(() => setLoading(false));
  }, [mesSel, refreshKey]);

  const mesLabelSel = meses.find(m => m.mes === mesSel)?.label ?? '';
  const mesLabelAnt = meses.find(m => m.mes === getMesAnterior(mesSel))?.label ?? 'mes anterior';

  const ventasMes    = useMemo(() => ventasPorMes.find(m => m.mes === mesSel)?.montoFront ?? 0, [ventasPorMes, mesSel]);
  const registrosApp = useMemo(() => registros.filter(r => r._source !== 'consolidado'), [registros]);
  const realPorCat   = useMemo(() => groupByCat(registrosApp), [registrosApp]);
  const antPorCat    = useMemo(() => groupByCat(regAnt.filter(r => r._source !== 'consolidado')), [regAnt]);
  // Consolidado mes anterior como referencia (ya tiene los totales de la hoja)
  const antConsolidadoPorCat = useMemo(() => groupByCat(regAnt), [regAnt]);

  const totalReal    = useMemo(() => Object.values(realPorCat).reduce((a, b) => a + b, 0), [realPorCat]);
  const presupMes    = presupuesto[mesSel] || {};
  const totalPresup  = Object.values(presupMes).reduce((a, b) => a + b, 0);

  const rentReal   = ventasMes > 0 ? ((ventasMes - totalReal)   / ventasMes) * 100 : null;
  const rentPresup = ventasMes > 0 && totalPresup > 0 ? ((ventasMes - totalPresup) / ventasMes) * 100 : null;

  function setPresupuestoCat(cat, monto) {
    const next = { ...presupuesto, [mesSel]: { ...(presupuesto[mesSel] || {}), [cat]: monto } };
    setPresupuesto(next);
    savePresupuesto(next);
  }

  // Alert: últimas 2 semanas + rent proyectada < 40%
  const diasRestantes = mesSel === mesActual ? (() => {
    const hoy = new Date();
    return new Date(anio, hoy.getMonth() + 1, 0).getDate() - hoy.getDate();
  })() : null;
  const mostrarAlerta = diasRestantes !== null && diasRestantes <= 14 && rentPresup !== null && rentPresup < 40;

  // Categorías a mostrar: tienen gastos reales o presupuesto manual
  const catsActivas = useMemo(() => {
    const extra = Object.keys(realPorCat).filter(c => !CATEGORIAS.includes(c));
    return [...CATEGORIAS, ...new Set(extra)].filter(c => realPorCat[c] > 0 || presupMes[c] > 0);
  }, [realPorCat, presupMes]);

  const catsVacias = useMemo(
    () => CATEGORIAS.filter(c => !catsActivas.includes(c)),
    [catsActivas]
  );

  function generarMensaje(esAlerta) {
    const icon  = esAlerta ? '⚠️' : '📊';
    const titulo = esAlerta
      ? `${icon} *ALERTA Rentabilidad — ${mesLabelSel} ${anio}*`
      : `${icon} *Reporte de Egresos — ${mesLabelSel} ${anio}*`;
    let t = `${titulo}\n\n`;
    t += `Ventas nuevas: ${fmt(ventasMes)}\n`;
    t += `Egresos reales: ${fmt(totalReal)}\n`;
    if (totalPresup > 0) t += `Presupuesto mes: ${fmt(totalPresup)}\n`;
    if (rentReal   !== null) t += `Rentabilidad real: ${pct(rentReal)}\n`;
    if (rentPresup !== null) t += `Rentabilidad proyectada: ${pct(rentPresup)} (objetivo ≥40%)\n`;
    if (esAlerta && diasRestantes !== null) t += `\n⚠️ *Por debajo del objetivo — quedan ${diasRestantes} días*\n`;
    t += `\n*Por categoría:*\n`;
    for (const cat of CATEGORIAS) {
      const r = realPorCat[cat] || 0;
      const p = presupMes[cat]  || 0;
      const a = antConsolidadoPorCat[cat] || 0;
      if (!r && !p && !a) continue;
      t += `• ${cat}: ${fmt(r)} real`;
      if (p) t += ` / ${fmt(p)} presup.`;
      if (a) t += ` / ${fmt(a)} mes ant.`;
      t += '\n';
    }
    return t.trim();
  }

  async function enviarSlack(esAlerta) {
    setSlackState('loading');
    try {
      const res  = await fetch('/api/slack', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: generarMensaje(esAlerta) }) });
      setSlackState((await res.json()).ok ? 'ok' : 'error');
    } catch { setSlackState('error'); }
    finally   { setTimeout(() => setSlackState('idle'), 3000); }
  }

  return (
    <div className="space-y-4 max-w-5xl">

      {/* Month selector */}
      <div className="flex gap-2 flex-wrap">
        {meses.map(m => (
          <button key={m.mes} onClick={() => setMesSel(m.mes)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${
              m.mes === mesSel ? 'bg-gray-800 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {m.label}
            {m.mes === mesActual && m.mes !== mesSel && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* Alert banner */}
      {mostrarAlerta && (
        <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <div>
            <p className="font-semibold text-red-700 text-sm">
              ⚠️ Rentabilidad proyectada {pct(rentPresup)} — objetivo ≥40%
            </p>
            <p className="text-xs text-red-500 mt-0.5">Quedan {diasRestantes} días para fin de mes.</p>
          </div>
          <button onClick={() => enviarSlack(true)} disabled={slackState === 'loading'}
            className={`shrink-0 text-xs px-4 py-2 rounded-lg font-semibold border transition-colors ${
              slackState === 'ok'    ? 'bg-green-50 border-green-300 text-green-700' :
              slackState === 'error' ? 'bg-red-100 border-red-400 text-red-800' :
              'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'
            }`}>
            {slackState === 'loading' ? 'Enviando…' : slackState === 'ok' ? '✓ Enviado' : slackState === 'error' ? 'Error' : '📤 Alerta Slack'}
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
          <p className="text-xs text-gray-400 mt-0.5">
            {totalPresup > 0 ? `${Math.round((totalReal / totalPresup) * 100)}% del presupuesto` : 'cargados hasta ahora'}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Presupuesto mes</p>
          <p className="text-2xl font-bold text-amber-700">{totalPresup > 0 ? fmt(totalPresup) : '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalPresup > 0 ? 'fijado manualmente' : 'usá ✎ por categoría'}
          </p>
        </div>
        <div className={`rounded-xl p-4 border ${
          rentPresup === null               ? 'bg-gray-50 border-gray-200' :
          rentPresup >= 40                  ? 'bg-emerald-50 border-emerald-200' :
                                             'bg-red-50 border-red-300'
        }`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Rent. proyectada</p>
          <p className={`text-2xl font-bold ${
            rentPresup === null ? 'text-gray-300' : rentPresup >= 40 ? 'text-emerald-700' : 'text-red-600'
          }`}>{rentPresup !== null ? pct(rentPresup) : '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {rentReal !== null ? `real: ${pct(rentReal)}` : 'fijá el presupuesto'}
          </p>
        </div>
      </div>

      {/* Header + actions */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-800">
            {mesLabelSel} {anio}
            {loading && <span className="ml-2 text-xs text-gray-400 font-normal animate-pulse">cargando…</span>}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Columnas Real · Presupuesto (editable) · Mes anterior ({mesLabelAnt})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => enviarSlack(false)} disabled={slackState === 'loading'}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
              slackState === 'ok'    ? 'bg-green-50 border-green-200 text-green-700' :
              slackState === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
              'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {slackState === 'loading' ? 'Enviando…' : slackState === 'ok' ? '✓ Enviado' : slackState === 'error' ? 'Error' : '📤 Reporte Slack'}
          </button>
          <button onClick={() => setAddCat('')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors">
            + Agregar gasto
          </button>
        </div>
      </div>

      {loadErr && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{loadErr}</div>
      )}

      {/* Categories accordion */}
      {!loading && (
        <div className="space-y-2">
          {catsActivas.map(cat => (
            <CategoryRow
              key={cat}
              cat={cat}
              items={registrosApp.filter(r => (r['Categoría'] || 'Otros') === cat)}
              presupuesto={presupMes[cat] || 0}
              mesAnterior={antConsolidadoPorCat[cat] || 0}
              onPresupuestoChange={monto => setPresupuestoCat(cat, monto)}
              onAdd={() => setAddCat(cat)}
            />
          ))}

          {/* Categorías vacías — para agregar nuevos gastos */}
          {catsVacias.length > 0 && (
            <details className="group">
              <summary className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer select-none py-2 list-none flex items-center gap-1.5">
                <span className="group-open:rotate-90 transition-transform text-[10px]">▶</span>
                Agregar a otras categorías
              </summary>
              <div className="space-y-1 mt-1">
                {catsVacias.map(cat => (
                  <div key={cat} className="flex items-center justify-between bg-white border border-dashed border-gray-200 rounded-xl px-5 py-3">
                    <span className="text-sm text-gray-400">{cat}</span>
                    <div className="flex items-center gap-3">
                      <BudgetInput value={presupMes[cat] || 0} onChange={monto => setPresupuestoCat(cat, monto)} />
                      <button onClick={() => setAddCat(cat)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center text-gray-400 text-sm font-bold transition-colors">
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {addCat !== null && (
        <AddModal
          registros={registrosApp}
          mesSel={mesSel}
          categoriaPre={addCat}
          onClose={() => setAddCat(null)}
          onSaved={() => { setAddCat(null); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}
