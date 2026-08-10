import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

// Paleta monocromática (igual que el resto de los documentos).
const DARK = '#1a1a1a';
const GRAY = '#666666';
const MUT  = '#999999';
const LIGHT = '#f4f4f4';
const CREAM = '#faf9f6';
const LINE  = '#e2e2e2';

const money = n => {
  const num = Math.round(Number(n) || 0);
  return '$' + String(Math.abs(num)).replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace(/^/, num < 0 ? '-' : '');
};
const pctv = n => (n == null ? '—' : `${Number(n).toFixed(1).replace('.', ',')}%`);

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 44, paddingHorizontal: 42, fontFamily: 'Helvetica', backgroundColor: '#fff', color: DARK, fontSize: 8.5 },

  // Header
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 9, letterSpacing: 1.5, color: DARK },
  brandSub: { fontSize: 6.5, color: MUT, letterSpacing: 1, marginTop: 1 },
  logoImage: { width: 40, height: 40, objectFit: 'contain' },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 20, color: DARK, letterSpacing: 0.3 },
  subtitle: { fontSize: 9, color: GRAY, marginTop: 2 },
  metaLine: { fontSize: 7.5, color: MUT, marginTop: 1 },
  rule: { borderBottomWidth: 1.5, borderBottomColor: DARK, marginTop: 8, marginBottom: 14 },

  // Section
  secTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  secNum: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#fff', backgroundColor: DARK, width: 15, height: 15, borderRadius: 8, textAlign: 'center', paddingTop: 3, marginRight: 7 },
  secTitle: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: DARK, letterSpacing: 0.2 },

  // KPI grid
  kpiWrap: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  kpi: { width: '33.333%', paddingHorizontal: 4, marginBottom: 8 },
  kpiCard: { backgroundColor: CREAM, borderWidth: 0.5, borderColor: LINE, borderRadius: 4, padding: 9 },
  kpiCardDark: { backgroundColor: DARK, borderRadius: 4, padding: 9 },
  kpiLabel: { fontSize: 6.5, letterSpacing: 0.6, color: GRAY, marginBottom: 3, textTransform: 'uppercase' },
  kpiLabelD: { fontSize: 6.5, letterSpacing: 0.6, color: '#bbb', marginBottom: 3, textTransform: 'uppercase' },
  kpiValue: { fontFamily: 'Helvetica-Bold', fontSize: 15, color: DARK },
  kpiValueD: { fontFamily: 'Helvetica-Bold', fontSize: 15, color: '#fff' },
  kpiHint: { fontSize: 6.5, color: MUT, marginTop: 2 },
  kpiHintD: { fontSize: 6.5, color: '#999', marginTop: 2 },

  // Tables
  th: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: DARK, paddingBottom: 4, marginBottom: 2 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 4 },
  trTot: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: DARK, paddingVertical: 5, marginTop: 1 },
  thc: { fontFamily: 'Helvetica-Bold', fontSize: 6.8, letterSpacing: 0.4, color: DARK, textTransform: 'uppercase' },
  td: { fontSize: 8.5, color: DARK },
  tdM: { fontSize: 8.5, color: GRAY },
  tdB: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: DARK },
  cL: { flex: 1 },
  cR: { flex: 1, textAlign: 'right' },
  cRn: { width: 62, textAlign: 'right' },
  cRs: { width: 42, textAlign: 'right' },

  note: { fontSize: 6.8, color: MUT, marginTop: 4, lineHeight: 1.3 },
  twoCol: { flexDirection: 'row', marginHorizontal: -6 },
  col: { flex: 1, paddingHorizontal: 6 },
  panel: { backgroundColor: CREAM, borderWidth: 0.5, borderColor: LINE, borderRadius: 4, padding: 10, marginBottom: 8 },
  panelDark: { backgroundColor: DARK, borderRadius: 4, padding: 10 },
  bigRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  footer: { position: 'absolute', bottom: 20, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 6 },
  footerTxt: { fontSize: 6.5, color: MUT },
});

