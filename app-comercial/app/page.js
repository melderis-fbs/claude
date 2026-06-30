import { getClientes, getClientesHeaders, getEgresosTab, getAbonos, getDeudores, getFacturas, getAnuncios } from '../lib/sheets.js';
import {
  calcularResumenMensual, calcularComisiones,
  calcularCobranzas, calcularCobrosSemanales,
  calcularPendientesPorMes, calcularVentasPorMes,
  calcularProyeccion, calcularDeudores,
  calcularCobrosAutomaticaPorMes, calcularProyeccionAnual,
  parseAnunciosTab,
} from '../lib/calculos.js';
import Dashboard from '../components/Dashboard.jsx';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function Home() {
  try {
    // getEgresosTab usa otra Web App de Apps Script → puede ir en paralelo sin
    // competir por la cola de ejecuciones de la planilla de clientes.
    const egresosP = getEgresosTab('Consolidado').catch(() => []);

    // El resto comparten la MISMA Web App de Apps Script, que serializa las
    // ejecuciones concurrentes: pedir las 6 a la vez satura la cola y provoca
    // timeouts. Las pedimos en secuencia para no saturarla. Primero las dos
    // críticas (sin las cuales no hay app); el resto degrada con .catch.
    const clientes        = await getClientes();
    const headers         = await getClientesHeaders();
    const abonos          = await getAbonos().catch(() => []);
    const deudoresRecords = await getDeudores().catch(() => []);
    const facturas        = await getFacturas().catch(() => []);
    const anunciosRows    = await getAnuncios().catch(() => []);
    const egresosRows     = await egresosP;

    const resumen              = calcularResumenMensual(clientes, egresosRows);
    const ventasPorMes         = calcularVentasPorMes(clientes);
    const cobrosAutomatica     = calcularCobrosAutomaticaPorMes(clientes);
    const comisiones           = calcularComisiones(clientes);
    const cobranzas        = calcularCobranzas(clientes);
    const cobrosSemanales  = calcularCobrosSemanales(clientes);
    const pendientesPorMes = calcularPendientesPorMes(clientes);
    const proyeccion       = calcularProyeccion(clientes);
    const deudores         = calcularDeudores(clientes, deudoresRecords);

    const anoActual = new Date().getFullYear().toString();
    const cobranzasFiltradas        = cobranzas.filter(m => m.mes.startsWith(anoActual));
    const pendientesPorMesFiltrados = Object.fromEntries(
      Object.entries(pendientesPorMes).filter(([k]) => k.startsWith(anoActual))
    );
    const resumenFiltrado    = resumen.filter(m => m.mes.startsWith(anoActual));
    const ventasPorMesFiltradas = ventasPorMes.filter(m => m.mes.startsWith(anoActual));
    const comisionesFiltradas   = comisiones.filter(m => m.mes.startsWith(anoActual));
    const proyeccionAnual = calcularProyeccionAnual(clientes, resumenFiltrado, ventasPorMesFiltradas);
    const anunciosPorMes  = parseAnunciosTab(anunciosRows);

    return (
      <Dashboard
        clientes={clientes}
        headers={headers}
        resumen={resumenFiltrado}
        ventasPorMes={ventasPorMesFiltradas}
        comisiones={comisionesFiltradas}
        cobranzas={cobranzasFiltradas}
        cobrosSemanales={cobrosSemanales}
        pendientesPorMes={pendientesPorMesFiltrados}
        proyeccion={proyeccion}
        proyeccionAnual={proyeccionAnual}
        abonos={abonos}
        deudores={deudores}
        facturas={facturas}
        cobrosAutomatica={cobrosAutomatica}
        anunciosPorMes={anunciosPorMes}
      />
    );
  } catch (err) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-lg w-full">
          <h2 className="text-red-700 font-semibold text-lg mb-2">Error al conectar</h2>
          <p className="text-red-600 text-sm font-mono break-all">{err.message}</p>
        </div>
      </div>
    );
  }
}
