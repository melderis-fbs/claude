'use client';
import { useState, useEffect, useMemo } from 'react';

const MEDIOS_PAGO = ['Transferencia', 'Efectivo', 'Tarjeta', 'Wise', 'Stripe', 'Cripto', 'Otro'];

const CATEGORIAS_DEF = [
  { id: 'Sueldos',                subs: ['Comercial', 'Entrega', 'Ops/G&A', 'Marketing'] },
  { id: 'Publicidad',             subs: [] },
  { id: 'APPS',                   subs: [] },
  { id: 'Gastos Administrativos', subs: [] },
  { id: 'Formación',              subs: [] },
  { id: 'Impuestos',              subs: [] },
  { id: 'Extras',                 subs: [] },
  { id: 'Retiros Personales',     subs: [] },
];

const MES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function getMeses(anio) {
  return Array.from({ length: 12 }, (_, i) => ({
    mes:   `${anio}-${String(i + 1).padStart(2, '0')}`,
    label: MES_SHORT[i],
  }));
}

function buildPivot(registros) {
  const p = {};
  for (const r of registros) {
    const cat   = r['Categoría']    || '';
    const sub   = r['Subcategoría'] || '';
    const mes   = r['Mes']          || '';
    const monto = Number(r['Monto']) || 0;
    if (!cat || !mes || !monto) continue;
    if (!p[cat])      p[cat]      = {};
    if (!p[cat][sub]) p[cat][sub] = {};
    p[cat][sub][mes] = (p[cat][sub][mes] || 0) + monto;
  }
  return p;
}

const fmtCell = n => n ? '$' + Math.round(n).toLocaleString('es-AR') : '';

// ── Modal para cargar monto en una celda ─────────────────────────────────────

