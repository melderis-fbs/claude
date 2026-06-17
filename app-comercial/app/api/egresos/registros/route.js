import { appendEgreso, getEgresosTab } from '../../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

// ── Convierte el formato pivot de "Consolidado" a filas planas ────────────────
const MAIN_CATS_LIST = [
  'Sueldos', 'Publicidad', 'APPS', 'Gastos Administrativos',
  'Formación', 'Impuestos', 'Extras', 'Retiros Personales',
];

// Mapa normalizado (sin acentos, minúsculas) → nombre canónico
function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
const MAIN_CATS_NORM = new Map(MAIN_CATS_LIST.map(c => [normalize(c), c]));

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

    // Reconoce categoría principal aunque tenga diferente case o acentos
    const canonico = MAIN_CATS_NORM.get(normalize(concepto));
    if (canonico) {
      currentCat = canonico;
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

// Normaliza cualquier representación de mes a YYYY-MM
function toMesKey(val) {
  const s = String(val ?? '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  // Puede venir como YYYY-MM-DD, ISO, o fecha JS serializada
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  } catch {}
  // Número serial de Excel (días desde 1899-12-30)
  const n = Number(s);
  if (!isNaN(n) && n > 40000) {
    const d = new Date((n - 25569) * 86400000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  return s;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || '';

    const [registrosTab, consolidadoRows] = await Promise.all([
      getEgresosTab('Registros').catch(err => {
        console.error('[egresos/registros] error al leer pestaña Registros:', err.message);
        return [];
      }),
      getEgresosTab('Consolidado').catch(() => []),
    ]);

    // Filtrar por mes y marcar fuente
    const registros = registrosTab
      .filter(r => {
        if (!mes) return true;
        const mesFila = toMesKey(r['Mes'] ?? r['mes'] ?? '');
        return mesFila === mes;
      })
      .map(r => ({ ...r, _source: 'registros' }));

    const historico = consolidadoToFlat(consolidadoRows)
      .filter(r => !mes || r['Mes'] === mes);

    // Registros manuales tienen precedencia sobre Consolidado en la misma categoría+subcategoría
    const keysRegistros = new Set(
      registros.map(r => `${r['Mes'] || ''}-${r['Categoría'] || ''}-${r['Subcategoría'] || ''}`)
    );
    const historicoFiltrado = historico.filter(
      r => !keysRegistros.has(`${r['Mes']}-${r['Categoría']}-${r['Subcategoría']}`)
    );

    return Response.json({
      rows: [...registros, ...historicoFiltrado],
      _debug: {
        registrosTabCount: registrosTab.length,
        registrosFiltradosCount: registros.length,
        sampleRaw: registrosTab[0] ?? null,
        mes,
      },
    });
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
