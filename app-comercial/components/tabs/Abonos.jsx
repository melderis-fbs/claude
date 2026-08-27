'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const fmt = n => n ? `$${Math.round(Number(n)).toLocaleString('es-AR')}` : '—';

const CLOSERS = ['Kevin','Vicky','Braian','Fabricio'];
const FORMAS_PAGO = ['Transferencia USD','Wise','Stripe','PayPal/Payoneer','Cripto','Transferencia ARS'];

const ESTADOS = [
  { value: '',         label: '—',        color: 'bg-gray-100 text-gray-400'       },
  { value: 'Ingresó',  label: 'Ingresó',  color: 'bg-gray-100 text-gray-700' },
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
  const [reciboModal, setReciboModal] = useState(null); // abono en curso, o null
  const [reciboForm, setReciboForm]   = useState({ nombre:'', telefono:'', email:'', concepto:'Seña / abono', monto:'', fecha:'', moneda:'USD' });
  const [reciboGen, setReciboGen]     = useState(false);

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

  // Abre el formulario de recibo prefileado con los datos de la seña.
  const abrirRecibo = (a) => {
    const forma = String(get(a, 'Forma de pago') || '');
    setError('');
    setReciboForm({
      nombre:    String(get(a, 'Nombre', 'nombre') || '').trim(),
      telefono:  String(get(a, 'Telefono', 'Teléfono', 'telefono') || '').trim(),
      email:     String(get(a, 'Email', 'Mail', 'email') || '').trim(),
      concepto:  'Seña / abono',
      monto:     String(get(a, 'Monto', 'monto') || ''),
      fecha:     get(a, 'Fecha', 'fecha') || new Date().toLocaleDateString('es-AR'),
      moneda:    /ars/i.test(forma) ? 'ARS' : 'USD',
    });
    setReciboModal(a);
  };
  const setR = (k, v) => setReciboForm(f => ({ ...f, [k]: v }));

  // Genera y descarga el recibo PDF con los datos del formulario. Usa
  // /api/documentos/generate (numeración correlativa + logo + registro).
  const confirmarRecibo = async () => {
    setReciboGen(true); setError('');
    try {
      const monto = Number(reciboForm.monto || 0);
      const payload = {
        tipo: 'Recibo',
        moneda: reciboForm.moneda,
        formData: {
          nombre:   reciboForm.nombre,
          telefono: reciboForm.telefono,
          email:    reciboForm.email,
          fecha:    reciboForm.fecha,
          items: [{ description: reciboForm.concepto || 'Seña / abono', quantity: 1, amount: monto }],
          subtotal: monto, vat: 0, vatAmount: 0, total: monto,
          titulo: 'RECIBO', subtitulo: 'Seña',
          origen: 'Abono',
        },
      };
      const res = await fetch('/api/documentos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Recibo-${(reciboForm.nombre || 'sena').replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      URL.revokeObjectURL(url);
      setReciboModal(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setReciboGen(false);
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
      {/* Modal recibo */}
      {reciboModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !reciboGen && setReciboModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recibo de seña</h3>
              <button onClick={() => setReciboModal(null)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                <input value={reciboForm.nombre} onChange={e => setR('nombre', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
                  <input value={reciboForm.telefono} onChange={e => setR('telefono', e.target.value)}
                    placeholder="Opcional"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input value={reciboForm.email} onChange={e => setR('email', e.target.value)}
                    placeholder="Opcional"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Concepto</label>
                <input value={reciboForm.concepto} onChange={e => setR('concepto', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-300" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Monto</label>
                  <input type="number" value={reciboForm.monto} onChange={e => setR('monto', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Moneda</label>
                  <select value={reciboForm.moneda} onChange={e => setR('moneda', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-300 bg-white">
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
                  <input value={reciboForm.fecha} onChange={e => setR('fecha', e.target.value)} placeholder="DD/MM/YYYY"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-300" />
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button onClick={() => setReciboModal(null)} disabled={reciboGen}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={confirmarRecibo} disabled={reciboGen || !reciboForm.nombre.trim()}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                {reciboGen ? 'Generando…' : '🧾 Generar recibo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Activas</p>
          <p className="text-3xl font-bold text-gray-900">{fmt(montoPendiente)}</p>
          <p className="text-xs text-gray-400 mt-1">{abonosLocal.filter(a => !get(a,'Estado','estado')).length} señas sin resolver</p>
        </div>
        <div className="bg-stone-50 border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ingresaron</p>
          <p className="text-3xl font-bold text-gray-700">{fmt(montoIngreso)}</p>
          <p className="text-xs text-gray-700 mt-1">{abonosLocal.filter(a => get(a,'Estado','estado') === 'Ingresó').length} señas</p>
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
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-200 w-64 shadow-sm" />
        <button onClick={() => setShowForm(s => !s)}
          className="ml-auto px-4 py-2 bg-gray-900 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg transition-colors">
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de seña</label>
              <input type="text" placeholder="DD/MM/YYYY" value={form.fecha} onChange={e => set('fecha', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Monto</label>
              <input type="number" value={form.monto} onChange={e => set('monto', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Forma de pago</label>
              <select value={form.formaPago} onChange={e => set('formaPago', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-200 bg-white">
                <option value="">— Elegir —</option>
                {FORMAS_PAGO.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Closer</label>
              <select value={form.closer} onChange={e => set('closer', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-200 bg-white">
                <option value="">— Elegir —</option>
                {CLOSERS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Seguimiento</label>
              <input value={form.seguimiento} onChange={e => set('seguimiento', e.target.value)}
                placeholder="Estado, notas…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-200" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setError(''); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={guardar} disabled={saving}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-900 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
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
                      <tr key={i} className="bg-stone-50/40">
                        <td className="px-3 py-2">
                          <input value={editForm.nombre} onChange={e => setE('nombre', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-200" />
                        </td>
                        <td className="px-3 py-2">
                          <input value={editForm.fecha} onChange={e => setE('fecha', e.target.value)} placeholder="DD/MM/YYYY"
                            className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-200" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={editForm.monto} onChange={e => setE('monto', e.target.value)}
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-200" />
                        </td>
                        <td className="px-3 py-2">
                          <select value={editForm.formaPago} onChange={e => setE('formaPago', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-200 bg-white">
                            <option value="">—</option>
                            {FORMAS_PAGO.map(o => <option key={o}>{o}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select value={editForm.closer} onChange={e => setE('closer', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-200 bg-white">
                            <option value="">—</option>
                            {CLOSERS.map(o => <option key={o}>{o}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input value={editForm.seguimiento} onChange={e => setE('seguimiento', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-200" />
                        </td>
                        <td className="px-3 py-2">
                          <select value={editForm.estado} onChange={e => setE('estado', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-200 bg-white">
                            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => guardarEdicion(a)} disabled={savingEdit}
                              className="px-2.5 py-1 bg-gray-900 hover:bg-gray-900 disabled:opacity-50 text-white text-xs font-bold rounded transition-colors">
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
                      <td className="px-4 py-3 font-semibold text-gray-700">{fmt(get(a,'Monto','monto'))}</td>
                      <td className="px-4 py-3 text-gray-600">{get(a,'Forma de pago') || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{get(a,'CLOSER','Closer','closer') || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{get(a,'Seguimiento','seguimiento') || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${est.color}`}>{est.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => abrirRecibo(a)}
                            className="text-xs px-2 py-1 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 whitespace-nowrap" title="Generar recibo de la seña">
                            🧾 Recibo
                          </button>
                          <button onClick={() => abrirEditar(a)}
                            className="text-gray-300 hover:text-gray-700 transition-colors text-base" title="Editar">
                            ✏
                          </button>
                        </div>
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
