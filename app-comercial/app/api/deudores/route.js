import { upsertDeudor } from '../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { rowIndex, cuotaNum, estado, comentario, nombre = '' } = await request.json();
    const result = await upsertDeudor(rowIndex, cuotaNum, estado, comentario, nombre);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
