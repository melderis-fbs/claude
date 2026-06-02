// Dashboard Comercial - Google Apps Script
//
// Deploy > New deployment > Web app
//   Execute as: Me
//   Who has access: Anyone
//   → Copiá esa URL como APPS_SCRIPT_URL en Vercel

// ► Reemplazá con el ID de tu planilla
// Lo encontrás en la URL: docs.google.com/spreadsheets/d/ ESTE_ID /edit
var SPREADSHEET_ID = '1CSHsgW9evTnPltELKmBfVUZq1vfzDaOzwUNu-cHOuQ8';

// Nombres exactos de las hojas — ajustá si son distintos
var SHEET_NEGOCIO         = 'negocio';
var SHEET_CLOSERS         = 'closers';
var SHEET_ANUNCIOS        = 'anuncios';
var SHEET_CLIENTES_NUEVOS = 'Seguimiento clientes';
var SHEET_RECOLECCION     = 'recoleccion';

// ── ENTRY POINT ───────────────────────────────────────────────────────────────

function doGet(e) {
  var tab = (e.parameter && e.parameter.tab) ? e.parameter.tab : '';
  var data;
  try {
    switch (tab) {
      case 'negocio':     data = getNegocio();               break;
      case 'closers':     data = getClosers();               break;
      case 'anuncios':    data = getAnuncios();              break;
      case 'clientes':    data = getSeguimientoClientes();   break;
      case 'recoleccion': data = getRecoleccion();           break;
      default:
        return json({ error: 'Tab inválido. Usar: negocio, closers, anuncios, clientes, recoleccion' });
    }
    return json({ data: data, tab: tab, timestamp: new Date().toISOString() });
  } catch (err) {
    return json({ error: err.message, tab: tab });
  }
}

// ── NEGOCIO ───────────────────────────────────────────────────────────────────
// Columnas: Mes | Cant ventas nuevas | Cant ventas back | Ventas totales |
//           Ventas Front | Ventas Back | Ventas TOTAL | Cash Collected |
//           Recolección venta nueva | Recolección recurrente front |
//           Recolección back | Recolección recurrente back | %CC |
//           Costos TOTAL | Ganancia | Rentabilidad |
//           Objetivo$ | Objetivo ventas | Faltante ventas | Faltante obj | Faltante gastos
function getNegocio() {
  var rows = getRows(SHEET_NEGOCIO, 2, 21);
  return rows.map(function(r) {
    return {
      mes:                        mesKey(r[0]),
      mesLabel:                   mesLabel(r[0]),
      cantVentasNuevas:           num(r[1]),
      cantVentasBack:             num(r[2]),
      ventasTotales:              num(r[3]),
      ventasFront:                num(r[4]),
      ventasBack:                 num(r[5]),
      ventasTotal:                num(r[6]),
      cashCollected:              num(r[7]),
      recoleccionVentaNueva:      num(r[8]),
      recoleccionRecurrenteFront: num(r[9]),
      recoleccionBack:            num(r[10]),
      recoleccionRecurrenteBack:  num(r[11]),
      pctCC:                      pctNum(r[12]),
      costosTotal:                num(r[13]),
      gananciaVentaNueva:         num(r[14]),
      rentabilidadVentaNueva:     pctNum(r[15]),
      objetivoPesos:              num(r[16]),
      objetivoVentas:             num(r[17]),
      faltanteVentas:             num(r[18]),
      faltanteObj:                num(r[19]),
      faltanteCubrirGastos:       num(r[20]),
    };
  });
}

