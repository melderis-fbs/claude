import { getClientes, getDeudores } from '../../../../lib/sheets.js';
import { calcularDeudores } from '../../../../lib/calculos.js';

export const dynamic = 'force-dynamic';

function fmt(amount) {
  const num = Number(amount) || 0;
  const [int, dec] = num.toFixed(2).split('.');
  return '$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
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

    if (deudores.length === 0) {
      await postSlack(webhookUrl, {
        text: '✅ *Reporte semanal de cobranzas* — No hay deudores pendientes esta semana.',
      });
      return Response.json({ ok: true, total: 0 });
    }

    const totalMonto = deudores.reduce((s, d) => s + d.monto, 0);

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📋 Reporte semanal de cobranzas', emoji: true },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${deudores.length} deudores pendientes* — Total: *${fmt(totalMonto)} USD*`,
        },
      },
      { type: 'divider' },
    ];

    for (const d of deudores) {
      const diasLabel = d.diasMora != null
        ? d.diasMora === 0 ? 'hoy' : `${d.diasMora}d de mora`
        : '';
      const comentarioText = d.comentario ? `\n> _${d.comentario}_` : '';
      const updateText = d.fechaUpdate ? `  •  última act. ${d.fechaUpdate}` : '';
      const estadoText = d.estado ? `  •  ${d.estado}` : '';

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${d.nombre}*  •  ${fmt(d.monto)}  •  cuota ${d.cuota}${diasLabel ? `  •  ${diasLabel}` : ''}${estadoText}${updateText}${comentarioText}`,
        },
      });
    }

    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Generado automáticamente el ${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
        },
      ],
    });

    await postSlack(webhookUrl, { blocks });

    return Response.json({ ok: true, total: deudores.length });
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
