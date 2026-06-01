import { NextResponse } from 'next/server';
import {
  getNegocioData,
  getAgendasData,
  getLlamadasData,
  getClosersData,
  getAnunciosData,
  getIngresosEgresosData,
  getClientesNuevosData,
  getRecoleccionData,
} from '../../../lib/sheets.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab');

  try {
    let data;
    switch (tab) {
      case 'negocio':
        data = await getNegocioData();
        break;
      case 'agendas':
        data = await getAgendasData();
        break;
      case 'llamadas':
        data = await getLlamadasData();
        break;
      case 'closers':
        data = await getClosersData();
        break;
      case 'anuncios':
        data = await getAnunciosData();
        break;
      case 'ingresos':
        data = await getIngresosEgresosData();
        break;
      case 'clientes':
        data = await getClientesNuevosData();
        break;
      case 'recoleccion':
        data = await getRecoleccionData();
        break;
      default:
        return NextResponse.json({ error: 'Tab no válido. Use: overview, agendas, llamadas, closers, anuncios, ingresos' }, { status: 400 });
    }
    return NextResponse.json({ data, tab, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(`Error fetching tab ${tab}:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
