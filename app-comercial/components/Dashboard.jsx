'use client';
import { useState } from 'react';
import ResumenEconomico from './tabs/ResumenEconomico.jsx';
import Clientes from './tabs/Clientes.jsx';
import Comisiones from './tabs/Comisiones.jsx';
import Cobranzas from './tabs/Cobranzas.jsx';

const TABS = [
  { id: 'resumen',    label: 'Resumen Económico' },
  { id: 'clientes',   label: 'Clientes' },
  { id: 'cobranzas',  label: 'Cobranzas' },
  { id: 'comisiones', label: 'Comisiones' },
];

export default function Dashboard({ clientes, headers, resumen, comisiones, cobranzas, cobrosSemanales, pendientesPorMes }) {
  const [tab, setTab] = useState('resumen');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm select-none">F</div>
          <span className="font-semibold text-gray-900">Founders BS — Comercial</span>
        </div>
        <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-medium">
          ● {clientes.length} clientes
        </span>
      </header>

      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 flex gap-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {tab === 'resumen'    && <ResumenEconomico resumen={resumen} cobrosSemanales={cobrosSemanales} />}
        {tab === 'clientes'   && <Clientes clientes={clientes} headers={headers} />}
        {tab === 'cobranzas'  && <Cobranzas cobranzas={cobranzas} pendientesPorMes={pendientesPorMes} />}
        {tab === 'comisiones' && <Comisiones comisiones={comisiones} />}
      </main>
    </div>
  );
}
