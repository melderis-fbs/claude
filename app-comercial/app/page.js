import { getClientes, getClientesHeaders, getEgresosTabs, MOCK_MODE } from '../lib/sheets.js';
import Dashboard from '../components/Dashboard.jsx';

export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    const [clientes, headers, egresosTabs] = await Promise.all([
      getClientes(),
      getClientesHeaders(),
      getEgresosTabs(),
    ]);

    return (
      <Dashboard
        clientes={clientes}
        headers={headers}
        egresosTabs={egresosTabs}
        mockMode={MOCK_MODE}
      />
    );
  } catch (err) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 max-w-lg w-full">
          <h2 className="text-red-400 font-semibold text-lg mb-2">Error al conectar con Google Sheets</h2>
          <p className="text-red-300 text-sm font-mono">{err.message}</p>
          <p className="text-slate-400 text-xs mt-4">
            Verificá las variables de entorno en <code className="text-slate-300">.env.local</code>
          </p>
        </div>
      </div>
    );
  }
}
