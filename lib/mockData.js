import { subMonths, format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const CLOSERS = ['María García', 'Carlos López', 'Ana Martín', 'Diego Fernández'];
const NICHOS = ['Fitness', 'Coaching', 'Inmobiliario', 'E-commerce'];
const CLIENTES = [
  'Martín Rodríguez', 'Sofía Herrera', 'Pablo Jiménez', 'Laura Torres', 'Nicolás Ramírez',
  'Valentina Flores', 'Tomás Vargas', 'Camila Mendoza', 'Andrés Castro', 'Florencia Ramos',
  'Ignacio Suárez', 'Lucía Fernández', 'Mateo González', 'Agustina Reyes', 'Sebastián Moreno',
  'Daniela Álvarez', 'Facundo Ruiz', 'Micaela López', 'Ramiro Sánchez', 'Valeria Romero',
];
const RESULTADOS = ['Interesado', 'Cerrado', 'No interesado', 'Seguimiento', 'Sin respuesta', 'Cerrado'];
const PROXIMOS_PASOS = [
  'Enviar propuesta', 'Llamar en 3 días', 'Demo programada', 'Esperar respuesta',
  'Recontactar la semana que viene', 'Enviar contrato', 'Confirmar inicio', 'Cerrar',
];
const OBSERVACIONES = [
  'Cliente muy interesado, pide más información sobre precios',
  'Necesita hablar con su socio antes de decidir',
  'Le gustó la propuesta, tiene dudas sobre el tiempo de implementación',
  'Presupuesto ajustado pero hay voluntad de avanzar',
  'Excelente llamada, cierre probable esta semana',
  'Cliente frío, volver a contactar en 2 semanas',
  'Pidió referencias de otros clientes',
  'Interesado en el plan premium',
];
const CATEGORIAS_EGRESO = ['Marketing', 'Sueldos', 'Herramientas', 'Publicidad', 'Operaciones', 'Impuestos'];
const CONCEPTOS_INGRESO = ['Cierre nuevo', 'Renovación', 'Upsell', 'Consultoría', 'Pago cuota'];
const CONCEPTOS_EGRESO = {
  'Marketing': ['Agencia SEO', 'Diseño gráfico', 'Fotografía', 'Videos'],
  'Sueldos': ['Sueldo equipo ventas', 'Sueldo administración', 'Honorarios'],
  'Herramientas': ['CRM', 'Software edición', 'Hosting', 'Herramientas IA'],
  'Publicidad': ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads'],
  'Operaciones': ['Alquiler oficina', 'Internet', 'Servicios', 'Materiales'],
  'Impuestos': ['IVA', 'Ingresos brutos', 'Monotributo', 'Cargas sociales'],
};

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

function pickRandom(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function randomInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function formatARS(n) {
  return `$ ${n.toLocaleString('es-AR')}`;
}

function getLastFourMonths() {
  const now = new Date();
  return [0, 1, 2, 3].map(i => {
    const d = subMonths(now, i);
    return {
      label: format(d, 'MMMM yyyy', { locale: es }),
      value: format(d, 'yyyy-MM'),
      date: d,
    };
  });
}

export function getMockOverviewData() {
  const rng = seededRandom(20240101);
  const today = new Date();
  const months = getLastFourMonths();
  const currentMonth = months[0];

  const ingresosMes = randomInt(3500000, 7500000, rng);
  const egresosMes = randomInt(1200000, 3000000, rng);
  const balanceNeto = ingresosMes - egresosMes;
  const llamadasHoy = randomInt(8, 22, rng);
  const agendasHoy = randomInt(3, 12, rng);
  const mejorCloser = CLOSERS[randomInt(0, 3, rng)];

  const semanas = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
  const chartData = semanas.map((sem, i) => {
    const rng2 = seededRandom(20240101 + i * 100);
    return {
      semana: sem,
      ingresos: randomInt(700000, 2000000, rng2),
      egresos: randomInt(300000, 800000, rng2),
    };
  });

  const urgentes = [
    { cliente: 'Martín Rodríguez', proximoPaso: 'Enviar propuesta', fecha: format(addDays(today, 1), 'dd/MM'), closer: 'María García' },
    { cliente: 'Sofía Herrera', proximoPaso: 'Llamar para confirmar', fecha: format(today, 'dd/MM'), closer: 'Carlos López' },
    { cliente: 'Pablo Jiménez', proximoPaso: 'Enviar contrato', fecha: format(addDays(today, 2), 'dd/MM'), closer: 'Ana Martín' },
  ];

  const topClosers = CLOSERS.map((nombre, i) => {
    const rng3 = seededRandom(20240101 + i * 50);
    const llamadas = randomInt(25, 60, rng3);
    const cierres = randomInt(5, 20, rng3);
    const ingresos = cierres * randomInt(80000, 200000, rng3);
    return { nombre, llamadas, cierres, tasa: ((cierres / llamadas) * 100).toFixed(1), ingresos };
  }).sort((a, b) => b.cierres - a.cierres);

  return {
    ingresosMes,
    egresosMes,
    balanceNeto,
    llamadasHoy,
    agendasHoy,
    mejorCloser,
    chartData,
    urgentes,
    topClosers,
    updatedAt: new Date().toISOString(),
  };
}

export function getMockAgendasData() {
  const rng = seededRandom(20240202);
  const today = new Date();
  const agendas = [];

  for (let dayOffset = -2; dayOffset <= 7; dayOffset++) {
    const date = addDays(today, dayOffset);
    const count = randomInt(2, 6, rng);
    for (let i = 0; i < count; i++) {
      const rng2 = seededRandom(20240202 + dayOffset * 100 + i * 17);
      const hour = randomInt(9, 18, rng2);
      const minute = pickRandom(['00', '30'], rng2);
      agendas.push({
        fecha: format(date, 'yyyy-MM-dd'),
        fechaDisplay: format(date, "EEEE dd/MM", { locale: es }),
        hora: `${hour}:${minute}`,
        cliente: pickRandom(CLIENTES, rng2),
        nicho: pickRandom(NICHOS, rng2),
        estado: pickRandom(['Pendiente', 'Confirmada', 'Cancelada', 'Confirmada', 'Confirmada'], rng2),
        closer: pickRandom(CLOSERS, rng2),
      });
    }
  }

  agendas.sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
    return a.hora.localeCompare(b.hora);
  });

  return agendas;
}

