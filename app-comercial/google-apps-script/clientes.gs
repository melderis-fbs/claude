// ─────────────────────────────────────────────────────────────────────────────
// Apps Script para la planilla de CLIENTES
// Pegá este código en: Extensiones > Apps Script (dentro de la planilla de clientes)
// Desplegá como Web App: Ejecutar como "Yo", Acceso "Cualquier usuario"
// ─────────────────────────────────────────────────────────────────────────────

const TAB_CLIENTES = 'Seguimiento clientes';

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'getClientes') return ok(getClientes());
    if (action === 'getHeaders')  return ok(getHeaders());
    return ok({ error: 'Acción no reconocida', action });
  } catch (err) {
    return error(err.message);
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  try {
    if (action === 'append') return ok(appendRow(body.rowValues));
    if (action === 'update') return ok(updateRow(body.rowIndex, body.rowValues));
    return ok({ error: 'Acción no reconocida', action });
  } catch (err) {
    return error(err.message);
  }
}

// ── Lectura ───────────────────────────────────────────────────────────────────

function getHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_CLIENTES);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return { headers: headers.map(h => h.toString().trim()) };
}

function getClientes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_CLIENTES);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return { clientes: [] };

  const allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = allValues[0].map(h => h.toString().trim());

  const clientes = allValues.slice(1)
    .map((row, i) => {
      const obj = { _rowIndex: i + 2 };
      headers.forEach((h, j) => { if (h) obj[h] = row[j] ?? ''; });
      return obj;
    })
    .filter(obj => {
      const { _rowIndex, ...fields } = obj;
      return Object.values(fields).some(v => v !== '' && v !== null && v !== undefined);
    });

  return { clientes };
}

// ── Escritura ─────────────────────────────────────────────────────────────────

function appendRow(rowValues) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_CLIENTES);
  sheet.appendRow(rowValues);
  return { ok: true };
}

function updateRow(rowIndex, rowValues) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_CLIENTES);
  const range = sheet.getRange(rowIndex, 1, 1, rowValues.length);
  range.setValues([rowValues]);
  return { ok: true };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
