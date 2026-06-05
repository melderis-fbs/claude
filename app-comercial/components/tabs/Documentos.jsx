'use client';
import { useState, useEffect, useCallback } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function addDaysStr(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function calcInvoice(items, taxPct) {
  const subtotal = items.reduce((s, it) => s + (Number(it.unitPrice) || 0) * (Number(it.qty) || 1), 0);
  const taxAmount = subtotal * (Number(taxPct) || 0) / 100;
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}
function calcRecibo(items, vatPct) {
  const subtotal = items.reduce((s, it) => s + (Number(it.amount) || 0) * (Number(it.quantity) || 1), 0);
  const vatAmount = subtotal * (Number(vatPct) || 0) / 100;
  return { subtotal, vatAmount, total: subtotal + vatAmount };
}
function displayAmount(n, moneda) {
  const num = Number(n) || 0;
  const [int, dec] = num.toFixed(2).split('.');
  if (moneda === 'ARS') return '$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec;
  return '$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
}
function findField(obj, keys) {
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== '') return String(obj[k]);
  return '';
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

const inp = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition';

function Label({ children }) {
  return <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide">{children}</label>;
}
function Field({ label, value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inp} />
    </div>
  );
}
function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ── Invoice form ──────────────────────────────────────────────────────────────

function InvoiceForm({ state, setState }) {
  const { fecha, dueDate, nombre, telefono, email, dni, paymentInfo, items, tax, moneda } = state;
  const { subtotal, taxAmount, total } = calcInvoice(items, tax);

  const upd = (field, val) => setState(p => ({ ...p, [field]: val }));
  const updItem = (i, field, val) => setState(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) }));

  return (
    <div className="space-y-6">

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha" value={fecha} onChange={v => upd('fecha', v)} placeholder="dd/mm/aaaa" />
        <Field label="Due Date" value={dueDate} onChange={v => upd('dueDate', v)} placeholder="dd/mm/aaaa" />
      </div>

      {/* Billed to */}
      <div>
        <SectionTitle>Issued to</SectionTitle>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Nombre *" value={nombre} onChange={v => upd('nombre', v)} />
          <Field label="Teléfono" value={telefono} onChange={v => upd('telefono', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" value={email} onChange={v => upd('email', v)} />
          <Field label="DNI" value={dni} onChange={v => upd('dni', v)} />
        </div>
      </div>

      {/* Payment info */}
      <div>
        <SectionTitle>Payment info</SectionTitle>
        <div>
          <Label>Método de pago / Datos bancarios <span className="font-normal text-gray-400">(opcional)</span></Label>
          <textarea
            value={paymentInfo}
            onChange={e => upd('paymentInfo', e.target.value)}
            placeholder={'Bank Transfer\nAccount Name: Victoria Becci\nAccount No: 0000 0000 0000'}
            rows={3}
            className={inp + ' resize-none'}
          />
        </div>
      </div>

      {/* Items */}
      <div>
        <SectionTitle>Ítems</SectionTitle>
        <div className="space-y-2">
          <div className="grid gap-2 px-1" style={{ gridTemplateColumns: '1fr 96px 52px 84px 20px' }}>
            {['Descripción', 'Precio unit.', 'Qty', 'Total', ''].map((h, i) => (
              <span key={i} className={`text-xs font-semibold text-gray-400 ${i > 0 ? 'text-right' : ''}`}>{h}</span>
            ))}
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 96px 52px 84px 20px' }}>
              <input value={item.description} onChange={e => updItem(i, 'description', e.target.value)} placeholder="Descripción" className={inp} />
              <input value={item.unitPrice} onChange={e => updItem(i, 'unitPrice', e.target.value)} placeholder="0" type="number" min="0" className={inp + ' text-right'} />
              <input value={item.qty} onChange={e => updItem(i, 'qty', e.target.value)} placeholder="1" type="number" min="1" className={inp + ' text-right'} />
              <span className="text-sm text-gray-700 text-right tabular-nums font-medium">
                {displayAmount((Number(item.unitPrice) || 0) * (Number(item.qty) || 1), moneda)}
              </span>
              {items.length > 1
                ? <button onClick={() => setState(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))} className="text-gray-300 hover:text-red-400 text-xl leading-none">×</button>
                : <span />}
            </div>
          ))}
        </div>
        <button onClick={() => setState(p => ({ ...p, items: [...p.items, { description: '', unitPrice: '', qty: 1 }] }))}
          className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700">
          + Agregar ítem
        </button>
      </div>

      {/* Tax + totals */}
      <div className="border-t border-gray-100 pt-4 space-y-4">
        <div className="flex items-center gap-3">
          <Label>Tax %</Label>
          <input value={tax} onChange={e => upd('tax', e.target.value)} type="number" min="0" max="100"
            className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
        </div>
        <Totals rows={[
          { label: 'Subtotal', value: displayAmount(subtotal, moneda) },
          { label: `Tax (${tax || 0}%)`, value: displayAmount(taxAmount, moneda), muted: true },
        ]} total={`Total ${moneda} ${displayAmount(total, moneda)}`} />
      </div>
    </div>
  );
}

