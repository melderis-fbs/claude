const MESES_ES = {
  'enero':'01','febrero':'02','marzo':'03','abril':'04','mayo':'05','junio':'06',
  'julio':'07','agosto':'08','septiembre':'09','octubre':'10','noviembre':'11','diciembre':'12',
};

export const CUOTAS_DEF = [
  { monto: 'Primer pago',  fecha: 'Fecha de ingreso(1er pago)', metodo: 'Met pago 1',  estado: 'Estado pago 1'  },
  { monto: 'Segundo pago', fecha: 'Fecha 2do pago',             metodo: 'Met pago 2',  estado: 'Estado pago 2'  },
  { monto: 'Tercer pago',  fecha: 'Fecha 3er pago',             metodo: 'Met pago 3',  estado: 'Estado pago 3'  },
  { monto: 'Cuarto Pago',  fecha: 'Fecha 4to pago',             metodo: 'Met pago 4',  estado: 'Estado 4to pago' },
];

function getMesNum(s) {
  const lower = s.toLowerCase().trim();
  for (const [nombre, num] of Object.entries(MESES_ES)) {
    if (lower.startsWith(nombre)) return num;
  }
  return null;
}

// Parsea cualquier formato de fecha/mes conocido → "YYYY-MM" o null
export function normalizarMes(val) {
  if (!val) return null;
  const s = String(val).trim();

  // Ya está en YYYY-MM
  if (/^\d{4}-\d{2}$/.test(s)) return s;

  // ISO 8601: "2025-06-01T03:00:00.000Z" o "2025-06-01"
  // GAS serializa objetos Date como ISO strings
  const iso = s.match(/^(\d{4})-(\d{2})-\d{2}/);
  if (iso) return `${iso[1]}-${iso[2]}`;

  // DD/MM/YYYY o D/M/YYYY
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}`;

  // MM/YYYY
  const my = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (my) return `${my[2]}-${my[1].padStart(2,'0')}`;

  // "Enero 2025", "enero-2025", "Enero/2025", etc.
  const yearMatch = s.match(/(\d{4})/);
  const mesNum = getMesNum(s);
  if (mesNum && yearMatch) return `${yearMatch[1]}-${mesNum}`;

  // Solo nombre de mes sin año → marcar para inferir
  if (mesNum) return `__SIN_ANIO__-${mesNum}`;

  return null;
}

// Normaliza el campo Ingreso: si solo tiene mes sin año, infiere el año
// usando el AÑO MÍNIMO encontrado en las fechas de pago del cliente.
// Esto evita que un cliente de Mayo 2025 quede en Mayo 2026 solo porque
// su cuota 2 cae en 2026.
function normalizarIngreso(ingreso, cliente) {
  const raw = normalizarMes(ingreso);
  if (!raw) return null;
  if (!raw.startsWith('__SIN_ANIO__')) return raw;

  const mesNum = raw.split('-')[1];
  let minAnio = null;
  for (const q of CUOTAS_DEF) {
    const fecha = cliente[q.fecha];
    if (!fecha) continue;
    const m = String(fecha).match(/(\d{4})/);
    if (m) {
      const anio = parseInt(m[1]);
      if (!minAnio || anio < minAnio) minAnio = anio;
    }
  }
  if (minAnio) return `${minAnio}-${mesNum}`;
  return `${new Date().getFullYear() - 1}-${mesNum}`;
}

export function mesLabel(yyyyMM) {
  if (!yyyyMM) return '';
  const [year, month] = yyyyMM.split('-');
  const nombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${nombres[parseInt(month) - 1]} ${year}`;
}

export function parseMonto(val) {
  if (!val && val !== 0) return 0;
  const n = parseFloat(String(val).replace(/[$,\s]/g, '').replace(',','.'));
  return isNaN(n) ? 0 : n;
}

export function esBack(cliente) {
  return (cliente['Programa'] || '').toString().toLowerCase().includes('back');
}

function esPagado(val) {
  if (val === true) return true; // Google Sheets checkbox devuelve booleano true
  const s = String(val || '').toUpperCase().trim();
  return s === 'SI' || s === 'SÍ' || s === 'YES' || s === '1' || s === 'TRUE';
}

