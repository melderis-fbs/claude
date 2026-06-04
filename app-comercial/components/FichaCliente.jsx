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

const PROGRAMA_OPTIONS = ['M1','M1+','M1.1','M2','Back','Starter'];
const CLOSER_OPTIONS   = ['Kevin','Vicky','Braian','Fabricio'];

const INFO_FIELDS = [
  { label: 'Programa', key: 'Programa', type: 'select', options: PROGRAMA_OPTIONS },
  { label: 'Fuente',   key: 'Fuente',   type: 'text' },
  { label: 'Ingreso',  key: 'Ingreso',  type: 'text' },
  { label: 'Closer',   key: 'CLOSER',   type: 'select', options: CLOSER_OPTIONS },
  { label: 'Setter',   key: 'SETTER',   type: 'text' },
];

export default function FichaCliente({ cliente: c, onClose, onPagadoUpdated }) {
  const [marcando, setMarcando] = useState(new Set());
  const [error, setError] = useState('');

  const commentField = COMMENT_COLS.find(col => col in c) || 'Notas';
  const [comentario, setComentario] = useState(c[commentField] || '');
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [notaGuardada, setNotaGuardada] = useState(false);

  // ── Terminado toggle ─────────────────────────────────────────────────────────
  const [terminado, setTerminado] = useState(esPagadoLocal(c['Completado']));
  const [togglingTerminado, setTogglingTerminado] = useState(false);

  const toggleTerminado = async () => {
    const newVal = !terminado;
    setTerminado(newVal); // optimistic update
    setTogglingTerminado(true);
    setError('');
    try {
      const res = await fetch('/api/update-pago', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: c._rowIndex, headerName: 'Completado', value: newVal ? 'SI' : 'NO' }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      onPagadoUpdated();
    } catch (err) {
      setTerminado(!newVal); // revert on error
      setError(err.message);
    } finally {
      setTogglingTerminado(false);
    }
  };

  // ── Edit mode ────────────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState(() =>
    Object.fromEntries(INFO_FIELDS.map(f => [f.key, c[f.key] || '']))
  );
  const [saving, setSaving] = useState(false);

  const enterEdit = () => {
    setEditValues(Object.fromEntries(INFO_FIELDS.map(f => [f.key, c[f.key] || ''])));
    setEditMode(true);
  };

  const cancelEdit = () => setEditMode(false);

  const saveEdit = async () => {
    setSaving(true);
    setError('');
    try {
      const changed = INFO_FIELDS.filter(f => editValues[f.key] !== (c[f.key] || ''));
      for (const field of changed) {
        const res = await fetch('/api/update-pago', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rowIndex: c._rowIndex, headerName: field.key, value: editValues[field.key] }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Error');
      }
      onPagadoUpdated();
      setEditMode(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Cuotas ───────────────────────────────────────────────────────────────────
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
        body: JSON.stringify({ rowIndex: c._rowIndex, headerName: cuota.q.estado, value: true }),
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
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{c['Nombre']}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{c['Email'] || '—'} · {c['Teléfono'] || '—'}</p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {/* Terminado toggle */}
            <button
              onClick={toggleTerminado}
              disabled={togglingTerminado}
              title={terminado ? 'Marcar como no terminado' : 'Marcar como terminado'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                terminado
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {terminado ? '✓ Terminado' : '○ Terminado'}
            </button>
            {/* Edit pencil */}
            {!editMode && (
              <button
                onClick={enterEdit}
                title="Editar datos"
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5a2 2 0 01-.878.515l-3 .75a.5.5 0 01-.607-.607l.75-3a2 2 0 01.515-.878l8.5-8.5z"/>
                </svg>
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {INFO_FIELDS.map(({ label, key, type, options }) => (
              <div key={key} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                {editMode ? (
                  type === 'select' ? (
                    <select
                      value={editValues[key]}
                      onChange={e => setEditValues(v => ({ ...v, [key]: e.target.value }))}
                      className="mt-0.5 w-full text-sm font-semibold text-gray-800 bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500">
                      <option value="">—</option>
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editValues[key]}
                      onChange={e => setEditValues(v => ({ ...v, [key]: e.target.value }))}
                      className="mt-0.5 w-full text-sm font-semibold text-gray-800 bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500"
                    />
                  )
                ) : (
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{c[key] || '—'}</p>
                )}
              </div>
            ))}
          </div>

          {/* Edit action buttons */}
          {editMode && (
            <div className="flex justify-end gap-2">
              <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          )}

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
