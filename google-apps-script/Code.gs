// Dashboard Comercial - Google Apps Script
//
// LECTURA (dashboard):
//   Deploy > New deployment > Web app > Execute as: Me > Anyone > Deploy
//   Copiá esa URL como APPS_SCRIPT_URL en Vercel.
//
// ESCRITURA desde Zapier (Slack → Sheets):
//   Usá la MISMA URL del web app en Zapier como destino del webhook POST.
//   Zapier Zap 1 – Canal agendas:
//     Trigger: "New Message Posted to Channel" → canal de agendas
//     Filter: solo si el mensaje contiene "Nueva agenda"
//     Action: "Webhooks by Zapier" → POST → URL del web app
//       Body type: JSON | Data: { "type": "agenda", "text": [Message Text], "username": [Username] }
//     NOTA: el username determina la fuente:
//       - si el username es "Mel" (o el nombre de tu bot principal) → fuente "Anuncios"
//       - si el mensaje contiene "BIO" o el username es el bot de bio → fuente "Bio IG"
//
//   Zapier Zap 2 – Canal llamadas:
//     Trigger: "New Message Posted to Channel" → canal de llamadas
//     Filter: solo si el mensaje contiene "Tipo de llamada:" O "Seguimientos de hoy:"
//     Action: "Webhooks by Zapier" → POST → URL del web app
//       Body type: JSON | Data: { "type": "llamada", "text": [Message Text], "username": [Username] }

// ► REEMPLAZÁ este ID con el de tu planilla.
// Lo encontrás en la URL de Google Sheets:
// https://docs.google.com/spreadsheets/d/  ESTE_ES_EL_ID  /edit
var SPREADSHEET_ID = 'TU_ID_AQUI';

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

function getSpreadsheet() {
  return SPREADSHEET_ID !== 'TU_ID_AQUI'
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  var sheet = getSpreadsheet().getSheetByName(name);
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
// Columnas: Mes | Fecha | Nombre | Nicho | Fecha reunión
function getAgendas() {
  var rows = getRows(SHEET_AGENDAS, 2, 5);
  return rows.map(function(r) {
    return {
      mes:           mesKey(r[0]),
      fecha:         fmtDateISO(r[1]),
      nombre:        str(r[2]),
      nicho:         str(r[3]),
      fechaReunion:  fmtDateISO(r[4]),
      fechaReunionDisplay: fmtDisplay(r[4]),
    };
  }).sort(function(a, b) {
    return a.fechaReunion < b.fechaReunion ? -1 : 1;
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

// ══════════════════════════════════════════════════════════════════════════════
// ESCRITURA DESDE ZAPIER (Slack → Sheets)
// ══════════════════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var type     = body.type     || '';
    var text     = body.text     || '';
    var username = body.username || '';

    if (type === 'agenda') {
      var rows = parseAgenda(text, username);
      rows.forEach(function(row) { appendToSheet(SHEET_AGENDAS, row); });
      return json({ ok: true, written: rows.length, type: 'agenda' });
    }

    if (type === 'llamada') {
      var rows = parseLlamada(text, username);
      rows.forEach(function(row) { appendToSheet(SHEET_LLAMADAS, row); });
      return json({ ok: true, written: rows.length, type: 'llamada' });
    }

    return json({ ok: false, error: 'type desconocido: ' + type });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function appendToSheet(sheetName, rowArray) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Hoja "' + sheetName + '" no encontrada.');
  sheet.appendRow(rowArray);
}

// ── Parser de agendas ─────────────────────────────────────────────────────────
// Formato esperado:
//   Nueva agenda automática   ← o "Nueva agenda de BIO"
//   Título: Sesión Asesoría Founders - Luis Prueba
//   Fecha y hora: Tuesday, May 19, 2026 3:00 PM  ← o formato ISO 2026-05-19T12:00:00
//   Enlace: https://...
//   Ocupación: Servicios profesionales...
function parseAgenda(text, username) {
  var lines = text.split('\n');

  var titulo    = extractField(lines, 'Título:');
  var fechaRaw  = extractField(lines, 'Fecha y hora:');
  var ocupacion = extractField(lines, 'Ocupación:');

  var userLower = (username || '').toLowerCase();
  var tipo = userLower === 'admin' ? 'Anuncios' : 'Bio IG';

  // Extraer nombre del cliente del título
  // "Sesión Asesoría Founders - Luis Prueba" → "Luis Prueba"
  // "Sesión Asesoría Founders IG - Kevin Piñón" → "Kevin Piñón"
  var nombre = titulo;
  var dashIdx = titulo.lastIndexOf(' - ');
  if (dashIdx >= 0) nombre = titulo.slice(dashIdx + 3).trim();

  // Parsear fecha de reunión
  var fechaReunion = '';
  try {
    var d = new Date(fechaRaw);
    if (!isNaN(d.getTime())) fechaReunion = fmt(d, 'yyyy-MM-dd');
  } catch(e) {}

  var hoy = fmt(new Date(), 'yyyy-MM-dd');
  var mes = hoy.slice(0, 7);

  // Columnas: Mes | Fecha (registro) | Nombre | Nicho | Fecha reunión
  return [[ mes, hoy, nombre, ocupacion || tipo, fechaReunion ]];
}

// ── Parser de llamadas ────────────────────────────────────────────────────────
// Soporta dos formatos:
//
// Formato A — reporte de llamada individual:
//   Tipo de llamada: Llamada
//   Nombre del lead: Noe Triviño
//   Resumen de la llamada: ...
//   Próximos pasos (si hay): ...
//
// Formato B — resumen de seguimientos:
//   Seguimientos de hoy:
//   Javier Perez: no tuve respuesta...
//   Flor DAgostino: me introdujo a...
//   ...
function parseLlamada(text, username) {
  var today = fmt(new Date(), 'yyyy-MM-dd');
  var mes   = today.slice(0, 7);
  var rows  = [];

  if (text.indexOf('Tipo de llamada:') >= 0) {
    // ── Formato A
    var lines       = text.split('\n');
    var nombre      = extractField(lines, 'Nombre del lead:');
    var resumen     = extractField(lines, 'Resumen de la llamada:');
    var proxPaso    = extractField(lines, 'Próximos pasos (si hay):');
    var resultado   = inferResultado(resumen + ' ' + proxPaso);
    var fechaProx   = inferFechaProxima(resumen + ' ' + proxPaso, today);

    // Columnas: Mes | Fecha | Closer | Nombre | Resultado | Próximo paso | Fecha próximo contacto | Observaciones
    rows.push([ mes, today, username, nombre, resultado, proxPaso, fechaProx, resumen ]);

  } else if (text.toLowerCase().indexOf('seguimientos de hoy') >= 0) {
    // ── Formato B: cada línea después del encabezado es un lead
    var lines = text.split('\n');
    var started = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!started) {
        if (line.toLowerCase().indexOf('seguimientos de hoy') >= 0) { started = true; }
        continue;
      }
      if (!line) continue;

      // "Javier Perez: no tuve respuesta..."
      var colonIdx = line.indexOf(':');
      if (colonIdx <= 0) continue;
      var nombreSeg = line.slice(0, colonIdx).trim();
      var detalle   = line.slice(colonIdx + 1).trim();
      var resultado = inferResultado(detalle);
      var proxPaso  = inferProximoPaso(detalle);
      var fechaProx = inferFechaProxima(detalle, today);

      rows.push([ mes, today, username, nombreSeg, resultado, proxPaso, fechaProx, detalle ]);
    }
  }

  return rows;
}

// ── Helpers de parseo ─────────────────────────────────────────────────────────

function extractField(lines, fieldName) {
  var prefix = fieldName.toLowerCase();
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().indexOf(prefix) === 0) {
      var val = lines[i].slice(fieldName.length).trim();
      // Si el siguiente campo aún no empezó, concatenar líneas de continuación
      for (var j = i + 1; j < lines.length; j++) {
        var next = lines[j].trim();
        if (!next || /^[A-ZÁÉÍÓÚ][^:]+:/.test(next)) break;
        val += ' ' + next;
      }
      return val;
    }
  }
  return '';
}

