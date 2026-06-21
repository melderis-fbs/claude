'use client';
import { useState } from 'react';

function SlackReporteBtn() {
  const [cargando, setCargando]   = useState(false);
  const [modal, setModal]         = useState(false);
  const [texto, setTexto]         = useState('');
  const [enviando, setEnviando]   = useState(false);
  const [enviado, setEnviado]     = useState(false);
  const [error, setError]         = useState('');

  async function verReporte() {
    setCargando(true); setError('');
    try {
      const res  = await fetch('/api/cron/cobranzas-weekly?preview=1');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar preview');
      setTexto(data.preview);
      setEnviado(false);
      setModal(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function enviar() {
    setEnviando(true); setError('');
    try {
      const res  = await fetch('/api/cron/cobranzas-weekly', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setEnviado(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        onClick={verReporte}
        disabled={cargando}
        className="text-xs px-3 py-1 rounded-full font-medium border transition-colors bg-white border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
      >
        {cargando ? 'Cargando…' : '📋 Ver reporte Slack'}
      </button>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-semibold text-gray-900">Reporte semanal</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="p-5 flex-1 overflow-auto">
              <textarea
                value={texto}
                onChange={e => { setTexto(e.target.value); setEnviado(false); }}
                rows={18}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 bg-gray-50 focus:outline-none resize-none focus:border-blue-300"
              />
            </div>
            {error && <p className="px-5 pb-2 text-red-600 text-xs">{error}</p>}
            <div className="px-5 pb-5 flex gap-2 justify-end flex-shrink-0">
              <button onClick={() => navigator.clipboard.writeText(texto)}
                className="px-4 py-2 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                Copiar
              </button>
              <button
                onClick={enviar}
                disabled={enviando || enviado}
                className={`px-4 py-2 text-xs rounded-lg font-semibold transition-colors ${
                  enviado ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60'
                }`}
              >
                {enviado ? '✓ Enviado a Slack' : enviando ? 'Enviando…' : '📤 Enviar a Slack'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
import Cashflow        from './tabs/Cashflow.jsx';

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
  { id: 'cashflow',   label: 'Cashflow' },
];

export default function Dashboard({
  clientes, headers, resumen, ventasPorMes, comisiones,
  cobranzas, cobrosSemanales, pendientesPorMes,
  proyeccion, proyeccionAnual = [], abonos, deudores, facturas, cobrosAutomatica,
  anunciosPorMes = {},
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
        {tab === 'resumen'    && <ResumenEconomico resumen={resumen} cobrosSemanales={cobrosSemanales} ventasPorMes={ventasPorMes} cobrosAutomatica={cobrosAutomatica} anunciosPorMes={anunciosPorMes} />}
        {tab === 'ventas'     && <Ventas ventasPorMes={ventasPorMes} clientes={clientes} />}
        {tab === 'cobranzas'  && <Cobranzas cobranzas={cobranzas} pendientesPorMes={pendientesPorMes} proyeccion={proyeccion} proyeccionAnual={proyeccionAnual} deudores={deudores} clientes={clientes} />}
        {tab === 'abonos'     && <Abonos abonos={abonos} />}
        {tab === 'comisiones' && <Comisiones comisiones={comisiones} />}
        {tab === 'facturas'   && <Facturas facturas={facturas} />}
        {tab === 'clientes'   && <Clientes clientes={clientes} headers={headers} />}
        {tab === 'documentos' && <Documentos clientes={clientes} />}
        {tab === 'egresos'    && <Egresos ventasPorMes={ventasPorMes} />}
        {tab === 'cashflow'   && <Cashflow />}
      </main>
    </div>
  );
}
