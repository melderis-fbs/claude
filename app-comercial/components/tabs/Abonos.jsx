'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const fmt = n => n ? `$${Math.round(Number(n)).toLocaleString('es-AR')}` : '—';

const CLOSERS = ['Kevin','Vicky','Braian','Fabricio'];
const FORMAS_PAGO = ['Transferencia USD','Wise','Stripe','PayPal/Payoneer','Cripto','Transferencia ARS'];

const ESTADOS = [
  { value: '',         label: '—',        color: 'bg-gray-100 text-gray-400'       },
  { value: 'Ingresó',  label: 'Ingresó',  color: 'bg-emerald-100 text-emerald-700' },
  { value: 'Devuelta', label: 'Devuelta', color: 'bg-red-100 text-red-700'         },
];

const estadoStyle = val => ESTADOS.find(e => e.value === val) || ESTADOS[0];

function get(a, ...keys) {
  for (const k of keys) if (a[k] !== undefined && a[k] !== '') return a[k];
  return '';
}

export default function Abonos({ abonos }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre:'', fecha:'', monto:'', formaPago:'', closer:'', seguimiento:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [abonosLocal, setAbonosLocal] = useState(abonos);
  const [editandoIdx, setEditandoIdx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const filtrados = abonosLocal.filter(a => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return String(get(a,'Nombre','nombre')).toLowerCase().includes(q) ||
           String(get(a,'Seguimiento','seguimiento')).toLowerCase().includes(q);
  });

  const montoIngreso  = abonosLocal.filter(a => get(a,'Estado','estado') === 'Ingresó')
    .reduce((s,a) => s + Number(get(a,'Monto','monto') || 0), 0);
  const montoDevuelta = abonosLocal.filter(a => get(a,'Estado','estado') === 'Devuelta')
    .reduce((s,a) => s + Number(get(a,'Monto','monto') || 0), 0);
  const montoPendiente = abonosLocal.filter(a => !get(a,'Estado','estado'))
    .reduce((s,a) => s + Number(get(a,'Monto','monto') || 0), 0);
  const totalResta = montoIngreso + montoDevuelta;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setE = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('Nombre requerido'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/abonos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowValues: [form.nombre, form.monto, form.formaPago, form.closer, form.seguimiento, form.fecha, ''] }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setForm({ nombre:'', fecha:'', monto:'', formaPago:'', closer:'', seguimiento:'' });
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const abrirEditar = (a) => {
    setEditandoIdx(a._rowIndex);
    setEditForm({
      nombre:      get(a,'Nombre','nombre'),
      fecha:       get(a,'Fecha','fecha'),
      monto:       get(a,'Monto','monto'),
      formaPago:   get(a,'Forma de pago'),
      closer:      get(a,'CLOSER','Closer','closer'),
      seguimiento: get(a,'Seguimiento','seguimiento'),
      estado:      get(a,'Estado','estado'),
    });
  };

  const guardarEdicion = async (a) => {
    setSavingEdit(true); setError('');
    const campos = [
      { header: 'Nombre',        val: editForm.nombre      },
      { header: 'Fecha',         val: editForm.fecha        },
      { header: 'Monto',         val: editForm.monto        },
      { header: 'Forma de pago', val: editForm.formaPago    },
      { header: 'CLOSER',        val: editForm.closer       },
      { header: 'Seguimiento',   val: editForm.seguimiento  },
      { header: 'Estado',        val: editForm.estado       },
    ];
    try {
      for (const c of campos) {
        const res = await fetch('/api/abonos', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rowIndex: a._rowIndex, headerName: c.header, value: c.val }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Error al guardar');
      }
      setAbonosLocal(prev => prev.map(ab =>
        ab._rowIndex === a._rowIndex
          ? { ...ab, 'Nombre': editForm.nombre, 'Fecha': editForm.fecha, 'Monto': editForm.monto,
              'Forma de pago': editForm.formaPago, 'CLOSER': editForm.closer,
              'Seguimiento': editForm.seguimiento, 'Estado': editForm.estado }
          : ab
      ));
      setEditandoIdx(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total abonos</p>
          <p className="text-3xl font-bold text-gray-900">{fmt(montoIngreso + montoDevuelta + montoPendiente)}</p>
          <p className="text-xs text-gray-400 mt-1">{abonosLocal.length} señas registradas</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ingresaron</p>
          <p className="text-3xl font-bold text-emerald-700">{fmt(montoIngreso)}</p>
          <p className="text-xs text-emerald-600 mt-1">{abonosLocal.filter(a => get(a,'Estado','estado') === 'Ingresó').length} señas</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Devueltas</p>
          <p className="text-3xl font-bold text-red-700">{fmt(montoDevuelta)}</p>
          <p className="text-xs text-red-500 mt-1">{abonosLocal.filter(a => get(a,'Estado','estado') === 'Devuelta').length} señas</p>
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
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de seña</label>
              <input type="text" placeholder="DD/MM/YYYY" value={form.fecha} onChange={e => set('fecha', e.target.value)}
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
                {FORMAS_PAGO.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Closer</label>
              <select value={form.closer} onChange={e => set('closer', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                <option value="">— Elegir —</option>
                {CLOSERS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="col-span-2">
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

      {error && !showForm && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Abonos / Señas registradas</h3>
          <span className="text-xs text-gray-400">{filtrados.length} de {abonosLocal.length}</span>
        </div>
        {filtrados.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            {abonosLocal.length === 0 ? 'No hay abonos registrados todavía.' : 'Sin resultados para esa búsqueda.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Nombre','Fecha','Monto','Forma de pago','Closer','Seguimiento','Estado',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((a, i) => {
                  const isEditing = editandoIdx === a._rowIndex;
                  if (isEditing) {
                    return (
                      <tr key={i} className="bg-blue-50/40">
                        <td className="px-3 py-2">
                          <input value={editForm.nombre} onChange={e => setE('nombre', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500" />
                        </td>
                        <td className="px-3 py-2">
                          <input value={editForm.fecha} onChange={e => setE('fecha', e.target.value)} placeholder="DD/MM/YYYY"
                            className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={editForm.monto} onChange={e => setE('monto', e.target.value)}
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500" />
                        </td>
                        <td className="px-3 py-2">
                          <select value={editForm.formaPago} onChange={e => setE('formaPago', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 bg-white">
                            <option value="">—</option>
                            {FORMAS_PAGO.map(o => <option key={o}>{o}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select value={editForm.closer} onChange={e => setE('closer', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 bg-white">
                            <option value="">—</option>
                            {CLOSERS.map(o => <option key={o}>{o}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input value={editForm.seguimiento} onChange={e => setE('seguimiento', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500" />
                        </td>
                        <td className="px-3 py-2">
                          <select value={editForm.estado} onChange={e => setE('estado', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 bg-white">
                            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => guardarEdicion(a)} disabled={savingEdit}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded transition-colors">
                              {savingEdit ? '…' : '✓'}
                            </button>
                            <button onClick={() => setEditandoIdx(null)}
                              className="px-2.5 py-1 border border-gray-200 text-gray-500 text-xs rounded hover:bg-gray-50">
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const est = estadoStyle(get(a,'Estado','estado'));
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{get(a,'Nombre','nombre') || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{get(a,'Fecha','fecha') || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-amber-700">{fmt(get(a,'Monto','monto'))}</td>
                      <td className="px-4 py-3 text-gray-600">{get(a,'Forma de pago') || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{get(a,'CLOSER','Closer','closer') || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{get(a,'Seguimiento','seguimiento') || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${est.color}`}>{est.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => abrirEditar(a)}
                          className="text-gray-300 hover:text-blue-500 transition-colors text-base" title="Editar">
                          ✏
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
