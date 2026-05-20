// Dashboard Comercial - Google Apps Script
// Pegá este código en Extensions > Apps Script dentro de tu Google Sheet.
// Luego: Deploy > New deployment > Web app
//   - Execute as: Me
//   - Who has access: Anyone
// Copiá la URL generada y ponela como APPS_SCRIPT_URL en Vercel.

// Nombres de las hojas en tu planilla — ajustá si son distintos
var SHEET_NEGOCIO   = 'negocio';
var SHEET_ANUNCIOS  = 'anuncios';
var SHEET_CLOSERS   = 'closers';
var SHEET_COBRANZAS = 'cobranzas';
var SHEET_EGRESOS   = 'egresos';
var SHEET_AGENDAS   = 'agendas';
var SHEET_LLAMADAS  = 'llamadas';

function doGet(e) {
  var tab = (e.parameter && e.parameter.tab) ? e.parameter.tab : '';
  var data;
  try {
    switch (tab) {
      case 'negocio':   data = getNegocio();   break;
      case 'agendas':   data = getAgendas();   break;
      case 'llamadas':  data = getLlamadas();  break;
      case 'closers':   data = getClosers();   break;
      case 'anuncios':  data = getAnuncios();  break;
      case 'ingresos':  data = getIngresos();  break;
      default:
        return json({ error: 'Tab inválido. Usar: negocio, agendas, llamadas, closers, anuncios, ingresos' });
    }
    return json({ data: data, tab: tab, timestamp: new Date().toISOString() });
  } catch (err) {
    return json({ error: err.message, tab: tab });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Hoja "' + name + '" no encontrada en la planilla.');
  return sheet;
}

function getRows(sheetName, startRow, numCols) {
  var sheet = getSheet(sheetName);
  var last = sheet.getLastRow();
  if (last < startRow) return [];
  var vals = sheet.getRange(startRow, 1, last - startRow + 1, numCols).getValues();
  return vals.filter(function(r) { return r.some(function(c) { return c !== ''; }); });
}

function mesKey(val) {
  if (!val) return '';
  if (val instanceof Date) return fmt(val, 'yyyy-MM');
  var s = String(val).trim();
  // acepta "2024-05", "mayo 2024", "05/2024", etc.
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{4}$/.test(s)) return s.slice(3) + '-' + s.slice(0, 2);
  try {
    var d = new Date(s);
    if (!isNaN(d.getTime())) return fmt(d, 'yyyy-MM');
  } catch(e){}
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

function fmtDisplay(val) {
  if (!val) return '';
  var d = (val instanceof Date) ? val : new Date(val);
  if (isNaN(d.getTime())) return String(val);
  var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  return DIAS[d.getDay()] + ' ' + fmt(d, 'dd/MM');
}

function num(v) { return parseFloat(String(v).replace(',','.')) || 0; }
function str(v) { return String(v || '').trim(); }

// ── NEGOCIO ───────────────────────────────────────────────────────────────────
// Columnas: Mes | Cant ventas nuevas | Cant ventas back | Ventas totales |
//           Ventas Front | Ventas Back | Ventas TOTAL | Cash Collected |
//           Recolección venta nueva | Recolección recurrente front |
//           Recolección back | Recolección recurrente back | %CC |
//           Costos TOTAL | Ganancia venta nueva | Rentabilidad venta nueva |
//           Objetivo$ | Objetivo ventas | Faltante ventas | Faltante obj |
//           Faltante cubrir gastos
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
      pctCC:                      num(r[12]),
      costosTotal:                num(r[13]),
      gananciaVentaNueva:         num(r[14]),
      rentabilidadVentaNueva:     num(r[15]),
      objetivoPesos:              num(r[16]),
      objetivoVentas:             num(r[17]),
      faltanteVentas:             num(r[18]),
      faltanteObj:                num(r[19]),
      faltanteCubrirGastos:       num(r[20]),
    };
  });
}

// ── AGENDAS ───────────────────────────────────────────────────────────────────
// Columnas sugeridas: Mes | Fecha | Hora | Nombre | Nicho | Closer | Estado
function getAgendas() {
  var rows = getRows(SHEET_AGENDAS, 2, 7);
  return rows.map(function(r) {
    return {
      mes:          mesKey(r[0]),
      fecha:        fmtDateISO(r[1]),
      fechaDisplay: fmtDisplay(r[1]),
      hora:         str(r[2]),
      nombre:       str(r[3]),
      nicho:        str(r[4]),
      closer:       str(r[5]),
      estado:       str(r[6]),
    };
  }).sort(function(a, b) {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
    return a.hora < b.hora ? -1 : 1;
  });
}