export function getMockLlamadasData() {
  const rng = seededRandom(20240303);
  const today = new Date();
  const llamadas = [];

  for (let dayOffset = -14; dayOffset <= 0; dayOffset++) {
    const date = addDays(today, dayOffset);
    const count = randomInt(3, 8, rng);
    for (let i = 0; i < count; i++) {
      const rng2 = seededRandom(20240303 + dayOffset * 100 + i * 23);
      const resultado = pickRandom(RESULTADOS, rng2);
      const durMin = randomInt(8, 45, rng2);
      const fechaProximo = resultado === 'Cerrado' || resultado === 'No interesado'
        ? null
        : format(addDays(date, randomInt(1, 7, rng2)), 'yyyy-MM-dd');

      llamadas.push({
        fecha: format(date, 'yyyy-MM-dd'),
        fechaDisplay: format(date, "dd/MM/yyyy"),
        closer: pickRandom(CLOSERS, rng2),
        cliente: pickRandom(CLIENTES, rng2),
        nicho: pickRandom(NICHOS, rng2),
        resultado,
        proximoPaso: resultado !== 'Cerrado' && resultado !== 'No interesado' ? pickRandom(PROXIMOS_PASOS, rng2) : '-',
        fechaProximoContacto: fechaProximo ? format(new Date(fechaProximo), 'dd/MM/yyyy') : '-',
        observaciones: pickRandom(OBSERVACIONES, rng2),
        duracion: `${durMin} min`,
      });
    }
  }

  llamadas.sort((a, b) => b.fecha.localeCompare(a.fecha));
  return llamadas;
}

export function getMockClosersData() {
  const months = getLastFourMonths();
  const allData = [];

  months.forEach((month, mi) => {
    CLOSERS.forEach((nombre, ci) => {
      const rng = seededRandom(20240404 + mi * 1000 + ci * 100);
      const llamadas = randomInt(20, 65, rng);
      const cierres = randomInt(4, Math.floor(llamadas * 0.4), rng);
      const tasa = ((cierres / llamadas) * 100).toFixed(1);
      const ingresos = cierres * randomInt(70000, 220000, rng);
      allData.push({ nombre, llamadas, cierres, tasa: parseFloat(tasa), ingresos, mes: month.value, mesLabel: month.label });
    });
  });

  return allData;
}

export function getMockAnunciosData() {
  const months = getLastFourMonths();
  const allData = [];

  months.forEach((month, mi) => {
    const weeks = [1, 2, 3, 4];
    weeks.forEach((week, wi) => {
      const rng = seededRandom(20240505 + mi * 1000 + wi * 100);
      const impresiones = randomInt(15000, 80000, rng);
      const clics = randomInt(300, 2000, rng);
      const inversion = randomInt(80000, 350000, rng);
      const leads = randomInt(20, 120, rng);
      allData.push({
        mes: month.value,
        mesLabel: month.label,
        semana: `Sem ${week}`,
        inversion,
        impresiones,
        clics,
        cpm: ((inversion / impresiones) * 1000).toFixed(0),
        cpc: (inversion / clics).toFixed(0),
        ctr: ((clics / impresiones) * 100).toFixed(2),
        leads,
        cpl: (inversion / leads).toFixed(0),
      });
    });
  });

  return allData;
}

export function getMockIngresosEgresosData() {
  const months = getLastFourMonths();
  const result = {};

  months.forEach((month, mi) => {
    const start = startOfMonth(month.date);
    const end = endOfMonth(month.date);
    const days = eachDayOfInterval({ start, end });
    const ingresos = [];
    const egresos = [];

    days.forEach((day, di) => {
      if (di % 3 !== 0) return;
      const rng = seededRandom(20240606 + mi * 10000 + di * 100);
      if (rng() > 0.5) {
        const closer = pickRandom(CLOSERS, rng);
        const concepto = pickRandom(CONCEPTOS_INGRESO, rng);
        ingresos.push({
          fecha: format(day, 'dd/MM/yyyy'),
          fechaSort: format(day, 'yyyy-MM-dd'),
          concepto: `${concepto} - ${pickRandom(CLIENTES, rng)}`,
          monto: randomInt(80000, 350000, rng),
          closer,
        });
      }
      if (rng() > 0.6) {
        const cat = pickRandom(CATEGORIAS_EGRESO, rng);
        const conceptosArr = CONCEPTOS_EGRESO[cat];
        egresos.push({
          fecha: format(day, 'dd/MM/yyyy'),
          fechaSort: format(day, 'yyyy-MM-dd'),
          concepto: pickRandom(conceptosArr, rng),
          categoria: cat,
          monto: randomInt(15000, 280000, rng),
        });
      }
    });

    result[month.value] = {
      ingresos: ingresos.sort((a, b) => a.fechaSort.localeCompare(b.fechaSort)),
      egresos: egresos.sort((a, b) => a.fechaSort.localeCompare(b.fechaSort)),
      mesLabel: month.label,
    };
  });

  return result;
}

export function getLastFourMonthsList() {
  return getLastFourMonths();
}
