import { google } from 'googleapis';

export const MOCK_MODE = !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

const CLIENTES_ID = process.env.SPREADSHEET_CLIENTES_ID;
const EGRESOS_ID = process.env.SPREADSHEET_EGRESOS_ID;
const TAB_CLIENTES = 'Seguimiento clientes';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// Convierte filas [[...], [...]] en [{ header: value, ... }, ...]
// Guarda _rowIndex (1-based, incluye fila de header) para poder escribir de vuelta
function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => h?.toString().trim() ?? '');
  return rows
    .slice(1)
    .map((row, i) => {
      const obj = { _rowIndex: i + 2 };
      headers.forEach((h, j) => {
        if (h) obj[h] = row[j] ?? '';
      });
      return obj;
    })
    .filter(obj => {
      const { _rowIndex, ...fields } = obj;
      return Object.values(fields).some(v => v !== '');
    });
}

// ── LECTURA ──────────────────────────────────────────────────────────────────

export async function getClientes() {
  if (MOCK_MODE) {
    const { mockClientes } = await import('./mockData.js');
    return mockClientes;
  }
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: CLIENTES_ID,
    range: `${TAB_CLIENTES}!A:AZ`,
  });
  return rowsToObjects(res.data.values ?? []);
}

// Devuelve los headers reales del tab de clientes (útil para mapear columnas antes de escribir)
export async function getClientesHeaders() {
  if (MOCK_MODE) {
    const { mockHeaders } = await import('./mockData.js');
    return mockHeaders;
  }
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: CLIENTES_ID,
    range: `${TAB_CLIENTES}!A1:AZ1`,
  });
  return res.data.values?.[0]?.map(h => h?.toString().trim() ?? '') ?? [];
}

// Devuelve los nombres de los tabs en la planilla de egresos
export async function getEgresosTabs() {
  if (MOCK_MODE) return ['Egresos', 'Sueldos'];
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  const res = await sheets.spreadsheets.get({ spreadsheetId: EGRESOS_ID });
  return res.data.sheets?.map(s => s.properties?.title ?? '') ?? [];
}

// Lee un tab de la planilla de egresos por nombre
export async function getEgresosTab(tabName) {
  if (MOCK_MODE) {
    const { mockEgresos } = await import('./mockData.js');
    return mockEgresos[tabName] ?? [];
  }
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EGRESOS_ID,
    range: `${tabName}!A:Z`,
  });
  return rowsToObjects(res.data.values ?? []);
}

// ── ESCRITURA ─────────────────────────────────────────────────────────────────

// Agrega una fila nueva al final del tab de clientes
// rowValues: array ordenado según los headers (ver getClientesHeaders)
export async function appendCliente(rowValues) {
  if (MOCK_MODE) throw new Error('Escritura no disponible en modo mock');
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  await sheets.spreadsheets.values.append({
    spreadsheetId: CLIENTES_ID,
    range: `${TAB_CLIENTES}!A:A`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [rowValues] },
  });
}

// Actualiza una fila existente por su _rowIndex
// rowValues: array ordenado según los headers
export async function updateClienteRow(rowIndex, rowValues) {
  if (MOCK_MODE) throw new Error('Escritura no disponible en modo mock');
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  const lastCol = colLetter(rowValues.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId: CLIENTES_ID,
    range: `${TAB_CLIENTES}!A${rowIndex}:${lastCol}${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [rowValues] },
  });
}

// Convierte número de columna a letra (1=A, 26=Z, 27=AA, ...)
function colLetter(n) {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
