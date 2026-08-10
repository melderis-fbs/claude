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
const Kpi = ({ label, value, hint, dark, small, w20 }) => (
  <View style={w20 ? s.kpi20 : s.kpi}>
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
  const { label, m, cuo, resumen = [], cobranzas = [], anuncio = {}, ventaMes = null, pendientesPorMes = {}, emitido } = data;

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
            {fuentes.length > 0 && <R3 a="Total" b={money(fuentes.reduce((a, [, d]) => a + d.monto, 0))} c={String(fuentes.reduce((a, [, d]) => a + d.count, 0))} tot />}
          </View>

          <View style={s.col}>
            <Text style={s.capLabel}>Lugar de ingreso del pago (venta nueva)</Text>
            <View style={s.th}><Text style={[s.thc, s.cL]}>Origen</Text><Text style={[s.thc, s.cRn]}>Monto</Text><Text style={[s.thc, s.cRs]}>Vtas.</Text></View>
            <R3 a="Argentina" b={money(m.montoAR || 0)} c={String(m.ventasAR || 0)} />
            <R3 a="Exterior" b={money(m.montoExt || 0)} c={String(m.ventasExt || 0)} />
            <R3 a="Efectivo" b={money(m.montoEfectivo || 0)} c={String(m.ventasEfectivo || 0)} />
            <R3 a="Total" b={money((m.montoAR || 0) + (m.montoExt || 0) + (m.montoEfectivo || 0))} c={String((m.ventasAR || 0) + (m.ventasExt || 0) + (m.ventasEfectivo || 0))} tot />

            <View style={{ height: 10 }} />
            <Text style={s.capLabel}>Declarado vs. no declarado (venta)</Text>
            <View style={s.th}><Text style={[s.thc, s.cL]}>Concepto</Text><Text style={[s.thc, s.cRn]}>Monto</Text><Text style={[s.thc, s.cRs]}>% s/tot</Text></View>
            <R3 a="Declarado (Argentina)" b={money(ventaDecl)} c={share(ventaDecl, ventaTotal)} />
            <R3 a="No declarado (Ext. + efvo.)" b={money(ventaNoDecl)} c={share(ventaNoDecl, ventaTotal)} />
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
        <Text style={s.note}>Declarado (Argentina) {money(recDecl)} · No declarado (ext. + efvo.) {money(recNoDecl)}.</Text>

        <View style={[s.twoCol, { marginTop: 9 }]}>
          <View style={s.col}><View style={s.panel}>
            <Text style={s.kL}>Tasa de recolección · venta nueva</Text>
            <Text style={s.kV}>{pctv(m.pctCC)}</Text>
            <Text style={s.kH}>{money(cashNuevoTotal)} primeros pagos ÷ {money(ventaTotal)} venta del mes</Text>
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
        {proy.length > 0 && (
          <>
            <Text style={s.capLabel}>Proyección de cobranza · cuotas pendientes por mes de vencimiento</Text>
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
        <View style={s.twoCol}>
          <View style={s.col}><View style={s.panelDark}>
            <Text style={s.kLd}>Devengada · sobre lo vendido</Text>
            <Text style={s.kVd}>{pctv(m.rentabilidad)}</Text>
            <Text style={s.kHd}>ganancia {money(m.ganancia)} · fact. {money(ventaTotal)} − costos {money(m.totalCostos)}</Text>
          </View></View>
          <View style={s.col}><View style={s.panel}>
            <Text style={s.kL}>Cobrada · sobre lo ingresado</Text>
            <Text style={s.kV}>{pctv(rentCobrada)}</Text>
            <Text style={s.kH}>ganancia {money(gananciaCobrada)} · recol. {money(m.cashTotal)} − costos {money(m.totalCostos)}</Text>
          </View></View>
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

        <View style={[s.twoCol, { marginTop: 12 }]}>
          <View style={s.col}>
            <Text style={s.capLabel}>Recolección de venta nueva</Text>
            <View style={s.th}><Text style={[s.thc, s.cL]}>Mes</Text><Text style={[s.thc, s.cRn]}>Cobrado</Text><Text style={[s.thc, s.cRs]}>%</Text></View>
            {resumen.map(r => (
              <R3 key={r.mes} a={r.label} b={money((r.cashNuevoAR || 0) + (r.cashNuevoExt || 0) + (r.cashNuevoEfectivo || 0))} c={pctv(r.pctCC)} />
            ))}
          </View>
          <View style={s.col}>
            <Text style={s.capLabel}>Cobranza de cuotas</Text>
            <View style={s.th}><Text style={[s.thc, s.cL]}>Mes</Text><Text style={[s.thc, s.cRn]}>Cobrado</Text><Text style={[s.thc, s.cRs]}>%</Text></View>
            {cobranzas.map(c => (
              <R3 key={c.mes} a={c.label} b={money(c.cobrado)} c={pctv(c.pctCobrado)} />
            ))}
          </View>
        </View>

        {/* Apartado Meta Ads */}
        <SecTitle n="A">Meta Ads — {label}</SecTitle>
        <View style={s.kpiWrap}>
          <Kpi w20 label="Inversión" value={money(anuncio.inversion)} hint="gasto pauta" />
          <Kpi w20 dark label="ROAS" value={xv(anuncio.roas)} hint={anuncio.roasCash != null ? `cash ${xv(anuncio.roasCash)}` : 'ventas ÷ inv.'} />
          <Kpi w20 label="ROAS Cash" value={xv(anuncio.roasCash)} hint="cobros ÷ inv." />
          <Kpi w20 label="Costo / lead" value={anuncio.costoLead != null ? money(anuncio.costoLead) : '—'} hint="inv. ÷ leads" />
          <Kpi w20 label="Costo / agenda" value={anuncio.costoAgenda != null ? money(anuncio.costoAgenda) : '—'} hint="inv. ÷ agendas" />
        </View>
        <Foot />
      </Page>
    </Document>
  );
}
