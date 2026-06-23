import { getTrackerPagos } from '../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const movimientos = await getTrackerPagos();
    return Response.json({ movimientos });
  } catch (err) {
    console.error('[tracker-pagos] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
