import { getClientesHeaders, getEgresosTabs, MOCK_MODE } from '../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (MOCK_MODE) {
    return Response.json({
      ok: true,
      mode: 'mock',
      message: 'Sin credenciales — usando datos de ejemplo',
    });
  }

  try {
    const [headers, egresosTabs] = await Promise.all([
      getClientesHeaders(),
      getEgresosTabs(),
    ]);
    return Response.json({
      ok: true,
      mode: 'live',
      clientes: { columnas: headers.length, primeras: headers.slice(0, 8) },
      egresos: { tabs: egresosTabs },
    });
  } catch (err) {
    return Response.json({ ok: false, mode: 'live', error: err.message }, { status: 500 });
  }
}
