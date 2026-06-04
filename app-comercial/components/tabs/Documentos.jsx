'use client';
import { useState } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function addDaysStr(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function calcInvoice(items, taxPct) {
  const subtotal = items.reduce(
    (s, it) => s + (Number(it.unitPrice) || 0) * (Number(it.qty) || 1),
    0,
  );
  const taxAmount = subtotal * (Number(taxPct) || 0) / 100;
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

function calcRecibo(items, vatPct) {
  const subtotal = items.reduce(
    (s, it) => s + (Number(it.amount) || 0) * (Number(it.quantity) || 1),
    0,
  );
  const vatAmount = subtotal * (Number(vatPct) || 0) / 100;
  return { subtotal, vatAmount, total: subtotal + vatAmount };
}

function displayAmount(n, moneda) {
  const num = Number(n) || 0;
  const [int, dec] = num.toFixed(2).split('.');
  if (moneda === 'ARS') {
    return '$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec;
  }
  return '$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const inputCls =
  'border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full bg-white';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

function Field({ label, value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );
}

function InvoiceForm({ state, setState }) {
  const { fecha, dueDate, nombre, telefono, email, dni, items, tax } = state;
  const { subtotal, taxAmount, total } = calcInvoice(items, tax);

  function updateItem(i, field, val) {
    setState((p) => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) }));
  }
  function addItem() {
    setState((p) => ({ ...p, items: [...p.items, { description: '', unitPrice: '', qty: 1 }] }));
  }
  function removeItem(i) {
    setState((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha" value={fecha} onChange={(v) => setState((p) => ({ ...p, fecha: v }))} placeholder="dd/mm/aaaa" />
        <Field label="Due Date" value={dueDate} onChange={(v) => setState((p) => ({ ...p, dueDate: v }))} placeholder="dd/mm/aaaa" />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Billed To</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre *" value={nombre} onChange={(v) => setState((p) => ({ ...p, nombre: v }))} />
          <Field label="Teléfono" value={telefono} onChange={(v) => setState((p) => ({ ...p, telefono: v }))} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label="Email" value={email} onChange={(v) => setState((p) => ({ ...p, email: v }))} />
          <Field label="DNI" value={dni} onChange={(v) => setState((p) => ({ ...p, dni: v }))} />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ítems</p>
        <div className="space-y-2">
          <div className="grid gap-2 text-xs text-gray-400 font-medium" style={{ gridTemplateColumns: '1fr 100px 56px 80px 24px' }}>
            <span>Descripción</span><span className="text-right">Precio unit.</span><span className="text-right">Qty</span><span className="text-right">Total</span><span />
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 100px 56px 80px 24px' }}>
              <input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)}
                placeholder="Descripción" className={inputCls} />
              <input value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                placeholder="0" type="number" min="0" className={`${inputCls} text-right`} />
              <input value={item.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)}
                placeholder="1" type="number" min="1" className={`${inputCls} text-right`} />
              <span className="text-xs text-gray-600 text-right tabular-nums">
                {displayAmount((Number(item.unitPrice) || 0) * (Number(item.qty) || 1), state.moneda)}
              </span>
              {items.length > 1 ? (
                <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
              ) : <span />}
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">+ Agregar ítem</button>
      </div>

      <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
        <label className={labelCls + ' mb-0'}>Tax %</label>
        <input value={tax} onChange={(e) => setState((p) => ({ ...p, tax: e.target.value }))}
          type="number" min="0" max="100"
          className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-20 text-right bg-white" />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-right border border-gray-100">
        <div className="text-sm text-gray-500">Subtotal <span className="text-gray-800 tabular-nums">{displayAmount(subtotal, state.moneda)}</span></div>
        <div className="text-sm text-gray-500">Tax ({tax || 0}%) <span className="text-gray-800 tabular-nums">{displayAmount(taxAmount, state.moneda)}</span></div>
        <div className="text-base font-bold text-gray-900 tabular-nums">Total {state.moneda} {displayAmount(total, state.moneda)}</div>
      </div>
    </div>
  );
}

