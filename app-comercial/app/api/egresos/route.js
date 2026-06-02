import { getEgresosTabs, getEgresosTab } from '../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab');

    if (tab) {
      const data = await getEgresosTab(tab);
      return Response.json({ ok: true, tab, data });
    }

    // Sin parámetro: devuelve la lista de tabs disponibles
    const tabs = await getEgresosTabs();
    return Response.json({ ok: true, tabs });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
