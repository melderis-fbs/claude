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
