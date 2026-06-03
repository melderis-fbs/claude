// ─────────────────────────────────────────────────────────────────────────────
// Apps Script para la planilla de CLIENTES
// Pegá este código en: Extensiones > Apps Script (dentro de la planilla de clientes)
// Desplegá como Web App: Ejecutar como "Yo", Acceso "Cualquier usuario"
// ─────────────────────────────────────────────────────────────────────────────

const TAB_CLIENTES = 'Seguimiento clientes';
const TAB_ABONOS   = 'Abono';

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'getClientes') return ok(getClientes());
    if (action === 'getHeaders')  return ok(getHeaders());
    if (action === 'getAbonos')   return ok(getAbonos());
    return ok({ error: 'Acción no reconocida', action });
  } catch (err) {
    return error(err.message);
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  try {
    if (action === 'append')      return ok(appendRow(body.rowValues));
    if (action === 'update')      return ok(updateRow(body.rowIndex, body.rowValues));
    if (action === 'updateField') return ok(updateField(body.rowIndex, body.headerName, body.value));
    if (action === 'appendAbono') return ok(appendAbono(body.rowValues));
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
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_CLIENTES);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return { clientes: [] };

  const allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers   = allValues[0].map(h => h.toString().trim());
  const tz        = Session.getScriptTimeZone();

  const clientes = allValues.slice(1)
    .map((row, i) => {
      const obj = { _rowIndex: i + 2 };
      headers.forEach((h, j) => {
        if (!h) return;
        const val = row[j];
        if (val instanceof Date && val.getTime() > 0) {
          obj[h] = Utilities.formatDate(val, tz, 'dd/MM/yyyy');
        } else {
          obj[h] = val !== null && val !== undefined ? val : '';
        }
      });
      return obj;
    })
    .filter(obj => {
      const { _rowIndex, ...fields } = obj;
      return Object.values(fields).some(v => v !== '' && v !== null && v !== undefined);
    });

  return { clientes };
}

function getAbonos() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_ABONOS);
  if (!sheet) return { abonos: [] };
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return { abonos: [] };

  const allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers   = allValues[0].map(h => h.toString().trim());
  const tz        = Session.getScriptTimeZone();

  const abonos = allValues.slice(1)
    .map((row, i) => {
      const obj = { _rowIndex: i + 2 };
      headers.forEach((h, j) => {
        if (!h) return;
        const val = row[j];
        if (val instanceof Date && val.getTime() > 0) {
          obj[h] = Utilities.formatDate(val, tz, 'dd/MM/yyyy');
        } else {
          obj[h] = val !== null && val !== undefined ? val : '';
        }
      });
      return obj;
    })
    .filter(obj => {
      const { _rowIndex, ...fields } = obj;
      return Object.values(fields).some(v => v !== '' && v !== null && v !== undefined);
    });

  return { abonos };
}

// ── Escritura ─────────────────────────────────────────────────────────────────

function appendRow(rowValues) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_CLIENTES);
  sheet.appendRow(rowValues);
  return { ok: true };
}

function updateRow(rowIndex, rowValues) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_CLIENTES);
  sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  return { ok: true };
}

function updateField(rowIndex, headerName, value) {
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_CLIENTES);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = headers.findIndex(h => h.toString().trim() === headerName);
  if (colIndex === -1) throw new Error('Columna no encontrada: ' + headerName);
  sheet.getRange(rowIndex, colIndex + 1).setValue(value);
  return { ok: true, rowIndex, headerName, value };
}

function appendAbono(rowValues) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_ABONOS);
  if (!sheet) throw new Error('Pestaña Abono no encontrada');
  sheet.appendRow(rowValues);
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
