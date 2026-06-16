import { appendAbono, updateAbonoField, MOCK_MODE } from '../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (MOCK_MODE) {
    return Response.json({ ok: false, error: 'Escritura no disponible en modo mock' }, { status: 400 });
  }
  try {
    const { rowValues } = await request.json();
    if (!rowValues || !Array.isArray(rowValues)) {
      return Response.json({ ok: false, error: 'rowValues requerido' }, { status: 400 });
    }
    await appendAbono(rowValues);
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
    const { rowIndex, headerName, value } = await request.json();
    if (!rowIndex || !headerName) {
      return Response.json({ ok: false, error: 'rowIndex y headerName requeridos' }, { status: 400 });
    }
    await updateAbonoField(rowIndex, headerName, value);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