function ReciboForm({ state, setState }) {
  const { fecha, nombre, telefono, email, items, vat } = state;
  const { subtotal, vatAmount, total } = calcRecibo(items, vat);

  function updateItem(i, field, val) {
    setState((p) => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) }));
  }
  function addItem() {
    setState((p) => ({ ...p, items: [...p.items, { description: '', quantity: 1, amount: '' }] }));
  }
  function removeItem(i) {
    setState((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="space-y-4">
      <Field label="Fecha" value={fecha} onChange={(v) => setState((p) => ({ ...p, fecha: v }))} placeholder="dd/mm/aaaa" className="max-w-xs" />

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">A nombre de</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre *" value={nombre} onChange={(v) => setState((p) => ({ ...p, nombre: v }))} />
          <Field label="Teléfono" value={telefono} onChange={(v) => setState((p) => ({ ...p, telefono: v }))} />
        </div>
        <div className="mt-4 max-w-xs">
          <Field label="Email" value={email} onChange={(v) => setState((p) => ({ ...p, email: v }))} />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ítems</p>
        <div className="space-y-2">
          <div className="grid gap-2 text-xs text-gray-400 font-medium" style={{ gridTemplateColumns: '1fr 80px 100px 24px' }}>
            <span>Descripción</span><span className="text-right">Cantidad</span><span className="text-right">Monto</span><span />
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 80px 100px 24px' }}>
              <input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)}
                placeholder="Descripción" className={inputCls} />
              <input value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                placeholder="1" type="number" min="1" className={`${inputCls} text-right`} />
              <input value={item.amount} onChange={(e) => updateItem(i, 'amount', e.target.value)}
                placeholder="0" type="number" min="0" className={`${inputCls} text-right`} />
              {items.length > 1 ? (
                <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
              ) : <span />}
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">+ Agregar ítem</button>
      </div>

      <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
        <label className={labelCls + ' mb-0'}>VAT %</label>
        <input value={vat} onChange={(e) => setState((p) => ({ ...p, vat: e.target.value }))}
          type="number" min="0" max="100"
          className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-20 text-right bg-white" />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-right border border-gray-100">
        <div className="text-sm text-gray-500">Subtotal <span className="text-gray-800 tabular-nums">{displayAmount(subtotal, state.moneda)}</span></div>
        <div className="text-sm text-gray-500">VAT ({vat || 0}%) <span className="text-gray-800 tabular-nums">{displayAmount(vatAmount, state.moneda)}</span></div>
        <div className="text-base font-bold text-gray-900 tabular-nums">Total {state.moneda} {displayAmount(total, state.moneda)}</div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const defaultInvoice = () => ({
  fecha: todayStr(),
  dueDate: addDaysStr(30),
  nombre: '',
  telefono: '',
  email: '',
  dni: '',
  items: [{ description: '', unitPrice: '', qty: 1 }],
  tax: 0,
  moneda: 'USD',
});

const defaultRecibo = () => ({
  fecha: todayStr(),
  nombre: '',
  telefono: '',
  email: '',
  items: [{ description: '', quantity: 1, amount: '' }],
  vat: 0,
  moneda: 'USD',
});

function findField(obj, candidates) {
  for (const key of candidates) {
    if (obj[key] !== undefined && obj[key] !== '') return String(obj[key]);
  }
  return '';
}

export default function Documentos({ clientes = [] }) {
  const [tipo, setTipo] = useState('Invoice');
  const [invState, setInvState] = useState(defaultInvoice);
  const [recState, setRecState] = useState(defaultRecibo);
  const [clientSearch, setClientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const moneda = tipo === 'Invoice' ? invState.moneda : recState.moneda;
  function setMoneda(m) {
    if (tipo === 'Invoice') setInvState((p) => ({ ...p, moneda: m }));
    else setRecState((p) => ({ ...p, moneda: m }));
  }

  const filtered =
    clientSearch.length >= 2
      ? clientes
          .filter((c) => {
            const name = findField(c, ['Nombre', 'nombre', 'NOMBRE', 'Cliente', 'Name']).toLowerCase();
            return name.includes(clientSearch.toLowerCase());
          })
          .slice(0, 8)
      : [];

  function fillFromCliente(c) {
    const nombre = findField(c, ['Nombre', 'nombre', 'NOMBRE', 'Cliente', 'Name']);
    const telefono = findField(c, ['Teléfono', 'Telefono', 'telefono', 'Tel', 'Celular', 'WhatsApp']);
    const email = findField(c, ['Email', 'email', 'EMAIL', 'Correo', 'correo']);
    const dni = findField(c, ['DNI', 'dni', 'Documento', 'Cédula', 'cedula']);
    if (tipo === 'Invoice') {
      setInvState((p) => ({ ...p, nombre, telefono, email, dni }));
    } else {
      setRecState((p) => ({ ...p, nombre, telefono, email }));
    }
    setClientSearch(nombre);
    setShowDropdown(false);
  }

  function switchTipo(t) {
    setTipo(t);
    setClientSearch('');
    setSuccess(null);
    setError(null);
  }

  async function handleGenerar() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let formData;
      if (tipo === 'Invoice') {
        const { subtotal, taxAmount, total } = calcInvoice(invState.items, invState.tax);
        formData = { ...invState, subtotal, taxAmount, total, origen: 'Manual' };
      } else {
        const { subtotal, vatAmount, total } = calcRecibo(recState.items, recState.vat);
        formData = { ...recState, subtotal, vatAmount, total, origen: 'Manual' };
      }

      if (!formData.nombre.trim()) {
        setError('El nombre es requerido.');
        return;
      }

      const res = await fetch('/api/documentos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, formData, moneda }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al generar' }));
        throw new Error(err.error || 'Error al generar el documento');
      }

      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') ?? '';
      const filename = cd.match(/filename="(.+?)"/)?.[1] ?? `${tipo}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess(`${tipo} generado y registrado correctamente.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Tipo + Moneda */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {['Invoice', 'Recibo'].map((t) => (
            <button key={t} onClick={() => switchTipo(t)}
              className={`px-6 py-2 text-sm font-medium transition-colors ${
                tipo === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {['USD', 'ARS'].map((m) => (
            <button key={m} onClick={() => setMoneda(m)}
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                moneda === m ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Client autocomplete */}
      {clientes.length > 0 && (
        <div className="relative">
          <label className={labelCls}>Buscar cliente existente (opcional)</label>
          <input
            value={clientSearch}
            onChange={(e) => { setClientSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => clientSearch.length >= 2 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Escribí un nombre para autocompletar..."
            className={inputCls}
          />
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 overflow-hidden">
              {filtered.map((c, i) => {
                const name = findField(c, ['Nombre', 'nombre', 'NOMBRE', 'Cliente', 'Name']);
                const mail = findField(c, ['Email', 'email']);
                return (
                  <button key={i} onMouseDown={() => fillFromCliente(c)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-baseline gap-2">
                    <span className="font-medium text-gray-900">{name}</span>
                    {mail && <span className="text-xs text-gray-400">{mail}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {tipo === 'Invoice'
          ? <InvoiceForm state={invState} setState={setInvState} />
          : <ReciboForm state={recState} setState={setRecState} />
        }
      </div>

      {/* Feedback */}
      {error && (
        <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          {success}
        </div>
      )}

      {/* Generate */}
      <button
        onClick={handleGenerar}
        disabled={loading}
        className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Generando...' : `Generar ${tipo}`}
      </button>
    </div>
  );
}
