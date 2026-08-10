'use client';
import { useState } from 'react';
import { LayoutDashboard, TrendingUp, Wallet, AlertTriangle, Coins, PieChart, Receipt, Users, FileText, CreditCard, LineChart } from 'lucide-react';

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
      // Enviamos EXACTAMENTE el texto que se está mostrando/editando en el
      // preview, para que "Enviar a Slack" == "Generar reporte".
      const res  = await fetch('/api/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texto }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al enviar');
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 bg-gray-50 focus:outline-none resize-none focus:border-gray-200"
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
                  enviado ? 'bg-gray-900 text-white' : 'bg-gray-900 hover:bg-gray-900 text-white disabled:opacity-60'
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
import { Deudores }     from './tabs/Cobranzas.jsx';
import Documentos      from './tabs/Documentos.jsx';
import Egresos         from './tabs/Egresos.jsx';
import Cashflow        from './tabs/Cashflow.jsx';

const TABS = [
  { id: 'resumen',    label: 'Resumen',    icon: LayoutDashboard },
  { id: 'ventas',     label: 'Ventas',     icon: TrendingUp },
  { id: 'cobranzas',  label: 'Cobranzas',  icon: Wallet },
  { id: 'deudores',   label: 'Deudores',   icon: AlertTriangle },
  { id: 'abonos',     label: 'Abonos',     icon: Coins },
  { id: 'comisiones', label: 'Comisiones', icon: PieChart },
  { id: 'facturas',   label: 'Facturas',   icon: Receipt },
  { id: 'clientes',   label: 'Clientes',   icon: Users },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'egresos',    label: 'Egresos',    icon: CreditCard },
  { id: 'cashflow',   label: 'Cashflow',   icon: LineChart },
];

export default function Dashboard({
  clientes, headers, resumen, ventasPorMes, comisiones,
  cobranzas, cobrosSemanales, pendientesPorMes,
  proyeccion, proyeccionAnual = [], abonos, deudores, facturas, cobrosAutomatica,
  anunciosPorMes = {}, comisionesAjustes = {},
}) {
  const [tab, setTab] = useState('resumen');
  const tabActual = TABS.find(t => t.id === tab);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar lateral */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold select-none">F</div>
          <div className="leading-tight">
            <p className="font-semibold text-gray-900 text-sm">Founders BS</p>
            <p className="text-xs text-gray-400">Comercial</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <Icon size={18} strokeWidth={2} className="flex-shrink-0" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <span className="font-semibold text-gray-900">{tabActual?.label}</span>
          <div className="flex items-center gap-2">
            <SlackReporteBtn />
            <span className="text-xs text-gray-700 bg-stone-50 border border-gray-200 px-3 py-1 rounded-full font-medium">
              ● {clientes.length} clientes
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {tab === 'resumen'    && <ResumenEconomico resumen={resumen} cobranzas={cobranzas} cobrosSemanales={cobrosSemanales} ventasPorMes={ventasPorMes} cobrosAutomatica={cobrosAutomatica} anunciosPorMes={anunciosPorMes} pendientesPorMes={pendientesPorMes} />}
          {tab === 'ventas'     && <Ventas ventasPorMes={ventasPorMes} clientes={clientes} />}
          {tab === 'cobranzas'  && <Cobranzas cobranzas={cobranzas} pendientesPorMes={pendientesPorMes} proyeccion={proyeccion} proyeccionAnual={proyeccionAnual} deudores={deudores} clientes={clientes} abonos={abonos} />}
          {tab === 'deudores'   && <Deudores deudores={deudores} clientes={clientes} />}
          {tab === 'abonos'     && <Abonos abonos={abonos} />}
          {tab === 'comisiones' && <Comisiones comisiones={comisiones} ajustesIniciales={comisionesAjustes} />}
          {tab === 'facturas'   && <Facturas facturas={facturas} />}
          {tab === 'clientes'   && <Clientes clientes={clientes} headers={headers} />}
          {tab === 'documentos' && <Documentos clientes={clientes} />}
          {tab === 'egresos'    && <Egresos ventasPorMes={ventasPorMes} />}
          {tab === 'cashflow'   && <Cashflow />}
        </main>
      </div>
    </div>
  );
}
