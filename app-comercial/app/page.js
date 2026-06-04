import { getClientes, getClientesHeaders, getEgresosTab, getAbonos, getDeudores, getFacturas } from '../lib/sheets.js';
import {
  calcularResumenMensual, calcularComisiones,
  calcularCobranzas, calcularCobrosSemanales,
  calcularPendientesPorMes, calcularVentasPorMes,
  calcularProyeccion, calcularDeudores,
} from '../lib/calculos.js';
import Dashboard from '../components/Dashboard.jsx';

export const revalidate = 60;

export default async function Home() {
  try {
    const [clientes, headers, egresosRows, abonos, deudoresRecords, facturas] = await Promise.all([
      getClientes(),
      getClientesHeaders(),
      getEgresosTab('Consolidado').catch(() => []),
      getAbonos().catch(() => []),
      getDeudores().catch(() => []),
      getFacturas().catch(() => []),
    ]);

    const resumen          = calcularResumenMensual(clientes, egresosRows);
    const ventasPorMes     = calcularVentasPorMes(clientes);
    const comisiones       = calcularComisiones(clientes);
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
        abonos={abonos}
        deudores={deudores}
        facturas={facturas}
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
