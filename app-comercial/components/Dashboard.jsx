'use client';
import { useState } from 'react';
import ResumenEconomico from './tabs/ResumenEconomico.jsx';
import Ventas          from './tabs/Ventas.jsx';
import Cobranzas       from './tabs/Cobranzas.jsx';
import Abonos          from './tabs/Abonos.jsx';
import Comisiones      from './tabs/Comisiones.jsx';
import Facturas        from './tabs/Facturas.jsx';
import Clientes        from './tabs/Clientes.jsx';

const TABS = [
  { id: 'resumen',    label: 'Resumen' },
  { id: 'ventas',     label: 'Ventas' },
  { id: 'cobranzas',  label: 'Cobranzas' },
  { id: 'abonos',     label: 'Abonos' },
  { id: 'comisiones', label: 'Comisiones' },
  { id: 'facturas',   label: 'Facturas' },
  { id: 'clientes',   label: 'Clientes' },
];

export default function Dashboard({
  clientes, headers, resumen, ventasPorMes, comisiones,
  cobranzas, cobrosSemanales, pendientesPorMes,
  proyeccion, abonos, deudores, facturas,
}) {
  const [tab, setTab] = useState('resumen');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm select-none">F</div>
          <span className="font-semibold text-gray-900">Founders BS — Comercial</span>
        </div>
        <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-medium">
          ● {clientes.length} clientes
        </span>
      </header>

      <nav className="bg-white border-b border-gray-200 px-6 flex gap-0 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-auto p-6">
        {tab === 'resumen'    && <ResumenEconomico resumen={resumen} cobrosSemanales={cobrosSemanales} />}
        {tab === 'ventas'     && <Ventas ventasPorMes={ventasPorMes} clientes={clientes} />}
        {tab === 'cobranzas'  && <Cobranzas cobranzas={cobranzas} pendientesPorMes={pendientesPorMes} proyeccion={proyeccion} deudores={deudores} clientes={clientes} />}
        {tab === 'abonos'     && <Abonos abonos={abonos} />}
        {tab === 'comisiones' && <Comisiones comisiones={comisiones} />}
        {tab === 'facturas'   && <Facturas facturas={facturas} />}
        {tab === 'clientes'   && <Clientes clientes={clientes} headers={headers} />}
      </main>
    </div>
  );
}