export function getPagosCliente(cliente) {
  return CUOTAS_DEF.map(q => ({
    monto:   parseMonto(cliente[q.monto]),
    mes:     normalizarMes(cliente[q.fecha]),
    metodo:  cliente[q.metodo]  || '',
    pagado:  esPagado(cliente[q.estado]),
    esBack:  esBack(cliente),
    closer:  (cliente['CLOSER'] || '').trim(),
    nombre:  (cliente['Nombre'] || '').trim(),
    programa:(cliente['Programa'] || '').trim(),
  })).filter(p => p.monto > 0);
}

// ── Resumen económico ─────────────────────────────────────────────────────────

function esMetodoAR(metodo) {
  const s = String(metodo || '').toUpperCase();
  return s.includes('ARS') || s.includes('EFECTIVO') || s.includes('PESOS');
}

export function calcularResumenMensual(clientes, egresosRows = []) {
  const ventasPorMes = {};
  const cashPorMes   = {};

  for (const c of clientes) {
    const mesIngreso = normalizarIngreso(c['Ingreso'], c);
    if (mesIngreso) {
      if (!ventasPorMes[mesIngreso]) ventasPorMes[mesIngreso] = { nuevas:0, back:0, front:0, montoBack:0, ar:0, arMonto:0, ext:0, extMonto:0 };
      const monto = parseMonto(c['Monto total']);
      if (esBack(c)) { ventasPorMes[mesIngreso].back++;   ventasPorMes[mesIngreso].montoBack += monto; }
      else {
        ventasPorMes[mesIngreso].nuevas++; ventasPorMes[mesIngreso].front += monto;
        const met = c['Met pago 1'] || '';
        if (esMetodoAR(met)) { ventasPorMes[mesIngreso].ar++; ventasPorMes[mesIngreso].arMonto += monto; }
        else if (met)        { ventasPorMes[mesIngreso].ext++; ventasPorMes[mesIngreso].extMonto += monto; }
      }
    }
    CUOTAS_DEF.forEach((q, qi) => {
      if (!esPagado(c[q.estado])) return;
      const monto = parseMonto(c[q.monto]);
      if (!monto) return;
      const mes = normalizarMes(c[q.fecha]);
      if (!mes || mes.startsWith('__')) return;
      if (!cashPorMes[mes]) cashPorMes[mes] = {
        total:0, front:0, back:0, porMetodo:{},
        nuevoFull:0, nuevoFinanciado:0, nuevoAR:0, nuevoExt:0,
        cuotaTotal:0, cuotaAR:0, cuotaExt:0,
      };
      cashPorMes[mes].total += monto;
      const isBack = esBack(c);
      const met = c[q.metodo] || 'Otro';
      if (isBack) cashPorMes[mes].back += monto;
      else        cashPorMes[mes].front += monto;
      cashPorMes[mes].porMetodo[met] = (cashPorMes[mes].porMetodo[met] || 0) + monto;
      if (!isBack) {
        const isAR = esMetodoAR(met);
        if (qi === 0) {
          if (Number(c['Cuotas'] || 1) <= 1) cashPorMes[mes].nuevoFull += monto;
          else cashPorMes[mes].nuevoFinanciado += monto;
          if (isAR) cashPorMes[mes].nuevoAR += monto;
          else      cashPorMes[mes].nuevoExt += monto;
        } else {
          cashPorMes[mes].cuotaTotal += monto;
          if (isAR) cashPorMes[mes].cuotaAR += monto;
          else      cashPorMes[mes].cuotaExt += monto;
        }
      }
    });
  }

  const egresosPorMes = {};
  for (const e of egresosRows) {
    const mes = normalizarMes(e['Mes'] || e['mes']);
    if (!mes || mes.startsWith('__')) continue;
    if (!egresosPorMes[mes]) egresosPorMes[mes] = {};
    const cat = String(e['Categoría'] || e['Categoria'] || e['categoria'] || 'Otros').trim();
    egresosPorMes[mes][cat] = (egresosPorMes[mes][cat] || 0) + parseMonto(e['Monto'] || e['monto']);
  }

  const meses = [...new Set([...Object.keys(ventasPorMes), ...Object.keys(cashPorMes)])].sort();

  return meses.map(mes => {
    const v = ventasPorMes[mes] || { nuevas:0, back:0, front:0, montoBack:0, ar:0, arMonto:0, ext:0, extMonto:0 };
    const c = cashPorMes[mes]   || { total:0, front:0, back:0, porMetodo:{}, nuevoFull:0, nuevoFinanciado:0, nuevoAR:0, nuevoExt:0, cuotaTotal:0, cuotaAR:0, cuotaExt:0 };
    const costos = egresosPorMes[mes] || {};
    const totalCostos = Object.values(costos).reduce((a,b) => a+b, 0);
    const ganancia = c.front - totalCostos;
    const pctCC = v.front > 0 ? (c.front / v.front) * 100 : 0;
    return {
      mes, label: mesLabel(mes),
      ventasNuevas: v.nuevas, ventasBack: v.back, ventasTotal: v.nuevas + v.back,
      montoFront: v.front, montoBack: v.montoBack, montoTotal: v.front + v.montoBack,
      ventasAR: v.ar, montoAR: v.arMonto,
      ventasExt: v.ext, montoExt: v.extMonto,
      cashTotal: c.total, cashFront: c.front, cashBack: c.back,
      cashPorMetodo: c.porMetodo, pctCC,
      cashNuevoFull: c.nuevoFull, cashNuevoFinanciado: c.nuevoFinanciado,
      cashNuevoAR: c.nuevoAR, cashNuevoExt: c.nuevoExt,
      cashCuotaTotal: c.cuotaTotal, cashCuotaAR: c.cuotaAR, cashCuotaExt: c.cuotaExt,
      cashTotalAR: c.nuevoAR + c.cuotaAR, cashTotalExt: c.nuevoExt + c.cuotaExt,
      costos, totalCostos, ganancia,
      rentabilidad: c.front > 0 ? (ganancia / c.front) * 100 : 0,
    };
  });
}

