'use client';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const PROGRAMAS = ['M1','M1+','M1.1','M2','Back','Starter'];
const CLOSERS   = ['Kevin','Vicky','Braian','Fabricio'];
const METODOS   = ['Transferencia USD','Wise','Stripe','PayPal/Payoneer','Cripto','Transferencia ARS'];

function formatFecha(val) {
  if (!val) return '—';
  const s = String(val).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return s || '—';
}

const CUOTA_COLS = [
  { monto: 'Primer pago',  fecha: 'Fecha de ingreso(1er pago)', met: 'Met pago 1',  estado: 'Estado pago 1'  },
  { monto: 'Segundo pago', fecha: 'Fecha 2do pago',             met: 'Met pago 2',  estado: 'Estado pago 2'  },
  { monto: 'Tercer pago',  fecha: 'Fecha 3er pago',             met: 'Met pago 3',  estado: 'Estado pago 3'  },
  { monto: 'Cuarto Pago',  fecha: 'Fecha 4to pago',             met: 'Met pago 4',  estado: 'Estado 4to pago' },
];

function esPagadoLocal(val) {
  if (val === true) return true;
  const s = String(val || '').toUpperCase().trim();
  return s === 'SI' || s === 'SÍ' || s === 'YES' || s === '1' || s === 'TRUE';
}

function traducirBoolean(val) {
  if (val === true)  return 'Si';
  if (val === false) return 'No';
  const s = String(val || '').trim().toUpperCase();
  if (s === 'SI' || s === 'SÍ' || s === 'TRUE' || s === 'YES' || s === '1') return 'Si';
  if (s === 'NO'  || s === 'FALSE' || s === '0') return 'No';
  return val || '—';
}

function getCuotasInfo(c) {
  const all   = CUOTA_COLS.filter(q => parseFloat(String(c[q.monto]||'').replace(/[$,\s]/g,'')) > 0);
  const pagas = all.filter(q => esPagadoLocal(c[q.estado]));
  if (!all.length) return '—';
  return `${pagas.length}/${all.length}`;
}

