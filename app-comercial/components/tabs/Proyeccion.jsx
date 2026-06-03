'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const fmt = n => `$${Math.round(n).toLocaleString('es-AR')}`;

function formatFecha(val) {
  if (!val) return '—';
  const s = String(val).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return s;
}

const DIAS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const ESTADOS = [
  { value: '',           label: 'Sin clasificar', color: 'bg-gray-100 text-gray-500'       },
  { value: 'Moroso',     label: 'Moroso',          color: 'bg-amber-100 text-amber-700'     },
  { value: 'En gestión', label: 'En gestión',       color: 'bg-blue-100 text-blue-700'      },
  { value: 'Incobrable', label: 'Incobrable',       color: 'bg-red-100 text-red-700'        },
  { value: 'Saldado',    label: 'Saldado',          color: 'bg-emerald-100 text-emerald-700'},
];

function estadoStyle(val) {
  return ESTADOS.find(e => e.value === val) || ESTADOS[0];
}

// ── Vista semanal ─────────────────────────────────────────────────────────────

function VistaSemanal({ proyeccion }) {
  const [offset, setOffset] = useState(0);
  const [marcando, setMarcando] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const idx = Math.max(0, Math.min(proyeccion.length - 1,
    proyeccion.findIndex(s => s.offset === 0) + offset));
  const semana = proyeccion[idx];

  const marcarPagado = useCallback(async (cobro) => {
    const key = `${cobro.rowIndex}-${cobro.cuota}`;
    setMarcando(prev => new Set([...prev, key]));
    setErrorMsg('');
    try {
      const res = await fetch('/api/update-pago', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: cobro.rowIndex, headerName: cobro.campoEstado, value: 'SI' }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      router.refresh();
    } catch (err) {
      setMarcando(prev => { const s = new Set(prev); s.delete(key); return s; });
      setErrorMsg(err.message);
    }
  }, [router]);

  if (!semana) return <p className="text-gray-400 text-sm">Sin datos de proyección.</p>;

  const diasEntries = Object.entries(semana.dias);
  const tieneAlgo = diasEntries.some(([, cobros]) => cobros.length > 0);

  return (
    <div className="space-y-5 max-w-4xl">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{errorMsg}</div>
      )}
      <div className="flex items-center gap-3">
        <button onClick={() => setOffset(o => o - 1)} disabled={idx === 0}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-xl leading-none">‹</button>
        <div className="flex-1 text-center">
          <p className={`text-sm font-semibold ${semana.esActual ? 'text-blue-600' : 'text-gray-700'}`}>
            {semana.esActual ? '● Esta semana' : semana.label}
          </p>
          {semana.esActual && <p className="text-xs text-gray-400 mt-0.5">{semana.label}</p>}
        </div>
        <button onClick={() => setOffset(o => o + 1)} disabled={idx === proyeccion.length - 1}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-xl leading-none">›</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Esperado</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(semana.totalEsperado)}</p>
          <p className="text-xs text-gray-400 mt-1">{Object.values(semana.dias).flat().length} cobros</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cobrado</p>
          <p className="text-2xl font-bold text-emerald-700">{fmt(semana.totalCobrado)}</p>
          <p className="text-xs text-emerald-600 mt-1">{Object.values(semana.dias).flat().filter(c => c.pagado).length} pagos</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pendiente</p>
          <p className="text-2xl font-bold text-red-600">{fmt(semana.totalPendiente)}</p>
          <p className="text-xs text-red-400 mt-1">{Object.values(semana.dias).flat().filter(c => !c.pagado).length} pendientes</p>
        </div>
      </div>

      {!tieneAlgo ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-12 text-center text-gray-400 text-sm">
          No hay cobros programados para esta semana.
        </div>
      ) : (
        <div className="space-y-3">
          {diasEntries.map(([fechaKey, cobros], dIdx) => {
            const visibles = cobros.filter(c => !marcando.has(`${c.rowIndex}-${c.cuota}`));
            if (!visibles.length) return null;
            const [, mm, dd] = fechaKey.split('-');
            const diaLabel = `${DIAS[dIdx]}  ${dd}/${mm}`;
            const cobradoHoy   = visibles.filter(c => c.pagado).reduce((a,c) => a+c.monto, 0);
            const pendienteHoy = visibles.filter(c => !c.pagado).reduce((a,c) => a+c.monto, 0);
            return (
              <div key={fechaKey} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
                  <span className="text-sm font-semibold text-gray-700">{diaLabel}</span>
                  <div className="flex gap-3 text-xs">
                    {cobradoHoy > 0 && <span className="text-emerald-600 font-medium">{fmt(cobradoHoy)} cobrado</span>}
                    {pendienteHoy > 0 && <span className="text-red-500 font-medium">{fmt(pendienteHoy)} pendiente</span>}
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {visibles.map((co, j) => (
                    <div key={j} className="px-5 py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${co.pagado ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{co.nombre}</p>
                          <p className="text-xs text-gray-400">
                            {co.programa} · {co.esSeña ? 'Seña' : `Cuota ${co.cuota}`} · {co.closer || '—'}
                            {co.metodo ? ` · ${co.metodo}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-sm font-bold ${co.pagado ? 'text-emerald-600' : 'text-gray-800'}`}>{fmt(co.monto)}</span>
                        {co.pagado
                          ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">✓ Cobrado</span>
                          : <button onClick={() => marcarPagado(co)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors">
                              ✓ Cobrado
                            </button>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Vista deudores ────────────────────────────────────────────────────────────

function VistaDeudores({ deudores: initialDeudores }) {
  const router = useRouter();
  const [items, setItems] = useState(initialDeudores);
  const [editando, setEditando] = useState(null);
  const [marcando, setMarcando] = useState(new Set());
  const [reporteModal, setReporteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mostrarSaldados, setMostrarSaldados] = useState(false);

  const visibles = items.filter(d => mostrarSaldados || d.estado !== 'Saldado');
  const totalMora = visibles.filter(d => d.estado !== 'Saldado').reduce((a,d) => a + d.monto, 0);
  const sinClasificar = visibles.filter(d => !d.estado).length;

  const guardarEstado = useCallback(async () => {
    if (!editando) return;
    try {
      const res = await fetch('/api/deudores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: editando.rowIndex, cuotaNum: editando.cuota, estado: editando.estado, comentario: editando.comentario }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      setItems(prev => prev.map(d =>
        d.rowIndex === editando.rowIndex && d.cuota === editando.cuota
          ? { ...d, estado: editando.estado, comentario: editando.comentario }
          : d
      ));
      setEditando(null);
    } catch (err) {
      setErrorMsg(err.message);
    }
  }, [editando]);

  const marcarPagado = useCallback(async (d) => {
    const key = `${d.rowIndex}-${d.cuota}`;
    setMarcando(prev => new Set([...prev, key]));
    setErrorMsg('');
    try {
      const res = await fetch('/api/update-pago', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: d.rowIndex, headerName: d.campoEstado, value: 'SI' }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      setItems(prev => prev.filter(x => !(x.rowIndex === d.rowIndex && x.cuota === d.cuota)));
      router.refresh();
    } catch (err) {
      setMarcando(prev => { const s = new Set(prev); s.delete(key); return s; });
      setErrorMsg(err.message);
    }
  }, [router]);

  const generarReporte = () => {
    const hoy = new Date().toLocaleDateString('es-AR');
    const grupos = { 'Incobrable': [], 'Moroso': [], 'En gestión': [], '': [] };
    for (const d of visibles) {
      if (d.estado === 'Saldado') continue;
      (grupos[d.estado] !== undefined ? grupos[d.estado] : grupos['']).push(d);
    }
    const emojiMap  = { 'Incobrable':'🔴','Moroso':'🟡','En gestión':'🔵','':'⚪' };
    const tituloMap = { 'Incobrable':'INCOBRABLES','Moroso':'MOROSOS','En gestión':'EN GESTIÓN','':'SIN CLASIFICAR' };
    let texto = `📋 *Reporte de Deudores — ${hoy}*\n━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `💰 Total en mora: ${fmt(totalMora)} | ${visibles.filter(d => d.estado !== 'Saldado').length} deudores\n\n`;
    for (const [estado, lista] of Object.entries(grupos)) {
      if (!lista.length) continue;
      texto += `${emojiMap[estado]} *${tituloMap[estado]}* (${lista.length})\n`;
      for (const d of lista) {
        const mora = d.diasMora !== null ? `${d.diasMora} días` : 'sin fecha';
        texto += `• ${d.nombre} — Cuota ${d.cuota} — ${fmt(d.monto)} — ${mora} — ${d.closer || '—'}\n`;
        if (d.comentario) texto += `  _${d.comentario}_\n`;
      }
      texto += '\n';
    }
    return texto.trim();
  };

  if (!initialDeudores.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-16 text-center">
        <p className="text-3xl mb-2">✅</p>
        <p className="text-gray-700 font-semibold">Sin deudores</p>
        <p className="text-gray-400 text-sm mt-1">No hay pagos vencidos pendientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{errorMsg}</div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total en mora</p>
          <p className="text-2xl font-bold text-red-600">{fmt(totalMora)}</p>
          <p className="text-xs text-red-400 mt-1">{visibles.filter(d => d.estado !== 'Saldado').length} deudores</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sin clasificar</p>
          <p className="text-2xl font-bold text-amber-600">{sinClasificar}</p>
          <p className="text-xs text-amber-500 mt-1">necesitan estado</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Incobrables</p>
          <p className="text-2xl font-bold text-gray-800">{items.filter(d => d.estado === 'Incobrable').length}</p>
          <p className="text-xs text-gray-400 mt-1">{fmt(items.filter(d => d.estado === 'Incobrable').reduce((a,d) => a+d.monto, 0))}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setReporteModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          📤 Generar reporte Slack
        </button>
        <button onClick={() => setMostrarSaldados(v => !v)}
          className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors">
          {mostrarSaldados ? 'Ocultar saldados' : 'Mostrar saldados'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Cliente','Programa','Cuota','Monto','Mora','Closer','Estado',''].map((h,i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibles.map((d, i) => {
                const es = estadoStyle(d.estado);
                const enProceso = marcando.has(`${d.rowIndex}-${d.cuota}`);
                return (
                  <tr key={i} className={`hover:bg-gray-50 ${d.estado === 'Saldado' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{d.nombre}</p>
                      {d.comentario && <p className="text-xs text-gray-400 italic truncate max-w-48">{d.comentario}</p>}
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">{d.programa}</span></td>
                    <td className="px-4 py-3 text-gray-500 font-medium">C{d.cuota}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{fmt(d.monto)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${d.diasMora > 30 ? 'text-red-600' : d.diasMora > 14 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {d.diasMora}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{d.closer || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setEditando({ rowIndex: d.rowIndex, cuota: d.cuota, estado: d.estado, comentario: d.comentario })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${es.color} hover:opacity-80 transition-opacity`}>
                        {es.label}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {!enProceso && d.estado !== 'Saldado' && (
                        <button onClick={() => marcarPagado(d)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
                          ✓ Pagado
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal estado */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Actualizar estado</h3>
              <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Estado</label>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS.map(e => (
                    <button key={e.value} onClick={() => setEditando(prev => ({ ...prev, estado: e.value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                        editando.estado === e.value ? `${e.color} border-current` : 'bg-white border-transparent text-gray-500 hover:border-gray-200'
                      }`}>
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Comentario / situación</label>
                <textarea value={editando.comentario}
                  onChange={e => setEditando(prev => ({ ...prev, comentario: e.target.value }))}
                  placeholder="Ej: Prometió pagar el viernes. No responde llamados..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditando(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button onClick={guardarEstado} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal reporte */}
      {reporteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setReporteModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Reporte Slack</h3>
              <button onClick={() => setReporteModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="p-5 space-y-3">
              <textarea readOnly value={generarReporte()} rows={14}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 bg-gray-50 focus:outline-none resize-none" />
              <button onClick={() => navigator.clipboard.writeText(generarReporte())}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                📋 Copiar al portapapeles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Proyeccion({ proyeccion, deudores = [] }) {
  const [vista, setVista] = useState('semana');
  const deudoresActivos = deudores.filter(d => d.estado !== 'Saldado');

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex gap-2 items-center">
        {[['semana','Proyección semanal'],['deudores','Deudores']].map(([v,l]) => (
          <button key={v} onClick={() => setVista(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vista === v ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>{l}</button>
        ))}
        {deudoresActivos.length > 0 && (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
            {deudoresActivos.length}
          </span>
        )}
      </div>

      {vista === 'semana'   && <VistaSemanal proyeccion={proyeccion} />}
      {vista === 'deudores' && <VistaDeudores deudores={deudores} />}
    </div>
  );
}
