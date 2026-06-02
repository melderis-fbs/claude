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

export function normalizarMes(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  const lower = s.toLowerCase();
  for (const [nombre, num] of Object.entries(MESES_ES)) {
    if (lower.includes(nombre)) {
      const year = s.match(/\d{4}/)?.[0] ?? String(new Date().getFullYear());
      return `${year}-${num}`;
    }
  }
  const m1 = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m1) return `${m1[2]}-${m1[1].padStart(2, '0')}`;
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m2) return `${m2[3]}-${m2[2].padStart(2, '0')}`;
  return s;
}

export function mesLabel(yyyyMM) {
  if (!yyyyMM) return '';
  const [year, month] = yyyyMM.split('-');
  const nombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${nombres[parseInt(month) - 1]} ${year}`;
}

export function parseMonto(val) {
  if (!val && val !== 0) return 0;
  const n = parseFloat(String(val).replace(/[,$\s]/g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

export function esBack(cliente) {
  return (cliente['Programa'] || '').toString().toLowerCase().includes('back');
}

export function getPagosCliente(cliente) {
  return CUOTAS_DEF.map(q => ({
    monto:   parseMonto(cliente[q.monto]),
    mes:     normalizarMes(cliente[q.fecha]),
    metodo:  cliente[q.metodo]  || '',
    pagado:  (cliente[q.estado] || '').toString().toUpperCase() === 'SI',
    esBack:  esBack(cliente),
    closer:  (cliente['CLOSER'] || '').trim(),
    nombre:  (cliente['Nombre'] || '').trim(),
    programa:(cliente['Programa'] || '').trim(),
  })).filter(p => p.monto > 0);
}

// ── Resumen económico ─────────────────────────────────────────────────────────

export function calcularResumenMensual(clientes, egresosRows = []) {
  const ventasPorMes = {};
  const cashPorMes   = {};

  for (const c of clientes) {
    const mesIngreso = normalizarMes(c['Ingreso']);
    if (mesIngreso) {
      if (!ventasPorMes[mesIngreso]) ventasPorMes[mesIngreso] = { nuevas:0, back:0, front:0, montoBack:0 };
      const monto = parseMonto(c['Monto total']);
      if (esBack(c)) { ventasPorMes[mesIngreso].back++;  ventasPorMes[mesIngreso].montoBack += monto; }
      else           { ventasPorMes[mesIngreso].nuevas++; ventasPorMes[mesIngreso].front    += monto; }
    }
    for (const p of getPagosCliente(c)) {
      if (!p.pagado || !p.mes) continue;
      if (!cashPorMes[p.mes]) cashPorMes[p.mes] = { total:0, front:0, back:0, porMetodo:{} };
      cashPorMes[p.mes].total += p.monto;
      if (p.esBack) cashPorMes[p.mes].back += p.monto;
      else          cashPorMes[p.mes].front += p.monto;
      const met = p.metodo || 'Otro';
      cashPorMes[p.mes].porMetodo[met] = (cashPorMes[p.mes].porMetodo[met] || 0) + p.monto;
    }
  }

  // Egresos: agrupar por mes y categoría
  const egresosPorMes = {};
  for (const e of egresosRows) {
    const mes = normalizarMes(e['Mes'] || e['mes']);
    if (!mes) continue;
    if (!egresosPorMes[mes]) egresosPorMes[mes] = {};
    const cat   = String(e['Categoría'] || e['Categoria'] || e['categoria'] || 'Otros').trim();
    const monto = parseMonto(e['Monto'] || e['monto']);
    egresosPorMes[mes][cat] = (egresosPorMes[mes][cat] || 0) + monto;
  }

  const meses = [...new Set([...Object.keys(ventasPorMes), ...Object.keys(cashPorMes)])].sort();

  return meses.map(mes => {
    const v = ventasPorMes[mes] || { nuevas:0, back:0, front:0, montoBack:0 };
    const c = cashPorMes[mes]   || { total:0, front:0, back:0, porMetodo:{} };
    const costos = egresosPorMes[mes] || {};
    const totalCostos = Object.values(costos).reduce((a,b) => a+b, 0);
    const ganancia = c.front - totalCostos;
    const pctCC = v.front > 0 ? (c.front / v.front) * 100 : 0;
    return {
      mes, label: mesLabel(mes),
      ventasNuevas: v.nuevas, ventasBack: v.back, ventasTotal: v.nuevas + v.back,
      montoFront: v.front, montoBack: v.montoBack, montoTotal: v.front + v.montoBack,
      cashTotal: c.total, cashFront: c.front, cashBack: c.back,
      cashPorMetodo: c.porMetodo,
      pctCC,
      costos, totalCostos,
      ganancia, rentabilidad: c.front > 0 ? (ganancia / c.front) * 100 : 0,
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
    totalCash:      Object.values(porMes[mes]).reduce((a,b)=>a+b,0),
    totalComisiones:Object.values(porMes[mes]).reduce((a,b)=>a+b,0) * PCT,
  }));
}

// ── Cobranzas ─────────────────────────────────────────────────────────────────

export function calcularCobranzas(clientes) {
  const porMes = {};
  for (const c of clientes) {
    for (const p of getPagosCliente(c)) {
      if (!p.mes) continue;
      if (!porMes[p.mes]) porMes[p.mes] = { aCobrar:0, cobrado:0, pendiente:0 };
      porMes[p.mes].aCobrar += p.monto;
      if (p.pagado) porMes[p.mes].cobrado   += p.monto;
      else          porMes[p.mes].pendiente += p.monto;
    }
  }
  return Object.entries(porMes).sort(([a],[b])=>a.localeCompare(b))
    .map(([mes, d]) => ({ mes, label: mesLabel(mes), ...d,
      pctCobrado: d.aCobrar > 0 ? (d.cobrado / d.aCobrar)*100 : 0 }));
}

// ── Cobros esta semana ────────────────────────────────────────────────────────

export function calcularCobrosSemanales(clientes) {
  const hoy = new Date();
  const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - ((hoy.getDay()+6)%7));
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6);
  lunes.setHours(0,0,0,0); domingo.setHours(23,59,59,999);

  const cobros = [];
  for (const c of clientes) {
    CUOTAS_DEF.forEach((q, i) => {
      const monto = parseMonto(c[q.monto]);
      if (!monto) return;
      const fechaStr = c[q.fecha];
      if (!fechaStr) return;
      const m = String(fechaStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (!m) return;
      const fecha = new Date(+m[3], +m[2]-1, +m[1]);
      if (fecha >= lunes && fecha <= domingo) {
        cobros.push({
          nombre:  c['Nombre']  || '',
          programa:c['Programa']|| '',
          closer:  c['CLOSER']  || '',
          cuota: i+1, monto, fecha: fechaStr,
          pagado: (c[q.estado]||'').toUpperCase() === 'SI',
          metodo: c[q.metodo] || '',
        });
      }
    });
  }
  return cobros.sort((a,b) => a.fecha.localeCompare(b.fecha));
}
