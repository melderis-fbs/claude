import {
  getOverviewData,
  getAgendasData,
  getLlamadasData,
  getClosersData,
  getAnunciosData,
  getIngresosEgresosData,
} from '../lib/sheets.js';
import Dashboard from '../components/Dashboard.jsx';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [overview, agendas, llamadas, closers, anuncios, ingresosEgresos] = await Promise.all([
    getOverviewData(),
    getAgendasData(),
    getLlamadasData(),
    getClosersData(),
    getAnunciosData(),
    getIngresosEgresosData(),
  ]);

  return (
    <Dashboard
      overview={overview}
      agendas={agendas}
      llamadas={llamadas}
      closers={closers}
      anuncios={anuncios}
      ingresosEgresos={ingresosEgresos}
    />
  );
}