// ── Ventas por mes ────────────────────────────────────────────────────────────

export function calcularVentasPorMes(clientes) {
  const porMes = {};

  for (const c of clientes) {
    const mes = normalizarIngreso(c['Ingreso'], c);
    if (!mes || mes.startsWith('__')) continue;
    if (!porMes[mes]) porMes[mes] = [];
    porMes[mes].push({
      nombre:   (c['Nombre']   || '').trim(),
      programa: (c['Programa'] || '').trim(),
      fuente:   (c['Fuente']   || '').trim(),
      closer:   (c['CLOSER']   || '').trim(),
      setter:   (c['SETTER']   || '').trim(),
      monto:    parseMonto(c['Monto total']),
      esBack:   esBack(c),
      cuotas:   Number(c['Cuotas'] || 1),
      estatus:  (c['Estatus']  || '').trim(),
      rowIndex: c._rowIndex,
    });
  }

  return Object.keys(porMes).sort().map(mes => {
    const ventas  = porMes[mes];
    const nuevas  = ventas.filter(v => !v.esBack);
    const backs   = ventas.filter(v =>  v.esBack);

    const porFuente = {};
    const porCloser = {};
    for (const v of nuevas) {
      const f  = v.fuente  || 'Sin fuente';
      const cl = v.closer  || 'Sin closer';
      porFuente[f]  = porFuente[f]  || { count:0, monto:0 };
      porCloser[cl] = porCloser[cl] || { count:0, monto:0 };
      porFuente[f].count++;  porFuente[f].monto  += v.monto;
      porCloser[cl].count++; porCloser[cl].monto += v.monto;
    }

    return {
      mes, label: mesLabel(mes),
      ventas,
      totalNuevas:  nuevas.length,
      totalBack:    backs.length,
      montoFront:   nuevas.reduce((a,v) => a+v.monto, 0),
      montoBack:    backs.reduce((a,v)  => a+v.monto, 0),
      montoTotal:   ventas.reduce((a,v) => a+v.monto, 0),
      porFuente,
      porCloser,
    };
  });
}

// ── Comisiones ────────────────────────────────────────────────────────────────

