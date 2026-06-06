import { getClientes, getDeudores } from '../../../../lib/sheets.js';
import { calcularDeudores, calcularCobrosSemanales } from '../../../../lib/calculos.js';

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

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ error: 'SLACK_WEBHOOK_URL no configurada' }, { status: 500 });
  }

  try {
    const [clientes, deudoresRecords] = await Promise.all([getClientes(), getDeudores()]);
    const deudores = calcularDeudores(clientes, deudoresRecords);
    const cobrosSemanales = calcularCobrosSemanales(clientes).filter(c => !c.pagado);

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📋 Reporte semanal de cobranzas', emoji: true },
      },
    ];

    // ── Deudores ──────────────────────────────────────────────────────────────
    if (deudores.length === 0) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: '✅ No hay deudores pendientes.' },
      });
    } else {
      const totalMonto = deudores.reduce((s, d) => s + d.monto, 0);
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${deudores.length} deudores pendientes* — Total: *${fmt(totalMonto)} USD*`,
        },
      });
      blocks.push({ type: 'divider' });

      for (const d of deudores) {
        const diasLabel = d.diasMora != null
          ? d.diasMora === 0 ? 'hoy' : `${d.diasMora}d de mora`
          : '';
        const estadoText = d.estado ? `  •  ${d.estado}` : '';
        const situacion = parseSituacionActual(d.comentario);
        const situacionText = situacion ? `\n> _${situacion}_` : '';

        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${d.nombre}*  •  ${fmt(d.monto)}  •  cuota ${d.cuota}${diasLabel ? `  •  ${diasLabel}` : ''}${estadoText}${situacionText}`,
          },
        });
      }
    }

    // ── Cobros de la semana ───────────────────────────────────────────────────
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'header',
      text: { type: 'plain_text', text: '📅 Cobros de esta semana', emoji: true },
    });

    if (cobrosSemanales.length === 0) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: '_No hay cobros programados para esta semana._' },
      });
    } else {
      const totalPendiente = cobrosSemanales.reduce((s, c) => s + c.monto, 0);

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Total pendiente esta semana: *${fmt(totalPendiente)}*`,
        },
      });

      for (const c of cobrosSemanales) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⏳ *${c.nombre}*  •  ${fmt(c.monto)}  •  cuota ${c.cuota}  •  ${c.fecha}`,
          },
        });
      }
    }

    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Generado el ${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
        },
      ],
    });

    await postSlack(webhookUrl, { blocks });

    return Response.json({ ok: true, deudores: deudores.length, cobros: cobrosSemanales.length });
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