// ── LLAMADAS ──────────────────────────────────────────────────────────────────
// Columnas sugeridas: Mes | Fecha | Closer | Nombre | Resultado |
//                    Próximo paso | Fecha próximo contacto | Observaciones
function getLlamadas() {
  var rows = getRows(SHEET_LLAMADAS, 2, 8);
  return rows.map(function(r) {
    return {
      mes:                   mesKey(r[0]),
      fecha:                 fmtDateISO(r[1]),
      fechaDisplay:          fmtDate(r[1]),
      closer:                str(r[2]),
      nombre:                str(r[3]),
      resultado:             str(r[4]),
      proximoPaso:           str(r[5]),
      fechaProximoContacto:  fmtDate(r[6]),
      observaciones:         str(r[7]),
    };
  }).sort(function(a, b) { return b.fecha < a.fecha ? -1 : 1; });
}

// ── CLOSERS ───────────────────────────────────────────────────────────────────
// Columnas: Mes | Closer | Agendadas | Asistencias | Reagenda |
//           Segunda llamada | Asistencia segunda llamada | Ofertas |
//           Seña | Cierres | %cierre | %asistencia
function getClosers() {
  var rows = getRows(SHEET_CLOSERS, 2, 12);
  return rows.map(function(r) {
    return {
      mes:                       mesKey(r[0]),
      mesLabel:                  mesLabel(r[0]),
      closer:                    str(r[1]),
      agendadas:                 num(r[2]),
      asistencias:               num(r[3]),
      reagenda:                  num(r[4]),
      segundaLlamada:            num(r[5]),
      asistenciaSegundaLlamada:  num(r[6]),
      ofertas:                   num(r[7]),
      senia:                     num(r[8]),
      cierres:                   num(r[9]),
      pctCierre:                 num(r[10]),
      pctAsistencia:             num(r[11]),
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
      pctAsistencia:       num(r[6]),
      costoAsistencia:     num(r[7]),
      cierres:             num(r[8]),
      pctCierres:          num(r[9]),
      pctLC:               num(r[10]),
      roas:                num(r[11]),
      roasCash:            num(r[12]),
    };
  });
}

// ── INGRESOS Y EGRESOS ────────────────────────────────────────────────────────
// Combina hoja "egresos" + hoja "cobranzas"
//
// egresos: Mes | Sueldos | Publicidad | APPS | Gastos administrativos |
//          Formacion | Impuestos | Extras
//
// cobranzas: Mes | Nombre | Programa | N de cuota | Cant cuotas |
//            MontoCuota | FechaCuota | Medio | Estado
function getIngresos() {
  var egresosRows = getRows(SHEET_EGRESOS, 2, 8);
  var cobranzasRows = getRows(SHEET_COBRANZAS, 2, 9);

  var egresos = egresosRows.map(function(r) {
    var sueldos = num(r[1]), publicidad = num(r[2]), apps = num(r[3]),
        gastosAdmin = num(r[4]), formacion = num(r[5]),
        impuestos = num(r[6]), extras = num(r[7]);
    return {
      mes:          mesKey(r[0]),
      mesLabel:     mesLabel(r[0]),
      sueldos:      sueldos,
      publicidad:   publicidad,
      apps:         apps,
      gastosAdmin:  gastosAdmin,
      formacion:    formacion,
      impuestos:    impuestos,
      extras:       extras,
      total:        sueldos + publicidad + apps + gastosAdmin + formacion + impuestos + extras,
    };
  });

  var cobranzas = cobranzasRows.map(function(r) {
    return {
      mes:         mesKey(r[0]),
      nombre:      str(r[1]),
      programa:    str(r[2]),
      nCuota:      num(r[3]),
      cantCuotas:  num(r[4]),
      montoCuota:  num(r[5]),
      fechaCuota:  fmtDate(r[6]),
      fechaSort:   fmtDateISO(r[6]),
      medio:       str(r[7]),
      estado:      str(r[8]),
    };
  });

  return { egresos: egresos, cobranzas: cobranzas };
}
