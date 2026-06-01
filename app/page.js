import {
  getNegocioData,
  getAgendasData,
  getLlamadasData,
  getClosersData,
  getAnunciosData,
  getIngresosEgresosData,
  getClientesNuevosData,
  getRecoleccionData,
} from '../lib/sheets.js';
import Dashboard from '../components/Dashboard.jsx';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [negocio, agendas, llamadas, closers, anuncios, ingresosEgresos, clientesNuevos, recoleccion] = await Promise.all([
    getNegocioData(),
    getAgendasData(),
    getLlamadasData(),
    getClosersData(),
    getAnunciosData(),
    getIngresosEgresosData(),
    getClientesNuevosData(),
    getRecoleccionData(),
  ]);

  return (
    <Dashboard
      negocio={negocio}
      agendas={agendas}
      llamadas={llamadas}
      closers={closers}
      anuncios={anuncios}
      ingresosEgresos={ingresosEgresos}
      clientesNuevos={clientesNuevos}
      recoleccion={recoleccion}
    />
  );
}
