'use client';
import { useState, useMemo } from 'react';

const PROGRAMAS = ['Todos','M1','M1+','M1.1','M2','Back','Starter'];

export default function Clientes({ clientes }) {
  const [busqueda, setBusqueda] = useState('');
  const [programa, setPrograma] = useState('Todos');
  const [closer, setCloser]     = useState('Todos');
  const [estatus, setEstatus]   = useState('Todos');
  const [clienteSel, setClienteSel] = useState(null);

  const closers = useMemo(() => {
    const s = new Set(clientes.map(c => c['CLOSER']).filter(Boolean));
    return ['Todos', ...Array.from(s).sort()];
  }, [clientes]);

  const estatuses = useMemo(() => {
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
        {[['Programa', programa, setPrograma, PROGRAMAS],
          ['Closer', closer, setCloser, closers],
          ['Estatus', estatus, setEstatus, estatuses]].map(([label, val, setter, opts]) => (
          <select key={label} value={val} onChange={e => setter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 shadow-sm">
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span className="text-xs text-gray-400 ml-auto font-medium">{filtrados.length} resultados</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Nombre','Programa','Fuente','Closer','Monto total','Cuotas pagas','Monto pagado','Estatus','Ingreso'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(c => {
                const completo = String(c['Completado']||'').toUpperCase() === 'SI';
                return (
                  <tr key={c._rowIndex}
                    onClick={() => setClienteSel(clienteSel?._rowIndex === c._rowIndex ? null : c)}
                    className={`cursor-pointer transition-colors ${
                      clienteSel?._rowIndex === c._rowIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{c['Nombre'] || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">{c['Programa'] || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c['Fuente'] || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{c['CLOSER'] || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">${Number(c['Monto total']||0).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${completo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c['Cuotas pagas'] || '0'}/{c['Cuotas'] || '?'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">${Number(c['Monto pagado']||0).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        String(c['Estatus']).toLowerCase().includes('activ') ? 'bg-blue-100 text-blue-700' :
                        String(c['Estatus']).toLowerCase().includes('baja')  ? 'bg-red-100 text-red-600' :
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

      {/* Ficha cliente */}
      {clienteSel && <FichaCliente cliente={clienteSel} onClose={() => setClienteSel(null)} />}
    </div>
  );
}

function FichaCliente({ cliente: c, onClose }) {
  const cuotas = [
    { n:1, monto: c['Primer pago'],  fecha: c['Fecha de ingreso(1er pago)'], met: c['Met pago 1'],  estado: c['Estado pago 1']  },
    { n:2, monto: c['Segundo pago'], fecha: c['Fecha 2do pago'],             met: c['Met pago 2'],  estado: c['Estado pago 2']  },
    { n:3, monto: c['Tercer pago'],  fecha: c['Fecha 3er pago'],             met: c['Met pago 3'],  estado: c['Estado pago 3']  },
    { n:4, monto: c['Cuarto Pago'],  fecha: c['Fecha 4to pago'],             met: c['Met pago 4'],  estado: c['Estado 4to pago'] },
  ].filter(q => q.monto && String(q.monto).trim());

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{c['Nombre']}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{c['Email']} · {c['Teléfono']}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none font-light">×</button>
        </div>
        <div className="p-6 space-y-5">
          {/* Info comercial */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[['Programa', c['Programa']], ['Fuente', c['Fuente']], ['Ingreso', c['Ingreso']],
              ['Closer', c['CLOSER']], ['Setter', c['SETTER']], ['Estatus', c['Estatus']],
              ['CRM', c['CRM']], ['Contrato', c['Contrato']], ['Completado', c['Completado']]
            ].map(([label, val]) => (
              <div key={label} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{val || '—'}</p>
              </div>
            ))}
          </div>

          {/* Cuotas */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cuotas</p>
            <div className="space-y-2">
              {cuotas.map(q => {
                const pagado = String(q.estado||'').toUpperCase() === 'SI';
                return (
                  <div key={q.n} className={`flex items-center justify-between rounded-lg px-4 py-3 border ${pagado ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${pagado ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{q.n}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">${Number(q.monto).toLocaleString('es-AR')}</p>
                        <p className="text-xs text-gray-400">{q.fecha || '—'} · {q.met || '—'}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${pagado ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {pagado ? '✓ Pagado' : 'Pendiente'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totales */}
          <div className="flex gap-6 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">Monto total</p>
              <p className="text-xl font-bold text-gray-900">${Number(c['Monto total']||0).toLocaleString('es-AR')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Pagado</p>
              <p className="text-xl font-bold text-emerald-600">${Number(c['Monto pagado']||0).toLocaleString('es-AR')}</p>
            </div>
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
