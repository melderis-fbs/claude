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
  if (!sheet) return { rows: [], error: 'Tab "' + tabName + '" no encontrado' };

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return { rows: [], debug: 'hoja vacía: lastRow=' + lastRow };

  const allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();

  // Detectar fila de cabeceras: primera fila con al menos 3 celdas no vacías
  // (para saltar filas de título que solo tienen 1 celda con texto)
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
        // Convertir Date a string para evitar serialización rara
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
