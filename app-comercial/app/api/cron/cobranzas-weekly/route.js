import { getClientes, getDeudores } from '../../../../lib/sheets.js';
import { CUOTAS_DEF, parseMonto, calcularCobrosSemanales } from '../../../../lib/calculos.js';

export const dynamic = 'force-dynamic';

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
  const hoy = new Date();
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
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
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
  const mesLabel = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: '📋 Reporte semanal de cobranzas', emoji: true } },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📊 *KPI ${mesLabel}*\n${barraProgreso(kpi.pct)}  *${kpi.pct.toFixed(1)}% cobrado*\nA cobrar: *${fmt(kpi.totalACobrar)}* | Cobrado: *${fmt(kpi.totalCobrado)}* | Pendiente: *${fmt(kpi.pendiente)}*`,
      },
    },
    { type: 'divider' },
  ];

  if (deudores.length === 0) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: '✅ No hay deudores pendientes.' } });
  } else {
    const totalMonto = deudores.reduce((s, d) => s + d.monto, 0);
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*${deudores.length} deudores pendientes* — Total: *${fmt(totalMonto)} USD*` } });
    blocks.push({ type: 'divider' });
    for (const d of deudores) {
      const diasLabel = d.diasMora != null ? (d.diasMora === 0 ? 'hoy' : `${d.diasMora}d de mora`) : '';
      const estadoText = d.estado ? `  •  ${d.estado}` : '';
      const situacion = parseSituacionActual(d.comentario);
      const situacionText = situacion ? `\n> _${situacion}_` : '';
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*${d.nombre}*  •  ${fmt(d.monto)}  •  cuota ${d.cuota}${diasLabel ? `  •  ${diasLabel}` : ''}${estadoText}${situacionText}` } });
    }
  }

  blocks.push({ type: 'divider' });
  blocks.push({ type: 'header', text: { type: 'plain_text', text: '📅 Cobros pendientes esta semana', emoji: true } });

  if (cobrosSemanales.length === 0) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: '_No hay cobros pendientes para esta semana._' } });
  } else {
    const totalPendiente = cobrosSemanales.reduce((s, c) => s + c.monto, 0);
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `Total pendiente: *${fmt(totalPendiente)}*` } });
    for (const c of cobrosSemanales) {
      const nota = String(clienteMap[c.rowIndex]?.['Notas'] || '').trim();
      const situacionText = nota ? `\n> _${nota}_` : '';
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `⏳ *${c.nombre}*  •  ${fmt(c.monto)}  •  cuota ${c.cuota}  •  ${c.fecha}${situacionText}` } });
    }
  }

  blocks.push({ type: 'divider' });
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: `Generado el ${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` }] });

  await postSlack(webhookUrl, { blocks });
  return { deudores: deudores.length, cobros: cobrosSemanales.length };
}

// GET — llamado por el cron de Vercel (requiere CRON_SECRET)
export async function GET(request) {
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
