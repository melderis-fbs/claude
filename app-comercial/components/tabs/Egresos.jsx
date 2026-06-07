'use client';
import { useState, useEffect } from 'react';

const MEDIOS_PAGO = ['Transferencia', 'Efectivo', 'Tarjeta', 'Wise', 'Stripe', 'Cripto', 'Otro'];

const CATEGORIAS = [
  { id: 'Sueldos',               subcategorias: ['Comercial', 'Entrega', 'Ops/G&A', 'Marketing'] },
  { id: 'Publicidad',            subcategorias: [] },
  { id: 'APPS',                  subcategorias: [] },
  { id: 'Gastos Administrativos',subcategorias: [] },
  { id: 'Formación',             subcategorias: [] },
  { id: 'Impuestos',             subcategorias: [] },
  { id: 'Extras',                subcategorias: [] },
  { id: 'Retiros Personales',    subcategorias: [] },
];

function getMeses() {
  const meses = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    meses.push({ mes, label });
  }
  return meses;
}

const fmt = n => `$${Math.round(n).toLocaleString('es-AR')}`;

// ── Bloque Sueldos (agrupado por dept) ────────────────────────────────────────

function SueldosRows({ entries }) {
  const byDept = {};
  for (const r of entries) {
    const dept = r['Subcategoría'] || 'Sin categoría';
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push(r);
  }

  return (
    <>
      {Object.entries(byDept).map(([dept, items]) => (
        <div key={dept}>
          <div className="px-5 py-2 bg-gray-50 flex items-center justify-between border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{dept}</span>
            <span className="text-xs font-semibold text-gray-600">
              {fmt(items.reduce((s, r) => s + (Number(r['Monto']) || 0), 0))}
            </span>
          </div>
          {items.map((r, i) => (
            <div key={i} className="px-5 py-2.5 pl-8 flex items-center justify-between text-sm border-t border-gray-50">
              <span className="text-gray-700">{r['Detalle'] || '—'}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-gray-400 text-xs">{r['Medio de pago']}{r['País'] ? ` · ${r['País']}` : ''}</span>
                <span className="font-semibold text-gray-900">{fmt(Number(r['Monto']) || 0)}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

// ── Bloque por categoría ──────────────────────────────────────────────────────

function CategoriaBlock({ cat, registros, mes, onAdded }) {
  const isSueldos = cat.id === 'Sueldos';
  const hasSubcats = cat.subcategorias.length > 0;

  const [modal, setModal]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState({
    subcategoria: cat.subcategorias[0] || '',
    detalle:      '',
    monto:        '',
    medioPago:    '',
    pais:         'AR',
  });

  const entries = registros.filter(r => r['Categoría'] === cat.id);
  const total   = entries.reduce((s, r) => s + (Number(r['Monto']) || 0), 0);

  function openModal() {
    setForm({ subcategoria: cat.subcategorias[0] || '', detalle: '', monto: '', medioPago: '', pais: 'AR' });
    setError('');
    setModal(true);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.monto || isNaN(Number(form.monto))) { setError('Ingresá un monto válido'); return; }
    if (!form.medioPago) { setError('Elegí un medio de pago'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/egresos/registros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mes,
          categoria:    cat.id,
          subcategoria: form.subcategoria,
          detalle:      form.detalle,
          monto:        Number(form.monto),
          medioPago:    form.medioPago,
          pais:         form.pais,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar');
      setModal(false);
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header del bloque */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">{cat.id}</h3>
          {entries.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{entries.length} {entries.length === 1 ? 'item' : 'items'}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xl font-bold ${total > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
            {total > 0 ? fmt(total) : '—'}
          </span>
          <button onClick={openModal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
            + Agregar
          </button>
        </div>
      </div>

      {/* Filas de entradas */}
      {entries.length > 0 && (
        <div className="border-t border-gray-100">
          {isSueldos ? (
            <SueldosRows entries={entries} />
          ) : (
            entries.map((r, i) => (
              <div key={i} className={`px-5 py-2.5 flex items-center justify-between text-sm ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <div className="min-w-0">
                  {r['Subcategoría'] && <span className="text-gray-700">{r['Subcategoría']}</span>}
                  {r['Detalle'] && <span className="text-gray-400 text-xs ml-2">{r['Detalle']}</span>}
                  {!r['Subcategoría'] && !r['Detalle'] && <span className="text-gray-300 text-xs italic">Sin descripción</span>}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-gray-400 text-xs">{r['Medio de pago']}{r['País'] ? ` · ${r['País']}` : ''}</span>
                  <span className="font-semibold text-gray-900">{fmt(Number(r['Monto']) || 0)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal para agregar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Agregar — {cat.id}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">

              {/* Subcategoría: botones para Sueldos, texto libre para el resto */}
              {hasSubcats ? (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Área</label>
                  <div className="flex flex-wrap gap-2">
                    {cat.subcategorias.map(s => (
                      <button key={s} type="button"
                        onClick={() => setForm(f => ({ ...f, subcategoria: s }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                          form.subcategoria === s
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Subcategoría <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input value={form.subcategoria}
                    onChange={e => setForm(f => ({ ...f, subcategoria: e.target.value }))}
                    placeholder="ej. Loom, Contador ARG…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              )}

              {/* Detalle / Nombre */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {isSueldos ? 'Nombre' : 'Detalle'} <span className="text-gray-400">(opcional)</span>
                </label>
                <input value={form.detalle}
                  onChange={e => setForm(f => ({ ...f, detalle: e.target.value }))}
                  placeholder={isSueldos ? 'ej. Kevin, Jhosana…' : 'Detalle adicional'}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>

              {/* Monto + País */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Monto</label>
                  <input type="number" min="0" step="0.01" value={form.monto}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">País</label>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    {['AR', 'USA'].map(p => (
                      <button key={p} type="button"
                        onClick={() => setForm(f => ({ ...f, pais: p }))}
                        className={`px-3 py-2 text-xs font-medium transition-colors ${
                          form.pais === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Medio de pago */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Medio de pago</label>
                <div className="flex flex-wrap gap-2">
                  {MEDIOS_PAGO.map(m => (
                    <button key={m} type="button"
                      onClick={() => setForm(f => ({ ...f, medioPago: m }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.medioPago === m
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}>{m}</button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40">
                  {loading ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

const MESES = getMeses();

export default function Egresos() {
  const [mesSel, setMesSel]       = useState(MESES[MESES.length - 1].mes);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function fetchRegistros(mes) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/egresos/registros?mes=${mes}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      const data = await res.json();
      setRegistros(data.rows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRegistros(mesSel); }, [mesSel]);

  const total = registros.reduce((s, r) => s + (Number(r['Monto']) || 0), 0);
  const mesLabel = MESES.find(m => m.mes === mesSel)?.label ?? mesSel;

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Selector de mes */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Mes:</span>
        {MESES.map(m => (
          <button key={m.mes} onClick={() => setMesSel(m.mes)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              m.mes === mesSel
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Total del mes */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total egresos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{total > 0 ? fmt(total) : '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500 capitalize">{mesLabel}</p>
          <p className="text-xs text-gray-400 mt-0.5">{registros.length} items cargados</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando…</div>
      ) : (
        <div className="space-y-3">
          {CATEGORIAS.map(cat => (
            <CategoriaBlock
              key={cat.id}
              cat={cat}
              registros={registros}
              mes={mesSel}
              onAdded={() => fetchRegistros(mesSel)}
            />
          ))}
        </div>
      )}

    </div>
  );
}
