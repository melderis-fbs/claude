'use client';
import { useState } from 'react';

const mesCorto = mk => {
  const M = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const p = String(mk).split('-');
  return p.length === 2 ? `${M[(+p[1]) - 1]} ${p[0]}` : mk;
};

// Formatea según el tipo detectado por el parser (money / x / pct / count).
function fmtMetrica(v, tipo) {
  if (v == null || isNaN(v)) return '—';
  const n = Number(v);
  if (tipo === 'money') return `$${Math.round(n).toLocaleString('es-AR')}`;
  if (tipo === 'x')     return `${n.toFixed(2).replace('.', ',')}x`;
  if (tipo === 'pct')   return `${n.toFixed(1).replace('.', ',')}%`;
  return Number.isInteger(n) ? n.toLocaleString('es-AR') : n.toFixed(2).replace('.', ',');
}

export default function Anuncios({ anunciosPorMes = {} }) {
  const meses = Object.keys(anunciosPorMes).sort();
  const [mesSel, setMesSel] = useState(meses[meses.length - 1] || '');

  if (meses.length === 0) {
    return (
      <div className="max-w-3xl">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500 text-sm">No hay datos en la pestaña <strong>Anuncios</strong> de la planilla.</p>
          <p className="text-gray-400 text-xs mt-2">Se espera un pivote: filas = métricas (Inversión, Leads, Agendas, Asistencias, Cierres…), columnas = meses.</p>
        </div>
      </div>
    );
  }

  // Orden de métricas: primer aparición recorriendo los meses en orden.
  const orden = [];
  const tipoDe = {};
  for (const mk of meses) {
    for (const mt of (anunciosPorMes[mk].metricas || [])) {
      if (!(mt.label in tipoDe)) { orden.push(mt.label); tipoDe[mt.label] = mt.tipo; }
    }
  }

  // Valor de una métrica para un mes. ROAS/ROAS Cash usan el valor CALCULADO
  // (ventas/cobros de clientes automática ÷ inversión), no el crudo del sheet.
  const valorCelda = (mk, label) => {
    const d = anunciosPorMes[mk] || {};
    const mt = (d.metricas || []).find(x => x.label === label);
    if (!mt) return null;
    if (mt.key === 'roas')     return d.roas ?? mt.value;
    if (mt.key === 'roasCash') return d.roasCash ?? mt.value;
    return mt.value;
  };

  const d = anunciosPorMes[mesSel] || {};
  const metricasMes = (d.metricas || []);
  const tasaCierre = d.cierres != null && d.asistencias ? (d.cierres / d.asistencias) * 100 : null;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Selector de mes */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Mes:</span>
        {meses.map(mk => (
          <button key={mk} onClick={() => setMesSel(mk)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mk === mesSel ? 'bg-gray-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {mesCorto(mk)}
          </button>
        ))}
      </div>

      {/* Embudo del mes seleccionado */}
      <div className="bg-gray-900 border border-gray-900 rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Embudo — {mesCorto(mesSel)}
          {tasaCierre != null && <span className="text-gray-500 normal-case font-normal"> · cierre {tasaCierre.toFixed(1).replace('.', ',')}% s/ asistencia</span>}
        </p>
        {metricasMes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {metricasMes.map((mt, i) => (
              <div key={i} className="bg-gray-800/60 rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-gray-400 leading-tight mb-1">{mt.label}</p>
                <p className="text-base font-bold text-white">{fmtMetrica(valorCelda(mesSel, mt.label), mt.tipo)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Sin métricas cargadas para este mes.</p>
        )}
      </div>

      {/* Histórico: métricas × meses (tal cual el tracker) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Histórico de anuncios</h3>
          <p className="text-xs text-gray-400 mt-0.5">Todas las métricas del tracker, mes a mes.</p>
        </div>
        <table className="w-full text-sm min-w-max">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-0 bg-gray-50">Métrica</th>
              {meses.map(mk => (
                <th key={mk} onClick={() => setMesSel(mk)}
                  className={`px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer ${mk === mesSel ? 'text-gray-900' : 'text-gray-500'}`}>
                  {mesCorto(mk)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orden.map(label => (
              <tr key={label} className="hover:bg-gray-50">
                <td className="px-5 py-2.5 font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-white">{label}</td>
                {meses.map(mk => {
                  const v = valorCelda(mk, label);
                  return (
                    <td key={mk} className={`px-5 py-2.5 text-right whitespace-nowrap ${mk === mesSel ? 'text-gray-900 font-semibold bg-gray-50' : 'text-gray-600'}`}>
                      {v == null ? '—' : fmtMetrica(v, tipoDe[label])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        ROAS y ROAS Cash se calculan (ventas / cobros de clientes con fuente “Automática” ÷ inversión Meta); el resto viene de la pestaña <strong>Anuncios</strong> de la planilla.
      </p>
    </div>
  );
}
