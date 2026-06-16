import { subMonths, format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const CLOSERS  = ['María García', 'Carlos López', 'Ana Martín', 'Diego Fernández'];
const NICHOS   = ['Fitness', 'Coaching', 'Inmobiliario', 'E-commerce'];
const NOMBRES  = [
  'Martín Rodríguez','Sofía Herrera','Pablo Jiménez','Laura Torres','Nicolás Ramírez',
  'Valentina Flores','Tomás Vargas','Camila Mendoza','Andrés Castro','Florencia Ramos',
  'Ignacio Suárez','Lucía Fernández','Mateo González','Agustina Reyes','Sebastián Moreno',
];
const PROGRAMAS  = ['Coaching Premium','Fitness VIP','Mentoría Inmobiliaria','E-commerce Pro'];
const MEDIOS     = ['Transferencia','Tarjeta','Efectivo','MercadoPago'];
const RESULTADOS = ['Cerrado','Seguimiento','No interesado','Reagendado','Sin respuesta'];
const PROXIMOS   = [
  'Enviar propuesta','Llamar en 3 días','Demo programada',
  'Esperar respuesta','Recontactar próxima semana','Enviar contrato',
];
const OBSERVACIONES = [
  'Cliente muy interesado, pide más info sobre precios',
  'Necesita hablar con su socio antes de decidir',
  'Le gustó la propuesta, tiene dudas sobre el tiempo de implementación',
  'Presupuesto ajustado pero hay voluntad de avanzar',
  'Excelente llamada, cierre probable esta semana',
  'Cliente frío, volver a contactar en 2 semanas',
];

function rng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xFFFFFFFF; return (s >>> 0) / 0xFFFFFFFF; };
}
function pick(arr, r) { return arr[Math.floor(r() * arr.length)]; }
function rInt(min, max, r) { return Math.floor(r() * (max - min + 1)) + min; }

export function getLastFourMonthsList() {
  const now = new Date();
  return [0,1,2,3].map(i => {
    const d = subMonths(now, i);
    const label = format(d, 'MMMM yyyy', { locale: es });
    return { label: label.charAt(0).toUpperCase() + label.slice(1), value: format(d, 'yyyy-MM'), date: d };
  });
}

// ── NEGOCIO ───────────────────────────────────────────────────────────────────
export function getMockNegocioData() {
  return getLastFourMonthsList().map(({ value: mes, label: mesLabel }, mi) => {
    const r = rng(10000 + mi * 777);
    const cantNuevas  = rInt(8, 18, r);
    const cantBack    = rInt(3, 10, r);
    const ventasFront = cantNuevas * rInt(150000, 350000, r);
    const ventasBack  = cantBack   * rInt(80000,  200000, r);
    const ventasTotal = ventasFront + ventasBack;
    const cashCollected = Math.round(ventasTotal * (0.7 + r() * 0.25));
    const recVentaNueva = Math.round(ventasFront * 0.55);
    const recRecFront   = Math.round(ventasFront * 0.2);
    const recBack       = Math.round(ventasBack  * 0.4);
    const recRecBack    = Math.round(ventasBack  * 0.25);
    const pctCC         = parseFloat(((cashCollected / ventasTotal) * 100).toFixed(1));
    const costosTotal   = rInt(800000, 2200000, r);
    const ganancia      = cashCollected - costosTotal;
    const rentabilidad  = parseFloat(((ganancia / cashCollected) * 100).toFixed(1));
    const objPesos      = rInt(3000000, 6000000, r);
    const objVentas     = rInt(20, 35, r);
    return {
      mes, mesLabel,
      cantVentasNuevas: cantNuevas,
      cantVentasBack:   cantBack,
      ventasTotales:    cantNuevas + cantBack,
      ventasFront, ventasBack, ventasTotal, cashCollected,
      recoleccionVentaNueva: recVentaNueva,
      recoleccionRecurrenteFront: recRecFront,
      recoleccionBack: recBack,
      recoleccionRecurrenteBack: recRecBack,
      pctCC, costosTotal,
      gananciaVentaNueva: ganancia,
      rentabilidadVentaNueva: rentabilidad,
      objetivoPesos: objPesos,
      objetivoVentas: objVentas,
      faltanteVentas: Math.max(0, objVentas - cantNuevas - cantBack),
      faltanteObj: Math.max(0, objPesos - ventasTotal),
      faltanteCubrirGastos: Math.max(0, costosTotal - cashCollected),
    };
  });
}

