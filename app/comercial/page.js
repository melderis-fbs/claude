import {
  getNegocioData,
  getClientesNuevosData,
  getRecoleccionData,
  getClosersData,
  getAnunciosData,
} from '../../lib/sheets.js';
import DashboardComercial from '../../components/DashboardComercial.jsx';

export const dynamic = 'force-dynamic';

export default async function ComercialPage() {
  const [negocio, clientesNuevos, recoleccion, closers, anuncios] = await Promise.all([
    getNegocioData(),
    getClientesNuevosData(),
    getRecoleccionData(),
    getClosersData(),
    getAnunciosData(),
  ]);

  return (
    <DashboardComercial
      negocio={negocio}
      clientesNuevos={clientesNuevos}
      recoleccion={recoleccion}
      closers={closers}
      anuncios={anuncios}
    />
  );
}
