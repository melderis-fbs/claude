import { appendEgreso } from '../../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { fecha, categoria, subcategoria, descripcion, monto, medioPago, pais } = await request.json();

    if (!categoria) return Response.json({ error: 'Categoría requerida' }, { status: 400 });
    if (!monto)     return Response.json({ error: 'Monto requerido' }, { status: 400 });
    if (!medioPago) return Response.json({ error: 'Medio de pago requerido' }, { status: 400 });

    await appendEgreso([
      fecha        ?? new Date().toLocaleDateString('es-AR'),
      categoria,
      subcategoria ?? '',
      descripcion  ?? '',
      Number(monto),
      medioPago,
      pais         ?? 'AR',
    ]);

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[egresos/append] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
