'use client';

import { useState } from 'react';
import { Database, AlertCircle } from 'lucide-react';

const TABS = [
  { id: 'resumen',     label: 'Resumen Económico' },
  { id: 'ventas',      label: 'Ventas' },
  { id: 'cobranzas',   label: 'Cobranzas' },
  { id: 'proyeccion',  label: 'Proyección' },
  { id: 'clientes',    label: 'Clientes' },
  { id: 'comisiones',  label: 'Comisiones' },
];

export default function Dashboard({ clientes, headers, egresosTabs, mockMode }) {
  const [activeTab, setActiveTab] = useState('clientes');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Founders BS — Comercial</h1>
        {mockMode && (
          <div className="flex items-center gap-2 bg-amber-900/40 border border-amber-700/60 text-amber-400 text-xs px-3 py-1.5 rounded-full">
            <AlertCircle size={13} />
            Modo demo — sin credenciales
          </div>
        )}
        {!mockMode && (
          <div className="flex items-center gap-2 bg-emerald-900/40 border border-emerald-700/60 text-emerald-400 text-xs px-3 py-1.5 rounded-full">
            <Database size={13} />
            Conectado a Google Sheets
          </div>
        )}
      </header>

      {/* Tabs */}
      <nav className="bg-slate-800/50 border-b border-slate-700 px-6 flex gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="p-6">
        {activeTab === 'clientes' && (
          <ClientesTab clientes={clientes} headers={headers} />
        )}
        {activeTab !== 'clientes' && (
          <Placeholder tab={TABS.find(t => t.id === activeTab)?.label} />
        )}
      </main>
    </div>
  );
}

function ClientesTab({ clientes, headers }) {
  // Columnas clave para la tabla resumen
  const colsToShow = ['Nombre', 'Programa', 'Closer', 'Fuente', 'Monto Total', 'Cuotas Pagas', 'Cuotas', 'Estatus', 'Mes de Ingreso'];
  const available = colsToShow.filter(c => headers.includes(c));

  if (clientes.length === 0) {
    return <p className="text-slate-500 text-sm">Sin datos de clientes.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Seguimiento clientes</h2>
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
          {clientes.length} registros · {headers.length} columnas detectadas
        </span>
      </div>

      {/* Columnas detectadas */}
      <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
        <p className="text-xs text-slate-400 mb-2 font-medium">Columnas leídas de la planilla:</p>
        <div className="flex flex-wrap gap-1.5">
          {headers.map(h => (
            <span key={h} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              {(available.length > 0 ? available : headers.slice(0, 8)).map(col => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {clientes.map(c => (
              <tr key={c._rowIndex} className="hover:bg-slate-800/40 transition-colors">
                {(available.length > 0 ? available : headers.slice(0, 8)).map(col => (
                  <td key={col} className="px-4 py-3 text-slate-300 whitespace-nowrap">
                    {c[col] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Placeholder({ tab }) {
  return (
    <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-slate-700">
      <div className="text-center">
        <p className="text-slate-500 text-sm">Vista próxima</p>
        <p className="text-slate-400 font-medium mt-1">{tab}</p>
      </div>
    </div>
  );
}
