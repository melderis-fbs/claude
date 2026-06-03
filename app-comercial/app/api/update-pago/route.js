import { updateClienteField, MOCK_MODE } from '../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

// PATCH /api/update-pago — marca un pago como pagado (o cualquier campo de estado)
// Body: { rowIndex: number, headerName: string, value: string }
export async function PATCH(request) {
  if (MOCK_MODE) {
    return Response.json({ ok: false, error: 'Escritura no disponible en modo mock' }, { status: 400 });
  }
  try {
    const { rowIndex, headerName, value } = await request.json();
    if (!rowIndex || !headerName) {
      return Response.json({ ok: false, error: 'rowIndex y headerName requeridos' }, { status: 400 });
    }
    await updateClienteField(rowIndex, headerName, value ?? 'SI');
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
