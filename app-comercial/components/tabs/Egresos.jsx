'use client';
import { useState, useEffect, useMemo } from 'react';

const CATEGORIAS = [
  'Sueldos', 'Publicidad', 'APPS', 'Gastos Administrativos',
  'Formación', 'Impuestos', 'Extras', 'Retiros Personales',
];

const MEDIOS_PAGO = ['Transferencia', 'Efectivo', 'Tarjeta', 'Wise', 'Stripe', 'Cripto', 'Otro'];

const MES_LABELS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

function getMeses(anio) {
  return Array.from({ length: 12 }, (_, i) => ({
    mes:   `${anio}-${String(i + 1).padStart(2, '0')}`,
    label: MES_LABELS[i],
  }));
}

const fmt = n => `$${Math.round(n || 0).toLocaleString('es-AR')}`;

// ── Modal añadir gasto ────────────────────────────────────────────────────────

function AddModal({ registros, mesSel, onClose, onSaved }) {
  const [gasto,     setGasto]     = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcat,    setSubcat]    = useState('');
  const [monto,     setMonto]     = useState('');
  const [medioPago, setMedioPago] = useState('');
  const [pais,      setPais]      = useState('AR');
  const [fechaVto,  setFechaVto]  = useState('');
  const [dondePaga, setDondePaga] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const subcatSuggestions = useMemo(() => {
    if (!categoria) return [];
    return [...new Set(
      registros.filter(r => r['Categoría'] === categoria && r['Subcategoría']).map(r => r['Subcategoría'])
    )];
  }, [registros, categoria]);

  async function handleSave(e) {
    e.preventDefault();
    if (!categoria)                    { setError('Elegí una categoría'); return; }
    if (!monto || isNaN(Number(monto))){ setError('Ingresá un monto válido'); return; }
    if (!medioPago)                    { setError('Elegí un medio de pago'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/egresos/registros', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mes: mesSel, categoria, subcategoria: subcat, detalle: gasto,
          monto: Number(monto), medioPago, pais, fechaVto, dondePaga,
        }),
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Añadir gasto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">

          {/* Gasto + Categoría */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Gasto</label>
              <input value={gasto} onChange={e => setGasto(e.target.value)} autoFocus
                placeholder="ej. Kevin, Loom, Meta Ads…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Categoría *</label>
              <select value={categoria} onChange={e => { setCategoria(e.target.value); setSubcat(''); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500">
                <option value="">Seleccioná</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Sub categoría */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Sub categoría <span className="text-gray-400">(opcional)</span>
            </label>
            <input value={subcat} onChange={e => setSubcat(e.target.value)}
              list="subcat-suggestions"
              placeholder="ej. Comercial, Meta, Loom…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            <datalist id="subcat-suggestions">
              {subcatSuggestions.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          {/* Monto + País */}
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

          {/* Medio de pago */}
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

          {/* Fecha vto + Donde se paga */}
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

// ── Componente principal ──────────────────────────────────────────────────────

export default function Egresos({ ventasPorMes = [] }) {
  const anio      = new Date().getFullYear();
  const meses     = useMemo(() => getMeses(anio), [anio]);
  const mesActual = `${anio}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const [mesSel,     setMesSel]     = useState(mesActual);
  const [registros,  setRegistros]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [catFilter,  setCatFilter]  = useState('');

  async function fetchRegistros(mes) {
    setLoading(true); setError('');
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

  const totalEgresos = useMemo(
    () => registros.reduce((s, r) => s + (Number(r['Monto']) || 0), 0),
    [registros]
  );

  // Total ventas del mes para calcular %gasto/venta
  const ventasMes = useMemo(
    () => ventasPorMes.find(m => m.mes === mesSel)?.montoTotal ?? 0,
    [ventasPorMes, mesSel]
  );

  const porCategoria = useMemo(() => {
    const m = {};
    for (const r of registros) {
      const cat = r['Categoría'] || '';
      if (cat) m[cat] = (m[cat] || 0) + (Number(r['Monto']) || 0);
    }
    return m;
  }, [registros]);

  const registrosFiltrados = catFilter
    ? registros.filter(r => r['Categoría'] === catFilter)
    : registros;

  const mesLabel = meses.find(m => m.mes === mesSel)?.label ?? '';

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Selector de mes ── */}
      <div className="flex gap-2 flex-wrap">
        {meses.map(m => (
          <button key={m.mes} onClick={() => { setMesSel(m.mes); setCatFilter(''); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              m.mes === mesSel
                ? 'bg-gray-800 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {m.label}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{error}</div>}

      {/* ── Cards de categorías + botón añadir ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORIAS.map(cat => {
          const total    = porCategoria[cat] || 0;
          const isActive = catFilter === cat;
          const pctVal   = ventasMes > 0 ? ((total / ventasMes) * 100).toFixed(1) + '%' : '—';
          return (
            <button key={cat} onClick={() => setCatFilter(f => f === cat ? '' : cat)}
              className={`rounded-2xl p-4 text-center transition-all border-2 ${
                isActive
                  ? 'bg-gray-800 border-gray-800 text-white shadow-md'
                  : total > 0
                    ? 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    : 'bg-gray-50 border-gray-100'
              }`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 truncate ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                {cat}
              </p>
              <p className={`text-xl font-bold ${isActive ? 'text-white' : total > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                {total > 0 ? fmt(total) : '—'}
              </p>
              <p className={`text-xs mt-1.5 ${isActive ? 'text-gray-400' : 'text-gray-400'}`}>
                {pctVal} gasto/venta
              </p>
            </button>
          );
        })}
      </div>

      {/* Botón añadir + resumen total */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Total egresos {mesLabel}:{' '}
          <span className="font-bold text-gray-900">{fmt(totalEgresos)}</span>
          {ventasMes > 0 && (
            <span className="ml-2 text-gray-400">
              ({((totalEgresos / ventasMes) * 100).toFixed(1)}% de ventas)
            </span>
          )}
        </p>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors">
          Añadir gasto +
        </button>
      </div>

      {/* ── Tabla de registros ── */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando…</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">
                {catFilter || 'Todos los gastos'} — {mesLabel}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {registrosFiltrados.length} items · {fmt(registrosFiltrados.reduce((s, r) => s + (Number(r['Monto']) || 0), 0))}
              </p>
            </div>
            {catFilter && (
              <button onClick={() => setCatFilter('')}
                className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1 transition-colors">
                × Limpiar filtro
              </button>
            )}
          </div>

          {registrosFiltrados.length === 0 ? (
            <div className="px-5 py-14 text-center text-gray-400 text-sm">
              No hay gastos cargados para este mes.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Gasto','Categoría','Sub categoría','Descripción','Monto','Medio de pago'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrosFiltrados.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{r['Detalle'] || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 whitespace-nowrap">
                          {r['Categoría'] || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r['Subcategoría'] || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-40 truncate">{r['Donde se paga'] || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{fmt(Number(r['Monto']) || 0)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r['Medio de pago'] || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <AddModal
          registros={registros}
          mesSel={mesSel}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchRegistros(mesSel); }}
        />
      )}
    </div>
  );
}
