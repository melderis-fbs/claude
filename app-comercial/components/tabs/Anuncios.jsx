'use client';
import { useState, Fragment } from 'react';

const mesCorto = mk => {
  const M = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const p = String(mk).split('-');
  return p.length === 2 ? `${M[(+p[1]) - 1]} ${p[0]}` : mk;
};

// Formatea según el tipo detectado por el parser.
// pct: los valores vienen como fracción (0,9643) → se muestran ×100 (96,43%).
function fmtMetrica(v, tipo) {
  if (v == null || isNaN(v)) return '—';
  const n = Number(v);
  if (tipo === 'money') {
    const a = Math.abs(n);
    return a > 0 && a < 100
      ? `$${n.toFixed(2).replace('.', ',')}`
      : `$${Math.round(n).toLocaleString('es-AR')}`;
  }
  if (tipo === 'pct') return `${(n * 100).toFixed(2).replace('.', ',')}%`;
  if (tipo === 'x')   return n.toFixed(2).replace('.', ',');
  return Number.isInteger(n) ? n.toLocaleString('es-AR') : n.toFixed(2).replace('.', ',');
}

function Kpi({ label, value, sub, dark }) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'}`}>
      <p className={`text-xs font-medium mb-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );
}

export default function Anuncios({ anunciosPorMes = {} }) {
  const meses = Object.keys(anunciosPorMes).sort();
  const [mesSel, setMesSel] = useState(meses[meses.length - 1] || '');

  if (meses.length === 0) {
    return (
      <div className="max-w-3xl">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500 text-sm">No hay datos en la pestaña <strong>Anuncios</strong> de la planilla.</p>
          <p className="text-gray-400 text-xs mt-2">Se espera un pivote: filas = métricas, columnas = meses.</p>
        </div>
      </div>
    );
  }

  // Filas únicas, en el orden REAL del tracker, con su sección (grupo).
  const filasMap = {};
  for (const mk of meses) {
    for (const mt of (anunciosPorMes[mk].metricas || [])) {
      if (!filasMap[mt.label]) filasMap[mt.label] = { label: mt.label, tipo: mt.tipo, grupo: mt.grupo || '', orden: mt.orden };
    }
  }
  const filas = Object.values(filasMap).sort((a, b) => a.orden - b.orden);

  // Valor de una métrica para un mes (ROAS/ROAS Cash usan el valor calculado).
  const valorCelda = (mk, label, key) => {
    const d = anunciosPorMes[mk] || {};
    if (key === 'roas')     return d.roas ?? null;
    if (key === 'roasCash') return d.roasCash ?? null;
    const mt = (d.metricas || []).find(x => x.label === label);
    return mt ? mt.value : null;
  };
  const keyDe = label => (anunciosPorMes[mesSel]?.metricas || []).find(x => x.label === label)?.key
    || Object.values(anunciosPorMes).flatMap(d => d.metricas || []).find(x => x.label === label)?.key || null;

  const d = anunciosPorMes[mesSel] || {};
  const fmtX = v => v != null ? v.toFixed(2).replace('.', ',') : '—';

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

      {/* KPIs del mes seleccionado */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Kpi label="Inversión"  value={d.inversion != null ? fmtMetrica(d.inversion, 'money') : '—'} sub="gasto Meta" dark />
        <Kpi label="Cierres"    value={d.cierres != null ? d.cierres : '—'} sub="ventas cerradas" />
        <Kpi label="Venta"      value={d.ventaAuto != null ? fmtMetrica(d.ventaAuto, 'money') : '—'} sub="facturación auto" />
        <Kpi label="ROAS"       value={fmtX(d.roas)} sub="ventas ÷ inversión" />
        <Kpi label="ROAS Cash"  value={fmtX(d.roasCash)} sub="cobros ÷ inversión" />
      </div>

      {/* Tabla completa: métricas × meses, agrupada por sección (tal cual el tracker) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Tracker de anuncios</h3>
          <p className="text-xs text-gray-400 mt-0.5">Todas las métricas, mes a mes. Tocá un mes para resaltarlo.</p>
        </div>
        <table className="w-full text-sm min-w-max">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-0 bg-gray-50 z-10">Métrica</th>
              {meses.map(mk => (
                <th key={mk} onClick={() => setMesSel(mk)}
                  className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer ${mk === mesSel ? 'text-gray-900 bg-gray-100' : 'text-gray-500'}`}>
                  {mesCorto(mk)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => {
              const prev = filas[i - 1];
              const nuevaSeccion = f.grupo && (!prev || prev.grupo !== f.grupo);
              const key = keyDe(f.label);
              return (
                <Fragment key={f.label}>
                  {nuevaSeccion && (
                    <tr className="bg-gray-100">
                      <td colSpan={meses.length + 1} className="px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-0">
                        {f.grupo}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-2 font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-white">{f.label}</td>
                    {meses.map(mk => {
                      const v = valorCelda(mk, f.label, key);
                      return (
                        <td key={mk} className={`px-4 py-2 text-right whitespace-nowrap ${mk === mesSel ? 'text-gray-900 font-semibold bg-gray-50' : 'text-gray-600'}`}>
                          {v == null ? '—' : fmtMetrica(v, f.tipo)}
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        ROAS y ROAS Cash se calculan (ventas / cobros de clientes “Automática” ÷ inversión Meta); el resto viene tal cual de la pestaña <strong>Anuncios</strong>. Los porcentajes se muestran ×100 respecto del valor guardado.
      </p>
    </div>
  );
}
