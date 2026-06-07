'use client';
import { useState } from 'react';

const CATEGORIAS = [
  'Sueldos',
  'Publicidad',
  'APPS',
  'Gastos Administrativos',
  'Formación',
  'Impuestos',
  'Extras',
  'Retiros Personales',
];

const MEDIOS_PAGO = [
  'Transferencia',
  'Efectivo',
  'Tarjeta',
  'Wise',
  'Stripe',
  'Cripto',
  'Otro',
];

const today = () => new Date().toISOString().split('T')[0];

const EMPTY = {
  fecha: today(),
  categoria: '',
  subcategoria: '',
  descripcion: '',
  monto: '',
  medioPago: '',
  pais: 'AR',
};

export default function Egresos() {
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [recientes, setRecientes] = useState([]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setSuccess(false);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.categoria) { setError('Elegí una categoría.'); return; }
    if (!form.monto || isNaN(Number(form.monto))) { setError('Ingresá un monto válido.'); return; }
    if (!form.medioPago) { setError('Elegí un medio de pago.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/egresos/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setRecientes(r => [{ ...form, id: Date.now() }, ...r.slice(0, 9)]);
      setForm({ ...EMPTY, fecha: form.fecha });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-gray-900">Cargar egreso</h2>
        <p className="text-sm text-gray-500 mt-1">Se guarda en la pestaña Registros de la planilla de egresos.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        {/* Fecha + País */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">FECHA</label>
            <input
              type="date"
              value={form.fecha}
              onChange={e => set('fecha', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">PAÍS</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {['AR', 'USA'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('pais', p)}
                  className={`px-5 py-2 text-sm font-medium transition-colors ${
                    form.pais === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">CATEGORÍA</label>
          <select
            value={form.categoria}
            onChange={e => set('categoria', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Seleccioná una categoría</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Subcategoría */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">SUBCATEGORÍA</label>
          <input
            type="text"
            value={form.subcategoria}
            onChange={e => set('subcategoria', e.target.value)}
            placeholder="ej. Loom, Kevin Setter, Contador ARG…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">DESCRIPCIÓN <span className="text-gray-400">(opcional)</span></label>
          <input
            type="text"
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            placeholder="Detalle adicional"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Monto + Medio de pago */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">MONTO (USD)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monto}
              onChange={e => set('monto', e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">MEDIO DE PAGO</label>
            <select
              value={form.medioPago}
              onChange={e => set('medioPago', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Seleccioná</option>
              {MEDIOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">✓ Egreso guardado correctamente.</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Guardando…' : 'Guardar egreso'}
        </button>

      </form>

      {recientes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Cargados en esta sesión</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recientes.map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{r.categoria}</span>
                  {r.subcategoria && <span className="text-gray-500"> — {r.subcategoria}</span>}
                  {r.descripcion  && <span className="text-gray-400 text-xs ml-2">{r.descripcion}</span>}
                </div>
                <div className="flex items-center gap-3 text-right shrink-0 ml-4">
                  <span className="text-gray-500 text-xs">{r.medioPago} · {r.pais}</span>
                  <span className="font-semibold text-gray-900">${Number(r.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