// ── Recibo form ───────────────────────────────────────────────────────────────

function ReciboForm({ state, setState }) {
  const { fecha, nombre, telefono, email, items, vat, moneda } = state;
  const { subtotal, vatAmount, total } = calcRecibo(items, vat);

  const upd = (field, val) => setState(p => ({ ...p, [field]: val }));
  const updItem = (i, field, val) => setState(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) }));

  return (
    <div className="space-y-6">

      <Field label="Fecha" value={fecha} onChange={v => upd('fecha', v)} placeholder="dd/mm/aaaa" className="max-w-xs" />

      <div>
        <SectionTitle>A nombre de</SectionTitle>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Nombre *" value={nombre} onChange={v => upd('nombre', v)} />
          <Field label="Teléfono" value={telefono} onChange={v => upd('telefono', v)} />
        </div>
        <div className="max-w-xs">
          <Field label="Email" value={email} onChange={v => upd('email', v)} />
        </div>
      </div>

      <div>
        <SectionTitle>Ítems</SectionTitle>
        <div className="space-y-2">
          <div className="grid gap-2 px-1" style={{ gridTemplateColumns: '1fr 76px 96px 20px' }}>
            {['Descripción', 'Cantidad', 'Monto', ''].map((h, i) => (
              <span key={i} className={`text-xs font-semibold text-gray-400 ${i > 0 ? 'text-right' : ''}`}>{h}</span>
            ))}
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 76px 96px 20px' }}>
              <input value={item.description} onChange={e => updItem(i, 'description', e.target.value)} placeholder="Descripción" className={inp} />
              <input value={item.quantity} onChange={e => updItem(i, 'quantity', e.target.value)} placeholder="1" type="number" min="1" className={inp + ' text-right'} />
              <input value={item.amount} onChange={e => updItem(i, 'amount', e.target.value)} placeholder="0" type="number" min="0" className={inp + ' text-right'} />
              {items.length > 1
                ? <button onClick={() => setState(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))} className="text-gray-300 hover:text-red-400 text-xl leading-none">×</button>
                : <span />}
            </div>
          ))}
        </div>
        <button onClick={() => setState(p => ({ ...p, items: [...p.items, { description: '', quantity: 1, amount: '' }] }))}
          className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700">
          + Agregar ítem
        </button>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-4">
        <div className="flex items-center gap-3">
          <Label>VAT %</Label>
          <input value={vat} onChange={e => upd('vat', e.target.value)} type="number" min="0" max="100"
            className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
        </div>
        <Totals rows={[
          { label: 'Subtotal', value: displayAmount(subtotal, moneda) },
          { label: `VAT (${vat || 0}%)`, value: displayAmount(vatAmount, moneda), muted: true },
        ]} total={`Total ${moneda} ${displayAmount(total, moneda)}`} />
      </div>
    </div>
  );
}

function Totals({ rows, total }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
      {rows.map((r, i) => (
        <div key={i} className={`flex justify-between items-baseline mb-1.5 ${r.muted ? 'text-gray-400' : ''}`}>
          <span className="text-sm">{r.label}</span>
          <span className="text-sm tabular-nums font-medium">{r.value}</span>
        </div>
      ))}
      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-baseline">
        <span className="text-sm font-bold text-gray-900">Total</span>
        <span className="text-base font-bold text-gray-900 tabular-nums">{total.replace(/^Total \w+ /, '')}</span>
      </div>
      <p className="text-right text-xs text-gray-400 mt-0.5">{total.match(/^Total (\w+)/)?.[1]}</p>
    </div>
  );
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const defaultInvoice = () => ({
  fecha: todayStr(), dueDate: addDaysStr(30),
  nombre: '', telefono: '', email: '', dni: '', paymentInfo: '',
  items: [{ description: '', unitPrice: '', qty: 1 }],
  tax: 0, moneda: 'USD',
});
const defaultRecibo = () => ({
  fecha: todayStr(),
  nombre: '', telefono: '', email: '',
  items: [{ description: '', quantity: 1, amount: '' }],
  vat: 0, moneda: 'USD',
});

// ── Main component ────────────────────────────────────────────────────────────

