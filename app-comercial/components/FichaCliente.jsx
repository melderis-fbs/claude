'use client';
import { useState } from 'react';

export const CUOTA_COLS = [
  { monto: 'Primer pago',  fecha: 'Fecha de ingreso(1er pago)', met: 'Met pago 1',  estado: 'Estado pago 1'  },
  { monto: 'Segundo pago', fecha: 'Fecha 2do pago',             met: 'Met pago 2',  estado: 'Estado pago 2'  },
  { monto: 'Tercer pago',  fecha: 'Fecha 3er pago',             met: 'Met pago 3',  estado: 'Estado pago 3'  },
  { monto: 'Cuarto Pago',  fecha: 'Fecha 4to pago',             met: 'Met pago 4',  estado: 'Estado 4to pago' },
];

export function formatFecha(val) {
  if (!val) return '—';
  const s = String(val).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return s || '—';
}

export function esPagadoLocal(val) {
  if (val === true) return true;
  const s = String(val || '').toUpperCase().trim();
  return s === 'SI' || s === 'SÍ' || s === 'YES' || s === '1' || s === 'TRUE';
}

export function traducirBoolean(val) {
  if (val === true)  return 'Si';
  if (val === false) return 'No';
  const s = String(val || '').trim().toUpperCase();
  if (s === 'SI' || s === 'SÍ' || s === 'TRUE' || s === 'YES' || s === '1') return 'Si';
  if (s === 'NO' || s === 'FALSE' || s === '0') return 'No';
  return val || '—';
}

export function getCuotasInfo(c) {
  const all   = CUOTA_COLS.filter(q => parseFloat(String(c[q.monto]||'').replace(/[$,\s]/g,'')) > 0);
  const pagas = all.filter(q => esPagadoLocal(c[q.estado]));
  if (!all.length) return '—';
  return `${pagas.length}/${all.length}`;
}

const COMMENT_COLS = ['Notas', 'Comentario', 'Comentarios', 'Observaciones'];

export default function FichaCliente({ cliente: c, onClose, onPagadoUpdated }) {
  const [marcando, setMarcando] = useState(new Set());
  const [error, setError] = useState('');

  const commentField = COMMENT_COLS.find(col => col in c) || 'Notas';
  const [comentario, setComentario] = useState(c[commentField] || '');
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [notaGuardada, setNotaGuardada] = useState(false);

  const cuotas = CUOTA_COLS.map((q, i) => ({
    n: i+1, q,
    monto:  c[q.monto],
    fecha:  c[q.fecha],
    met:    c[q.met],
    estado: c[q.estado],
  })).filter(x => x.monto && parseFloat(String(x.monto).replace(/[$,\s]/g,'')) > 0);

  const guardarNota = async () => {
    setGuardandoNota(true);
    setError('');
    try {
      const res = await fetch('/api/update-pago', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: c._rowIndex, headerName: commentField, value: comentario }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      setNotaGuardada(true);
      setTimeout(() => setNotaGuardada(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoNota(false);
    }
  };

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
            <p className="text-sm text-gray-500 mt-0.5">{c['Email'] || '—'} · {c['Teléfono'] || '—'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4">×</button>
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

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notas / Comentarios</p>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Agregar nota sobre este cliente…"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex justify-end mt-1.5">
              <button onClick={guardarNota} disabled={guardandoNota}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                  notaGuardada ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>
                {notaGuardada ? '✓ Guardado' : guardandoNota ? 'Guardando…' : 'Guardar nota'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
