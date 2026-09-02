// Conexión a Google Sheets vía Google Apps Script Web App.
// Variables de entorno:
//   APPS_SCRIPT_CLIENTES_URL  → Web App de la planilla de clientes
//   APPS_SCRIPT_EGRESOS_URL   → Web App de la planilla de egresos

export const MOCK_MODE =
  !process.env.APPS_SCRIPT_CLIENTES_URL && !process.env.APPS_SCRIPT_EGRESOS_URL;

const READ_TIMEOUT  = 50000;
const WRITE_TIMEOUT = 20000;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// GET (lecturas) — idempotente. Reintentamos ante timeout/red Y ante respuestas
// transitorias de Google: el /exec redirige a googleusercontent y en frío o bajo
// carga a veces devuelve un 404 "unable to open the file" o una página HTML aunque
// el Web App esté sano. Reintentar suele resolverlo (el ping del diagnóstico
// mostró las URLs vivas). Por eso el default trae reintentos.
async function fetchScript(url, params = {}, { retries = 3 } = {}) {
  if (!url) throw new Error('No está configurada la URL del Apps Script en el servidor.');
  const qs = new URLSearchParams(params).toString();
  const fullUrl = qs ? `${url}?${qs}` : url;
  let lastErr;
  for (let intento = 0; intento <= retries; intento++) {
    try {
      const res = await fetch(fullUrl, { cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(READ_TIMEOUT) });
      const text = await res.text();
      // 404/5xx o cuerpo HTML (404 de Drive / página de login) → transitorio, se reintenta.
      if (!res.ok)          throw Object.assign(new Error(`Apps Script HTTP ${res.status}`), { reintentable: true });
      if (/^\s*</.test(text)) throw Object.assign(new Error('Apps Script devolvió HTML (404/login) en vez de datos'), { reintentable: true });
      return JSON.parse(text); // un HTML/parcial cae al catch como error de parseo → reintenta
    } catch (err) {
      lastErr = err;
      const transitorio = err?.reintentable || err?.name === 'TimeoutError' || err?.name === 'AbortError' ||
        /timeout|aborted|network|fetch failed|ECONN|unexpected token|json|<|not found|404/i.test(err?.message || '');
      if (intento < retries && transitorio) {
        await sleep(700 * (intento + 1)); // 0.7s, 1.4s, 2.1s
        continue;
      }
      // Agotados los reintentos: mensaje claro según el síntoma.
      if (/HTML|404|login|<|not found/i.test(err?.message || '')) {
        throw new Error('El Apps Script no devolvió datos tras varios intentos (404/HTML). Si persiste, revisá que la implementación activa tenga "Cualquier usuario" y que la URL /exec en Vercel sea la vigente.');
      }
      throw err;
    }
  }
  throw lastErr;
}

// POST (escrituras) — NO reintentamos para no duplicar filas; sólo subimos el timeout.
async function postScript(url, body) {
  if (!url) throw new Error('No está configurada APPS_SCRIPT_CLIENTES_URL en el servidor.');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    redirect: 'follow',
    signal: AbortSignal.timeout(WRITE_TIMEOUT),
  });
  const text = await res.text();
  // Google devuelve una página HTML (404 de Drive o login) cuando el Web App no
  // resuelve para POST: normalmente el doPost no está en la implementación ACTIVA,
  // el acceso no es "Cualquier usuario", o la URL /exec quedó desactualizada.
  if (/^\s*</.test(text)) {
    throw new Error(
      'El Apps Script no aceptó la escritura (devolvió una página de Google, no datos). ' +
      'Revisá en Apps Script → Implementar → Gestionar implementaciones: que la implementación ACTIVA ' +
      'tenga doPost publicado, "Ejecutar como: Yo" y "Quién tiene acceso: Cualquier usuario", y que la URL ' +
      '/exec en Vercel sea la de esa implementación. Al redeployar, usá "Editar → Nueva versión" para no cambiar la URL.'
    );
  }
  if (!res.ok) throw new Error(`Apps Script error ${res.status}: ${text.slice(0, 300)}`);
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`Respuesta inesperada del Apps Script: ${text.slice(0, 200)}`); }
  if (data && data.error) throw new Error(data.error);
  return data;
}

// ── CLIENTES ──────────────────────────────────────────────────────────────────

export async function getClientes() {
  if (MOCK_MODE) {
    const { mockClientes } = await import('./mockData.js');
    return mockClientes;
  }
  const data = await fetchScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'getClientes' });
  return data.clientes ?? [];
}

export async function getClientesHeaders() {
  if (MOCK_MODE) {
    const { mockHeaders } = await import('./mockData.js');
    return mockHeaders;
  }
  const data = await fetchScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'getHeaders' });
  return data.headers ?? [];
}

export async function appendCliente(rowValues) {
  if (MOCK_MODE) throw new Error('Escritura no disponible en modo mock');
  return postScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'append', rowValues });
}

export async function updateClienteRow(rowIndex, rowValues) {
  if (MOCK_MODE) throw new Error('Escritura no disponible en modo mock');
  return postScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'update', rowIndex, rowValues });
}

export async function updateClienteField(rowIndex, headerName, value) {
  if (MOCK_MODE) throw new Error('Escritura no disponible en modo mock');
  return postScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'updateField', rowIndex, headerName, value });
}

