// Dashboard Comercial - Google Apps Script
//
// Deploy > New deployment > Web app
//   Execute as: Me
//   Who has access: Anyone
//   → Copiá esa URL como APPS_SCRIPT_URL en Vercel

var SPREADSHEET_ID    = '1CSHsgW9evTnPltELKmBfVUZq1vfzDaOzwUNu-cHOuQ8';
var SHEET_CLIENTES    = 'Seguimiento clientes';
var SHEET_RECOLECCION = 'recoleccion';
var SHEET_COMENTARIOS = 'comentarios';

// ── ENTRY POINT ───────────────────────────────────────────────────────────────

function doGet(e) {
  var tab = (e.parameter && e.parameter.tab) ? e.parameter.tab : '';
  var data;
  try {
    switch (tab) {
      case 'clientes':    data = getSeguimientoClientes(); break;
      case 'recoleccion': data = getRecoleccion();         break;
      case 'comentarios': data = getComentarios();         break;
      default:
        return json({ error: 'Tab inválido. Usar: clientes, recoleccion, comentarios' });
    }
    return json({ data: data, tab: tab, timestamp: new Date().toISOString() });
  } catch (err) {
    return json({ error: err.message, tab: tab });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.type === 'comentario') {
      saveComentario(body.tipo, body.nombre, body.texto);
      return json({ ok: true });
    }
    return json({ error: 'Tipo desconocido: ' + body.type });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

// ── SEGUIMIENTO CLIENTES ──────────────────────────────────────────────────────
// 26 columns (0-25):
// 0: Nombre, 1: Email, 2: Teléfono, 3: Fuente, 4: Programa, 5: Monto total ($5,000.00 format),
// 6: Cuotas, 7: SETTER, 8: CLOSER, 9: Ingreso (bare Spanish month name)
// 10-13: Pago 1 (monto, fecha, metodo, estado)
// 14-17: Pago 2
// 18-21: Pago 3
// 22-25: Pago 4
// esBack = fuente.toUpperCase() === 'BACK'
// montoPagado = sum of pagos where estado === 'Cobrado'
function getSeguimientoClientes() {
  var rows = getRows(SHEET_CLIENTES, 2, 26);
  return rows.map(function(r) {
    var fuente  = str(r[3]);
    var esBack  = fuente.toUpperCase() === 'BACK';
    var pagos   = [];
    var montoPagado = 0;
    for (var i = 0; i < 4; i++) {
      var base  = 10 + i * 4;
      var monto = num(r[base]);
      if (!monto) { pagos.push(null); continue; }
      var fechaVal = r[base + 1];
      var metodo   = str(r[base + 2]);
      var fechaISO = fechaVal ? fmtDateISO(fechaVal) : '';
      var estado   = estadoPago(r[base + 3], fechaVal);
      if (estado === 'Cobrado') montoPagado += monto;
      pagos.push({
        n:             i + 1,
        monto:         monto,
        fecha:         fechaVal ? fmtDate(fechaVal) : '',
        fechaISO:      fechaISO,
        metodo:        metodo,
        clasificacion: clasificarMetodo(metodo),
        estado:        estado,
      });
    }
    return {
      nombre:      str(r[0]),
      email:       str(r[1]),
      telefono:    str(r[2]),
      fuente:      fuente,
      programa:    normalizePrograma(str(r[4])),
      montoTotal:  num(r[5]),
      cuotas:      num(r[6]),
      setter:      str(r[7]),
      closer:      str(r[8]),
      ingreso:     mesKey(r[9]),
      pagos:       pagos,
      montoPagado: montoPagado,
      esBack:      esBack,
    };
  }).filter(function(c) { return c.nombre; });
}

// ── RECOLECCIÓN ───────────────────────────────────────────────────────────────
// Col 0-7:   Nombre | Email | Teléfono | Fuente | Programa | MontoTotal | Cuotas | Ingreso
// Col 8-23:  Pago 1..4 (Monto | Fecha | Método | Estado) × 4
// Col 24-28: MontoAdeudado | Completado | Estatus | CuotasPagas | Terminado
function getRecoleccion() {
  var rows = getRows(SHEET_RECOLECCION, 2, 29);
  return rows.map(function(r) {
    var pagos = [];
    for (var i = 0; i < 4; i++) {
      var base  = 8 + i * 4;
      var monto = num(r[base]);
      if (!monto) { pagos.push(null); continue; }
      var fechaVal = r[base + 1];
      var metodo   = str(r[base + 2]);
      var fechaISO = fechaVal ? fmtDateISO(fechaVal) : '';
      pagos.push({
        n:             i + 1,
        monto:         monto,
        fecha:         fechaVal ? fmtDate(fechaVal) : '',
        fechaISO:      fechaISO,
        metodo:        metodo,
        clasificacion: clasificarMetodo(metodo),
        estado:        estadoPago(r[base + 3], fechaVal),
      });
    }
    return {
      nombre:       str(r[0]),
      email:        str(r[1]),
      telefono:     str(r[2]),
      fuente:       str(r[3]),
      programa:     normalizePrograma(str(r[4])),
      montoTotal:   num(r[5]),
      cuotas:       num(r[6]),
      ingreso:      mesKey(r[7]),
      pagos:        pagos,
      montoAdeudado: num(r[24]),
      completado:   r[25] === true || str(r[25]).toLowerCase() === 'true',
      estatus:      str(r[26]),
      cuotasPagas:  num(r[27]),
      terminado:    r[28] === true || str(r[28]).toLowerCase() === 'true',
    };
  }).filter(function(c) { return c.nombre; });
}

// ── COMENTARIOS ───────────────────────────────────────────────────────────────
// Sheet cols: tipo (A), nombre (B), texto (C), fecha (D)
// Returns object keyed by "tipo|nombre"
function getComentarios() {
  var sheet;
  try { sheet = getSheet(SHEET_COMENTARIOS); }
  catch(e) { return {}; }

  var last = sheet.getLastRow();
  if (last < 2) return {};
  var rows = sheet.getRange(2, 1, last - 1, 4).getValues();
  var result = {};
  rows.forEach(function(r) {
    var tipo   = str(r[0]);
    var nombre = str(r[1]);
    var texto  = str(r[2]);
    var fecha  = r[3] ? fmtDateISO(r[3]) : '';
    if (!tipo || !nombre) return;
    var key = tipo + '|' + nombre;
    result[key] = { tipo: tipo, nombre: nombre, texto: texto, fecha: fecha };
  });
  return result;
}

// ── SAVE COMENTARIO ───────────────────────────────────────────────────────────
function saveComentario(tipo, nombre, texto) {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_COMENTARIOS);

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_COMENTARIOS);
    sheet.getRange(1, 1, 1, 4).setValues([['tipo', 'nombre', 'texto', 'fecha']]);
  }

  var last = sheet.getLastRow();
  // Search for existing row
  if (last >= 2) {
    var data = sheet.getRange(2, 1, last - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      if (str(data[i][0]) === tipo && str(data[i][1]) === nombre) {
        var rowNum = i + 2;
        sheet.getRange(rowNum, 3, 1, 2).setValues([[texto, new Date()]]);
        return;
      }
    }
  }

  // Append new row
  sheet.appendRow([tipo, nombre, texto, new Date()]);
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

