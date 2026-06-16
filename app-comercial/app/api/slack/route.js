export async function POST(req) {
  const { text } = await req.json();
  if (!text) return Response.json({ error: 'Sin contenido' }, { status: 400 });

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ error: 'SLACK_WEBHOOK_URL no configurado en variables de entorno' }, { status: 500 });
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.text();
    return Response.json({ error: `Slack rechazó el mensaje: ${body}` }, { status: 500 });
  }

  return Response.json({ ok: true });
}