export function calcularComisiones(clientes) {
  const PCT = 0.08;
  const porMes = {};
  for (const c of clientes) {
    if (esBack(c)) continue;
    const closer = (c['CLOSER'] || '').trim();
    if (!closer) continue;
    for (const p of getPagosCliente(c)) {
      if (!p.pagado || !p.mes || p.esBack) continue;
      if (!porMes[p.mes]) porMes[p.mes] = {};
      porMes[p.mes][closer] = (porMes[p.mes][closer] || 0) + p.monto;
    }
  }
  return Object.keys(porMes).sort().map(mes => ({
    mes, label: mesLabel(mes),
    detalle: Object.entries(porMes[mes])
      .map(([closer, cash]) => ({ closer, cash, comision: cash * PCT }))
      .sort((a,b) => b.cash - a.cash),
    totalCash:       Object.values(porMes[mes]).reduce((a,b)=>a+b,0),
    totalComisiones: Object.values(porMes[mes]).reduce((a,b)=>a+b,0) * PCT,
  }));
}

// ── Cobranzas ─────────────────────────────────────────────────────────────────

export function calcularCobranzas(clientes) {
  const porMes = {};
  for (const c of clientes) {
    CUOTAS_DEF.slice(1).forEach(q => {
      const monto = parseMonto(c[q.monto]);
      if (!monto) return;
      const mes = normalizarMes(c[q.fecha]);
      if (!mes || mes.startsWith('__')) return;
      if (!porMes[mes]) porMes[mes] = { aCobrar:0, cobrado:0, pendiente:0 };
      porMes[mes].aCobrar += monto;
      if (esPagado(c[q.estado])) porMes[mes].cobrado   += monto;
      else                        porMes[mes].pendiente += monto;
    });
  }
  return Object.entries(porMes).sort(([a],[b])=>a.localeCompare(b))
    .map(([mes, d]) => ({ mes, label: mesLabel(mes), ...d,
      pctCobrado: d.aCobrar > 0 ? (d.cobrado/d.aCobrar)*100 : 0 }));
}

// Pendientes agrupados por mes (se pre-computan server-side para pasar como prop)
export function calcularPendientesPorMes(clientes) {
  const porMes = {};
  for (const c of clientes) {
    CUOTAS_DEF.forEach((q, i) => {
      if (i === 0) return; // primer pago va en Ventas, no en Cobranzas
      if (esPagado(c[q.estado])) return;
      const monto = parseMonto(c[q.monto]);
      if (!monto) return;
      const mes = normalizarMes(c[q.fecha]);
      if (!mes || mes.startsWith('__')) return;
      if (!porMes[mes]) porMes[mes] = [];
      porMes[mes].push({
        nombre:      (c['Nombre']   || '').trim(),
        programa:    (c['Programa'] || '').trim(),
        closer:      (c['CLOSER']   || '').trim(),
        cuota:       i + 1,
        monto,
        fecha:       c[q.fecha]  || '',
        metodo:      c[q.metodo] || '',
        rowIndex:    c._rowIndex,
        campoEstado: q.estado,
      });
    });
  }
  return porMes;
}

// ── Proyección semanal ────────────────────────────────────────────────────────

function parseFechaToDate(fechaStr) {
  if (!fechaStr) return null;
  const s = String(fechaStr).trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return new Date(+dmy[3], +dmy[2]-1, +dmy[1]);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2]-1, +iso[3]);
  return null;
}

function semanaLabel(lunes, domingo) {
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const fl = `${lunes.getDate()} ${meses[lunes.getMonth()]}`;
  const fd = `${domingo.getDate()} ${meses[domingo.getMonth()]} ${domingo.getFullYear()}`;
  return `${fl} – ${fd}`;
}

