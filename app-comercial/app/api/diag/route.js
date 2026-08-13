import { MOCK_MODE, getEgresosTab } from '../../../lib/sheets.js';

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

// Prueba una ACCIÓN real del script y resume la respuesta (sin volcar todo).
async function probeAction(url, action, extra = {}) {
  if (!url) return { set: false };
  const u = String(url).trim();
  const qs = new URLSearchParams({ action, ...extra }).toString();
  try {
    const res = await fetch(`${u}?${qs}`, { redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(30000) });
    const body = await res.text();
    const esHTML = /^\s*</.test(body);
    let filas = null, claves = null;
    if (!esHTML) {
      try {
        const j = JSON.parse(body);
        const arr = j.clientes || j.abonos || j.rows || j.deudores || j.facturas || (Array.isArray(j) ? j : null);
        if (Array.isArray(arr)) { filas = arr.length; claves = arr[0] ? Object.keys(arr[0]).slice(0, 12) : []; }
        if (j.error) claves = [`error: ${j.error}`];
      } catch { /* no era JSON */ }
    }
    return { status: res.status, ok: res.ok, tipo: esHTML ? 'HTML' : 'JSON', filas, claves, bodyStart: body.slice(0, 120) };
  } catch (e) {
    return { error: String(e?.message || e).slice(0, 160) };
  }
}

async function probeComAjustes() {
  try {
    const rows = await getEgresosTab('Comisiones ajustes');
    return {
      filas: rows.length,
      encabezados: rows[0] ? Object.keys(rows[0]).filter(k => k !== '_rowIndex') : [],
      primeras: rows.slice(0, 4),
    };
  } catch (e) {
    return { error: String(e?.message || e).slice(0, 200) };
  }
}

export async function GET() {
  const CU = process.env.APPS_SCRIPT_CLIENTES_URL;
  return Response.json({
    mockMode: MOCK_MODE,
    clientes: await probe(CU),
    egresos:  await probe(process.env.APPS_SCRIPT_EGRESOS_URL),
    comisionesAjustes: await probeComAjustes(),
    // Acciones reales del script de clientes: acá se ve cuál falla y con qué.
    acciones: {
      getClientes: await probeAction(CU, 'getClientes'),
      getAnuncios: await probeAction(CU, 'getAnuncios'),
      getAbonos:   await probeAction(CU, 'getAbonos'),
    },
  });
}
