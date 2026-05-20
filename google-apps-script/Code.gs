// Dashboard Comercial - Google Apps Script
// Pegá este código en Extensions > Apps Script dentro de tu Google Sheet.
// Luego: Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone > Deploy
// Copiá la URL generada y ponela en la variable APPS_SCRIPT_URL de tu proyecto.

function doGet(e) {
  const tab = e.parameter.tab || '';
  let data;

  try {
    switch (tab) {
      case 'overview':   data = getOverview();   break;
      case 'agendas':    data = getAgendas();    break;
      case 'llamadas':   data = getLlamadas();   break;
      case 'closers':    data = getClosers();    break;
      case 'anuncios':   data = getAnuncios();   break;
      case 'ingresos':   data = getIngresos();   break;
      default:
        return jsonResponse({ error: 'Tab inválido. Usar: overview, agendas, llamadas, closers, anuncios, ingresos' });
    }
    return jsonResponse({ data: data, tab: tab, timestamp: new Date().toISOString() });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Hoja "' + name + '" no encontrada');
  return sheet;
}

function sheetToObjects(sheet, startRow, numCols) {
  const lastRow = sheet.getLastRow();
  if (lastRow < startRow) return [];
  const values = sheet.getRange(startRow, 1, lastRow - startRow + 1, numCols).getValues();
  return values.filter(row => row.some(cell => cell !== ''));
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
// Hoja "Resumen": columna A = clave, columna B = valor
// Claves esperadas: ingresosMes, egresosMes, balanceNeto, llamadasHoy,
//                  agendasHoy, mejorCloser
// Columnas D-F (opcional): semana, ingresos, egresos  (para el gráfico)
// Columnas H-K (opcional): cliente, proximoPaso, fecha, closer (urgentes)
function getOverview() {
  const sheet = getSheet('Resumen');
  const rows = sheetToObjects(sheet, 1, 10);

  const kv = {};
  const chartData = [];
  const urgentes = [];

  rows.forEach(function(row) {
    const key = String(row[0] || '').trim();
    const val = row[1];
    if (key) kv[key] = val;

    // columnas D-F: semana, ingresos, egresos
    if (row[3]) {
      chartData.push({ semana: row[3], ingresos: Number(row[4]) || 0, egresos: Number(row[5]) || 0 });
    }
    // columnas H-K: cliente, proximoPaso, fecha, closer
    if (row[7]) {
      urgentes.push({ cliente: row[7], proximoPaso: row[8], fecha: formatDate(row[9]), closer: row[10] });
    }
  });

  return {
    ingresosMes:  Number(kv['ingresosMes'])  || 0,
    egresosMes:   Number(kv['egresosMes'])   || 0,
    balanceNeto:  Number(kv['balanceNeto'])  || 0,
    llamadasHoy:  Number(kv['llamadasHoy'])  || 0,
    agendasHoy:   Number(kv['agendasHoy'])   || 0,
    mejorCloser:  String(kv['mejorCloser']   || ''),
    chartData:    chartData,
    urgentes:     urgentes,
    topClosers:   getTopClosers(),
    updatedAt:    new Date().toISOString(),
  };
}

function getTopClosers() {
  try {
    const sheet = getSheet('Closers');
    const currentMonth = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
    const rows = sheetToObjects(sheet, 2, 6);
    return rows
      .filter(function(r) { return String(r[5] || '').trim() === currentMonth; })
      .map(function(r) {
        return {
          nombre: String(r[0] || ''),
          llamadas: Number(r[1]) || 0,
          cierres: Number(r[2]) || 0,
          tasa: parseFloat(r[3]) || 0,
          ingresos: Number(r[4]) || 0,
        };
      })
      .sort(function(a, b) { return b.cierres - a.cierres; })
      .slice(0, 4);
  } catch (e) {
    return [];
  }
}

// ── AGENDAS ───────────────────────────────────────────────────────────────────
// Hoja "Agendas": fecha | hora | cliente | nicho | estado | closer
function getAgendas() {
  const sheet = getSheet('Agendas');
  const rows = sheetToObjects(sheet, 2, 6);
  return rows.map(function(r) {
    const fecha = formatDateISO(r[0]);
    return {
      fecha:        fecha,
      fechaDisplay: formatDateDisplay(r[0]),
      hora:         String(r[1] || ''),
      cliente:      String(r[2] || ''),
      nicho:        String(r[3] || ''),
      estado:       String(r[4] || ''),
      closer:       String(r[5] || ''),
    };
  }).sort(function(a, b) {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
    return a.hora < b.hora ? -1 : 1;
  });
}

// ── LLAMADAS ──────────────────────────────────────────────────────────────────
// Hoja "Llamadas": fecha | closer | cliente | resultado | proximoPaso | observaciones | duracion | fechaProximoContacto
function getLlamadas() {
  const sheet = getSheet('Llamadas');
  const rows = sheetToObjects(sheet, 2, 8);
  return rows.map(function(r) {
    return {
      fecha:                 formatDateISO(r[0]),
      fechaDisplay:          formatDate(r[0]),
      closer:                String(r[1] || ''),
      cliente:               String(r[2] || ''),
      nicho:                 String(r[3] || ''),
      resultado:             String(r[4] || ''),
      proximoPaso:           String(r[5] || ''),
      observaciones:         String(r[6] || ''),
      duracion:              String(r[7] || ''),
      fechaProximoContacto:  formatDate(r[8]),
    };
  }).sort(function(a, b) { return b.fecha < a.fecha ? -1 : 1; });
}

// ── CLOSERS ───────────────────────────────────────────────────────────────────
// Hoja "Closers": nombre | llamadas | cierres | tasa | ingresos | mes (yyyy-MM)
function getClosers() {
  const sheet = getSheet('Closers');
  const rows = sheetToObjects(sheet, 2, 6);
  return rows.map(function(r) {
    return {
      nombre:   String(r[0] || ''),
      llamadas: Number(r[1]) || 0,
      cierres:  Number(r[2]) || 0,
      tasa:     parseFloat(r[3]) || 0,
      ingresos: Number(r[4]) || 0,
      mes:      String(r[5] || ''),
      mesLabel: formatMonthLabel(r[5]),
    };
  });
}

// ── ANUNCIOS ──────────────────────────────────────────────────────────────────
// Hoja "Anuncios": mes (yyyy-MM) | semana | inversion | impresiones | clics | cpm | cpc | ctr | leads | cpl
function getAnuncios() {
  const sheet = getSheet('Anuncios');
  const rows = sheetToObjects(sheet, 2, 10);
  return rows.map(function(r) {
    return {
      mes:         String(r[0] || ''),
      mesLabel:    formatMonthLabel(r[0]),
      semana:      String(r[1] || ''),
      inversion:   Number(r[2]) || 0,
      impresiones: Number(r[3]) || 0,
      clics:       Number(r[4]) || 0,
      cpm:         String(r[5] || '0'),
      cpc:         String(r[6] || '0'),
      ctr:         String(r[7] || '0'),
      leads:       Number(r[8]) || 0,
      cpl:         String(r[9] || '0'),
    };
  });
}

// ── INGRESOS Y EGRESOS ────────────────────────────────────────────────────────
// Hoja "IngresosEgresos":
//   Ingresos: col A=fecha, B=concepto, C=monto, D=mes(yyyy-MM)
//   Egresos:  col F=fecha, G=concepto, H=categoria, I=monto  (misma hoja, columnas F-I)
function getIngresos() {
  const sheet = getSheet('IngresosEgresos');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return buildMonthMap([], []);

  const ingRows = sheet.getRange(2, 1, lastRow - 1, 4).getValues()
    .filter(function(r) { return r[0] !== ''; });
  const egrRows = sheet.getRange(2, 6, lastRow - 1, 4).getValues()
    .filter(function(r) { return r[0] !== ''; });

  const ingresos = ingRows.map(function(r) {
    return {
      fecha:     formatDate(r[0]),
      fechaSort: formatDateISO(r[0]),
      concepto:  String(r[1] || ''),
      monto:     Number(r[2]) || 0,
      mes:       String(r[3] || ''),
    };
  });

  const egresos = egrRows.map(function(r) {
    return {
      fecha:     formatDate(r[0]),
      fechaSort: formatDateISO(r[0]),
      concepto:  String(r[1] || ''),
      categoria: String(r[2] || ''),
      monto:     Number(r[3]) || 0,
      mes:       deriveMes(r[0]),
    };
  });

  return buildMonthMap(ingresos, egresos);
}

function buildMonthMap(ingresos, egresos) {
  const result = {};
  ingresos.forEach(function(r) {
    if (!r.mes) return;
    if (!result[r.mes]) result[r.mes] = { ingresos: [], egresos: [], mesLabel: formatMonthLabel(r.mes) };
    result[r.mes].ingresos.push(r);
  });
  egresos.forEach(function(r) {
    if (!r.mes) return;
    if (!result[r.mes]) result[r.mes] = { ingresos: [], egresos: [], mesLabel: formatMonthLabel(r.mes) };
    result[r.mes].egresos.push(r);
  });
  return result;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatDateISO(val) {
  if (!val) return '';
  try {
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  } catch (e) { return String(val); }
}

function formatDate(val) {
  if (!val) return '-';
  try {
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  } catch (e) { return String(val); }
}

function formatDateDisplay(val) {
  if (!val) return '';
  try {
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const DAYS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    return DAYS[d.getDay()] + ' ' + Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM');
  } catch (e) { return String(val); }
}

function deriveMes(val) {
  if (!val) return '';
  try {
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return '';
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM');
  } catch (e) { return ''; }
}

function formatMonthLabel(mesStr) {
  if (!mesStr) return '';
  try {
    const parts = String(mesStr).split('-');
    if (parts.length < 2) return mesStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return MONTHS[d.getMonth()] + ' ' + parts[0];
  } catch (e) { return mesStr; }
}
