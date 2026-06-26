'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FichaCliente, { getCuotasInfo, esPagadoLocal, CUOTA_COLS, calcularMontos } from '../FichaCliente.jsx';

const PROGRAMAS = ['M1','M1+','M1.1','M2','Back','Starter'];
const CLOSERS   = ['Kevin','Vicky','Braian','Fabricio'];
const METODOS   = ['Transferencia USD','Wise','Stripe','PayPal/Payoneer','Cripto','Transferencia ARS','Efectivo'];

const MES_ORDER = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
];

function mesKey(ingreso) {
  if (!ingreso) return null;
  const s = String(ingreso).toLowerCase().trim();
  const parts = s.split(/\s+/);
  const mesIdx = MES_ORDER.findIndex(m => parts[0].startsWith(m));
  if (mesIdx === -1) return null;
  const year = parts.length >= 2 ? parts[parts.length - 1].padStart(4, '0') : '0000';
  return `${year}-${String(mesIdx).padStart(2, '0')}`;
}

function ClienteRow({ c, clienteSel, setClienteSel }) {
  const cuotasInfo = getCuotasInfo(c);
  const completo   = cuotasInfo !== '—' && cuotasInfo.split('/')[0] === cuotasInfo.split('/')[1];
  const isSelected = clienteSel?._rowIndex === c._rowIndex;
  const { total, pagado } = calcularMontos(c);
  return (
    <tr onClick={() => setClienteSel(isSelected ? null : c)}
      className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <td className="px-4 py-3 font-medium text-gray-900">{c['Nombre'] || '—'}</td>
      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">{c['Programa'] || '—'}</span></td>
      <td className="px-4 py-3 text-gray-500 text-xs">{c['Fuente'] || '—'}</td>
      <td className="px-4 py-3 text-gray-700">{c['CLOSER'] || '—'}</td>
      <td className="px-4 py-3 text-gray-700">${total.toLocaleString('es-AR')}</td>
      <td className="px-4 py-3 text-center">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${completo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{cuotasInfo}</span>
      </td>
      <td className="px-4 py-3 text-gray-700">${pagado.toLocaleString('es-AR')}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {c['Estatus'] ? (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              String(c['Estatus']).toLowerCase().includes('activ') ? 'bg-blue-100 text-blue-700' :
              String(c['Estatus']).toLowerCase().includes('baja')  ? 'bg-red-100 text-red-600'  :
              'bg-gray-100 text-gray-500'
            }`}>{c['Estatus']}</span>
          ) : <span className="text-gray-300">—</span>}
          {String(c['Reembolso'] || '').toUpperCase() === 'SI' && (
            <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">↩ Reembolso</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-gray-400 text-xs text-right">
        <span className={`transition-colors ${isSelected ? 'text-blue-500' : 'text-gray-300'}`}>›</span>
      </td>
    </tr>
  );
}

function GrupoMes({ label, clientes, defaultOpen, clienteSel, setClienteSel }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800 capitalize">{label}</span>
          <span className="text-xs text-gray-400 font-medium">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</span>
        </div>
        <span className={`text-gray-400 text-lg transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-t border-gray-100">
              <tr>
                {['Nombre','Programa','Fuente','Closer','Monto total','Cuotas','Pagado','Estatus',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map(c => (
                <ClienteRow key={c._rowIndex} c={c} clienteSel={clienteSel} setClienteSel={setClienteSel} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Clientes({ clientes, headers }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [programa, setPrograma] = useState('Todos');
  const [closer, setCloser]     = useState('Todos');
  const [estatus, setEstatus]   = useState('Todos');
  const [clienteSel, setClienteSel] = useState(null);
  const [showAdd, setShowAdd]   = useState(false);

  const fuenteOpts = useMemo(() => {
    const s = new Set(clientes.map(c => c['Fuente']).filter(Boolean));
    return Array.from(s).sort();
  }, [clientes]);

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

  const grupos = useMemo(() => {
    const map = new Map(); // groupKey → { label, sortKey, clientes[] }
    for (const c of filtrados) {
      const sortKey  = mesKey(c['Ingreso']);
      const label    = c['Ingreso'] || 'Sin ingreso';
      const groupKey = sortKey ?? `__${label}`;
      if (!map.has(groupKey)) map.set(groupKey, { label, sortKey: sortKey ?? '', clientes: [] });
      map.get(groupKey).clientes.push(c);
    }
    return Array.from(map.values())
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
      .map(g => ({ key: g.label, label: g.label, clientes: g.clientes }));
  }, [filtrados]);

  const primerKey = grupos[0]?.key;

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

      {/* Grupos por mes */}
      {grupos.map(g => (
        <GrupoMes key={g.key} label={g.label} clientes={g.clientes}
          defaultOpen={g.key === primerKey}
          clienteSel={clienteSel} setClienteSel={setClienteSel} />
      ))}

      {clienteSel && (
        <FichaCliente cliente={clienteSel} onClose={() => setClienteSel(null)}
          onPagadoUpdated={() => { setClienteSel(null); router.refresh(); }} />
      )}
      {showAdd && (
        <AddClienteModal headers={headers} fuenteOpts={fuenteOpts} onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); router.refresh(); }} />
      )}
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

const CUOTA_LABELS = ['Primer pago','Segundo pago','Tercer pago','Cuarto pago'];
const CUOTA_FIELDS = CUOTA_COLS.map(q => ({ monto: q.monto, fecha: q.fecha, met: q.met, estado: q.estado }));

function AddClienteModal({ headers, fuenteOpts = [], onClose, onSaved }) {
  const [form, setForm] = useState({ 'Estado pago 1': 'NO' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const g   = field => form[field] ?? '';
  const cuotasCount = Number(g('Cuotas') || 1);

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

          {/* Cuotas selector — prominente arriba */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cantidad de pagos</label>
            <div className="flex gap-2">
              {[['1','Pago full'],['2','2 pagos'],['3','3 pagos'],['4','4 pagos']].map(([n, lbl]) => (
                <button key={n} type="button" onClick={() => set('Cuotas', n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                    (g('Cuotas') || '1') === n
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}>{lbl}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre" required value={g('Nombre')} onChange={v => set('Nombre', v)} />
            <Field label="Email" type="email" value={g('Email')} onChange={v => set('Email', v)} />
            <Field label="Teléfono" value={g('Teléfono')} onChange={v => set('Teléfono', v)} />
            <Sel   label="Fuente" value={g('Fuente')} onChange={v => set('Fuente', v)} options={fuenteOpts} />
            <Sel   label="Programa"  value={g('Programa')} onChange={v => set('Programa', v)} options={PROGRAMAS} />
            <Sel   label="Closer" value={g('CLOSER')} onChange={v => set('CLOSER', v)} options={CLOSERS} />
            <Field label="Setter" value={g('SETTER')} onChange={v => set('SETTER', v)} />
            <Field label="Ingreso" value={g('Ingreso')} onChange={v => set('Ingreso', v)} placeholder="Enero 2025" />
            <Sel   label="Estatus" value={g('Estatus')} onChange={v => set('Estatus', v)} options={['Activo','Baja','Pausa']} />
            <Field label="Monto total" type="number" value={g('Monto total')} onChange={v => set('Monto total', v)} />
          </div>

          {/* Cuotas */}
          {[0,1,2,3].filter(i => i < cuotasCount).map(i => (
            <div key={i} className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{CUOTA_LABELS[i]}</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Monto" type="number" value={g(CUOTA_FIELDS[i].monto)} onChange={v => set(CUOTA_FIELDS[i].monto, v)} />
                <Field label="Fecha" value={g(CUOTA_FIELDS[i].fecha)} onChange={v => set(CUOTA_FIELDS[i].fecha, v)} placeholder="DD/MM/YYYY" />
                <Sel   label="Método" value={g(CUOTA_FIELDS[i].met)} onChange={v => set(CUOTA_FIELDS[i].met, v)} options={METODOS} />
                <Sel   label="¿Pagado?" value={g(CUOTA_FIELDS[i].estado) || 'NO'} onChange={v => set(CUOTA_FIELDS[i].estado, v)} options={['NO','SI']} />
              </div>
            </div>
          ))}

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