// ── ABONOS (pestaña "Abono" en la planilla de clientes) ──────────────────────

export async function getAbonos() {
  if (MOCK_MODE) return [];
  const data = await fetchScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'getAbonos' });
  return data.abonos ?? [];
}

export async function appendAbono(rowValues) {
  if (MOCK_MODE) throw new Error('Escritura no disponible en modo mock');
  return postScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'appendAbono', rowValues });
}

export async function updateAbonoField(rowIndex, headerName, value) {
  if (MOCK_MODE) throw new Error('Escritura no disponible en modo mock');
  return postScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'updateAbonoField', rowIndex, headerName, value });
}

// ── FACTURAS ──────────────────────────────────────────────────────────────────

export async function getFacturas() {
  if (MOCK_MODE) return [];
  const data = await fetchScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'getFacturas' });
  return data.facturas ?? [];
}

export async function appendFactura(rowValues) {
  if (MOCK_MODE) throw new Error('Escritura no disponible en modo mock');
  return postScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'appendFactura', rowValues });
}

export async function updateFacturaRow(rowIndex, rowValues) {
  if (MOCK_MODE) throw new Error('Escritura no disponible en modo mock');
  return postScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'updateFactura', rowIndex, rowValues });
}

// ── DEUDORES ──────────────────────────────────────────────────────────────────

export async function getDeudores() {
  if (MOCK_MODE) return [];
  const data = await fetchScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'getDeudores' });
  return data.deudores ?? [];
}

export async function upsertDeudor(rowIndex, cuotaNum, estado, comentario) {
  if (MOCK_MODE) throw new Error('No disponible en modo mock');
  return postScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'upsertDeudor', rowIndex, cuotaNum, estado, comentario });
}

// ── DOCUMENTOS_EMITIDOS ───────────────────────────────────────────────────────

export async function getUltimoNumero(tipo) {
  if (MOCK_MODE) return null;
  const data = await fetchScript(process.env.APPS_SCRIPT_CLIENTES_URL, {
    action: 'getUltimoNumero',
    tipo,
  });
  return data.ultimoNumero ?? null;
}

export async function appendDocumento(rowValues) {
  if (MOCK_MODE) throw new Error('Escritura no disponible en modo mock');
  return postScript(process.env.APPS_SCRIPT_CLIENTES_URL, {
    action: 'appendDocumento',
    rowValues,
  });
}

export async function getDocumentos() {
  if (MOCK_MODE) return [];
  const data = await fetchScript(process.env.APPS_SCRIPT_CLIENTES_URL, {
    action: 'getDocumentos',
  });
  return data.documentos ?? [];
}

// ── COMISIONES: ajustes (fijos + extras) compartidos ─────────────────────────

export async function getComisionesAjustes() {
  if (MOCK_MODE) return [];
  const data = await fetchScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'getComisionesAjustes' });
  return data.ajustes ?? [];
}

// ── EGRESOS ───────────────────────────────────────────────────────────────────

export async function appendEgreso(rowValues) {
  if (MOCK_MODE || !process.env.APPS_SCRIPT_EGRESOS_URL) throw new Error('APPS_SCRIPT_EGRESOS_URL no configurada');
  return postScript(process.env.APPS_SCRIPT_EGRESOS_URL, { action: 'appendEgreso', rowValues });
}

export async function getEgresosTabs() {
  if (MOCK_MODE || !process.env.APPS_SCRIPT_EGRESOS_URL) return [];
  const data = await fetchScript(process.env.APPS_SCRIPT_EGRESOS_URL, { action: 'getTabs' });
  return data.tabs ?? [];
}

export async function getEgresosTab(tabName) {
  if (MOCK_MODE || !process.env.APPS_SCRIPT_EGRESOS_URL) return [];
  const data = await fetchScript(process.env.APPS_SCRIPT_EGRESOS_URL, { action: 'getTab', tab: tabName });
  if (data.error) throw new Error(`GAS: ${data.error}`);
  return data.rows ?? data.data ?? (Array.isArray(data) ? data : []);
}

export async function getEgresosRegistros(mes) {
  if (MOCK_MODE || !process.env.APPS_SCRIPT_EGRESOS_URL) return [];
  const params = { action: 'getRegistros' };
  if (mes) params.mes = mes;
  const data = await fetchScript(process.env.APPS_SCRIPT_EGRESOS_URL, params);
  if (data.error) throw new Error(`GAS: ${data.error}`);
  return data.rows ?? [];
}

export async function getAnuncios() {
  if (MOCK_MODE) return [];
  const data = await fetchScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'getAnuncios' });
  if (data.error) throw new Error(`GAS: ${data.error}`);
  return data.rows ?? [];
}

// ── TRACKER PAGOS (pestaña "Tracker pagos" en la planilla de clientes) ─────────

export async function getTrackerPagos() {
  if (MOCK_MODE) return [];
  const data = await fetchScript(process.env.APPS_SCRIPT_CLIENTES_URL, { action: 'getTrackerPagos' });
  if (data.error) throw new Error(`GAS: ${data.error}`);
  return data.movimientos ?? [];
}
