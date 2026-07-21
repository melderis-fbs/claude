import { getClientes, getDeudores } from '../../../../lib/sheets.js';
import { CUOTAS_DEF, parseMonto, calcularCobrosSemanales } from '../../../../lib/calculos.js';

export const dynamic = 'force-dynamic';

// "Ahora" en horario de Argentina (UTC-3). El servidor corre en UTC; sin esto,
// de noche el día ya cambió allá y el reporte tomaba la semana/día siguiente.
const TZ_AR = 'America/Argentina/Buenos_Aires';
function ahoraArg() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ_AR }));
}

function fmt(amount) {
  const num = Number(amount) || 0;
  const [int, dec] = num.toFixed(2).split('.');
  return '$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
}

function parseSituacionActual(comentario) {
  if (!comentario) return '';
  try {
    const obj = JSON.parse(comentario);
    return obj.sa || '';
  } catch {
    return comentario;
  }
}

function isPaid(val) {
  if (val === true) return true;
  const s = String(val || '').toUpperCase().trim();
  return s === 'SI' || s === 'SÍ' || s === 'YES' || s === '1' || s === 'TRUE';
}

function barraProgreso(pct) {
  const filled = Math.round(Math.min(100, Math.max(0, pct)) / 10);
  return '🟩'.repeat(filled) + '⬜'.repeat(10 - filled);
}

function calcularKPIMes(clientes) {
  const hoy = ahoraArg();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  let totalACobrar = 0;
  let totalCobrado = 0;

  for (const c of clientes) {
    for (const q of CUOTAS_DEF) {
      const monto = parseMonto(c[q.monto]);
      if (!monto) continue;
      const fecha = parseFecha(c[q.fecha] || '');
      if (!fecha) continue;
      const mesFecha = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (mesFecha !== mesActual) continue;
      totalACobrar += monto;
      if (isPaid(c[q.estado])) totalCobrado += monto;
    }
  }

  return {
    totalACobrar,
    totalCobrado,
    pendiente: totalACobrar - totalCobrado,
    pct: totalACobrar > 0 ? (totalCobrado / totalACobrar) * 100 : 0,
  };
}

function parseFecha(fechaStr) {
  const s = String(fechaStr || '').trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  return null;
}

function buildDeudoresManuales(deudoresRecords, clientes) {
  const hoy = ahoraArg(); hoy.setHours(0, 0, 0, 0);
  const clienteMap = {};
  for (const c of clientes) clienteMap[String(c._rowIndex)] = c;

  return deudoresRecords
    .filter(r => r.estado !== 'Saldado')
    .map(r => {
      const cliente = clienteMap[String(r.rowIndex)];
      if (!cliente) return null;
      const cuotaIdx = Number(r.cuotaNum) - 1;
      const q = CUOTAS_DEF[cuotaIdx];
      if (!q) return null;
      const monto = parseMonto(cliente[q.monto]);
      if (!monto) return null;
      const fechaStr = cliente[q.fecha] || '';
      const fecha = parseFecha(fechaStr);
      const diasMora = fecha ? Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24)) : null;
      return {
        nombre:     (cliente['Nombre'] || '').trim(),
        monto,
        cuota:      Number(r.cuotaNum),
        fecha:      fechaStr,
        diasMora,
        rowIndex:   r.rowIndex,
        estado:     r.estado || '',
        comentario: r.comentario || '',
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.diasMora === null) return 1;
      if (b.diasMora === null) return -1;
      return b.diasMora - a.diasMora;
    });
}

async function runReporte() {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('SLACK_WEBHOOK_URL no configurada');

  const [clientes, deudoresRecords] = await Promise.all([getClientes(), getDeudores()]);

  const saldadosKeys = new Set(
    deudoresRecords.filter(r => r.estado === 'Saldado').map(r => `${r.rowIndex}-${r.cuotaNum}`)
  );
  const cobrosSemanales = calcularCobrosSemanales(clientes)
    .filter(c => !c.pagado && !saldadosKeys.has(`${c.rowIndex}-${c.cuota}`));
  const cobrosKeys = new Set(cobrosSemanales.map(c => `${c.rowIndex}-${c.cuota}`));
  const deudores = buildDeudoresManuales(deudoresRecords, clientes)
    .filter(d => !cobrosKeys.has(`${d.rowIndex}-${d.cuota}`));

  const recMap = {};
  for (const r of deudoresRecords) recMap[`${r.rowIndex}-${r.cuotaNum}`] = r;

  const clienteMap = {};
  for (const c of clientes) clienteMap[c._rowIndex] = c;

  const kpi = calcularKPIMes(clientes);
  const mesLabel = ahoraArg().toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: TZ_AR });

  // Mismo texto que muestra el preview / "Generar reporte" → un único formato.
  const text = buildPreviewText(kpi, deudores, cobrosSemanales, clienteMap, mesLabel);
  await postSlack(webhookUrl, { text });
  return { deudores: deudores.length, cobros: cobrosSemanales.length };
}