export function calcularProyeccion(clientes, semanasAtras = 2, semanasAdelante = 10) {
  const hoy = new Date();
  const lunesHoy = new Date(hoy);
  lunesHoy.setDate(hoy.getDate() - ((hoy.getDay()+6)%7));
  lunesHoy.setHours(0,0,0,0);

  const semanas = [];
  for (let w = -semanasAtras; w <= semanasAdelante; w++) {
    const lunes  = new Date(lunesHoy); lunes.setDate(lunesHoy.getDate() + w*7);
    const domingo = new Date(lunes);   domingo.setDate(lunes.getDate()+6); domingo.setHours(23,59,59,999);

    const dias = {};
    for (let d = 0; d < 7; d++) {
      const dia = new Date(lunes); dia.setDate(lunes.getDate()+d);
      dias[dia.toISOString().split('T')[0]] = [];
    }

    for (const c of clientes) {
      CUOTAS_DEF.forEach((q, i) => {
        const monto = parseMonto(c[q.monto]);
        if (!monto) return;
        const fecha = parseFechaToDate(c[q.fecha]);
        if (!fecha || fecha < lunes || fecha > domingo) return;
        const key = fecha.toISOString().split('T')[0];
        if (!dias[key]) return;
        dias[key].push({
          nombre:   (c['Nombre']   || '').trim(),
          programa: (c['Programa'] || '').trim(),
          closer:   (c['CLOSER']   || '').trim(),
          cuota: i+1, esSeña: i === 0, monto,
          fecha: c[q.fecha] || '',
          pagado:      esPagado(c[q.estado]),
          metodo:      c[q.metodo] || '',
          rowIndex:    c._rowIndex,
          campoEstado: q.estado,
        });
      });
    }

    const todos = Object.values(dias).flat();
    semanas.push({
      offset: w, esActual: w === 0,
      lunes: lunes.toISOString().split('T')[0],
      domingo: domingo.toISOString().split('T')[0],
      label: semanaLabel(lunes, domingo),
      dias,
      totalEsperado: todos.reduce((a,c) => a+c.monto, 0),
      totalCobrado:  todos.filter(c => c.pagado).reduce((a,c) => a+c.monto, 0),
      totalPendiente:todos.filter(c => !c.pagado).reduce((a,c) => a+c.monto, 0),
    });
  }
  return semanas;
}

// ── Señas por mes (solo primer pago = seña/depósito) ─────────────────────────

export function calcularSeñasPorMes(clientes) {
  const porMes = {};
  const q = CUOTAS_DEF[0]; // solo cuota 1
  for (const c of clientes) {
    const monto = parseMonto(c[q.monto]);
    if (!monto) continue;
    const mes = normalizarMes(c[q.fecha]);
    if (!mes || mes.startsWith('__')) continue;
    if (!porMes[mes]) porMes[mes] = [];
    porMes[mes].push({
      nombre:      (c['Nombre']   || '').trim(),
      programa:    (c['Programa'] || '').trim(),
      closer:      (c['CLOSER']   || '').trim(),
      monto, fecha: c[q.fecha]||'',
      metodo:      c[q.metodo] || '',
      pagado:      String(c[q.estado]||'').toUpperCase().trim() === 'SI',
      rowIndex:    c._rowIndex,
      campoEstado: q.estado,
    });
  }
  return porMes;
}

// ── Cobros esta semana ────────────────────────────────────────────────────────

export function calcularCobrosSemanales(clientes) {
  const hoy    = new Date();
  const lunes  = new Date(hoy); lunes.setDate(hoy.getDate() - ((hoy.getDay()+6)%7));
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate()+6);
  lunes.setHours(0,0,0,0); domingo.setHours(23,59,59,999);

  const cobros = [];
  for (const c of clientes) {
    CUOTAS_DEF.forEach((q, i) => {
      const monto = parseMonto(c[q.monto]);
      if (!monto) return;
      const fechaStr = c[q.fecha];
      if (!fechaStr) return;

      let fecha = null;
      const dmy = String(fechaStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dmy) {
        fecha = new Date(+dmy[3], +dmy[2]-1, +dmy[1]);
      } else {
        const iso = String(fechaStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (iso) fecha = new Date(+iso[1], +iso[2]-1, +iso[3]);
      }

      if (!fecha) return;
      if (fecha >= lunes && fecha <= domingo) {
        cobros.push({
          nombre:  c['Nombre']   || '',
          programa:c['Programa'] || '',
          closer:  c['CLOSER']   || '',
          cuota:   i+1, monto,
          fecha:   fechaStr,
          pagado:  esPagado(c[q.estado]),
          metodo:  c[q.metodo]   || '',
          rowIndex:    c._rowIndex,
          campoEstado: q.estado,
        });
      }
    });
  }
  return cobros.sort((a,b) => String(a.fecha).localeCompare(String(b.fecha)));
}