const SecTitle = ({ n, children }) => (
  <View style={s.secTitleRow}>
    <Text style={s.secNum}>{n}</Text>
    <Text style={s.secTitle}>{children}</Text>
  </View>
);
const Kpi = ({ label, value, hint, dark }) => (
  <View style={s.kpi}>
    <View style={dark ? s.kpiCardDark : s.kpiCard}>
      <Text style={dark ? s.kpiLabelD : s.kpiLabel}>{label}</Text>
      <Text style={dark ? s.kpiValueD : s.kpiValue}>{value}</Text>
      {!!hint && <Text style={dark ? s.kpiHintD : s.kpiHint}>{hint}</Text>}
    </View>
  </View>
);
const Foot = ({ page }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerTxt}>Founders BS · Informe financiero</Text>
    <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
);

export default function InformeDocument({ data, logoSrc }) {
  const { label, m, cuo, resumen = [], cobranzas = [], anuncio = {}, pendientesPorMes = {}, emitido } = data;

  const ventaTotal = (m.montoFront || 0) + (m.montoBack || 0);
  const cashNuevoTotal = (m.cashNuevoAR || 0) + (m.cashNuevoExt || 0) + (m.cashNuevoEfectivo || 0);
  const costos = m.costos || {};
  const costEntries = Object.entries(costos).sort((a, b) => b[1] - a[1]);

  // Proyección de cobranza: sumar cuotas pendientes por mes de vencimiento.
  const proy = Object.entries(pendientesPorMes)
    .map(([mes, arr]) => [mes, (arr || []).reduce((a, p) => a + (p.monto || 0), 0)])
    .filter(([, v]) => v > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  const proyTotal = proy.reduce((a, [, v]) => a + v, 0);
  const mesLbl = mk => {
    const M = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const p = String(mk).split('-'); return p.length === 2 ? `${M[(+p[1]) - 1]} ${p[0]}` : mk;
  };

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
            : <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.brand}>FOUNDERS</Text>
                <Text style={s.brandSub}>BUSINESS STRATEGIES</Text>
              </View>}
        </View>
        <View style={s.rule} />

        {/* 1 Resumen */}
        <SecTitle n="1">Resumen</SecTitle>
        <View style={s.kpiWrap}>
          <Kpi dark label="Facturación (venta)" value={money(ventaTotal)} hint={`${(m.ventasNuevas || 0)} nuevas + ${(m.ventasBack || 0)} back`} />
          <Kpi label="Rentabilidad devengada" value={pctv(m.rentabilidad)} hint="ganancia ÷ facturación" />
          <Kpi label="Recolección del mes" value={money(m.cashTotal)} hint="caja total ingresada" />
          <Kpi label="Recolección venta nueva" value={pctv(m.pctCC)} hint="primeros pagos ÷ venta" />
          <Kpi label="Cobranza de cuotas" value={cuo ? pctv(cuo.pctCobrado) : '—'} hint="cobrado ÷ lo que vencía" />
          <Kpi label="ROAS" value={anuncio.roas != null ? `${Number(anuncio.roas).toFixed(2)}x` : '—'} hint="retorno de la pauta" />
        </View>

        {/* 2 Facturación */}
        <SecTitle n="2">Facturación e ingresos</SecTitle>
        <View style={s.twoCol}>
          <View style={s.col}>
            <View style={s.panelDark}>
              <Text style={s.kpiLabelD}>Venta total del mes</Text>
              <Text style={s.kpiValueD}>{money(ventaTotal)}</Text>
              <Text style={s.kpiHintD}>{(m.ventasNuevas || 0) + (m.ventasBack || 0)} operaciones</Text>
            </View>
            <View style={{ height: 6 }} />
            <View style={s.th}><Text style={[s.thc, s.cL]}>Ventas</Text><Text style={[s.thc, s.cRs]}>Cant.</Text><Text style={[s.thc, s.cRn]}>Monto</Text></View>
            <View style={s.tr}><Text style={[s.td, s.cL]}>Nuevas (front)</Text><Text style={[s.tdM, s.cRs]}>{m.ventasNuevas || 0}</Text><Text style={[s.td, s.cRn]}>{money(m.montoFront)}</Text></View>
            <View style={s.tr}><Text style={[s.td, s.cL]}>Back (recompra)</Text><Text style={[s.tdM, s.cRs]}>{m.ventasBack || 0}</Text><Text style={[s.td, s.cRn]}>{money(m.montoBack)}</Text></View>
            <View style={s.trTot}><Text style={[s.tdB, s.cL]}>Total</Text><Text style={[s.tdB, s.cRs]}>{(m.ventasNuevas || 0) + (m.ventasBack || 0)}</Text><Text style={[s.tdB, s.cRn]}>{money(ventaTotal)}</Text></View>
          </View>
          <View style={s.col}>
            <Text style={s.kpiLabel}>Lugar de ingreso del pago (venta nueva)</Text>
            <View style={{ height: 4 }} />
            <View style={s.th}><Text style={[s.thc, s.cL]}>Origen</Text><Text style={[s.thc, s.cRs]}>Ventas</Text><Text style={[s.thc, s.cRn]}>Monto</Text></View>
            <View style={s.tr}><Text style={[s.td, s.cL]}>Argentina</Text><Text style={[s.tdM, s.cRs]}>{m.ventasAR || 0}</Text><Text style={[s.td, s.cRn]}>{money(m.montoAR || 0)}</Text></View>
            <View style={s.tr}><Text style={[s.td, s.cL]}>Exterior</Text><Text style={[s.tdM, s.cRs]}>{m.ventasExt || 0}</Text><Text style={[s.td, s.cRn]}>{money(m.montoExt || 0)}</Text></View>
            <View style={s.tr}><Text style={[s.td, s.cL]}>Efectivo</Text><Text style={[s.tdM, s.cRs]}>{m.ventasEfectivo || 0}</Text><Text style={[s.td, s.cRn]}>{money(m.montoEfectivo || 0)}</Text></View>
            <View style={s.trTot}><Text style={[s.tdB, s.cL]}>Total</Text><Text style={[s.tdB, s.cRs]}>{(m.ventasAR || 0) + (m.ventasExt || 0) + (m.ventasEfectivo || 0)}</Text><Text style={[s.tdB, s.cRn]}>{money((m.montoAR || 0) + (m.montoExt || 0) + (m.montoEfectivo || 0))}</Text></View>
            <Text style={s.note}>Pago full: {money(m.cashNuevoFull || 0)} · Financiado: {money(m.cashNuevoFinanciado || 0)}</Text>
          </View>
        </View>

        {/* 3 Cobros y recolección */}
        <SecTitle n="3">Cobros y recolección</SecTitle>
        <Text style={s.kpiLabel}>Composición de la recolección · por origen y lugar de ingreso</Text>
        <View style={{ height: 4 }} />
        <View style={s.th}>
          <Text style={[s.thc, s.cL]}>Concepto</Text>
          <Text style={[s.thc, s.cRn]}>Argentina</Text>
          <Text style={[s.thc, s.cRn]}>Exterior</Text>
          <Text style={[s.thc, s.cRn]}>Efectivo</Text>
          <Text style={[s.thc, s.cRn]}>Total</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.td, s.cL]}>Venta nueva (primeros pagos)</Text>
          <Text style={[s.td, s.cRn]}>{money(m.cashNuevoAR || 0)}</Text>
          <Text style={[s.td, s.cRn]}>{money(m.cashNuevoExt || 0)}</Text>
          <Text style={[s.td, s.cRn]}>{money(m.cashNuevoEfectivo || 0)}</Text>
          <Text style={[s.tdB, s.cRn]}>{money(cashNuevoTotal)}</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.td, s.cL]}>Cuotas (meses anteriores)</Text>
          <Text style={[s.td, s.cRn]}>{money(m.cashCuotaAR || 0)}</Text>
          <Text style={[s.td, s.cRn]}>{money(m.cashCuotaExt || 0)}</Text>
          <Text style={[s.td, s.cRn]}>{money(m.cashCuotaEfectivo || 0)}</Text>
          <Text style={[s.tdB, s.cRn]}>{money(m.cashCuotaTotal || 0)}</Text>
        </View>
        <View style={s.trTot}>
          <Text style={[s.tdB, s.cL]}>Total recolección</Text>
          <Text style={[s.tdB, s.cRn]}>{money(m.cashTotalAR || 0)}</Text>
          <Text style={[s.tdB, s.cRn]}>{money(m.cashTotalExt || 0)}</Text>
          <Text style={[s.tdB, s.cRn]}>{money(m.cashTotalEfectivo || 0)}</Text>
          <Text style={[s.tdB, s.cRn]}>{money(m.cashTotal)}</Text>
        </View>

        <View style={[s.twoCol, { marginTop: 10 }]}>
          <View style={s.col}>
            <View style={s.panel}>
              <Text style={s.kpiLabel}>Tasa de recolección · venta nueva</Text>
              <View style={s.bigRow}>
                <Text style={s.kpiValue}>{pctv(m.pctCC)}</Text>
              </View>
              <Text style={s.kpiHint}>{money(cashNuevoTotal)} primeros pagos ÷ {money(ventaTotal)} venta del mes</Text>
            </View>
          </View>
          <View style={s.col}>
            <View style={s.panel}>
              <Text style={s.kpiLabel}>Cobranza de cuotas</Text>
              <View style={s.bigRow}>
                <Text style={s.kpiValue}>{cuo ? pctv(cuo.pctCobrado) : '—'}</Text>
              </View>
              <Text style={s.kpiHint}>{cuo ? `${money(cuo.cobrado)} cobrado ÷ ${money(cuo.aCobrar)} que vencía` : 'sin datos'}</Text>
            </View>
          </View>
        </View>

        {proy.length > 0 && (
          <>
            <Text style={[s.kpiLabel, { marginTop: 6 }]}>Proyección de cobranza · cuotas pendientes por mes de vencimiento</Text>
            <View style={{ height: 4 }} />
            <View style={s.th}><Text style={[s.thc, s.cL]}>Mes de vencimiento</Text><Text style={[s.thc, s.cR]}>Cuotas a cobrar</Text></View>
            {proy.map(([mk, v]) => (
              <View style={s.tr} key={mk}><Text style={[s.td, s.cL]}>{mesLbl(mk)}</Text><Text style={[s.td, s.cR]}>{money(v)}</Text></View>
            ))}
            <View style={s.trTot}><Text style={[s.tdB, s.cL]}>Total por cobrar</Text><Text style={[s.tdB, s.cR]}>{money(proyTotal)}</Text></View>
          </>
        )}

        <Foot />
      </Page>

      {/* ── Página 2 ── */}
      <Page size="A4" style={s.page}>
        {/* 4 Egresos */}
        <SecTitle n="4">Egresos</SecTitle>
        {costEntries.length > 0 ? (
          <>
            <View style={s.th}>
              <Text style={[s.thc, s.cL]}>Categoría</Text>
              <Text style={[s.thc, s.cRn]}>Monto</Text>
              <Text style={[s.thc, s.cRs]}>% s/costos</Text>
              <Text style={[s.thc, s.cRs]}>% s/venta</Text>
            </View>
            {costEntries.map(([cat, val]) => (
              <View style={s.tr} key={cat}>
                <Text style={[s.td, s.cL]}>{cat}</Text>
                <Text style={[s.td, s.cRn]}>{money(val)}</Text>
                <Text style={[s.tdM, s.cRs]}>{m.totalCostos > 0 ? pctv((val / m.totalCostos) * 100) : '—'}</Text>
                <Text style={[s.tdM, s.cRs]}>{ventaTotal > 0 ? pctv((val / ventaTotal) * 100) : '—'}</Text>
              </View>
            ))}
            <View style={s.trTot}>
              <Text style={[s.tdB, s.cL]}>Total costos</Text>
              <Text style={[s.tdB, s.cRn]}>{money(m.totalCostos)}</Text>
              <Text style={[s.tdB, s.cRs]}>100%</Text>
              <Text style={[s.tdB, s.cRs]}>{ventaTotal > 0 ? pctv((m.totalCostos / ventaTotal) * 100) : '—'}</Text>
            </View>
          </>
        ) : <Text style={s.tdM}>Sin datos de costos para este mes.</Text>}

        {/* 5 Rentabilidad */}
        <SecTitle n="5">Rentabilidad</SecTitle>
        <View style={s.panelDark}>
          <Text style={s.kpiLabelD}>Ganancia devengada · sobre lo vendido</Text>
          <Text style={s.kpiValueD}>{money(m.ganancia)}</Text>
          <Text style={s.kpiHintD}>facturación {money(ventaTotal)} − costos {money(m.totalCostos)} · equivale a {pctv(m.rentabilidad)} de rentabilidad</Text>
        </View>

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
            <Text style={[s.td, s.cRn]}>{money(r.montoFront + (r.montoBack || 0))}</Text>
            <Text style={[s.tdM, s.cRn]}>{money(r.cashTotal)}</Text>
            <Text style={[s.tdM, s.cRn]}>{money(r.totalCostos)}</Text>
            <Text style={[s.td, s.cRn]}>{money(r.ganancia)}</Text>
            <Text style={[s.tdB, s.cRs]}>{Object.keys(r.costos || {}).length ? pctv(r.rentabilidad) : '—'}</Text>
          </View>
        ))}

        <View style={[s.twoCol, { marginTop: 12 }]}>
          <View style={s.col}>
            <Text style={s.kpiLabel}>Recolección de venta nueva</Text>
            <View style={{ height: 4 }} />
            <View style={s.th}><Text style={[s.thc, s.cL]}>Mes</Text><Text style={[s.thc, s.cRn]}>Cobrado</Text><Text style={[s.thc, s.cRs]}>%</Text></View>
            {resumen.map(r => (
              <View style={s.tr} key={r.mes}>
                <Text style={[s.td, s.cL]}>{r.label}</Text>
                <Text style={[s.tdM, s.cRn]}>{money((r.cashNuevoAR || 0) + (r.cashNuevoExt || 0) + (r.cashNuevoEfectivo || 0))}</Text>
                <Text style={[s.tdB, s.cRs]}>{pctv(r.pctCC)}</Text>
              </View>
            ))}
          </View>
          <View style={s.col}>
            <Text style={s.kpiLabel}>Cobranza de cuotas</Text>
            <View style={{ height: 4 }} />
            <View style={s.th}><Text style={[s.thc, s.cL]}>Mes</Text><Text style={[s.thc, s.cRn]}>Cobrado</Text><Text style={[s.thc, s.cRs]}>%</Text></View>
            {cobranzas.map(c => (
              <View style={s.tr} key={c.mes}>
                <Text style={[s.td, s.cL]}>{c.label}</Text>
                <Text style={[s.tdM, s.cRn]}>{money(c.cobrado)}</Text>
                <Text style={[s.tdB, s.cRs]}>{pctv(c.pctCobrado)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Apartado Meta Ads */}
        <SecTitle n="A">Meta Ads — {label}</SecTitle>
        <View style={s.kpiWrap}>
          <Kpi label="Inversión" value={anuncio.inversion != null ? money(anuncio.inversion) : '—'} hint="gasto publicitario" />
          <Kpi dark label="ROAS" value={anuncio.roas != null ? `${Number(anuncio.roas).toFixed(2)}x` : '—'} hint={anuncio.roasCash != null ? `cash ${Number(anuncio.roasCash).toFixed(2)}x` : 'ventas auto ÷ inversión'} />
          <Kpi label="ROAS Cash" value={anuncio.roasCash != null ? `${Number(anuncio.roasCash).toFixed(2)}x` : '—'} hint="cobros auto ÷ inversión" />
          <Kpi label="Costo por lead" value={anuncio.costoLead != null ? money(anuncio.costoLead) : '—'} hint="inversión ÷ leads" />
          <Kpi label="Costo por agenda" value={anuncio.costoAgenda != null ? money(anuncio.costoAgenda) : '—'} hint="inversión ÷ agendas" />
        </View>

        <Foot />
      </Page>
    </Document>
  );
}
