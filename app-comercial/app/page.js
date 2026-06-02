import { getClientes, getClientesHeaders, getEgresosTab } from '../lib/sheets.js';
import { calcularResumenMensual, calcularComisiones, calcularCobranzas, calcularCobrosSemanales } from '../lib/calculos.js';
import Dashboard from '../components/Dashboard.jsx';

export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    const [clientes, headers, egresosRows] = await Promise.all([
      getClientes(),
      getClientesHeaders(),
      getEgresosTab('Egresos').catch(() => []),
    ]);

    const resumen     = calcularResumenMensual(clientes, egresosRows);
    const comisiones  = calcularComisiones(clientes);
    const cobranzas   = calcularCobranzas(clientes);
    const cobrosSemanales = calcularCobrosSemanales(clientes);

    return (
      <Dashboard
        clientes={clientes}
        headers={headers}
        resumen={resumen}
        comisiones={comisiones}
        cobranzas={cobranzas}
        cobrosSemanales={cobrosSemanales}
      />
    );
  } catch (err) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950">
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 max-w-lg w-full">
          <h2 className="text-red-400 font-semibold text-lg mb-2">Error al conectar</h2>
          <p className="text-red-300 text-sm font-mono break-all">{err.message}</p>
        </div>
      </div>
    );
  }
}
