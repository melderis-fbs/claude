import { getEgresosRegistros, appendEgreso, getEgresosTab } from '../../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

// ── Convierte el formato pivot de "Consolidado" a filas planas ────────────────
const MAIN_CATS = new Set([
  'Sueldos', 'Publicidad', 'APPS', 'Gastos Administrativos',
  'Formación', 'Impuestos', 'Extras', 'Retiros Personales',
]);

const MESES_MAP = {
  'enero':'01','febrero':'02','marzo':'03','abril':'04',
  'mayo':'05','junio':'06','julio':'07','agosto':'08',
  'septiembre':'09','octubre':'10','noviembre':'11','diciembre':'12',
};

function consolidadoToFlat(rows) {
  const anio = new Date().getFullYear();
  const flat = [];
  let currentCat = '';

  for (const row of rows) {
    // Primer campo que no sea mes, %, ni _rowIndex = nombre del concepto
    let concepto = '';
    for (const [key, val] of Object.entries(row)) {
      if (key === '_rowIndex' || key.startsWith('%')) continue;
      if (MESES_MAP[key.toLowerCase().trim()]) continue;
      concepto = String(val || '').trim();
      break;
    }
    if (!concepto || /^total/i.test(concepto)) continue;

    if (MAIN_CATS.has(concepto)) {
      currentCat = concepto;
      continue; // fila de total por categoría — la saltamos, usamos las subcategorías
    }

    // Fila de subcategoría → extraer monto por mes
    for (const [key, val] of Object.entries(row)) {
      if (key === '_rowIndex' || key.startsWith('%')) continue;
      const mesNum = MESES_MAP[key.toLowerCase().trim()];
      if (!mesNum) continue;
      const monto = Number(String(val || '').replace(/[$, ]/g, '')) || 0;
      if (!monto) continue;
      flat.push({
        'Mes':          `${anio}-${mesNum}`,
        'Categoría':    currentCat || 'Otros',
        'Subcategoría': concepto,
        'Detalle':      '',
        'Monto':        monto,
        'Medio de pago': '',
        'País':         '',
        '_source':      'consolidado',
      });
    }
  }
  return flat;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || '';

    // Cargar en paralelo: nuevos registros + histórico de Consolidado
    const [registros, consolidadoRows] = await Promise.all([
      getEgresosRegistros(mes),
      getEgresosTab('Consolidado').catch(() => []),
    ]);

    const historico = consolidadoToFlat(consolidadoRows)
      .filter(r => !mes || r['Mes'] === mes);

    // Los registros nuevos tienen precedencia; el histórico llena los meses sin datos nuevos
    const mesesConDatos = new Set(registros.map(r => `${r['Mes']}-${r['Categoría']}-${r['Subcategoría']}`));
    const historicoFiltrado = historico.filter(
      r => !mesesConDatos.has(`${r['Mes']}-${r['Categoría']}-${r['Subcategoría']}`)
    );

    return Response.json({ rows: [...registros, ...historicoFiltrado] });
  } catch (err) {
    console.error('[egresos/registros GET] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { mes, categoria, subcategoria, detalle, monto, medioPago, pais, fechaVto, dondePaga } = await request.json();

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
      fechaVto     ?? '',
      dondePaga    ?? '',
    ]);

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[egresos/registros POST] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