// ── CLOSERS ───────────────────────────────────────────────────────────────────
// Columnas: Mes | Closer | Agendadas | Asistencias | Reagenda |
//           Segunda llamada | Asistencia 2da | Ofertas | Seña | Cierres | %cierre | %asistencia
function getClosers() {
  var rows = getRows(SHEET_CLOSERS, 2, 12);
  return rows.map(function(r) {
    return {
      mes:                      mesKey(r[0]),
      mesLabel:                 mesLabel(r[0]),
      closer:                   str(r[1]),
      agendadas:                num(r[2]),
      asistencias:              num(r[3]),
      reagenda:                 num(r[4]),
      segundaLlamada:           num(r[5]),
      asistenciaSegundaLlamada: num(r[6]),
      ofertas:                  num(r[7]),
      senia:                    num(r[8]),
      cierres:                  num(r[9]),
      pctCierre:                pctNum(r[10]),
      pctAsistencia:            pctNum(r[11]),
    };
  });
}

// ── ANUNCIOS ──────────────────────────────────────────────────────────────────
// Columnas: Mes | Inversión | Agendas cualificadas | $Costo por agenda |
//           Llamadas en calendario | Asistencias | %Asistencia | $Asistencia |
//           Cierres | %Cierres | %LC | ROAS | ROAS CASH
function getAnuncios() {
  var rows = getRows(SHEET_ANUNCIOS, 2, 13);
  return rows.map(function(r) {
    return {
      mes:                 mesKey(r[0]),
      mesLabel:            mesLabel(r[0]),
      inversion:           num(r[1]),
      agendasCualificadas: num(r[2]),
      costoAgenda:         num(r[3]),
      llamadasCalendario:  num(r[4]),
      asistencias:         num(r[5]),
      pctAsistencia:       pctNum(r[6]),
      costoAsistencia:     num(r[7]),
      cierres:             num(r[8]),
      pctCierres:          pctNum(r[9]),
      pctLC:               pctNum(r[10]),
      roas:                num(r[11]),
      roasCash:            num(r[12]),
    };
  });
}

// ── SEGUIMIENTO CLIENTES ──────────────────────────────────────────────────────
// Col 0-9:   Nombre | Email | Teléfono | Fuente | Programa | MontoTotal | Cuotas | Setter | Closer | Ingreso
// Col 10-25: Pago 1..4 (Monto | Fecha | Método | Estado) × 4
// Col 26-33: MontoPagado | Completado | Estatus | CuotasPagas | Notas | CRM | Contrato | Terminado
function getSeguimientoClientes() {
  var rows = getRows(SHEET_CLIENTES_NUEVOS, 2, 34);
  return rows.map(function(r) {
    var pagos = [];
    for (var i = 0; i < 4; i++) {
      var base  = 10 + i * 4;
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
      nombre:      str(r[0]),
      email:       str(r[1]),
      telefono:    str(r[2]),
      fuente:      str(r[3]),
      programa:    str(r[4]),
      montoTotal:  num(r[5]),
      cuotas:      num(r[6]),
      setter:      str(r[7]),
      closer:      str(r[8]),
      ingreso:     mesKey(r[9]),
      pagos:       pagos,
      montoPagado: num(r[26]),
      completado:  r[27] === true || str(r[27]).toLowerCase() === 'true',
      estatus:     str(r[28]),
      cuotasPagas: num(r[29]),
      notas:       str(r[30]),
      crm:         r[31] === true || str(r[31]).toLowerCase() === 'true',
      contrato:    r[32] === true || str(r[32]).toLowerCase() === 'true',
      terminado:   r[33] === true || str(r[33]).toLowerCase() === 'true',
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
      programa:     str(r[4]),
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

// ── HELPERS ───────────────────────────────────────────────────────────────────

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

function mesKey(val) {
  if (!val) return '';
  if (val instanceof Date) return fmt(val, 'yyyy-MM');
  var s = String(val).trim();
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{4}$/.test(s)) return s.slice(3) + '-' + s.slice(0, 2);
  var MESES = { enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,
                julio:7,agosto:8,septiembre:9,octubre:10,noviembre:11,diciembre:12 };
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

function num(v)    { return parseFloat(String(v).replace(',', '.')) || 0; }
function str(v)    { return String(v || '').trim(); }
function pctNum(v) { var n = num(v); return n > 0 && n <= 1 ? Math.round(n * 1000) / 10 : Math.round(n * 10) / 10; }