// M1+ → M2, everything else unchanged
function normalizePrograma(p) {
  if (!p) return p;
  if (p === 'M1+') return 'M2';
  return p;
}

function clasificarMetodo(m) {
  var s = str(m).toLowerCase();
  if (!s) return 'usa';
  if (s.indexOf('transferencia') === 0) return 'argentina';
  if (s === 'efectivo') return 'efectivo';
  return 'usa';
}

function estadoPago(estadoRaw, fechaVal) {
  if (estadoRaw === true || str(estadoRaw).toLowerCase() === 'true') return 'Cobrado';
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  if (fechaVal) {
    var d = (fechaVal instanceof Date) ? fechaVal : new Date(fechaVal);
    if (!isNaN(d.getTime()) && d < hoy) return 'Vencido';
  }
  return 'Pendiente';
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet() {
  return SPREADSHEET_ID !== 'TU_ID_AQUI'
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  var sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Hoja "' + name + '" no encontrada.');
  return sheet;
}

function getRows(sheetName, startRow, numCols) {
  var sheet = getSheet(sheetName);
  var last  = sheet.getLastRow();
  if (last < startRow) return [];
  return sheet.getRange(startRow, 1, last - startRow + 1, numCols).getValues()
    .filter(function(r) { return r.some(function(c) { return c !== ''; }); });
}

// mesKey handles bare Spanish month names like "Enero" without a year (defaults to current year)
function mesKey(val) {
  if (!val) return '';
  if (val instanceof Date) return fmt(val, 'yyyy-MM');
  var s = String(val).trim();
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{4}$/.test(s)) return s.slice(3) + '-' + s.slice(0, 2);
  var MESES = { enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6,
                julio:7, agosto:8, septiembre:9, octubre:10, noviembre:11, diciembre:12 };
  var lower = s.toLowerCase();
  for (var m in MESES) {
    if (lower.indexOf(m) === 0) {
      var ym   = s.match(/\d{4}/);
      var year = ym ? ym[0] : new Date().getFullYear().toString();
      var n    = MESES[m];
      return year + '-' + (n < 10 ? '0' + n : '' + n);
    }
  }
  try { var d = new Date(s); if (!isNaN(d.getTime())) return fmt(d, 'yyyy-MM'); } catch(e){}
  return s;
}

function mesLabel(val) {
  var key = mesKey(val);
  if (!key) return String(val || '');
  var parts = key.split('-');
  if (parts.length < 2) return key;
  var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return MESES[parseInt(parts[1]) - 1] + ' ' + parts[0];
}

function fmt(val, pattern) {
  if (!val) return '';
  try {
    var d = (val instanceof Date) ? val : new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return Utilities.formatDate(d, Session.getScriptTimeZone(), pattern);
  } catch(e) { return String(val); }
}

function fmtDate(val)    { return fmt(val, 'dd/MM/yyyy'); }
function fmtDateISO(val) { return fmt(val, 'yyyy-MM-dd'); }

// Handles "$5,000.00" format: strip $ and commas before parseFloat
function num(v) {
  var s = String(v || '').trim().replace(/^\$/, '').replace(/,/g, '');
  return parseFloat(s) || 0;
}

function str(v)    { return String(v || '').trim(); }
function pctNum(v) { var n = num(v); return n > 0 && n <= 1 ? Math.round(n * 1000) / 10 : Math.round(n * 10) / 10; }
