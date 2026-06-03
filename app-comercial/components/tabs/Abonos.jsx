'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const fmt = n => n ? `$${Math.round(Number(n)).toLocaleString('es-AR')}` : '—';

export default function Abonos({ abonos }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre:'', monto:'', formaPago:'', seguimiento:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filtrados = abonos.filter(a => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return String(a['Nombre']||a['nombre']||'').toLowerCase().includes(q) ||
           String(a['Seguimiento']||a['seguimiento']||'').toLowerCase().includes(q);
  });

  const montoTotal  = abonos.reduce((s,a) => s + Number(a['Monto']||a['monto']||0), 0);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('Nombre requerido'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/abonos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowValues: [form.nombre, form.monto, form.formaPago, form.seguimiento] }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setForm({ nombre:'', monto:'', formaPago:'', seguimiento:'' });
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header + stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total abonos / señas</p>
          <p className="text-3xl font-bold text-gray-900">{abonos.length}</p>
          <p className="text-xs text-gray-400 mt-1">reservas registradas</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Monto total señas</p>
          <p className="text-3xl font-bold text-amber-700">{fmt(montoTotal)}</p>
          <p className="text-xs text-amber-600 mt-1">suma a la recolección</p>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="flex gap-3 items-center">
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre…"
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 w-64 shadow-sm" />
        <button onClick={() => setShowForm(s => !s)}
          className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          + Nuevo abono
        </button>
      </div>

      {/* Formulario nuevo abono */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Nuevo abono / seña</h3>
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Monto</label>
              <input type="number" value={form.monto} onChange={e => set('monto', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Forma de pago</label>
              <select value={form.formaPago} onChange={e => set('formaPago', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                <option value="">— Elegir —</option>
                {['Transferencia USD','Wise','Stripe','PayPal/Payoneer','Cripto','Transferencia ARS'].map(o => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Seguimiento</label>
              <input value={form.seguimiento} onChange={e => set('seguimiento', e.target.value)}
                placeholder="Estado, notas…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setError(''); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={guardar} disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Abonos / Señas registradas</h3>
          <span className="text-xs text-gray-400">{filtrados.length} de {abonos.length}</span>
        </div>
        {filtrados.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            {abonos.length === 0 ? 'No hay abonos registrados todavía.' : 'Sin resultados para esa búsqueda.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Nombre','Monto','Forma de pago','Seguimiento'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((a, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{a['Nombre']||a['nombre']||'—'}</td>
                  <td className="px-5 py-3 font-semibold text-amber-700">{fmt(a['Monto']||a['monto'])}</td>
                  <td className="px-5 py-3 text-gray-600">{a['Forma de pago']||a['forma de pago']||'—'}</td>
                  <td className="px-5 py-3 text-gray-500">{a['Seguimiento']||a['seguimiento']||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