// ── AGENDAS ───────────────────────────────────────────────────────────────────
// Columnas: Mes | Fecha (registro) | Nombre | Nicho | Fecha reunión
export function getMockAgendasData() {
  const r = rng(20000);
  const today = new Date();
  const agendas = [];
  for (let day = -3; day <= 14; day++) {
    const reunion = addDays(today, day);
    const count = rInt(2, 6, r);
    for (let i = 0; i < count; i++) {
      const r2 = rng(20000 + day * 100 + i * 17);
      const registrado = addDays(reunion, -rInt(0, 3, r2));
      agendas.push({
        mes:                  format(reunion, 'yyyy-MM'),
        fecha:                format(registrado, 'yyyy-MM-dd'),
        nombre:               pick(NOMBRES, r2),
        nicho:                pick(NICHOS, r2),
        fechaReunion:         format(reunion, 'yyyy-MM-dd'),
        fechaReunionDisplay:  format(reunion, "EEEE dd/MM", { locale: es }),
        fuente:               r2 % 3 === 0 ? 'Anuncios' : 'Bio IG',
      });
    }
  }
  return agendas.sort((a, b) => a.fechaReunion.localeCompare(b.fechaReunion));
}

// ── LLAMADAS ──────────────────────────────────────────────────────────────────
export function getMockLlamadasData() {
  const r = rng(30000);
  const today = new Date();
  const llamadas = [];
  for (let day = -14; day <= 0; day++) {
    const date = addDays(today, day);
    const count = rInt(3, 9, r);
    for (let i = 0; i < count; i++) {
      const r2 = rng(30000 + day * 100 + i * 23);
      const resultado = pick(RESULTADOS, r2);
      const needsFollow = resultado !== 'Cerrado' && resultado !== 'No interesado';
      llamadas.push({
        mes:   format(date, 'yyyy-MM'),
        fecha: format(date, 'yyyy-MM-dd'),
        fechaDisplay: format(date, 'dd/MM/yyyy'),
        closer:   pick(CLOSERS, r2),
        nombre:   pick(NOMBRES, r2),
        resultado,
        proximoPaso:          needsFollow ? pick(PROXIMOS, r2) : '-',
        fechaProximoContacto: needsFollow ? format(addDays(date, rInt(1, 7, r2)), 'dd/MM/yyyy') : '-',
        observaciones: pick(OBSERVACIONES, r2),
      });
    }
  }
  return llamadas.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// ── CLOSERS ───────────────────────────────────────────────────────────────────
export function getMockClosersData() {
  const data = [];
  getLastFourMonthsList().forEach(({ value: mes, label: mesLabel }, mi) => {
    CLOSERS.forEach((closer, ci) => {
      const r = rng(40000 + mi * 1000 + ci * 100);
      const agendadas   = rInt(25, 55, r);
      const asistencias = rInt(Math.floor(agendadas * 0.55), Math.floor(agendadas * 0.85), r);
      const reagenda    = rInt(1, 6, r);
      const segunda     = rInt(2, 8, r);
      const asisSegunda = rInt(1, segunda, r);
      const ofertas     = rInt(Math.floor(asistencias * 0.4), Math.floor(asistencias * 0.75), r);
      const senia       = rInt(Math.floor(ofertas * 0.4), Math.floor(ofertas * 0.8), r);
      const cierres     = rInt(Math.floor(senia * 0.6), senia, r);
      data.push({
        mes, mesLabel, closer, agendadas, asistencias, reagenda,
        segundaLlamada: segunda,
        asistenciaSegundaLlamada: asisSegunda,
        ofertas, senia, cierres,
        pctCierre:     parseFloat(((cierres / agendadas) * 100).toFixed(1)),
        pctAsistencia: parseFloat(((asistencias / agendadas) * 100).toFixed(1)),
      });
    });
  });
  return data;
}

// ── ANUNCIOS ──────────────────────────────────────────────────────────────────
export function getMockAnunciosData() {
  return getLastFourMonthsList().map(({ value: mes, label: mesLabel }, mi) => {
    const r = rng(50000 + mi * 999);
    const inversion           = rInt(250000, 900000, r);
    const agendasCualificadas = rInt(30, 90, r);
    const costoAgenda         = Math.round(inversion / agendasCualificadas);
    const llamadasCalendario  = Math.round(agendasCualificadas * (0.7 + r() * 0.2));
    const asistencias         = Math.round(llamadasCalendario  * (0.6 + r() * 0.25));
    const pctAsistencia       = parseFloat(((asistencias / llamadasCalendario) * 100).toFixed(1));
    const costoAsistencia     = Math.round(inversion / asistencias);
    const cierres             = rInt(Math.floor(asistencias * 0.15), Math.floor(asistencias * 0.4), r);
    const pctCierres          = parseFloat(((cierres / asistencias) * 100).toFixed(1));
    const pctLC               = parseFloat(((cierres / llamadasCalendario) * 100).toFixed(1));
    const ventasGen           = cierres * rInt(150000, 350000, r);
    const roas                = parseFloat((ventasGen / inversion).toFixed(2));
    const roasCash            = parseFloat((Math.round(ventasGen * 0.78) / inversion).toFixed(2));
    return {
      mes, mesLabel, inversion, agendasCualificadas, costoAgenda,
      llamadasCalendario, asistencias, pctAsistencia, costoAsistencia,
      cierres, pctCierres, pctLC, roas, roasCash,
    };
  });
}

// ── INGRESOS Y EGRESOS ────────────────────────────────────────────────────────
export function getMockIngresosEgresosData() {
  const egresos = getLastFourMonthsList().map(({ value: mes, label: mesLabel }, mi) => {
    const r = rng(60000 + mi * 888);
    const vals = {
      sueldos:     rInt(400000,  900000, r),
      publicidad:  rInt(150000,  500000, r),
      apps:        rInt(30000,   120000, r),
      gastosAdmin: rInt(50000,   200000, r),
      formacion:   rInt(20000,   100000, r),
      impuestos:   rInt(60000,   250000, r),
      extras:      rInt(10000,    80000, r),
    };
    const total = Object.values(vals).reduce((s, v) => s + v, 0);
    return { mes, mesLabel, ...vals, total };
  });

  const cobranzas = [];
  getLastFourMonthsList().forEach(({ value: mes }, mi) => {
    const r = rng(70000 + mi * 555);
    const count = rInt(8, 20, r);
    for (let i = 0; i < count; i++) {
      const r2 = rng(70000 + mi * 555 + i * 37);
      const cantCuotas = rInt(3, 12, r2);
      const nCuota     = rInt(1, cantCuotas, r2);
      const offset     = rInt(-15, 30, r2);
      const dateVal    = addDays(new Date(), offset);
      cobranzas.push({
        mes,
        nombre:     pick(NOMBRES, r2),
        programa:   pick(PROGRAMAS, r2),
        nCuota, cantCuotas,
        montoCuota: rInt(30000, 150000, r2),
        fechaCuota: format(dateVal, 'dd/MM/yyyy'),
        fechaSort:  format(dateVal, 'yyyy-MM-dd'),
        medio:      pick(MEDIOS, r2),
        estado:     pick(['Cobrado','Cobrado','Cobrado','Pendiente','Vencido'], r2),
      });
    }
  });

  return { egresos, cobranzas };
}

// ── CLIENTES NUEVOS (Seguimiento clientes) ────────────────────────────────────
// Matches real column structure (26 cols). No completado/estatus/cuotasPagas/notas/crm/contrato/terminado.
// montoPagado is calculated from pagos (sum where estado === 'Cobrado').
// esBack = fuente === 'BACK'.
export function getMockClientesNuevosData() {
  const TODAY = '2026-06-01';

  function pago(n, monto, fecha, metodo, cobrado) {
    const clasificacion =
      metodo.toLowerCase().startsWith('transferencia') ? 'argentina' :
      metodo.toLowerCase() === 'efectivo' ? 'efectivo' : 'usa';
    const fechaISO = fecha;
    const fechaDisplay = fecha ? fecha.split('-').reverse().join('/') : '';
    const estado =
      cobrado === true ? 'Cobrado' :
      (cobrado === false && fecha && fecha < TODAY) ? 'Vencido' : 'Pendiente';
    return { n, monto, fecha: fechaDisplay, fechaISO, metodo, clasificacion, estado };
  }

  function calcMontoPagado(pagos) {
    return (pagos || []).reduce((s, p) => p && p.estado === 'Cobrado' ? s + (p.monto || 0) : s, 0);
  }

  const clientes = [
    {
      nombre: 'Juan Cavallo',
      email: 'juan.cavallo@gmail.com',
      telefono: '+54 9 11 4321-0001',
      fuente: 'BIO',
      programa: 'M1',
      montoTotal: 5000,
      cuotas: 2,
      setter: 'Mel',
      closer: 'Kevin',
      ingreso: '2026-01',
      pagos: [
        pago(1, 2500, '2026-01-10', 'Transferencia USD', true),
        pago(2, 2500, '2026-02-10', 'Transferencia USD', true),
        null,
        null,
      ],
      esBack: false,
    },
    {
      nombre: 'Lucia Fargnoli',
      email: 'lucia.fargnoli@gmail.com',
      telefono: '+54 9 11 4321-0002',
      fuente: 'ADS',
      programa: 'M1',
      montoTotal: 5500,
      cuotas: 3,
      setter: 'Mel',
      closer: 'Vicky',
      ingreso: '2026-01',
      pagos: [
        pago(1, 2000, '2026-01-15', 'Transferencia USD', true),
        pago(2, 1750, '2026-02-15', 'Efectivo', true),
        pago(3, 1750, '2026-03-15', 'Efectivo', true),
        null,
      ],
      esBack: false,
    },
    {
      nombre: 'Clelia Sartori',
      email: 'clelia.sartori@gmail.com',
      telefono: '+54 9 11 4321-0003',
      fuente: 'Automática',
      programa: 'M1',
      montoTotal: 6500,
      cuotas: 4,
      setter: 'Mel',
      closer: 'Fabri',
      ingreso: '2026-03',
      pagos: [
        pago(1, 2000, '2026-03-05', 'Transferencia USD', true),
        pago(2, 1500, '2026-04-05', 'PayPal', true),
        pago(3, 1500, '2026-05-05', 'Transferencia USD', true),
        pago(4, 1500, '2026-06-05', 'Transferencia USD', true),
      ],
      esBack: false,
    },
    {
      nombre: 'Tamara Barthes',
      email: 'tamara.barthes@gmail.com',
      telefono: '+54 9 11 4321-0004',
      fuente: 'Automática',
      programa: 'M1',
      montoTotal: 5000,
      cuotas: 4,
      setter: 'Mel',
      closer: 'Kevin',
      ingreso: '2026-05',
      pagos: [
        pago(1, 1250, '2026-05-20', 'Stripe', true),
        pago(2, 1250, '2026-06-20', 'Stripe', false),
        pago(3, 1250, '2026-07-20', 'Stripe', false),
        pago(4, 1250, '2026-08-20', 'Stripe', false),
      ],
      esBack: false,
    },
    {
      nombre: 'Paz Adanez',
      email: 'paz.adanez@gmail.com',
      telefono: '+54 9 11 4321-0005',
      fuente: 'BIO',
      programa: 'M1',
      montoTotal: 5000,
      cuotas: 3,
      setter: 'Mel',
      closer: 'Braian',
      ingreso: '2026-05',
      pagos: [
        pago(1, 1667, '2026-05-22', 'Stripe', true),
        pago(2, 1667, '2026-06-22', 'Stripe', false),
        pago(3, 1666, '2026-07-22', 'Stripe', false),
        null,
      ],
      esBack: false,
    },
    {
      nombre: 'Vanesa Solé',
      email: 'vanesa.sole@gmail.com',
      telefono: '+54 9 11 4321-0006',
      fuente: 'Automática',
      programa: 'M1',
      montoTotal: 3500,
      cuotas: 1,
      setter: 'Mel',
      closer: 'Kevin',
      ingreso: '2026-05',
      pagos: [
        pago(1, 3500, '2026-05-28', 'Transferencia ARS', true),
        null,
        null,
        null,
      ],
      esBack: false,
    },
    {
      nombre: 'Matias Staffolani',
      email: 'matias.staffolani@gmail.com',
      telefono: '+54 9 11 4321-0007',
      fuente: 'Automática',
      programa: 'M1',
      montoTotal: 4500,
      cuotas: 4,
      setter: 'Mel',
      closer: 'Vicky',
      ingreso: '2026-03',
      pagos: [
        pago(1, 1125, '2026-03-10', 'Transferencia USD', true),
        pago(2, 1125, '2026-05-15', 'Transferencia USD', false),
        pago(3, 1125, '2026-07-10', 'Transferencia USD', false),
        pago(4, 1125, '2026-09-10', 'Transferencia USD', false),
      ],
      esBack: false,
    },
    {
      nombre: 'Gabriela Bouvet',
      email: 'gabriela.bouvet@gmail.com',
      telefono: '+54 9 11 4321-0008',
      fuente: 'Automática',
      programa: 'M2',
      montoTotal: 6500,
      cuotas: 4,
      setter: 'Mel',
      closer: 'Fabri',
      ingreso: '2026-03',
      pagos: [
        pago(1, 2000, '2026-03-15', 'Stripe', true),
        pago(2, 1500, '2026-04-15', 'Stripe', true),
        pago(3, 1500, '2026-05-15', 'Stripe', true),
        pago(4, 1500, '2026-06-15', 'Stripe', false),
      ],
      esBack: false,
    },
    {
      nombre: 'Mariano Chiesa',
      email: 'mariano.chiesa@gmail.com',
      telefono: '+54 9 11 4321-0009',
      fuente: 'BACK',
      programa: 'M2',
      montoTotal: 6550,
      cuotas: 3,
      setter: 'Mel',
      closer: 'Braian',
      ingreso: '2026-03',
      pagos: [
        pago(1, 2550, '2026-03-20', 'Transferencia ARS', true),
        pago(2, 2000, '2026-05-20', 'Transferencia ARS', false),
        pago(3, 2000, '2026-07-20', 'Transferencia ARS', false),
        null,
      ],
      esBack: true,
    },
    {
      nombre: 'Maria Bidegain',
      email: 'maria.bidegain@gmail.com',
      telefono: '+54 9 11 4321-0010',
      fuente: 'Automática',
      programa: 'M1',
      montoTotal: 5000,
      cuotas: 3,
      setter: 'Mel',
      closer: 'Kevin',
      ingreso: '2026-04',
      pagos: [
        pago(1, 2000, '2026-04-10', 'Stripe', true),
        pago(2, 1500, '2026-05-10', 'Stripe', false),
        pago(3, 1500, '2026-06-10', 'Stripe', false),
        null,
      ],
      esBack: false,
    },
    {
      nombre: 'Emilia Picchi',
      email: 'emilia.picchi@gmail.com',
      telefono: '+54 9 11 4321-0011',
      fuente: 'Automática',
      programa: 'M1',
      montoTotal: 6500,
      cuotas: 1,
      setter: 'Mel',
      closer: 'Vicky',
      ingreso: '2026-04',
      pagos: [
        pago(1, 6500, '2026-04-05', 'Transferencia USD', true),
        null,
        null,
        null,
      ],
      esBack: false,
    },
    {
      nombre: 'Agustina Bombau',
      email: 'agustina.bombau@gmail.com',
      telefono: '+54 9 11 4321-0012',
      fuente: 'BACK',
      programa: 'M2',
      montoTotal: 5000,
      cuotas: 1,
      setter: 'Mel',
      closer: 'Braian',
      ingreso: '2026-03',
      pagos: [
        pago(1, 5000, '2026-03-25', 'Transferencia USD', true),
        null,
        null,
        null,
      ],
      esBack: true,
    },
  ].map(c => ({ ...c, montoPagado: calcMontoPagado(c.pagos) }));

  return clientes;
}

// ── RECOLECCION ───────────────────────────────────────────────────────────────
export function getMockRecoleccionData() {
  const TODAY = '2026-06-01';

  function pago(n, monto, fecha, metodo, estado) {
    const clasificacion =
      metodo.startsWith('Transferencia') ? 'argentina' :
      metodo === 'Efectivo' ? 'efectivo' : 'usa';
    const fechaISO = fecha;
    const fechaDisplay = fecha ? fecha.split('-').reverse().join('/') : '';
    const estadoStr =
      estado === true ? 'Cobrado' :
      (estado === false && fecha && fecha < TODAY) ? 'Vencido' : 'Pendiente';
    return { n, monto, fecha: fechaDisplay, fechaISO, metodo, clasificacion, estado: estadoStr };
  }

  return [
    {
      nombre: 'Alejandra Navarro',
      email: 'alejandra.navarro@gmail.com',
      telefono: '+54 9 11 5321-0001',
      fuente: 'BACK',
      programa: 'M1',
      montoTotal: 5500,
      cuotas: 2,
      ingreso: '2025-10',
      pagos: [
        pago(1, 2750, '2025-10-15', 'Transferencia USD', true),
        pago(2, 2750, '2025-11-15', 'Transferencia USD', true),
        null,
        null,
      ],
      montoAdeudado: 0,
      completado: true,
      cuotasPagas: 2,
      terminado: false,
    },
    {
      nombre: 'Language Solution',
      email: 'contacto@languagesolution.com',
      telefono: '+1 305 555 0002',
      fuente: 'REPESCA',
      programa: 'M2',
      montoTotal: 10000,
      cuotas: 3,
      ingreso: '2025-10',
      pagos: [
        pago(1, 4000, '2025-10-20', 'PayPal', true),
        pago(2, 3000, '2025-11-20', 'PayPal', true),
        pago(3, 3000, '2025-12-20', 'PayPal', true),
        null,
      ],
      montoAdeudado: 0,
      completado: true,
      cuotasPagas: 3,
      terminado: false,
    },
    {
      nombre: 'Facundo Castro',
      email: 'facundo.castro@gmail.com',
      telefono: '+54 9 11 5321-0003',
      fuente: 'IG - SETTER',
      programa: 'M1',
      montoTotal: 5000,
      cuotas: 3,
      ingreso: '2025-12',
      pagos: [
        pago(1, 2000, '2025-12-10', 'Dolarapp', true),
        pago(2, 1500, '2026-04-10', 'Dolarapp', false),
        pago(3, 1500, '2026-06-10', 'Dolarapp', false),
        null,
      ],
      montoAdeudado: 3000,
      completado: false,
      cuotasPagas: 1,
      terminado: false,
    },
    {
      nombre: 'Daiana Collazo',
      email: 'daiana.collazo@gmail.com',
      telefono: '+54 9 11 5321-0004',
      fuente: 'BIO',
      programa: 'M1',
      montoTotal: 5000,
      cuotas: 2,
      ingreso: '2025-12',
      pagos: [
        pago(1, 2500, '2025-12-05', 'Transferencia ARS', true),
        pago(2, 2500, '2026-01-05', 'Transferencia USD', true),
        null,
        null,
      ],
      montoAdeudado: 0,
      completado: true,
      cuotasPagas: 2,
      terminado: false,
    },
    {
      nombre: 'Gianna Guastella',
      email: 'gianna.guastella@gmail.com',
      telefono: '+54 9 11 5321-0005',
      fuente: 'BACK',
      programa: 'M1',
      montoTotal: 10000,
      cuotas: 2,
      ingreso: '2025-07',
      pagos: [
        pago(1, 5000, '2025-07-18', 'Transferencia USD', true),
        pago(2, 5000, '2025-08-18', 'Transferencia USD', true),
        null,
        null,
      ],
      montoAdeudado: 0,
      completado: true,
      cuotasPagas: 2,
      terminado: false,
    },
    {
      nombre: 'Claudia di Paolo',
      email: 'claudia.dipaolo@gmail.com',
      telefono: '+54 9 11 5321-0006',
      fuente: 'IG - SETTER',
      programa: 'M1',
      montoTotal: 5000,
      cuotas: 3,
      ingreso: '2025-12',
      pagos: [
        pago(1, 2000, '2025-12-20', 'Transferencia USD', true),
        pago(2, 1500, '2026-01-20', 'Transferencia USD', true),
        pago(3, 1500, '2026-02-20', 'Transferencia USD', true),
        null,
      ],
      montoAdeudado: 0,
      completado: true,
      cuotasPagas: 3,
      terminado: false,
    },
  ];
}
