// ─────────────────────────────────────────────────────────────────────────────
// Apps Script para la planilla de EGRESOS
// Pegá este código en: Extensiones > Apps Script (dentro de la planilla de egresos)
// Desplegá como Web App: Ejecutar como "Yo", Acceso "Cualquier usuario"
// ─────────────────────────────────────────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'getTabs')       return ok(getTabs());
    if (action === 'getTab')        return ok(getTab(e.parameter.tab));
    if (action === 'getRegistros')  return ok(getRegistros(e.parameter.mes));
    return ok({ error: 'Acción no reconocida', action });
  } catch (err) {
    return error(err.message);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    if (action === 'appendEgreso') return ok(appendEgreso(body.rowValues));
    return ok({ error: 'Acción no reconocida', action });
  } catch (err) {
    return error(err.message);
  }
}

var TAB_REGISTROS = 'Registros';
var HEADERS_REGISTROS = ['Mes', 'Categoría', 'Subcategoría', 'Detalle', 'Monto', 'Medio de pago', 'País', 'Fecha vto', 'Donde se paga'];

function ensureSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TAB_REGISTROS);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_REGISTROS);
    var headerRange = sheet.getRange(1, 1, 1, HEADERS_REGISTROS.length);
    headerRange.setValues([HEADERS_REGISTROS]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f3f4f6');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 90);
    sheet.setColumnWidth(2, 140);
    sheet.setColumnWidth(3, 130);
    sheet.setColumnWidth(4, 160);
    sheet.setColumnWidth(5, 90);
    sheet.setColumnWidth(6, 120);
    sheet.setColumnWidth(7, 60);
  }
  return sheet;
}

function appendEgreso(rowValues) {
  var sheet = ensureSheet();
  sheet.appendRow(rowValues);
  return { ok: true };
}

function getRegistros(mes) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TAB_REGISTROS);
  if (!sheet) return { rows: [] };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { rows: [] };

  var lastCol = Math.max(sheet.getLastColumn(), HEADERS_REGISTROS.length);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return h ? h.toString().trim() : '';
  });

  var dataRows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  var rows = dataRows
    .map(function(row) {
      var obj = {};
      headers.forEach(function(h, j) {
        if (!h) return;
        var val = row[j];
        obj[h] = (val !== null && val !== undefined) ? val : '';
      });
      return obj;
    })
    .filter(function(obj) {
      // Solo filas con al menos categoría o monto
      return obj['Categoría'] || obj['Monto'];
    })
    .filter(function(obj) {
      // Filtrar por mes si se especifica
      if (!mes) return true;
      return String(obj['Mes']).trim() === mes;
    });

  return { rows: rows };
}

function getTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabs = ss.getSheets().map(s => s.getName());
  return { tabs };
}

function getTab(tabName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
  if (!sheet) return { rows: [], error: 'Tab "' + tabName + '" no encontrado' };

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return { rows: [], debug: 'hoja vacía: lastRow=' + lastRow };

  const allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();

  var headerRowIdx = 0;
  for (var i = 0; i < Math.min(5, allValues.length); i++) {
    var nonEmpty = allValues[i].filter(function(v) {
      return v !== '' && v !== null && v !== undefined;
    });
    if (nonEmpty.length >= 3) {
      headerRowIdx = i;
      break;
    }
  }

  var headers = allValues[headerRowIdx].map(function(h) {
    return h.toString().trim();
  });

  var rows = allValues.slice(headerRowIdx + 1)
    .map(function(row, i) {
      var obj = { _rowIndex: headerRowIdx + i + 2 };
      headers.forEach(function(h, j) {
        if (!h) return;
        var val = row[j];
        if (val instanceof Date) {
          obj[h] = val.getTime() > 0 ? Utilities.formatDate(val, Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
        } else {
          obj[h] = (val !== null && val !== undefined) ? val : '';
        }
      });
      return obj;
    })
    .filter(function(obj) {
      var keys = Object.keys(obj).filter(function(k) { return k !== '_rowIndex'; });
      return keys.some(function(k) {
        var v = obj[k];
        return v !== '' && v !== null && v !== undefined && v !== 0;
      });
    });

  return {
    rows: rows,
    debug: {
      headerRowIdx: headerRowIdx,
      headers: headers.filter(function(h) { return h; }),
      totalDataRows: allValues.length - headerRowIdx - 1,
      rowsAfterFilter: rows.length
    }
  };
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
