'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const fmt   = n => isNaN(n) ? '—' : `$${Math.round(n).toLocaleString('es-AR')}`;

// Campos del sheet (pestaña Facturas): Tipo de factura · Fecha · Monto · Nombre · CUIT · Estado
const TIPOS   = ['Emitida', 'Recibida'];
const ESTADOS = ['Pendiente', 'Estudio', 'Enviada', 'Pagada'];

const PEND_KEY = 'facturas_pend_prev_v1'; // pendientes del mes anterior, por mes (localStorage)

function mesKey(fechaStr) {
  if (!fechaStr) return null;
  const p = String(fechaStr).trim().split('/');
  if (p.length !== 3) return null;
  const [, m, y] = p.map(Number);
  if (!m || !y) return null;
  return `${y}-${String(m).padStart(2, '0')}`;
}

function mesLabel(key) {
  if (!key) return '';
  const [y, m] = key.split('-').map(Number);
  return `${MESES[m - 1]} ${y}`;
}

function parseM(val) {
  const n = parseFloat(String(val || '').replace(/[$,\s]/g, ''));
  return isNaN(n) ? 0 : n;
}

const ESTADO_STYLE = {
  Pendiente: 'bg-red-100 text-red-700',
  Estudio:   'bg-amber-100 text-amber-700',
  Enviada:   'bg-blue-100 text-blue-700',
  Pagada:    'bg-emerald-100 text-emerald-700',
};

const EMPTY_FORM = { tipo:'Emitida', fecha:'', monto:'', nombre:'', cuit:'', estado:'Pendiente' };

export default function Facturas({ facturas = [] }) {
  const router = useRouter();

  const tipoDe = f => String(f['Tipo de factura'] || '').trim();

  const months = useMemo(() => {
    const keys = new Set(facturas.map(f => mesKey(f['Fecha'])).filter(Boolean));
    return Array.from(keys).sort().reverse();
  }, [facturas]);

  const [mesSel, setMesSel] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Pendientes del mes anterior — valor manual por mes, guardado en el navegador.
  const [pendPrev, setPendPrev] = useState({});
  useEffect(() => {
    try { setPendPrev(JSON.parse(localStorage.getItem(PEND_KEY) || '{}')); } catch {}
  }, []);
  const setPend = v => setPendPrev(prev => {
    const next = { ...prev, [mesSel]: v };
    try { localStorage.setItem(PEND_KEY, JSON.stringify(next)); } catch {}
    return next;
  });
  const pendVal = pendPrev[mesSel] ?? '';

  const filtered = useMemo(() =>
    mesSel === 'all' ? facturas : facturas.filter(f => mesKey(f['Fecha']) === mesSel),
    [facturas, mesSel]
  );

  const emitidas  = filtered.filter(f => tipoDe(f) === 'Emitida');
  const recibidas = filtered.filter(f => tipoDe(f) === 'Recibida');

  const totalEmitido  = emitidas.reduce((s, f) => s + parseM(f['Monto']), 0);
  const totalRecibido = recibidas.reduce((s, f) => s + parseM(f['Monto']), 0);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.fecha || !form.tipo) { setFormError('Tipo y fecha son obligatorios.'); return; }
    setSubmitting(true); setFormError('');
    try {
      // Orden de columnas del sheet: Tipo de factura · Fecha · Monto · Nombre · CUIT · Estado
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowValues: [
          form.tipo,
          form.fecha,
          form.monto ? parseFloat(String(form.monto).replace(/[$,\s]/g,'')) : '',
          form.nombre,
          form.cuit,
          form.estado,
        ] }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Error al guardar');
      setShowModal(false);
      router.refresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl">

      {/* Top bar: selector de meses + nueva factura */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setMesSel('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mesSel === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Todos
          </button>
          {months.map(m => (
            <button key={m} onClick={() => setMesSel(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mesSel === m ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {mesLabel(m)}
            </button>
          ))}
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowModal(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          + Nueva factura
        </button>
      </div>

      {/* Cards: Emitido · Recibido · Pendientes mes anterior (editable) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Emitido</p>
          <p className="text-2xl font-bold text-blue-700">{fmt(totalEmitido)}</p>
          <p className="text-xs text-blue-500 mt-1">{emitidas.length} facturas</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recibido</p>
          <p className="text-2xl font-bold text-amber-700">{fmt(totalRecibido)}</p>
          <p className="text-xs text-amber-500 mt-1">{recibidas.length} facturas</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pendientes mes anterior</p>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-gray-700">$</span>
            <input type="number" inputMode="numeric" placeholder="0" value={pendVal}
              onChange={e => setPend(e.target.value)}
              className="w-full bg-transparent text-2xl font-bold text-gray-700 focus:outline-none placeholder-gray-300" />
          </div>
          <p className="text-xs text-gray-400 mt-1">lo completás vos {mesSel !== 'all' ? `· ${mesLabel(mesSel)}` : '· por mes'}</p>
        </div>
      </div>

      {/* Tabla única (como la planilla): columnas en horizontal */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Sin facturas{mesSel !== 'all' ? ` en ${mesLabel(mesSel)}` : ''}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Tipo de factura','Fecha','Monto','Nombre','CUIT','Estado'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((f, i) => {
                  const tipo   = tipoDe(f);
                  const estado = String(f['Estado'] || '').trim();
                  return (
                    <tr key={f._rowIndex ?? i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tipo === 'Emitida' ? 'bg-blue-100 text-blue-700' : tipo === 'Recibida' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                          {tipo || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{f['Fecha'] || '—'}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{fmt(parseM(f['Monto']))}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{f['Nombre'] || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs font-mono whitespace-nowrap">{f['CUIT'] || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${ESTADO_STYLE[estado] || 'bg-gray-100 text-gray-500'}`}>
                          {estado || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nueva factura */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Nueva factura</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              {formError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}

              {/* Tipo de factura */}
              <div className="flex gap-2">
                {TIPOS.map(t => (
                  <button key={t} type="button" onClick={() => set('tipo', t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      form.tipo === t ? (t === 'Emitida' ? 'bg-blue-600 text-white border-blue-600' : 'bg-amber-500 text-white border-amber-500')
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}>{t}</button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha *</label>
                  <input type="text" placeholder="DD/MM/YYYY" value={form.fecha} onChange={e => set('fecha', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Monto</label>
                  <input type="number" placeholder="0" value={form.monto} onChange={e => set('monto', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                  <input type="text" placeholder="Nombre / razón social" value={form.nombre} onChange={e => set('nombre', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">CUIT</label>
                  <input type="text" placeholder="20-12345678-9" value={form.cuit} onChange={e => set('cuit', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                <div className="flex gap-2 flex-wrap">
                  {ESTADOS.map(e => (
                    <button key={e} type="button" onClick={() => set('estado', e)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        form.estado === e ? `${ESTADO_STYLE[e]} border-transparent ring-2 ring-offset-1 ring-gray-300` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}>{e}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={guardar} disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-sm font-semibold text-white">
                  {submitting ? 'Guardando…' : 'Guardar factura'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
