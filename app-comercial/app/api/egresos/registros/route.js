import { getEgresosRegistros, appendEgreso } from '../../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || '';
    const rows = await getEgresosRegistros(mes);
    return Response.json({ rows });
  } catch (err) {
    console.error('[egresos/registros GET] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { mes, categoria, subcategoria, detalle, monto, medioPago, pais } = await request.json();

    if (!categoria) return Response.json({ error: 'Categoría requerida' }, { status: 400 });
    if (!monto)     return Response.json({ error: 'Monto requerido' }, { status: 400 });

    await appendEgreso([
      mes          ?? '',
      categoria,
      subcategoria ?? '',
      detalle      ?? '',
      Number(monto),
      medioPago    ?? '',
      pais         ?? 'AR',
    ]);

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[egresos/registros POST] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
