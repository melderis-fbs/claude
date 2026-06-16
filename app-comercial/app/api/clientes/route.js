import { getClientes, getClientesHeaders, appendCliente, updateClienteRow, MOCK_MODE } from '../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [clientes, headers] = await Promise.all([getClientes(), getClientesHeaders()]);
    return Response.json({ ok: true, headers, clientes });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// POST /api/clientes — crea un cliente nuevo
// Body: { rowValues: [...] }  (array ordenado según headers)
export async function POST(request) {
  if (MOCK_MODE) {
    return Response.json({ ok: false, error: 'Escritura no disponible en modo mock' }, { status: 400 });
  }
  try {
    const { rowValues } = await request.json();
    if (!rowValues || !Array.isArray(rowValues)) {
      return Response.json({ ok: false, error: 'rowValues requerido' }, { status: 400 });
    }
    await appendCliente(rowValues);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// PATCH /api/clientes — actualiza una fila existente
// Body: { rowIndex: number, rowValues: [...] }
export async function PATCH(request) {
  if (MOCK_MODE) {
    return Response.json({ ok: false, error: 'Escritura no disponible en modo mock' }, { status: 400 });
  }
  try {
    const { rowIndex, rowValues } = await request.json();
    if (!rowIndex || !rowValues) {
      return Response.json({ ok: false, error: 'rowIndex y rowValues requeridos' }, { status: 400 });
    }
    await updateClienteRow(rowIndex, rowValues);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