export default function Documentos({ clientes = [] }) {
  const [tipo, setTipo] = useState('Invoice');
  const [invState, setInvState] = useState(defaultInvoice);
  const [recState, setRecState] = useState(defaultRecibo);
  const [clientSearch, setClientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const moneda = tipo === 'Invoice' ? invState.moneda : recState.moneda;
  const setMoneda = m => tipo === 'Invoice' ? setInvState(p => ({ ...p, moneda: m })) : setRecState(p => ({ ...p, moneda: m }));

  const closePreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') closePreview(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closePreview]);

  const filtered = clientSearch.length >= 2
    ? clientes.filter(c => findField(c, ['Nombre','nombre','NOMBRE','Cliente','Name']).toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 8)
    : [];

  function fillFromCliente(c) {
    const nombre   = findField(c, ['Nombre','nombre','NOMBRE','Cliente','Name']);
    const telefono = findField(c, ['Teléfono','Telefono','telefono','Tel','Celular','WhatsApp']);
    const email    = findField(c, ['Email','email','EMAIL','Correo','correo']);
    const dni      = findField(c, ['DNI','dni','Documento','Cédula','cedula']);
    if (tipo === 'Invoice') setInvState(p => ({ ...p, nombre, telefono, email, dni }));
    else setRecState(p => ({ ...p, nombre, telefono, email }));
    setClientSearch(nombre);
    setShowDropdown(false);
  }

  function switchTipo(t) {
    setTipo(t);
    setClientSearch('');
    setSuccess(null);
    setError(null);
  }

  function buildFormData() {
    if (tipo === 'Invoice') {
      const { subtotal, taxAmount, total } = calcInvoice(invState.items, invState.tax);
      return { ...invState, subtotal, taxAmount, total, origen: 'Manual' };
    }
    const { subtotal, vatAmount, total } = calcRecibo(recState.items, recState.vat);
    return { ...recState, subtotal, vatAmount, total, origen: 'Manual' };
  }

  async function callApi(endpoint) {
    const formData = buildFormData();
    if (!formData.nombre.trim()) { setError('El nombre es requerido.'); return null; }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, formData, moneda }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error inesperado' }));
      throw new Error(err.error || 'Error al procesar');
    }
    return res;
  }

  async function handlePreview() {
    setError(null);
    setPreviewing(true);
    try {
      const res = await callApi('/api/documentos/preview');
      if (!res) return;
      const blob = await res.blob();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) { setError(err.message); }
    finally { setPreviewing(false); }
  }

  async function handleGenerar() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await callApi('/api/documentos/generate');
      if (!res) return;
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') ?? '';
      const filename = cd.match(/filename="(.+?)"/)?.[1] ?? `${tipo}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      setSuccess(`${tipo} generado y registrado correctamente.`);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <>
      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closePreview}>
          <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: 'min(840px, 96vw)', height: '92vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0 bg-white">
              <span className="text-sm font-semibold text-gray-700">Vista previa — {tipo}</span>
              <button onClick={closePreview} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-xl transition">×</button>
            </div>
            <iframe src={previewUrl} className="flex-1 w-full" title="Vista previa" />
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-5">

        {/* Type + currency toggles */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-xl border border-gray-200 p-0.5 bg-white shadow-sm">
            {['Invoice', 'Recibo'].map(t => (
              <button key={t} onClick={() => switchTipo(t)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tipo === t ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl border border-gray-200 p-0.5 bg-white shadow-sm">
            {['USD', 'ARS'].map(m => (
              <button key={m} onClick={() => setMoneda(m)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${moneda === m ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Client autocomplete */}
        {clientes.length > 0 && (
          <div className="relative">
            <Label>Buscar cliente existente <span className="font-normal text-gray-400">(opcional)</span></Label>
            <input value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => clientSearch.length >= 2 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Escribí un nombre para autocompletar..."
              className={inp} />
            {showDropdown && filtered.length > 0 && (
              <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-1 overflow-hidden">
                {filtered.map((c, i) => {
                  const name = findField(c, ['Nombre','nombre','NOMBRE','Cliente','Name']);
                  const mail = findField(c, ['Email','email']);
                  return (
                    <button key={i} onMouseDown={() => fillFromCliente(c)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-baseline gap-2">
                      <span className="font-semibold text-gray-900">{name}</span>
                      {mail && <span className="text-xs text-gray-400">{mail}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {tipo === 'Invoice'
            ? <InvoiceForm state={invState} setState={setInvState} />
            : <ReciboForm state={recState} setState={setRecState} />}
        </div>

        {/* Feedback */}
        {error && <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}
        {success && <div className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3">{success}</div>}

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={handlePreview} disabled={previewing || loading}
            className="flex-1 border border-gray-200 bg-white text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm">
            {previewing ? 'Cargando...' : 'Vista previa'}
          </button>
          <button onClick={handleGenerar} disabled={loading || previewing}
            className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm">
            {loading ? 'Generando...' : `Generar ${tipo}`}
          </button>
        </div>

      </div>
    </>
  );
}
