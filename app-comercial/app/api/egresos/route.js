import { getEgresosTabs, getEgresosTab } from '../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab');

    if (tab) {
      // ?raw=1 → devuelve la respuesta cruda del GAS antes de cualquier procesamiento
      if (searchParams.get('raw') === '1' && process.env.APPS_SCRIPT_EGRESOS_URL) {
        const url = `${process.env.APPS_SCRIPT_EGRESOS_URL}?action=getTab&tab=${encodeURIComponent(tab)}`;
        const res = await fetch(url, { cache: 'no-store' });
        const text = await res.text();
        return Response.json({ rawGas: text.slice(0, 3000) });
      }
      const data = await getEgresosTab(tab);
      return Response.json({ ok: true, tab, data });
    }

    // Sin parámetro: devuelve la lista de tabs disponibles
    const tabs = await getEgresosTabs();
    return Response.json({ ok: true, tabs, urlConfigured: !!process.env.APPS_SCRIPT_EGRESOS_URL });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
