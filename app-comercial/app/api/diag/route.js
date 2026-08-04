import { MOCK_MODE } from '../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

// Diagnóstico: muestra qué URL de Apps Script está usando el deploy y qué
// responde. Usa una acción inexistente (__ping__) para no exponer datos:
//   - si está VIVA → {"error":"Acción no reconocida"}
//   - si está MUERTA → HTML 404 de Google ("<!DOCTYPE html>…")
async function probe(url) {
  if (!url) return { set: false };
  const u = String(url).trim();
  const out = { set: true, len: u.length, tail: u.slice(-16), endsWithExec: u.endsWith('/exec') };
  try {
    const res = await fetch(`${u}?action=__ping__`, { redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(20000) });
    const body = await res.text();
    out.status = res.status;
    out.ok = res.ok;
    out.bodyStart = body.slice(0, 100);
  } catch (e) {
    out.error = String(e?.message || e).slice(0, 160);
  }
  return out;
}

export async function GET() {
  return Response.json({
    mockMode: MOCK_MODE,
    clientes: await probe(process.env.APPS_SCRIPT_CLIENTES_URL),
    egresos:  await probe(process.env.APPS_SCRIPT_EGRESOS_URL),
  });
}
