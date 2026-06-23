// Conexión a Google Sheets vía Google Apps Script Web App.
// Variables de entorno:
//   APPS_SCRIPT_CLIENTES_URL  → Web App de la planilla de clientes
//   APPS_SCRIPT_EGRESOS_URL   → Web App de la planilla de egresos

export const MOCK_MODE =
  !process.env.APPS_SCRIPT_CLIENTES_URL && !process.env.APPS_SCRIPT_EGRESOS_URL;

async function fetchScript(url, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const fullUrl = qs ? `${url}?${qs}` : url;
  const res = await fetch(fullUrl, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Apps Script error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function postScript(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Apps Script error ${res.status}: ${await res.text()}`);
  const data = await res.json();
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
