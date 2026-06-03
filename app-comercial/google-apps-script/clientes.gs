// ─────────────────────────────────────────────────────────────────────────────
// Apps Script para la planilla de CLIENTES
// Pegá este código en: Extensiones > Apps Script (dentro de la planilla de clientes)
// Desplegá como Web App: Ejecutar como "Yo", Acceso "Cualquier usuario"
// ─────────────────────────────────────────────────────────────────────────────

const TAB_CLIENTES = 'Seguimiento clientes';
const TAB_ABONOS   = 'Abonos';
const TAB_DEUDORES = 'Deudores';
const TAB_FACTURAS = 'Facturas';

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'getClientes')  return ok(getClientes());
    if (action === 'getHeaders')   return ok(getHeaders());
    if (action === 'getAbonos')    return ok(getAbonos());
    if (action === 'getDeudores')  return ok(getDeudores());
    if (action === 'getFacturas')  return ok(getFacturas());
    return ok({ error: 'Acción no reconocida', action });
  } catch (err) {
    return error(err.message);
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  try {
    if (action === 'append')       return ok(appendRow(body.rowValues));
    if (action === 'update')       return ok(updateRow(body.rowIndex, body.rowValues));
    if (action === 'updateField')  return ok(updateField(body.rowIndex, body.headerName, body.value));
    if (action === 'appendAbono')  return ok(appendAbono(body.rowValues));
    if (action === 'upsertDeudor') return ok(upsertDeudor(body.rowIndex, body.cuotaNum, body.estado, body.comentario));
    if (action === 'appendFactura') return ok(appendFactura(body.rowValues));
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

function getDeudores() {
  const sheet = getOrCreateDeudoresSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { deudores: [] };

  const allValues = sheet.getRange(1, 1, lastRow, 5).getValues();
  const headers = allValues[0];
  const deudores = allValues.slice(1)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
      return obj;
    })
    .filter(d => d.rowIndex || d['rowIndex']);

  return { deudores };
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
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_ABONOS);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(TAB_ABONOS);
    sheet.appendRow(['Nombre','Monto','Forma de pago','CLOSER','Seguimiento','Fecha']);
  }
  sheet.appendRow(rowValues);
  return { ok: true };
}

function upsertDeudor(rowIndex, cuotaNum, estado, comentario) {
  const sheet = getOrCreateDeudoresSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const riCol  = headers.indexOf('rowIndex');
  const cnCol  = headers.indexOf('cuotaNum');
  const esCol  = headers.indexOf('estado');
  const coCol  = headers.indexOf('comentario');
  const fuCol  = headers.indexOf('fechaUpdate');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][riCol]) === String(rowIndex) && String(data[i][cnCol]) === String(cuotaNum)) {
      sheet.getRange(i + 1, esCol + 1).setValue(estado);
      sheet.getRange(i + 1, coCol + 1).setValue(comentario);
      sheet.getRange(i + 1, fuCol + 1).setValue(new Date().toISOString());
      return { ok: true };
    }
  }

  sheet.appendRow([rowIndex, cuotaNum, estado, comentario, new Date().toISOString()]);
  return { ok: true };
}

// ── Facturas ──────────────────────────────────────────────────────────────────

function getFacturas() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_FACTURAS);
  if (!sheet) return { facturas: [] };
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { facturas: [] };
  const allValues = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  const headers = allValues[0].map(h => h.toString().trim());
  const tz = Session.getScriptTimeZone();
  return {
    facturas: allValues.slice(1).map((row, i) => {
      const obj = { _rowIndex: i + 2 };
      headers.forEach((h, j) => {
        if (!h) return;
        const val = row[j];
        obj[h] = val instanceof Date && val.getTime() > 0
          ? Utilities.formatDate(val, tz, 'dd/MM/yyyy')
          : (val !== null && val !== undefined ? val : '');
      });
      return obj;
    }).filter(obj => {
      const { _rowIndex, ...fields } = obj;
      return Object.values(fields).some(v => v !== '' && v !== null);
    })
  };
}

function appendFactura(rowValues) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_FACTURAS);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(TAB_FACTURAS);
    sheet.appendRow(['Fecha','FechaPago','Numero','Tipo','ClienteProveedor','Concepto','Monto','Estado']);
  }
  sheet.appendRow(rowValues);
  return { ok: true };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getOrCreateDeudoresSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TAB_DEUDORES);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_DEUDORES);
    sheet.appendRow(['rowIndex','cuotaNum','estado','comentario','fechaUpdate']);
  }
  return sheet;
}

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
