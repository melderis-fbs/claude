// ─────────────────────────────────────────────────────────────────────────────
// Apps Script para la planilla de EGRESOS
// Pegá este código en: Extensiones > Apps Script (dentro de la planilla de egresos)
// Desplegá como Web App: Ejecutar como "Yo", Acceso "Cualquier usuario"
// ─────────────────────────────────────────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'getTabs') return ok(getTabs());
    if (action === 'getTab')  return ok(getTab(e.parameter.tab));
    return ok({ error: 'Acción no reconocida', action });
  } catch (err) {
    return error(err.message);
  }
}

function getTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabs = ss.getSheets().map(s => s.getName());
  return { tabs };
}

function getTab(tabName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
  if (!sheet) return { rows: [], error: `Tab "${tabName}" no encontrado` };

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return { rows: [] };

  const allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = allValues[0].map(h => h.toString().trim());

  const rows = allValues.slice(1)
    .map((row, i) => {
      const obj = { _rowIndex: i + 2 };
      headers.forEach((h, j) => { if (h) obj[h] = row[j] ?? ''; });
      return obj;
    })
    .filter(obj => {
      const { _rowIndex, ...fields } = obj;
      return Object.values(fields).some(v => v !== '' && v !== null && v !== undefined);
    });

  return { rows };
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
