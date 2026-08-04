import { getComisionesAjustes, saveComisionAjuste, MOCK_MODE } from '../../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ajustes = await getComisionesAjustes();
    return Response.json({ ajustes });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (MOCK_MODE) {
    return Response.json({ ok: false, error: 'Escritura no disponible en modo mock' }, { status: 400 });
  }
  try {
    const { mes, closer, fijo, extras } = await request.json();
    if (!mes || !closer) return Response.json({ ok: false, error: 'mes y closer requeridos' }, { status: 400 });
    await saveComisionAjuste(mes, closer, Number(fijo) || 0, extras ?? '');
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
