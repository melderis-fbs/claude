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

export default function Proyeccion({ proyeccion }) {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [marcando, setMarcando] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState('');

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

      {/* Navegación semanal */}
      <div className="flex items-center gap-3">
        <button onClick={() => setOffset(o => o - 1)} disabled={idx === 0}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-xl leading-none">
          ‹
        </button>
        <div className="flex-1 text-center">
          <p className={`text-sm font-semibold ${semana.esActual ? 'text-blue-600' : 'text-gray-700'}`}>
            {semana.esActual ? '● Esta semana' : semana.label}
          </p>
          {semana.esActual && <p className="text-xs text-gray-400 mt-0.5">{semana.label}</p>}
        </div>
        <button onClick={() => setOffset(o => o + 1)} disabled={idx === proyeccion.length - 1}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-xl leading-none">
          ›
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Esperado</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(semana.totalEsperado)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {Object.values(semana.dias).flat().length} cobro{Object.values(semana.dias).flat().length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cobrado</p>
          <p className="text-2xl font-bold text-emerald-700">{fmt(semana.totalCobrado)}</p>
          <p className="text-xs text-emerald-600 mt-1">
            {Object.values(semana.dias).flat().filter(c => c.pagado).length} pagos
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pendiente</p>
          <p className="text-2xl font-bold text-red-600">{fmt(semana.totalPendiente)}</p>
          <p className="text-xs text-red-400 mt-1">
            {Object.values(semana.dias).flat().filter(c => !c.pagado).length} pendientes
          </p>
        </div>
      </div>

      {/* Días */}
      {!tieneAlgo ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-12 text-center text-gray-400 text-sm">
          No hay cobros programados para esta semana.
        </div>
      ) : (
        <div className="space-y-3">
          {diasEntries.map(([fechaKey, cobros], dIdx) => {
            const visibles = cobros.filter(c => !marcando.has(`${c.rowIndex}-${c.cuota}`));
            if (!visibles.length) return null;

            const [yyyy, mm, dd] = fechaKey.split('-');
            const diaLabel = `${DIAS[dIdx]}  ${dd}/${mm}`;
            const cobradoHoy = visibles.filter(c => c.pagado).reduce((a,c) => a+c.monto, 0);
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