export default function Clientes({ clientes, headers }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [programa, setPrograma] = useState('Todos');
  const [closer, setCloser]     = useState('Todos');
  const [estatus, setEstatus]   = useState('Todos');
  const [clienteSel, setClienteSel] = useState(null);
  const [showAdd, setShowAdd]   = useState(false);

  const closerOpts = useMemo(() => {
    const s = new Set(clientes.map(c => c['CLOSER']).filter(Boolean));
    return ['Todos', ...Array.from(s).sort()];
  }, [clientes]);

  const estatusOpts = useMemo(() => {
    const s = new Set(clientes.map(c => c['Estatus']).filter(Boolean));
    return ['Todos', ...Array.from(s).sort()];
  }, [clientes]);

  const filtrados = useMemo(() => clientes.filter(c => {
    if (busqueda && !`${c['Nombre']} ${c['Email']} ${c['Teléfono']}`.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (programa !== 'Todos' && c['Programa'] !== programa) return false;
    if (closer   !== 'Todos' && c['CLOSER']   !== closer)   return false;
    if (estatus  !== 'Todos' && c['Estatus']  !== estatus)  return false;
    return true;
  }), [clientes, busqueda, programa, closer, estatus]);

  return (
    <div className="space-y-4 max-w-full">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, email…"
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 w-64 shadow-sm" />
        {[['Programa', programa, setPrograma, ['Todos', ...PROGRAMAS]],
          ['Closer',   closer,   setCloser,   closerOpts],
          ['Estatus',  estatus,  setEstatus,  estatusOpts]].map(([label, val, setter, opts]) => (
          <select key={label} value={val} onChange={e => setter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 shadow-sm">
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span className="text-xs text-gray-400 font-medium">{filtrados.length} resultados</span>
        <button onClick={() => setShowAdd(true)}
          className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          + Nuevo cliente
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Nombre','Programa','Fuente','Closer','Monto total','Cuotas','Pagado','Estatus','Ingreso'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(c => {
                const cuotasInfo = getCuotasInfo(c);
                const completo   = cuotasInfo !== '—' && cuotasInfo.split('/')[0] === cuotasInfo.split('/')[1];
                return (
                  <tr key={c._rowIndex}
                    onClick={() => setClienteSel(clienteSel?._rowIndex === c._rowIndex ? null : c)}
                    className={`cursor-pointer transition-colors ${clienteSel?._rowIndex === c._rowIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{c['Nombre'] || '—'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">{c['Programa'] || '—'}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c['Fuente'] || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{c['CLOSER'] || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">${Number(c['Monto total']||0).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${completo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{cuotasInfo}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">${Number(c['Monto pagado']||0).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        String(c['Estatus']).toLowerCase().includes('activ') ? 'bg-blue-100 text-blue-700' :
                        String(c['Estatus']).toLowerCase().includes('baja')  ? 'bg-red-100 text-red-600'  :
                        'bg-gray-100 text-gray-500'
                      }`}>{c['Estatus'] || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{c['Ingreso'] || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {clienteSel && (
        <FichaCliente cliente={clienteSel} onClose={() => setClienteSel(null)}
          onPagadoUpdated={() => { setClienteSel(null); router.refresh(); }} />
      )}
      {showAdd && (
        <AddClienteModal headers={headers} onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); router.refresh(); }} />
      )}
    </div>
  );
}

// ── Ficha cliente ─────────────────────────────────────────────────────────────

function FichaCliente({ cliente: c, onClose, onPagadoUpdated }) {
  const [marcando, setMarcando] = useState(new Set());
  const [error, setError] = useState('');

  const cuotas = CUOTA_COLS.map((q, i) => ({
    n: i+1, q,
    monto:  c[q.monto],
    fecha:  c[q.fecha],
    met:    c[q.met],
    estado: c[q.estado],
  })).filter(x => x.monto && parseFloat(String(x.monto).replace(/[$,\s]/g,'')) > 0);

  const marcarPagado = async (cuota) => {
    const key = String(cuota.n);
    setMarcando(prev => new Set([...prev, key]));
    setError('');
    try {
      const res = await fetch('/api/update-pago', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: c._rowIndex, headerName: cuota.q.estado, value: 'SI' }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      onPagadoUpdated();
    } catch (err) {
      setMarcando(prev => { const s = new Set(prev); s.delete(key); return s; });
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{c['Nombre']}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{c['Email']} · {c['Teléfono']}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-5">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[['Programa',c['Programa'],false],['Fuente',c['Fuente'],false],['Ingreso',c['Ingreso'],false],
              ['Closer',c['CLOSER'],false],['Setter',c['SETTER'],false],['Estatus',c['Estatus'],false],
              ['CRM',c['CRM'],true],['Contrato',c['Contrato'],true],['Completado',c['Completado'],true]
            ].map(([label, val, isBoolean]) => (
              <div key={label} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{isBoolean ? traducirBoolean(val) : (val || '—')}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cuotas</p>
            <div className="space-y-2">
              {cuotas.map(x => {
                const pagado = esPagadoLocal(x.estado);
                const enProceso = marcando.has(String(x.n));
                return (
                  <div key={x.n} className={`flex items-center justify-between rounded-lg px-4 py-3 border ${pagado || enProceso ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${pagado || enProceso ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{x.n}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">${Number(String(x.monto).replace(/[$,\s]/g,'')).toLocaleString('es-AR')}</p>
                        <p className="text-xs text-gray-400">{formatFecha(x.fecha)} · {x.met || '—'}</p>
                      </div>
                    </div>
                    {pagado || enProceso
                      ? <span className="text-xs font-semibold text-emerald-600">✓ Pagado</span>
                      : <button onClick={() => marcarPagado(x)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors">
                          ✓ Marcar pagado
                        </button>
                    }
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-6 pt-3 border-t border-gray-100">
            <div><p className="text-xs text-gray-400">Monto total</p><p className="text-xl font-bold text-gray-900">${Number(c['Monto total']||0).toLocaleString('es-AR')}</p></div>
            <div><p className="text-xs text-gray-400">Pagado</p><p className="text-xl font-bold text-emerald-600">${Number(c['Monto pagado']||0).toLocaleString('es-AR')}</p></div>
            <div><p className="text-xs text-gray-400">Cuotas</p><p className="text-xl font-bold text-gray-700">{getCuotasInfo(c)}</p></div>
          </div>

          {c['Notas'] && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-xs text-amber-600 font-semibold mb-1">Notas</p>
              <p className="text-sm text-gray-700">{c['Notas']}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Agregar cliente ───────────────────────────────────────────────────────────

function Field({ label, value, onChange, type='text', placeholder, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}{required && ' *'}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 bg-white" />
    </div>
  );
}

function Sel({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 bg-white">
        <option value="">— Elegir —</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function AddClienteModal({ headers, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const g   = field => form[field] || '';

  const submit = async () => {
    if (!g('Nombre').trim()) { setError('Nombre requerido'); return; }
    setLoading(true); setError('');
    try {
      const rowValues = headers.map(h => form[h] ?? '');
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowValues }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      onSaved();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nuevo cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre" required value={g('Nombre')} onChange={v => set('Nombre', v)} />
            <Field label="Email" type="email" value={g('Email')} onChange={v => set('Email', v)} />
            <Field label="Teléfono" value={g('Teléfono')} onChange={v => set('Teléfono', v)} />
            <Field label="Fuente" value={g('Fuente')} onChange={v => set('Fuente', v)} placeholder="ADS, BIO, REPESCA…" />
            <Sel   label="Programa"  value={g('Programa')} onChange={v => set('Programa', v)} options={PROGRAMAS} />
            <Sel   label="Closer (CLOSER)" value={g('CLOSER')} onChange={v => set('CLOSER', v)} options={CLOSERS} />
            <Field label="Setter (SETTER)" value={g('SETTER')} onChange={v => set('SETTER', v)} />
            <Field label="Ingreso" value={g('Ingreso')} onChange={v => set('Ingreso', v)} placeholder="Enero 2025" />
            <Sel   label="Estatus" value={g('Estatus')} onChange={v => set('Estatus', v)} options={['Activo','Baja','Pausa']} />
            <Field label="Monto total" type="number" value={g('Monto total')} onChange={v => set('Monto total', v)} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Primer pago</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Monto primer pago" type="number" value={g('Primer pago')} onChange={v => set('Primer pago', v)} />
              <Field label="Fecha" value={g('Fecha de ingreso(1er pago)')} onChange={v => set('Fecha de ingreso(1er pago)', v)} placeholder="DD/MM/YYYY" />
              <Sel   label="Método" value={g('Met pago 1')} onChange={v => set('Met pago 1', v)} options={METODOS} />
              <Sel   label="¿Pagado?" value={g('Estado pago 1') || 'NO'} onChange={v => set('Estado pago 1', v)} options={['NO','SI']} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={submit} disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-sm font-semibold text-white">
              {loading ? 'Guardando…' : 'Guardar cliente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
