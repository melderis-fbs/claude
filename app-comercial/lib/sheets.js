// Conexión a Google Sheets vía Google Apps Script Web App.
// Variables de entorno:
//   APPS_SCRIPT_CLIENTES_URL  → Web App de la planilla de clientes
//   APPS_SCRIPT_EGRESOS_URL   → Web App de la planilla de egresos

export const MOCK_MODE =
  !process.env.APPS_SCRIPT_CLIENTES_URL && !process.env.APPS_SCRIPT_EGRESOS_URL;

async function fetchScript(url, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const fullUrl = qs ? `${url}?${qs}` : url;
  const res = await fetch(fullUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Apps Script error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function postScript(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Apps Script error ${res.status}: ${await res.text()}`);
  return res.json();
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

// ── EGRESOS ───────────────────────────────────────────────────────────────────

export async function getEgresosTabs() {
  if (MOCK_MODE) return ['Egresos', 'Sueldos'];
  const data = await fetchScript(process.env.APPS_SCRIPT_EGRESOS_URL, { action: 'getTabs' });
  return data.tabs ?? [];
}

export async function getEgresosTab(tabName) {
  if (MOCK_MODE) {
    const { mockEgresos } = await import('./mockData.js');
    return mockEgresos[tabName] ?? [];
  }
  const data = await fetchScript(process.env.APPS_SCRIPT_EGRESOS_URL, { action: 'getTab', tab: tabName });
  return data.rows ?? [];
}
