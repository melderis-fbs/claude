import { appendFactura, updateFacturaRow, MOCK_MODE } from '../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (MOCK_MODE) {
    return Response.json({ ok: false, error: 'Escritura no disponible en modo mock' }, { status: 400 });
  }
  try {
    const { rowValues } = await request.json();
    if (!rowValues?.length) return Response.json({ ok: false, error: 'rowValues requerido' }, { status: 400 });
    await appendFactura(rowValues);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (MOCK_MODE) {
    return Response.json({ ok: false, error: 'Escritura no disponible en modo mock' }, { status: 400 });
  }
  try {
    const { rowIndex, rowValues } = await request.json();
    if (!rowIndex || !rowValues?.length) {
      return Response.json({ ok: false, error: 'rowIndex y rowValues requeridos' }, { status: 400 });
    }
    await updateFacturaRow(rowIndex, rowValues);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