function buildPreviewText(kpi, deudores, cobrosSemanales, clienteMap, mesLabel) {
  let t = `📊 KPI ${mesLabel}\n`;
  t += `${barraProgreso(kpi.pct)}  ${kpi.pct.toFixed(1)}% cobrado\n`;
  t += `A cobrar: ${fmt(kpi.totalACobrar)} | Cobrado: ${fmt(kpi.totalCobrado)} | Pendiente: ${fmt(kpi.pendiente)}\n\n`;
  t += '━━━━━━━━━━━━━━━━━━━━\n\n';

  if (deudores.length === 0) {
    t += '✅ No hay deudores pendientes.\n\n';
  } else {
    const total = deudores.reduce((s, d) => s + d.monto, 0);
    t += `📋 ${deudores.length} deudores pendientes — Total: ${fmt(total)} USD\n`;
    // Agrupados por estado
    const KNOWN = ['Incobrable', 'Moroso', 'En gestión'];
    const CATS = [
      { match: d => d.estado === 'Incobrable',        emoji: '🔴', titulo: 'INCOBRABLES'    },
      { match: d => d.estado === 'Moroso',            emoji: '🟡', titulo: 'MOROSOS'        },
      { match: d => d.estado === 'En gestión',        emoji: '🔵', titulo: 'EN GESTIÓN'     },
      { match: d => !KNOWN.includes(d.estado),        emoji: '⚪', titulo: 'SIN CLASIFICAR' },
    ];
    for (const cat of CATS) {
      const lista = deudores.filter(cat.match).sort((a, b) => (b.diasMora ?? -1) - (a.diasMora ?? -1));
      if (!lista.length) continue;
      const totalCat = lista.reduce((s, d) => s + d.monto, 0);
      t += `\n${cat.emoji} ${cat.titulo} (${lista.length}) — ${fmt(totalCat)}\n`;
      for (const d of lista) {
        const dias      = d.diasMora != null ? (d.diasMora === 0 ? 'hoy' : `${d.diasMora}d de mora`) : 'sin fecha';
        const situacion = parseSituacionActual(d.comentario);
        t += `${d.nombre}  •  ${fmt(d.monto)}  •  cuota ${d.cuota}  •  ${dias}\n`;
        if (situacion) t += `> ${situacion}\n`;
      }
    }
    t += '\n';
  }

  t += '━━━━━━━━━━━━━━━━━━━━\n\n';
  t += '📅 Cobros pendientes esta semana\n\n';

  if (cobrosSemanales.length === 0) {
    t += 'No hay cobros pendientes para esta semana.\n';
  } else {
    const totalPend = cobrosSemanales.reduce((s, c) => s + c.monto, 0);
    t += `Total pendiente: ${fmt(totalPend)}\n\n`;
    for (const c of cobrosSemanales) {
      const nota = String(clienteMap[c.rowIndex]?.['Notas'] || '').trim();
      t += `⏳ ${c.nombre}  •  ${fmt(c.monto)}  •  cuota ${c.cuota}  •  ${c.fecha}\n`;
      if (nota) t += `  > ${nota}\n`;
    }
  }

  t += `\n\n_Generado el ${ahoraArg().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ_AR })}_`;
  return t.trim();
}

// GET — preview (sin Slack) o cron de Vercel (requiere CRON_SECRET)
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Preview: genera el texto pero no envía a Slack
  if (searchParams.get('preview') === '1') {
    try {
      const [clientes, deudoresRecords] = await Promise.all([getClientes(), getDeudores()]);
      const saldadosKeys = new Set(
        deudoresRecords.filter(r => r.estado === 'Saldado').map(r => `${r.rowIndex}-${r.cuotaNum}`)
      );
      const cobrosSemanales = calcularCobrosSemanales(clientes)
        .filter(c => !c.pagado && !saldadosKeys.has(`${c.rowIndex}-${c.cuota}`));
      const cobrosKeys = new Set(cobrosSemanales.map(c => `${c.rowIndex}-${c.cuota}`));
      const deudores = buildDeudoresManuales(deudoresRecords, clientes)
        .filter(d => !cobrosKeys.has(`${d.rowIndex}-${d.cuota}`));
      const clienteMap = {};
      for (const c of clientes) clienteMap[c._rowIndex] = c;
      const kpi      = calcularKPIMes(clientes);
      const mesLabel = ahoraArg().toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: TZ_AR });
      return Response.json({ preview: buildPreviewText(kpi, deudores, cobrosSemanales, clienteMap, mesLabel) });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  // ENVÍO AUTOMÁTICO DESACTIVADO. Este GET es el que dispararía el reporte de
  // forma programada (cron / llamador externo). No manda nada salvo que se opte
  // explícitamente con REPORTE_COBRANZAS_ENABLED=true. El envío MANUAL desde la
  // app usa POST y NO pasa por acá, así que sigue funcionando normalmente.
  if (process.env.REPORTE_COBRANZAS_ENABLED !== 'true') {
    return Response.json({ ok: true, skipped: true, reason: 'Reporte automático desactivado' });
  }

  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  try {
    const result = await runReporte();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cobranzas-weekly] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST — trigger manual desde la app
export async function POST() {
  try {
    const result = await runReporte();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cobranzas-weekly] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

async function postSlack(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Slack webhook error ${res.status}: ${text}`);
  }
}
