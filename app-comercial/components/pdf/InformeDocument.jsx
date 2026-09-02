import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

// Paleta monocromática (igual que el resto de los documentos).
const DARK = '#1a1a1a';
const GRAY = '#666666';
const MUT  = '#999999';
const CREAM = '#faf9f6';
const LINE  = '#e2e2e2';

const money = n => {
  const num = Math.round(Number(n) || 0);
  const abs = String(Math.abs(num)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (num < 0 ? '-$' : '$') + abs;
};
// Dinero con 2 decimales (para costos chicos: CPL, CPM…).
const money2 = n => {
  if (n == null || isNaN(n)) return '—';
  const [i, d] = Math.abs(Number(n)).toFixed(2).split('.');
  return (Number(n) < 0 ? '-$' : '$') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + d;
};
const pctv = n => (n == null || isNaN(n) ? '—' : `${Number(n).toFixed(1).replace('.', ',')}%`);
const xv   = n => (n == null || isNaN(n) ? '—' : `${Number(n).toFixed(2).replace('.', ',')}x`);
const share = (part, whole) => (whole > 0 ? pctv((part / whole) * 100) : '—');

const s = StyleSheet.create({
  page: { paddingTop: 38, paddingBottom: 42, paddingHorizontal: 42, fontFamily: 'Helvetica', backgroundColor: '#fff', color: DARK, fontSize: 8.5 },

  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 9, letterSpacing: 1.5, color: DARK },
  brandSub: { fontSize: 6.5, color: MUT, letterSpacing: 1, marginTop: 1 },
  logoImage: { width: 38, height: 38, objectFit: 'contain' },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 19, color: DARK, letterSpacing: 0.3 },
  subtitle: { fontSize: 9, color: GRAY, marginTop: 2 },
  metaLine: { fontSize: 7.5, color: MUT, marginTop: 1 },
  rule: { borderBottomWidth: 1.5, borderBottomColor: DARK, marginTop: 7, marginBottom: 4 },

  secTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 7 },
  secNum: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#fff', backgroundColor: DARK, width: 14, height: 14, borderRadius: 7, textAlign: 'center', paddingTop: 3, marginRight: 7 },
  secTitle: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: DARK, letterSpacing: 0.2 },
  capLabel: { fontSize: 6.8, letterSpacing: 0.6, color: GRAY, marginBottom: 4, textTransform: 'uppercase' },

  kpiWrap: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 },
  kpi: { width: '33.333%', paddingHorizontal: 3, marginBottom: 6 },
  kpi25: { width: '25%', paddingHorizontal: 3, marginBottom: 6 },
  kpi20: { width: '20%', paddingHorizontal: 3, marginBottom: 6 },
  cardLight: { backgroundColor: CREAM, borderWidth: 0.5, borderColor: LINE, borderRadius: 4, padding: 8 },
  cardDark: { backgroundColor: DARK, borderRadius: 4, padding: 8 },
  kL: { fontSize: 6.3, letterSpacing: 0.5, color: GRAY, marginBottom: 3, textTransform: 'uppercase' },
  kLd: { fontSize: 6.3, letterSpacing: 0.5, color: '#bbb', marginBottom: 3, textTransform: 'uppercase' },
  kV: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: DARK },
  kVd: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: '#fff' },
  kVsm: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: DARK },
  kH: { fontSize: 6.2, color: MUT, marginTop: 2 },
  kHd: { fontSize: 6.2, color: '#999', marginTop: 2 },

  th: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: DARK, paddingBottom: 3, marginBottom: 1 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 3.5 },
  trTot: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: DARK, paddingVertical: 4, marginTop: 1 },
  thc: { fontFamily: 'Helvetica-Bold', fontSize: 6.6, letterSpacing: 0.3, color: DARK, textTransform: 'uppercase' },
  td: { fontSize: 8.3, color: DARK },
  tdM: { fontSize: 8.3, color: GRAY },
  tdB: { fontFamily: 'Helvetica-Bold', fontSize: 8.3, color: DARK },
  cL: { flex: 1 },
  cR: { flex: 1, textAlign: 'right' },
  cRn: { width: 66, textAlign: 'right' },
  cRs: { width: 54, textAlign: 'right' },

  note: { fontSize: 6.6, color: MUT, marginTop: 4, lineHeight: 1.35 },
  twoCol: { flexDirection: 'row', marginHorizontal: -6 },
  col: { flex: 1, paddingHorizontal: 6 },
  panel: { backgroundColor: CREAM, borderWidth: 0.5, borderColor: LINE, borderRadius: 4, padding: 9 },
  panelDark: { backgroundColor: DARK, borderRadius: 4, padding: 9 },
  footer: { position: 'absolute', bottom: 18, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 5 },
  footerTxt: { fontSize: 6.3, color: MUT },
});

