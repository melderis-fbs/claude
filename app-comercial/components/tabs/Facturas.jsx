'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const fmt   = n => isNaN(n) ? '—' : `$${Math.round(n).toLocaleString('es-AR')}`;

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
  Cobrada:   'bg-emerald-100 text-emerald-700',
  Pagada:    'bg-emerald-100 text-emerald-700',
};

const EMPTY_FORM = { fecha:'', fechaPago:'', numero:'', tipo:'Emitida', clienteProveedor:'', concepto:'', monto:'', estado:'Pendiente' };

function FacturasTable({ rows, titulo, color }) {
  const total = rows.reduce((s, f) => s + parseM(f['Monto']), 0);
  const headerColor = color === 'blue' ? 'text-blue-700' : 'text-amber-700';
  const totalColor  = color === 'blue' ? 'text-blue-700' : 'text-amber-700';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className={`font-semibold text-sm uppercase tracking-wider ${headerColor}`}>{titulo}</h3>
        <span className={`text-lg font-bold ${totalColor}`}>{fmt(total)}</span>
      </div>
      {rows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-12 text-gray-400 text-sm">Sin registros</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Número','Cliente / Proveedor','Fecha','Fecha pago','Monto','Estado'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((f, i) => {
                const estado = String(f['Estado'] || '').trim();
                return (
                  <tr key={f._rowIndex ?? i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{f['Numero'] || '—'}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{f['ClienteProveedor'] || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{f['Fecha'] || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{f['FechaPago'] || '—'}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{fmt(parseM(f['Monto']))}</td>
                    <td className="px-4 py-2.5">
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
  );
}

export default function Facturas({ facturas = [] }) {
  const router = useRouter();

  const months = useMemo(() => {
    const keys = new Set(facturas.map(f => mesKey(f['Fecha'])).filter(Boolean));
    return Array.from(keys).sort().reverse();
  }, [facturas]);

  const [mesSel, setMesSel] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const filtered = useMemo(() =>
    mesSel === 'all' ? facturas : facturas.filter(f => mesKey(f['Fecha']) === mesSel),
    [facturas, mesSel]
  );

  const emitidas  = filtered.filter(f => String(f['Tipo']).trim() === 'Emitida');
  const recibidas = filtered.filter(f => String(f['Tipo']).trim() === 'Recibida');

  const totalEmitidas  = emitidas.reduce((s, f) => s + parseM(f['Monto']), 0);
  const totalRecibidas = recibidas.reduce((s, f) => s + parseM(f['Monto']), 0);
  const balance = totalEmitidas - totalRecibidas;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.fecha || !form.tipo) { setFormError('Fecha y tipo son obligatorios.'); return; }
    setSubmitting(true); setFormError('');
    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowValues: [form.fecha, form.fechaPago, form.numero, form.tipo, form.clienteProveedor, form.concepto, form.monto ? parseFloat(String(form.monto).replace(/[$,\s]/g,'')) : '', form.estado] }),
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

      {/* Top bar */}
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

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Emitidas</p>
          <p className="text-2xl font-bold text-blue-700">{fmt(totalEmitidas)}</p>
          <p className="text-xs text-blue-500 mt-1">{emitidas.length} facturas</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recibidas</p>
          <p className="text-2xl font-bold text-amber-700">{fmt(totalRecibidas)}</p>
          <p className="text-xs text-amber-500 mt-1">{recibidas.length} facturas</p>
        </div>
        <div className={`border rounded-xl p-4 ${balance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Balance</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmt(balance)}</p>
          <p className="text-xs text-gray-400 mt-1">emitidas − recibidas</p>
        </div>
      </div>

      {/* Dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FacturasTable rows={emitidas}  titulo="Emitidas"  color="blue" />
        <FacturasTable rows={recibidas} titulo="Recibidas" color="amber" />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Nueva factura</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              {formError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}

              {/* Tipo — prominente */}
              <div className="flex gap-2">
                {['Emitida','Recibida'].map(t => (
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de pago</label>
                  <input type="text" placeholder="DD/MM/YYYY" value={form.fechaPago} onChange={e => set('fechaPago', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Número</label>
                  <input type="text" placeholder="0001-00000123" value={form.numero} onChange={e => set('numero', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                  <select value={form.estado} onChange={e => set('estado', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                    {['Pendiente','Cobrada','Pagada'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cliente / Proveedor</label>
                <input type="text" placeholder="Nombre del cliente o proveedor" value={form.clienteProveedor} onChange={e => set('clienteProveedor', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Concepto</label>
                  <input type="text" placeholder="Descripción del servicio" value={form.concepto} onChange={e => set('concepto', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Monto</label>
                  <input type="number" placeholder="0" value={form.monto} onChange={e => set('monto', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
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
