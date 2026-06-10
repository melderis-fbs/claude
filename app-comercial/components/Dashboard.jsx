'use client';
import { useState } from 'react';

function SlackReporteBtn() {
  const [state, setState] = useState('idle');
  async function send() {
    setState('loading');
    try {
      const res = await fetch('/api/cron/cobranzas-weekly', { method: 'POST' });
      const data = await res.json();
      setState(data.ok ? 'ok' : 'error');
    } catch {
      setState('error');
    } finally {
      setTimeout(() => setState('idle'), 3000);
    }
  }
  return (
    <button
      onClick={send}
      disabled={state === 'loading'}
      className={`text-xs px-3 py-1 rounded-full font-medium border transition-colors ${
        state === 'ok'    ? 'bg-green-50 border-green-200 text-green-700' :
        state === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
        'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {state === 'loading' ? 'Enviando…' : state === 'ok' ? '✓ Enviado' : state === 'error' ? 'Error' : '📤 Enviar reporte Slack'}
    </button>
  );
}
import ResumenEconomico from './tabs/ResumenEconomico.jsx';
import Ventas          from './tabs/Ventas.jsx';
import Cobranzas       from './tabs/Cobranzas.jsx';
import Abonos          from './tabs/Abonos.jsx';
import Comisiones      from './tabs/Comisiones.jsx';
import Facturas        from './tabs/Facturas.jsx';
import Clientes        from './tabs/Clientes.jsx';
import Documentos      from './tabs/Documentos.jsx';
import Egresos         from './tabs/Egresos.jsx';

const TABS = [
  { id: 'resumen',    label: 'Resumen' },
  { id: 'ventas',     label: 'Ventas' },
  { id: 'cobranzas',  label: 'Cobranzas' },
  { id: 'abonos',     label: 'Abonos' },
  { id: 'comisiones', label: 'Comisiones' },
  { id: 'facturas',   label: 'Facturas' },
  { id: 'clientes',   label: 'Clientes' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'egresos',    label: 'Egresos' },
];

export default function Dashboard({
  clientes, headers, resumen, ventasPorMes, comisiones,
  cobranzas, cobrosSemanales, pendientesPorMes,
  proyeccion, proyeccionAnual = [], abonos, deudores, facturas, cobrosAutomatica,
}) {
  const [tab, setTab] = useState('resumen');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm select-none">F</div>
          <span className="font-semibold text-gray-900">Founders BS — Comercial</span>
        </div>
        <div className="flex items-center gap-2">
          <SlackReporteBtn />
          <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-medium">
            ● {clientes.length} clientes
          </span>
        </div>
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
        {tab === 'resumen'    && <ResumenEconomico resumen={resumen} cobrosSemanales={cobrosSemanales} ventasPorMes={ventasPorMes} cobrosAutomatica={cobrosAutomatica} />}
        {tab === 'ventas'     && <Ventas ventasPorMes={ventasPorMes} clientes={clientes} />}
        {tab === 'cobranzas'  && <Cobranzas cobranzas={cobranzas} pendientesPorMes={pendientesPorMes} proyeccion={proyeccion} proyeccionAnual={proyeccionAnual} deudores={deudores} clientes={clientes} />}
        {tab === 'abonos'     && <Abonos abonos={abonos} />}
        {tab === 'comisiones' && <Comisiones comisiones={comisiones} />}
        {tab === 'facturas'   && <Facturas facturas={facturas} />}
        {tab === 'clientes'   && <Clientes clientes={clientes} headers={headers} />}
        {tab === 'documentos' && <Documentos clientes={clientes} />}
        {tab === 'egresos'    && <Egresos ventasPorMes={ventasPorMes} />}
      </main>
    </div>
  );
}
