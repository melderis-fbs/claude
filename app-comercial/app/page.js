import { getClientes, getClientesHeaders, getEgresosTab, getAbonos, getDeudores, getFacturas, getAnuncios } from '../lib/sheets.js';
import {
  calcularResumenMensual, calcularComisiones,
  calcularCobranzas, calcularCobrosSemanales,
  calcularPendientesPorMes, calcularVentasPorMes,
  calcularProyeccion, calcularDeudores,
  calcularCobrosAutomaticaPorMes, calcularVentasAutomaticaPorMes,
  calcularProyeccionAnual,
  parseAnunciosTab,
} from '../lib/calculos.js';
import Dashboard from '../components/Dashboard.jsx';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function Home() {
  try {
    // getEgresosTab usa otra Web App de Apps Script → puede ir en paralelo sin
    // competir por la cola de ejecuciones de la planilla de clientes. Arrancamos
    // ambas lecturas de egresos ACÁ (en paralelo) para no sumar latencia luego.
    const egresosP    = getEgresosTab('Consolidado').catch(() => []);
    const comAjustesP = getEgresosTab('Comisiones ajustes').catch(() => []);

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
    // Ajustes de comisiones y egresos ya venían corriendo en paralelo arriba.
    const comAjustesRows  = await comAjustesP;
    const egresosRows     = await egresosP;

    // Formato plano: una fila por concepto (Mes, Closer, Fijo, Concepto Variable,
    // Monto Variable). Agrupamos por mes + closer (case-insensitive: "Kevin"="kevin").
    const gAdj  = (r, ...ks) => { for (const k of ks) { if (r[k] != null && r[k] !== '') return r[k]; } return ''; };
    const numOf = v => Number(String(v).replace(/[^0-9.\-]/g, '')) || 0;
    const normMes = v => {
      const s = String(v || '').trim();
      if (/^\d{4}-\d{2}$/.test(s)) return s;
      const d = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (d) return `${d[3]}-${d[2].padStart(2, '0')}`;
      return s;
    };
    const comisionesAjustes = {};
    for (const r of comAjustesRows) {
      const mes    = normMes(gAdj(r, 'Mes', 'mes'));
      const closer = String(gAdj(r, 'Closer', 'closer', 'CLOSER')).trim();
      if (!mes || !closer) continue;
      const fijo     = numOf(gAdj(r, 'Fijo', 'fijo'));
      const concepto = String(gAdj(r, 'Concepto Variable', 'Concepto', 'concepto')).trim();
      const monto    = numOf(gAdj(r, 'Monto Variable', 'Monto', 'monto'));
      const key = `${mes}|${closer.toLowerCase()}`;
      if (!comisionesAjustes[key]) comisionesAjustes[key] = { fijo: 0, items: [] };
      if (fijo) comisionesAjustes[key].fijo += fijo;
      if (concepto || monto) comisionesAjustes[key].items.push({ concepto, monto });
    }

    const resumen              = calcularResumenMensual(clientes, egresosRows);
    const ventasPorMes         = calcularVentasPorMes(clientes);
    const cobrosAutomatica     = calcularCobrosAutomaticaPorMes(clientes);
    const ventasAutomatica     = calcularVentasAutomaticaPorMes(clientes);
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
    // ROAS y ROAS Cash se CALCULAN acá (ventas/cobros de clientes automática /
    // inversión Meta), no se leen del sheet. La inversión, costo por lead y por
    // agenda siguen viniendo de la pestaña Anuncios.
    for (const [mes, d] of Object.entries(anunciosPorMes)) {
      const inv = Number(d.inversion);
      if (inv > 0) {
        d.roas     = (ventasAutomatica[mes] || 0) / inv;
        d.roasCash = (cobrosAutomatica[mes] || 0) / inv;
      } else {
        d.roas = null;
        d.roasCash = null;
      }
    }

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
        comisionesAjustes={comisionesAjustes}
      />
    );
  } catch (err) {
    const msg = String(err?.message || '');
    const es404 = /error 404|page not found|unable to open the file|página de login|unexpected token|<!doctype|cualquier usuario/i.test(msg);
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-xl w-full shadow-sm">
          <h2 className="text-red-700 font-semibold text-lg mb-2">Error al conectar con la planilla</h2>
          {es404 ? (
            <div className="space-y-3 text-sm text-gray-700">
              <p>El Apps Script devolvió <span className="font-semibold">404</span>. Casi siempre es una de estas dos:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li><span className="font-medium text-gray-800">Acceso restringido:</span> en Apps Script → Administrar implementaciones → editar, poné <span className="font-medium">“Quién tiene acceso: Cualquier usuario”</span>. Al redeployar suele volver a “Solo yo”.</li>
                <li><span className="font-medium text-gray-800">URL desactualizada:</span> la URL <code>…/exec</code> en las variables de entorno no es la de la implementación activa.</li>
              </ol>
              <p className="text-xs text-gray-400">Tip: para que no cambie la URL, actualizá el script con “editar implementación → Nueva versión”, no con “Nueva implementación”.</p>
            </div>
          ) : (
            <p className="text-red-600 text-sm font-mono break-all">{msg}</p>
          )}
        </div>
      </div>
    );
  }
}