function AddModal({ cat, sub, mesFull, mesLabel, onClose, onSaved }) {
  const anio = mesFull.split('-')[0];
  const [detalle,   setDetalle]   = useState('');
  const [monto,     setMonto]     = useState('');
  const [medioPago, setMedioPago] = useState('');
  const [pais,      setPais]      = useState('AR');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  async function handleSave(e) {
    e.preventDefault();
    if (!monto || isNaN(Number(monto))) { setError('Ingresá un monto válido'); return; }
    if (!medioPago) { setError('Elegí un medio de pago'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/egresos/registros', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes: mesFull, categoria: cat, subcategoria: sub, detalle, monto: Number(monto), medioPago, pais }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{cat}</p>
            <h3 className="font-semibold text-gray-900">{sub} — {mesLabel} {anio}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">

          {/* Nombre/Detalle — siempre disponible, label cambia para Sueldos */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {cat === 'Sueldos' ? 'Nombre' : 'Detalle'}{' '}
              <span className="text-gray-400">(opcional)</span>
            </label>
            <input value={detalle} onChange={e => setDetalle(e.target.value)}
              placeholder={cat === 'Sueldos' ? 'ej. Kevin, Jhosana…' : 'Detalle adicional'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>

          {/* Monto + País */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Monto</label>
              <input type="number" min="0" step="0.01" value={monto} autoFocus
                onChange={e => setMonto(e.target.value)} placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">País</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {['AR', 'USA'].map(p => (
                  <button key={p} type="button" onClick={() => setPais(p)}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${pais === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Medio de pago */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Medio de pago</label>
            <div className="flex flex-wrap gap-2">
              {MEDIOS_PAGO.map(m => (
                <button key={m} type="button" onClick={() => setMedioPago(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    medioPago === m ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}>{m}</button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors">
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Egresos() {
  const anio  = new Date().getFullYear();
  const meses = useMemo(() => getMeses(anio), [anio]);

  const [registros,    setRegistros]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [extraSubs,    setExtraSubs]    = useState({});        // { catId: string[] }
  const [addingSubFor, setAddingSubFor] = useState(null);      // catId | null
  const [newSubText,   setNewSubText]   = useState('');
  const [modalCell,    setModalCell]    = useState(null);      // { cat, sub, mesFull, mesLabel }

  async function fetchAll() {
    setError('');
    try {
      const res = await fetch('/api/egresos/registros');
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      const data = await res.json();
      setRegistros(data.rows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const pivot = useMemo(() => buildPivot(registros), [registros]);

  const subcatsPorCat = useMemo(() => {
    const result = {};
    for (const cat of CATEGORIAS_DEF) {
      const fromData = registros
        .filter(r => r['Categoría'] === cat.id && r['Subcategoría'])
        .map(r => r['Subcategoría']);
      const extras = extraSubs[cat.id] || [];
      const all = [...cat.subs];
      for (const s of [...fromData, ...extras]) {
        if (!all.includes(s)) all.push(s);
      }
      result[cat.id] = all;
    }
    return result;
  }, [registros, extraSubs]);

  const totalesPorMes = useMemo(() => {
    const t = {};
    for (const r of registros) {
      const mes   = r['Mes']    || '';
      const monto = Number(r['Monto']) || 0;
      t[mes] = (t[mes] || 0) + monto;
    }
    return t;
  }, [registros]);

  function confirmAddSub(catId) {
    const s = newSubText.trim();
    if (!s) return;
    setExtraSubs(prev => ({ ...prev, [catId]: [...(prev[catId] || []), s] }));
    setAddingSubFor(null);
    setNewSubText('');
  }

  const COL_N = 1 + meses.length; // Concepto + 12 meses

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Cargando…</div>;

  return (
    <div className="space-y-4 max-w-full">
      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="text-sm border-collapse w-full" style={{ minWidth: '900px' }}>

          {/* ── Encabezado ── */}
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider
                             sticky left-0 bg-white z-20 w-48 min-w-48 border-r border-gray-100">
                Concepto
              </th>
              {meses.map(m => (
                <th key={m.mes} className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-24">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Fila TOTAL GENERAL ── */}
          <tbody>
            <tr className="bg-gray-900 border-b-2 border-gray-700">
              <td className="px-4 py-2.5 font-bold text-white text-xs uppercase tracking-wider
                             sticky left-0 bg-gray-900 z-10 border-r border-gray-700">
                Total general
              </td>
              {meses.map(m => (
                <td key={m.mes} className="px-3 py-2.5 text-right font-bold text-white text-xs">
                  {fmtCell(totalesPorMes[m.mes])}
                </td>
              ))}
            </tr>
          </tbody>

          {/* ── Una tbody por categoría ── */}
          {CATEGORIAS_DEF.map(cat => {
            const subs     = subcatsPorCat[cat.id] || [];
            const catPivot = pivot[cat.id] || {};

            return (
              <tbody key={cat.id}>
                {/* Fila categoría (totales) */}
                <tr className="bg-gray-50 border-t-2 border-gray-200 border-b border-gray-200">
                  <td className="px-4 py-2.5 font-bold text-gray-800 text-xs uppercase tracking-wider
                                 sticky left-0 bg-gray-50 z-10 border-r border-gray-100">
                    {cat.id}
                  </td>
                  {meses.map(m => {
                    const total = subs.reduce((s, sub) => s + (catPivot[sub]?.[m.mes] || 0), 0);
                    return (
                      <td key={m.mes} className="px-3 py-2.5 text-right font-bold text-gray-700 text-xs">
                        {fmtCell(total)}
                      </td>
                    );
                  })}
                </tr>

                {/* Filas subcategoría */}
                {subs.map(sub => (
                  <tr key={sub} className="border-b border-gray-50 hover:bg-blue-50/40 group transition-colors">
                    <td className="px-4 py-2 pl-8 text-gray-600 text-sm
                                   sticky left-0 bg-white group-hover:bg-blue-50/40 z-10 border-r border-gray-50 transition-colors">
                      {sub}
                    </td>
                    {meses.map(m => {
                      const val = catPivot[sub]?.[m.mes] || 0;
                      return (
                        <td key={m.mes}
                          onClick={() => setModalCell({ cat: cat.id, sub, mesFull: m.mes, mesLabel: m.label })}
                          className="px-3 py-2 text-right cursor-pointer hover:bg-blue-100 transition-colors text-xs font-medium group/cell">
                          {val
                            ? <span className="text-gray-800">{fmtCell(val)}</span>
                            : <span className="text-gray-200 group-hover/cell:text-blue-300 select-none">+</span>
                          }
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Fila para agregar subcategoría */}
                <tr className="border-b border-gray-100">
                  <td colSpan={COL_N} className="px-4 py-1.5 pl-8 sticky left-0 bg-white z-10">
                    {addingSubFor === cat.id ? (
                      <div className="flex items-center gap-2">
                        <input autoFocus value={newSubText}
                          onChange={e => setNewSubText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  confirmAddSub(cat.id);
                            if (e.key === 'Escape') { setAddingSubFor(null); setNewSubText(''); }
                          }}
                          placeholder="Nombre de subcategoría…"
                          className="border border-blue-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-48" />
                        <button onClick={() => confirmAddSub(cat.id)}
                          className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          OK
                        </button>
                        <button onClick={() => { setAddingSubFor(null); setNewSubText(''); }}
                          className="text-xs text-gray-400 hover:text-gray-600">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setAddingSubFor(cat.id)}
                        className="text-xs text-gray-300 hover:text-blue-500 transition-colors">
                        + agregar subcategoría
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            );
          })}
        </table>
      </div>

      {modalCell && (
        <AddModal
          cat={modalCell.cat}
          sub={modalCell.sub}
          mesFull={modalCell.mesFull}
          mesLabel={modalCell.mesLabel}
          onClose={() => setModalCell(null)}
          onSaved={() => { setModalCell(null); fetchAll(); }}
        />
      )}
    </div>
  );
}
