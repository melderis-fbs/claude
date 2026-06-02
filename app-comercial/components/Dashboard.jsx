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

export default function Dashboard({ clientes, headers, resumen, comisiones, cobranzas, cobrosSemanales }) {
  const [tab, setTab] = useState('resumen');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">F</div>
          <span className="font-semibold text-white">Founders BS — Comercial</span>
        </div>
        <span className="text-xs text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full">
          ● {clientes.length} clientes cargados
        </span>
      </header>

      <nav className="bg-slate-900/60 border-b border-slate-800 px-6 flex gap-0 shrink-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-auto p-6">
        {tab === 'resumen'    && <ResumenEconomico resumen={resumen} cobrosSemanales={cobrosSemanales} />}
        {tab === 'clientes'   && <Clientes clientes={clientes} headers={headers} />}
        {tab === 'cobranzas'  && <Cobranzas cobranzas={cobranzas} clientes={clientes} />}
        {tab === 'comisiones' && <Comisiones comisiones={comisiones} />}
      </main>
    </div>
  );
}
