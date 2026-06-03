'use client';
import { useState } from 'react';

const fmt = n => n == null ? '—' : `$${Math.round(n).toLocaleString('es-AR')}`;

export default function Ventas({ ventasPorMes }) {
  const [mesSel, setMesSel] = useState(ventasPorMes[ventasPorMes.length - 1]?.mes ?? '');
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'nuevas' | 'back'

  const mes = ventasPorMes.find(m => m.mes === mesSel);

  if (!ventasPorMes.length) {
    return <p className="text-gray-400 text-sm">Sin datos de ventas.</p>;
  }

  const ventasFiltradas = mes
    ? (filtro === 'nuevas' ? mes.ventas.filter(v => !v.esBack)
     : filtro === 'back'   ? mes.ventas.filter(v => v.esBack)
     : mes.ventas)
    : [];

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Selector de mes */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Mes:</span>
        {ventasPorMes.map(m => (
          <button key={m.mes} onClick={() => setMesSel(m.mes)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              m.mes === mesSel ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {m.label}
          </button>
        ))}
      </div>

      {mes && (
        <>
          {/* Cards resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ventas nuevas</p>
              <p className="text-3xl font-bold text-gray-900">{mes.totalNuevas}</p>
              <p className="text-sm text-gray-500 mt-1">{fmt(mes.montoFront)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ventas back</p>
              <p className="text-3xl font-bold text-blue-700">{mes.totalBack}</p>
              <p className="text-sm text-blue-600 mt-1">{fmt(mes.montoBack)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total ventas</p>
              <p className="text-3xl font-bold text-emerald-700">{mes.totalNuevas + mes.totalBack}</p>
              <p className="text-sm text-emerald-600 mt-1">{fmt(mes.montoTotal)}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ticket promedio</p>
              <p className="text-2xl font-bold text-purple-700">
                {mes.totalNuevas > 0 ? fmt(mes.montoFront / mes.totalNuevas) : '—'}
              </p>
              <p className="text-xs text-purple-600 mt-1">Solo front</p>
            </div>
          </div>

          {/* Por fuente y por closer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Por fuente — ventas nuevas</h3>
              {Object.keys(mes.porFuente).length === 0 ? (
                <p className="text-gray-400 text-sm">Sin datos</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {['Fuente','Cant.','Monto'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(mes.porFuente).sort(([,a],[,b]) => b.count - a.count).map(([fuente, d]) => (
                      <tr key={fuente}>
                        <td className="py-2 text-gray-700">{fuente}</td>
                        <td className="py-2 text-center">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold text-gray-600">{d.count}</span>
                        </td>
                        <td className="py-2 text-right font-medium text-gray-800">{fmt(d.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Por closer — ventas nuevas</h3>
              {Object.keys(mes.porCloser).length === 0 ? (
                <p className="text-gray-400 text-sm">Sin datos</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {['Closer','Cant.','Monto','Participación'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(mes.porCloser).sort(([,a],[,b]) => b.count - a.count).map(([closer, d]) => {
                      const pct = mes.totalNuevas > 0 ? (d.count / mes.totalNuevas) * 100 : 0;
                      return (
                        <tr key={closer}>
                          <td className="py-2 font-medium text-gray-800">{closer}</td>
                          <td className="py-2 text-center">
                            <span className="px-2 py-0.5 bg-blue-100 rounded text-xs font-semibold text-blue-700">{d.count}</span>
                          </td>
                          <td className="py-2 text-right text-gray-700">{fmt(d.monto)}</td>
                          <td className="py-2 pl-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-20">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Tabla completa de ventas */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Clientes — {mes.label}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{mes.ventas.length} clientes ingresados</p>
              </div>
              <div className="flex gap-1">
                {[['todos','Todos'],['nuevas','Front'],['back','Back']].map(([v,l]) => (
                  <button key={v} onClick={() => setFiltro(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filtro === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Nombre','Programa','Tipo','Fuente','Closer','Monto','Cuotas','Estatus'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ventasFiltradas.map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{v.nombre || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">{v.programa || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${v.esBack ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {v.esBack ? 'Back' : 'Front'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{v.fuente || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{v.closer || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{fmt(v.monto)}</td>
                      <td className="px-4 py-3 text-gray-500 text-center">{v.cuotas}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          String(v.estatus).toLowerCase().includes('activ') ? 'bg-blue-100 text-blue-700' :
                          String(v.estatus).toLowerCase().includes('baja')  ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>{v.estatus || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Histórico mensual</h3>
            </div>
            <table className="w-full text-sm min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  {['Mes','Nuevas','Monto front','Back','Monto back','Total','Ticket prom.'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...ventasPorMes].reverse().map(m => (
                  <tr key={m.mes} onClick={() => setMesSel(m.mes)}
                    className={`cursor-pointer transition-colors ${m.mes === mesSel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3 font-semibold text-gray-800">{m.label}</td>
                    <td className="px-5 py-3 text-gray-700">{m.totalNuevas}</td>
                    <td className="px-5 py-3 text-gray-700">{fmt(m.montoFront)}</td>
                    <td className="px-5 py-3 text-blue-600">{m.totalBack}</td>
                    <td className="px-5 py-3 text-blue-600">{fmt(m.montoBack)}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{m.totalNuevas + m.totalBack}</td>
                    <td className="px-5 py-3 text-gray-600">{m.totalNuevas > 0 ? fmt(m.montoFront / m.totalNuevas) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