function inferResultado(texto) {
  var t = texto.toLowerCase();
  if (t.indexOf('pagó') >= 0 || t.indexOf('pago') >= 0 || t.indexOf('confirmó') >= 0) return 'Cerrado';
  if (t.indexOf('no llega') >= 0 || t.indexOf('no puede') >= 0 || t.indexOf('no interesado') >= 0) return 'No interesado';
  if (t.indexOf('segunda') >= 0 || t.indexOf('2da') >= 0 || t.indexOf('reunión') >= 0 || t.indexOf('reunion') >= 0) return 'Segunda llamada';
  if (t.indexOf('sin respuesta') >= 0) return 'Sin respuesta';
  if (t.indexOf('seguimiento') >= 0 || t.indexOf('ver si') >= 0 || t.indexOf('pensando') >= 0) return 'Seguimiento';
  return 'Seguimiento';
}

function inferProximoPaso(texto) {
  var t = texto.toLowerCase();
  if (t.indexOf('segunda') >= 0 || t.indexOf('2da') >= 0) return 'Segunda llamada';
  if (t.indexOf('confirma') >= 0) return 'Esperar confirmación';
  if (t.indexOf('banco') >= 0 || t.indexOf('préstamo') >= 0 || t.indexOf('prestamo') >= 0) return 'Esperar financiamiento';
  if (t.indexOf('sin respuesta') >= 0) return 'Recontactar';
  if (t.indexOf('pagó') >= 0 || t.indexOf('pago') >= 0) return '-';
  return 'Seguimiento';
}

function inferFechaProxima(texto, baseDate) {
  // Busca "viernes", "lunes", "el martes", etc. o "X días"
  var t = texto.toLowerCase();
  var d = new Date(baseDate);
  var DIAS = { lunes:1, martes:2, miércoles:3, miercoles:3, jueves:4, viernes:5, sábado:6, sabado:6, domingo:0 };
  for (var diaName in DIAS) {
    if (t.indexOf(diaName) >= 0) {
      var target = DIAS[diaName];
      var current = d.getDay();
      var diff = (target - current + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return fmt(d, 'dd/MM/yyyy');
    }
  }
  var match = t.match(/en (\d+) días/);
  if (match) {
    d.setDate(d.getDate() + parseInt(match[1]));
    return fmt(d, 'dd/MM/yyyy');
  }
  if (t.indexOf('mañana') >= 0) {
    d.setDate(d.getDate() + 1);
    return fmt(d, 'dd/MM/yyyy');
  }
  return '';
}