const SecTitle = ({ n, children }) => (
  <View style={s.secTitleRow}><Text style={s.secNum}>{n}</Text><Text style={s.secTitle}>{children}</Text></View>
);
const Kpi = ({ label, value, hint, dark, small, w20, w25 }) => (
  <View style={w20 ? s.kpi20 : w25 ? s.kpi25 : s.kpi}>
    <View style={dark ? s.cardDark : s.cardLight}>
      <Text style={dark ? s.kLd : s.kL}>{label}</Text>
      <Text style={dark ? s.kVd : (small ? s.kVsm : s.kV)}>{value}</Text>
      {!!hint && <Text style={dark ? s.kHd : s.kH}>{hint}</Text>}
    </View>
  </View>
);
const Foot = () => (
  <View style={s.footer} fixed>
    <Text style={s.footerTxt}>Founders BS · Informe financiero</Text>
    <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
);
const R3 = ({ a, b, c, bold, tot }) => (
  <View style={tot ? s.trTot : s.tr}>
    <Text style={[bold || tot ? s.tdB : s.td, s.cL]}>{a}</Text>
    <Text style={[bold || tot ? s.tdB : s.td, s.cRn]}>{b}</Text>
    <Text style={[bold || tot ? s.tdB : s.tdM, s.cRs]}>{c}</Text>
  </View>
);

export default function InformeDocument({ data, logoSrc }) {
  const { label, m, cuo, resumen = [], cobranzas = [], anuncio = {}, ventaMes = null, pendientesPorMes = {}, emitido,
          saldoDelMes = { porVenc: {}, total: 0, ingresado: 0 }, recolOrigen = { primerosPagos: 0, porOrigen: {}, totalCuotas: 0 } } = data;

  const ventaTotal = (m.montoFront || 0) + (m.montoBack || 0);
  const cashNuevoTotal = (m.cashNuevoAR || 0) + (m.cashNuevoExt || 0) + (m.cashNuevoEfectivo || 0);
  const costEntries = Object.entries(m.costos || {}).sort((a, b) => b[1] - a[1]);

  // Declarado = Argentina; No declarado = Exterior + Efectivo (según el informe).
  const ventaDecl = m.montoAR || 0;
  const ventaNoDecl = (m.montoExt || 0) + (m.montoEfectivo || 0);
  const recDecl = m.cashTotalAR || 0;
  const recNoDecl = (m.cashTotalExt || 0) + (m.cashTotalEfectivo || 0);

  // Origen de la venta por fuente.
  const fuentes = ventaMes?.porFuente
    ? Object.entries(ventaMes.porFuente).sort((a, b) => b[1].monto - a[1].monto)
    : [];

  // Proyección de cobranza (cuotas pendientes por mes de vencimiento).
  const mesLbl = mk => {
    const M = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const p = String(mk).split('-'); return p.length === 2 ? `${M[(+p[1]) - 1]} ${p[0]}` : mk;
  };
  const proy = Object.entries(pendientesPorMes)
    .map(([mes, arr]) => [mes, (arr || []).reduce((a, p) => a + (p.monto || 0), 0)])
    .filter(([, v]) => v > 0).sort(([a], [b]) => a.localeCompare(b));
  const proyTotal = proy.reduce((a, [, v]) => a + v, 0);

  // Saldo por cobrar de las VENTAS del mes, por mes de vencimiento.
  const saldoVenc = Object.entries(saldoDelMes.porVenc || {})
    .filter(([, v]) => v > 0).sort(([a], [b]) => a.localeCompare(b));
  // Caja del mes por ORIGEN: primeros pagos (propio) + cuotas de meses anteriores.
  const recolOrig = Object.entries(recolOrigen.porOrigen || {})
    .filter(([, v]) => v > 0).sort(([a], [b]) => a.localeCompare(b));
  const recolTotal = (recolOrigen.primerosPagos || 0) + (recolOrigen.totalCuotas || 0);

  // Embudo completo de Meta (todas las filas del tracker, en orden).
  const funnel = Array.isArray(anuncio.metricas) ? anuncio.metricas : [];
  const fmtMetrica = (v, tipo) => {
    if (v == null || isNaN(v)) return '—';
    const n = Number(v);
    if (tipo === 'money') {
      const a = Math.abs(n);
      return a > 0 && a < 100 ? `$${n.toFixed(2).replace('.', ',')}` : money(n);
    }
    if (tipo === 'x')   return `${n.toFixed(2).replace('.', ',')}x`;
    if (tipo === 'pct') return `${(n * 100).toFixed(2).replace('.', ',')}%`;
    return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
  };

  // ── Totales y promedios de las tablas de evolución ──────────────────────────
  const sum = (arr, f) => arr.reduce((acc, x) => acc + (f(x) || 0), 0);
  const avg = vals => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
  const evoTot = {
    fact:     sum(resumen, r => (r.montoFront || 0) + (r.montoBack || 0)),
    recol:    sum(resumen, r => r.cashTotal),
    costos:   sum(resumen, r => r.totalCostos),
    ganancia: sum(resumen, r => r.ganancia),
    rentProm: avg(resumen.filter(r => Object.keys(r.costos || {}).length).map(r => r.rentabilidad)),
  };
  const recNuevaTot = {
    cobrado: sum(resumen, r => (r.cashNuevoAR || 0) + (r.cashNuevoExt || 0) + (r.cashNuevoEfectivo || 0)),
    pctProm: avg(resumen.map(r => r.pctCC).filter(v => v != null)),
  };
  const cobrCuotasTot = {
    cobrado: sum(cobranzas, c => c.cobrado),
    pctProm: avg(cobranzas.map(c => c.pctCobrado).filter(v => v != null)),
  };

  // ── Meta Ads: serie mensual + embudo del mes seleccionado ───────────────────
  const anunciosPorMes = data.anunciosPorMes || {};
  const metaMeses = Object.keys(anunciosPorMes).sort();
  const getMetV = (d, re) => { const mt = (d?.metricas || []).find(x => re.test(x.label)); return mt ? mt.value : null; };
  const metaSerie = metaMeses.map(mk => {
    const d = anunciosPorMes[mk] || {};
    return {
      mes: mk, label: mesLbl(mk),
      inversion: d.inversion ?? null,
      cierres:   d.cierres ?? null,
      cpa: (d.inversion != null && d.cierres) ? d.inversion / d.cierres : null,
      roas: d.roas ?? null,
    };
  });
  const metaTot = {
    inversion: sum(metaSerie, x => x.inversion),
    cierres:   sum(metaSerie, x => x.cierres),
  };
  metaTot.cpa  = metaTot.cierres ? metaTot.inversion / metaTot.cierres : null;
  metaTot.roas = avg(metaSerie.map(x => x.roas).filter(v => v != null));
  const roasFmt = n => (n == null || isNaN(n) ? '—' : Number(n).toFixed(2).replace('.', ','));

  const aAgendas   = getMetV(anuncio, /agendas?\s*(calif|cualif)/i);
  const aLeadsAfsa = getMetV(anuncio, /leads?\s*afsa/i);
  const aLeadsAbo  = getMetV(anuncio, /leads?\s*abo/i);
  const aLeads     = (aLeadsAfsa || aLeadsAbo) ? (aLeadsAfsa || 0) + (aLeadsAbo || 0) : aAgendas;
  const aAsist     = anuncio.asistencias ?? getMetV(anuncio, /^asistencias/i);
  // %Asistencia: fila de PORCENTAJE (no la de conteo "Asistencias").
  const aPctAsist  = (anuncio.metricas || []).find(x => /asistencia/i.test(x.label) && x.tipo === 'pct')?.value ?? null;
  const aVenta     = anuncio.ventaAuto ?? getMetV(anuncio, /^venta$/i);
  const aFacturado = anuncio.facturado ?? getMetV(anuncio, /facturado/i);
  const aCostoLead = anuncio.costoLead ?? getMetV(anuncio, /\$?\s*lead/i);
  const aCierres   = anuncio.cierres ?? getMetV(anuncio, /^cierres/i);
  const aTasaCierre = (aCierres != null && aAsist) ? (aCierres / aAsist) * 100 : null;

  // Movimientos del período (reembolsos detectados automáticamente).
  const reembolsos = ventaMes?.totalReembolsos || 0;
  const montoReemb = ventaMes?.montoReembolso || 0;

  // Rentabilidad cobrada = (recolección − costos) ÷ recolección.
  const gananciaCobrada = (m.cashTotal || 0) - (m.totalCostos || 0);
  const rentCobrada = m.cashTotal > 0 ? (gananciaCobrada / m.cashTotal) * 100 : null;

  return (
    <Document>
      {/* ── Página 1 ── */}
      <Page size="A4" style={s.page}>
        <View style={s.headRow}>
          <View>
            <Text style={s.title}>Informe financiero</Text>
            <Text style={s.subtitle}>Cierre de {label}</Text>
            {!!emitido && <Text style={s.metaLine}>Emitido {emitido} · Moneda USD consolidado</Text>}
          </View>
          {logoSrc
            ? <Image src={logoSrc} style={s.logoImage} />
            : <View style={{ alignItems: 'flex-end' }}><Text style={s.brand}>FOUNDERS</Text><Text style={s.brandSub}>BUSINESS STRATEGIES</Text></View>}
        </View>
        <View style={s.rule} />

        {/* 1 Resumen */}
        <SecTitle n="1">Resumen</SecTitle>
        <View style={s.kpiWrap}>
          <Kpi dark label="Facturación (venta)" value={money(ventaTotal)} hint={`${m.ventasNuevas || 0} nuevas + ${m.ventasBack || 0} back`} />
          <Kpi label="Rentabilidad devengada" value={pctv(m.rentabilidad)} hint="ganancia ÷ facturación" />
          <Kpi label="Recolección del mes" value={money(m.cashTotal)} hint="caja total ingresada" />
          <Kpi label="Recolección venta nueva" value={pctv(m.pctCC)} hint="primeros pagos ÷ venta" />
          <Kpi label="Cobranza de cuotas" value={cuo ? pctv(cuo.pctCobrado) : '—'} hint="cobrado ÷ lo que vencía" />
          <Kpi label="ROAS" value={xv(anuncio.roas)} hint={`inversión ${money(anuncio.inversion)}`} />
        </View>

        {/* 2 Facturación */}
        <SecTitle n="2">Facturación e ingresos</SecTitle>
        <View style={s.twoCol}>
          <View style={s.col}>
            <View style={s.panelDark}>
              <Text style={s.kLd}>Venta total del mes</Text>
              <Text style={s.kVd}>{money(ventaTotal)}</Text>
              <Text style={s.kHd}>{(m.ventasNuevas || 0) + (m.ventasBack || 0)} operaciones · nuevas {money(m.montoFront)} · back {money(m.montoBack)}</Text>
            </View>
            <View style={{ height: 8 }} />
            <Text style={s.capLabel}>Origen de la venta · por fuente</Text>
            <View style={s.th}><Text style={[s.thc, s.cL]}>Fuente</Text><Text style={[s.thc, s.cRn]}>Monto</Text><Text style={[s.thc, s.cRs]}>Vtas.</Text></View>
            {fuentes.length ? fuentes.map(([f, d]) => (
              <R3 key={f} a={f} b={money(d.monto)} c={String(d.count)} />
            )) : <Text style={s.note}>Sin desglose de fuente para este mes.</Text>}
            {(m.ventasBack || 0) > 0 && <R3 a="Back" b={money(m.montoBack || 0)} c={String(m.ventasBack || 0)} />}
            {(fuentes.length > 0 || (m.ventasBack || 0) > 0) && (
              <R3 a="Total" b={money(ventaTotal)} c={String((m.ventasNuevas || 0) + (m.ventasBack || 0))} tot />
            )}
          </View>

          <View style={s.col}>
            <Text style={s.capLabel}>Lugar de ingreso del pago (venta nueva)</Text>
            <View style={s.th}><Text style={[s.thc, s.cL]}>Origen</Text><Text style={[s.thc, s.cRn]}>Monto</Text><Text style={[s.thc, s.cRs]}>Vtas.</Text></View>
            <R3 a="Argentina" b={money(m.montoAR || 0)} c={String(m.ventasAR || 0)} />
            <R3 a="Exterior" b={money(m.montoExt || 0)} c={String(m.ventasExt || 0)} />
            <R3 a="Efectivo" b={money(m.montoEfectivo || 0)} c={String(m.ventasEfectivo || 0)} />
            <R3 a="Total" b={money((m.montoAR || 0) + (m.montoExt || 0) + (m.montoEfectivo || 0))} c={String((m.ventasAR || 0) + (m.ventasExt || 0) + (m.ventasEfectivo || 0))} tot />
            <Text style={s.note}>Pago full: {money(m.cashNuevoFull || 0)} · Financiado: {money(m.cashNuevoFinanciado || 0)} (según primeros pagos).</Text>
          </View>
        </View>

        {/* 3 Cobros y recolección */}
        <SecTitle n="3">Cobros y recolección</SecTitle>
        <Text style={s.capLabel}>Composición de la recolección · por origen y lugar de ingreso</Text>
        <View style={s.th}>
          <Text style={[s.thc, s.cL]}>Concepto</Text>
          <Text style={[s.thc, s.cRn]}>Argentina</Text>
          <Text style={[s.thc, s.cRn]}>Exterior</Text>
          <Text style={[s.thc, s.cRn]}>Efectivo</Text>
          <Text style={[s.thc, s.cRn]}>Total</Text>
        </View>
        {[
          ['Venta nueva (primeros pagos)', m.cashNuevoAR, m.cashNuevoExt, m.cashNuevoEfectivo, cashNuevoTotal],
          ['Cuotas (meses anteriores)', m.cashCuotaAR, m.cashCuotaExt, m.cashCuotaEfectivo, m.cashCuotaTotal],
        ].map((row, i) => (
          <View style={s.tr} key={i}>
            <Text style={[s.td, s.cL]}>{row[0]}</Text>
            <Text style={[s.td, s.cRn]}>{money(row[1] || 0)}</Text>
            <Text style={[s.td, s.cRn]}>{money(row[2] || 0)}</Text>
            <Text style={[s.td, s.cRn]}>{money(row[3] || 0)}</Text>
            <Text style={[s.tdB, s.cRn]}>{money(row[4] || 0)}</Text>
          </View>
        ))}
        <View style={s.trTot}>
          <Text style={[s.tdB, s.cL]}>Total recolección</Text>
          <Text style={[s.tdB, s.cRn]}>{money(m.cashTotalAR || 0)}</Text>
          <Text style={[s.tdB, s.cRn]}>{money(m.cashTotalExt || 0)}</Text>
          <Text style={[s.tdB, s.cRn]}>{money(m.cashTotalEfectivo || 0)}</Text>
          <Text style={[s.tdB, s.cRn]}>{money(m.cashTotal)}</Text>
        </View>

        <View style={[s.twoCol, { marginTop: 9 }]}>
          <View style={s.col}><View style={s.panel}>
            <Text style={s.kL}>Tasa de recolección · venta nueva</Text>
            <Text style={s.kV}>{pctv(m.pctCC)}</Text>
            <Text style={s.kH}>{money(cashNuevoTotal)} primeros pagos ÷ {money(m.montoFront)} venta nueva del mes</Text>
          </View></View>
          <View style={s.col}><View style={s.panel}>
            <Text style={s.kL}>Cobranza de cuotas</Text>
            <Text style={s.kV}>{cuo ? pctv(cuo.pctCobrado) : '—'}</Text>
            <Text style={s.kH}>{cuo ? `${money(cuo.cobrado)} cobrado ÷ ${money(cuo.aCobrar)} que vencía` : 'sin datos'}</Text>
          </View></View>
        </View>
        <Foot />
      </Page>

      {/* ── Página 2 ── */}
      <Page size="A4" style={s.page}>
        {/* Flujo de cuotas del mes estudiado */}
        <Text style={s.capLabel}>Cuotas de {label} · saldo por cobrar y origen de la caja</Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={[s.kL, { marginBottom: 4 }]}>Saldo por cobrar de las ventas de {label}</Text>
            <View style={s.th}><Text style={[s.thc, s.cL]}>Vence en</Text><Text style={[s.thc, s.cR]}>Monto</Text></View>
            {saldoVenc.length ? saldoVenc.map(([mk, v]) => (
              <View style={s.tr} key={mk}><Text style={[s.td, s.cL]}>{mesLbl(mk)}</Text><Text style={[s.td, s.cR]}>{money(v)}</Text></View>
            )) : <Text style={s.note}>Sin cuotas futuras pendientes de las ventas de este mes.</Text>}
            {saldoVenc.length > 0 && (
              <View style={s.trTot}><Text style={[s.tdB, s.cL]}>Total por cobrar</Text><Text style={[s.tdB, s.cR]}>{money(saldoDelMes.total)}</Text></View>
            )}
          </View>
          <View style={s.col}>
            <Text style={[s.kL, { marginBottom: 4 }]}>Caja de {label} · por mes de origen</Text>
            <View style={s.th}><Text style={[s.thc, s.cL]}>Origen</Text><Text style={[s.thc, s.cR]}>Monto</Text></View>
            <View style={s.tr}><Text style={[s.td, s.cL]}>Venta nueva del mes</Text><Text style={[s.td, s.cR]}>{money(recolOrigen.primerosPagos || 0)}</Text></View>
            {recolOrig.map(([mk, v]) => (
              <View style={s.tr} key={mk}><Text style={[s.td, s.cL]}>Cuotas de ventas de {mesLbl(mk)}</Text><Text style={[s.td, s.cR]}>{money(v)}</Text></View>
            ))}
            <View style={s.trTot}><Text style={[s.tdB, s.cL]}>Total recolectado</Text><Text style={[s.tdB, s.cR]}>{money(recolTotal)}</Text></View>
          </View>
        </View>

        {proy.length > 0 && (
          <>
            <Text style={[s.capLabel, { marginTop: 12 }]}>Proyección de cobranza · cuotas pendientes por mes de vencimiento (todas)</Text>
            <View style={s.th}><Text style={[s.thc, s.cL]}>Mes de vencimiento</Text><Text style={[s.thc, s.cR]}>Cuotas a cobrar</Text></View>
            {proy.map(([mk, v]) => (
              <View style={s.tr} key={mk}><Text style={[s.td, s.cL]}>{mesLbl(mk)}</Text><Text style={[s.td, s.cR]}>{money(v)}</Text></View>
            ))}
            <View style={s.trTot}><Text style={[s.tdB, s.cL]}>Total por cobrar</Text><Text style={[s.tdB, s.cR]}>{money(proyTotal)}</Text></View>
          </>
        )}

        <Text style={[s.capLabel, { marginTop: 12 }]}>Movimientos del período</Text>
        <View style={s.th}><Text style={[s.thc, s.cL]}>Concepto</Text><Text style={[s.thc, s.cRn]}>Cant.</Text><Text style={[s.thc, s.cR]}>Impacto en caja</Text></View>
        <View style={s.tr}><Text style={[s.td, s.cL]}>Reembolsos del mes</Text><Text style={[s.tdM, s.cRn]}>{reembolsos}</Text><Text style={[s.td, s.cR]}>{montoReemb ? money(-Math.abs(montoReemb)) : money(0)}</Text></View>
        <Text style={s.note}>Los reembolsos se detectan automáticamente. Las bajas sin reembolso requieren cargarse aparte (aún no hay fuente de datos).</Text>

        {/* 4 Egresos */}
        <SecTitle n="4">Egresos</SecTitle>
        {costEntries.length > 0 ? (
          <>
            <View style={s.th}>
              <Text style={[s.thc, s.cL]}>Categoría</Text>
              <Text style={[s.thc, s.cRn]}>Monto</Text>
              <Text style={[s.thc, s.cRs]}>% cost.</Text>
              <Text style={[s.thc, s.cRs]}>% vta.</Text>
            </View>
            {costEntries.map(([cat, val]) => (
              <View style={s.tr} key={cat}>
                <Text style={[s.td, s.cL]}>{cat}</Text>
                <Text style={[s.td, s.cRn]}>{money(val)}</Text>
                <Text style={[s.tdM, s.cRs]}>{share(val, m.totalCostos)}</Text>
                <Text style={[s.tdM, s.cRs]}>{share(val, ventaTotal)}</Text>
              </View>
            ))}
            <View style={s.trTot}>
              <Text style={[s.tdB, s.cL]}>Total costos</Text>
              <Text style={[s.tdB, s.cRn]}>{money(m.totalCostos)}</Text>
              <Text style={[s.tdB, s.cRs]}>100%</Text>
              <Text style={[s.tdB, s.cRs]}>{share(m.totalCostos, ventaTotal)}</Text>
            </View>
          </>
        ) : <Text style={s.tdM}>Sin datos de costos para este mes.</Text>}

        {/* 5 Rentabilidad */}
        <SecTitle n="5">Rentabilidad</SecTitle>
        <View style={s.panelDark}>
          <Text style={s.kLd}>Devengada · sobre lo vendido</Text>
          <Text style={s.kVd}>{pctv(m.rentabilidad)}</Text>
          <Text style={s.kHd}>ganancia {money(m.ganancia)} · fact. {money(ventaTotal)} − costos {money(m.totalCostos)}</Text>
        </View>
        <Foot />
      </Page>

      {/* ── Página 3 ── */}
      <Page size="A4" style={s.page}>
        {/* 6 Evolución */}
        <SecTitle n="6">Evolución 2026</SecTitle>
        <View style={s.th}>
          <Text style={[s.thc, s.cL]}>Mes</Text>
          <Text style={[s.thc, s.cRn]}>Facturación</Text>
          <Text style={[s.thc, s.cRn]}>Recolección</Text>
          <Text style={[s.thc, s.cRn]}>Costos</Text>
          <Text style={[s.thc, s.cRn]}>Ganancia</Text>
          <Text style={[s.thc, s.cRs]}>Rent.</Text>
        </View>
        {resumen.map(r => (
          <View style={s.tr} key={r.mes}>
            <Text style={[s.td, s.cL]}>{r.label}</Text>
            <Text style={[s.td, s.cRn]}>{money((r.montoFront || 0) + (r.montoBack || 0))}</Text>
            <Text style={[s.tdM, s.cRn]}>{money(r.cashTotal)}</Text>
            <Text style={[s.tdM, s.cRn]}>{money(r.totalCostos)}</Text>
            <Text style={[s.td, s.cRn]}>{money(r.ganancia)}</Text>
            <Text style={[s.tdB, s.cRs]}>{Object.keys(r.costos || {}).length ? pctv(r.rentabilidad) : '—'}</Text>
          </View>
        ))}
        <View style={s.trTot}>
          <Text style={[s.tdB, s.cL]}>Total anual</Text>
          <Text style={[s.tdB, s.cRn]}>{money(evoTot.fact)}</Text>
          <Text style={[s.tdB, s.cRn]}>{money(evoTot.recol)}</Text>
          <Text style={[s.tdB, s.cRn]}>{money(evoTot.costos)}</Text>
          <Text style={[s.tdB, s.cRn]}>{money(evoTot.ganancia)}</Text>
          <Text style={[s.tdB, s.cRs]}>{pctv(evoTot.rentProm)}</Text>
        </View>

        <View style={[s.twoCol, { marginTop: 12 }]}>
          <View style={s.col}>
            <Text style={s.capLabel}>Recolección de venta nueva</Text>
            <View style={s.th}><Text style={[s.thc, s.cL]}>Mes</Text><Text style={[s.thc, s.cRn]}>Cobrado</Text><Text style={[s.thc, s.cRs]}>%</Text></View>
            {resumen.map(r => (
              <R3 key={r.mes} a={r.label} b={money((r.cashNuevoAR || 0) + (r.cashNuevoExt || 0) + (r.cashNuevoEfectivo || 0))} c={pctv(r.pctCC)} />
            ))}
            <R3 a="Total / prom." b={money(recNuevaTot.cobrado)} c={pctv(recNuevaTot.pctProm)} tot />
          </View>
          <View style={s.col}>
            <Text style={s.capLabel}>Cobranza de cuotas</Text>
            <View style={s.th}><Text style={[s.thc, s.cL]}>Mes</Text><Text style={[s.thc, s.cRn]}>Cobrado</Text><Text style={[s.thc, s.cRs]}>%</Text></View>
            {cobranzas.map(c => (
              <R3 key={c.mes} a={c.label} b={money(c.cobrado)} c={pctv(c.pctCobrado)} />
            ))}
            <R3 a="Total / prom." b={money(cobrCuotasTot.cobrado)} c={pctv(cobrCuotasTot.pctProm)} tot />
          </View>
        </View>

        <Foot />
      </Page>

      {/* ── Página 4 · Meta Ads ── */}
      <Page size="A4" style={s.page}>
        <View style={s.headRow}>
          <View>
            <Text style={s.title}>Meta Ads</Text>
            <Text style={s.subtitle}>{label}</Text>
          </View>
          {logoSrc
            ? <Image src={logoSrc} style={s.logoImage} />
            : <View style={{ alignItems: 'flex-end' }}><Text style={s.brand}>FOUNDERS</Text><Text style={s.brandSub}>BUSINESS STRATEGIES</Text></View>}
        </View>
        <View style={s.rule} />

        {/* Apartado Meta Ads */}
        <SecTitle n="A">Meta Ads — {label}</SecTitle>
        <View style={s.kpiWrap}>
          <Kpi w25 label="Inversión" value={money(anuncio.inversion)} hint="gasto de pauta" />
          <Kpi w25 label="Leads" value={aLeads != null ? String(aLeads) : '—'} hint={aCostoLead != null ? `CPL ${money2(aCostoLead)}` : ''} />
          <Kpi w25 label="Cierres" value={aCierres != null ? String(aCierres) : '—'} hint={aTasaCierre != null ? `${pctv(aTasaCierre)} s/ asistencia` : ''} />
          <Kpi w25 dark label="ROAS" value={roasFmt(anuncio.roas)} hint={anuncio.roasCash != null ? `cash ${roasFmt(anuncio.roasCash)}` : ''} />
        </View>

        <View style={[s.twoCol, { marginTop: 4 }]}>
          {/* Embudo del mes */}
          <View style={s.col}>
            <Text style={s.capLabel}>Embudo</Text>
            <View style={s.th}>
              <Text style={[s.thc, s.cL]}>Etapa</Text>
              <Text style={[s.thc, s.cRn]}>Valor</Text>
              <Text style={[s.thc, s.cRs]}>Costo / tasa</Text>
            </View>
            <R3 a="Agendas cualificadas" b={aAgendas != null ? String(aAgendas) : '—'} c={aCostoLead != null ? money2(aCostoLead) : '—'} />
            <R3 a="Asistencias" b={aAsist != null ? String(aAsist) : '—'} c={aPctAsist != null ? pctv(aPctAsist * 100) : '—'} />
            <R3 a="Cierres" b={aCierres != null ? String(aCierres) : '—'} c={aTasaCierre != null ? pctv(aTasaCierre) : '—'} />
            <R3 a="Venta" b={aVenta != null ? money(aVenta) : '—'} c="" bold />
            <R3 a="Facturado" b={aFacturado != null ? money(aFacturado) : '—'} c="" bold />
          </View>

          {/* Evolución mensual */}
          <View style={s.col}>
            <Text style={s.capLabel}>Evolución mensual</Text>
            <View style={s.th}>
              <Text style={[s.thc, { flex: 1 }]}>Mes</Text>
              <Text style={[s.thc, { width: 46, textAlign: 'right' }]}>Inv.</Text>
              <Text style={[s.thc, { width: 40, textAlign: 'right' }]}>CPA</Text>
              <Text style={[s.thc, { width: 30, textAlign: 'right' }]}>Cierr.</Text>
              <Text style={[s.thc, { width: 30, textAlign: 'right' }]}>ROAS</Text>
            </View>
            {metaSerie.map(x => (
              <View style={s.tr} key={x.mes}>
                <Text style={[s.td, { flex: 1, fontSize: 7.5 }]}>{x.label}</Text>
                <Text style={[s.td, { width: 46, textAlign: 'right', fontSize: 7.5 }]}>{money(x.inversion)}</Text>
                <Text style={[s.tdM, { width: 40, textAlign: 'right', fontSize: 7.5 }]}>{x.cpa != null ? money(x.cpa) : '—'}</Text>
                <Text style={[s.tdM, { width: 30, textAlign: 'right', fontSize: 7.5 }]}>{x.cierres != null ? String(x.cierres) : '—'}</Text>
                <Text style={[s.tdB, { width: 30, textAlign: 'right', fontSize: 7.5 }]}>{roasFmt(x.roas)}</Text>
              </View>
            ))}
            <View style={s.trTot}>
              <Text style={[s.tdB, { flex: 1 }]}>Total</Text>
              <Text style={[s.tdB, { width: 46, textAlign: 'right', fontSize: 7.5 }]}>{money(metaTot.inversion)}</Text>
              <Text style={[s.tdB, { width: 40, textAlign: 'right', fontSize: 7.5 }]}>{metaTot.cpa != null ? money(metaTot.cpa) : '—'}</Text>
              <Text style={[s.tdB, { width: 30, textAlign: 'right', fontSize: 7.5 }]}>{String(metaTot.cierres)}</Text>
              <Text style={[s.tdB, { width: 30, textAlign: 'right', fontSize: 7.5 }]}>{roasFmt(metaTot.roas)}</Text>
            </View>
          </View>
        </View>
        <Foot />
      </Page>
    </Document>
  );
}
