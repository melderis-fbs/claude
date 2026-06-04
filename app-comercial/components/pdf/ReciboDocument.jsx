import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const DARK = '#1a1a1a';
const BORDER = '#e2e2e2';

function fmt(amount, moneda) {
  const num = Number(amount) || 0;
  const [int, dec] = num.toFixed(2).split('.');
  if (moneda === 'ARS') {
    return '$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec;
  }
  return '$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 52,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: DARK,
    fontSize: 9,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 18,
    borderBottomWidth: 2.5,
    borderBottomColor: DARK,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleBlock: {
    marginRight: 28,
  },
  headerTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 32,
    color: DARK,
    letterSpacing: 1,
    lineHeight: 1,
  },
  metaDivider: {
    width: 1,
    height: 36,
    backgroundColor: BORDER,
    marginRight: 20,
  },
  metaBlock: {
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    letterSpacing: 0.5,
    color: '#888888',
    marginRight: 5,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: DARK,
  },
  logoImage: {
    width: 120,
    height: 50,
    objectFit: 'contain',
  },

  // ── A nombre de ─────────────────────────────────────────────────────────────
  nombreSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  nombreSectionLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    letterSpacing: 1.5,
    color: '#aaaaaa',
    marginBottom: 6,
  },
  nombreName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: DARK,
    marginBottom: 3,
  },
  nombreLine: {
    fontSize: 8.5,
    color: '#666666',
    marginBottom: 2,
  },

  // ── Table ────────────────────────────────────────────────────────────────────
  table: {
    marginBottom: 18,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: DARK,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 2,
  },
  tableBody: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  colDesc: { flex: 1 },
  colQty: { width: 60 },
  colAmt: { width: 80 },
  thLeft: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  thCenter: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: '#ffffff',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  thRight: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: '#ffffff',
    letterSpacing: 0.8,
    textAlign: 'right',
  },
  tdLeft: { fontSize: 9, color: DARK },
  tdCenter: { fontSize: 9, color: DARK, textAlign: 'center' },
  tdRight: { fontSize: 9, color: DARK, textAlign: 'right' },

  // ── Totals ───────────────────────────────────────────────────────────────────
  totalsOuter: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  totalsBox: {
    width: 220,
  },
  totRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3.5,
  },
  totLabel: {
    fontSize: 8.5,
    color: '#666666',
  },
  totVal: {
    fontSize: 8.5,
    color: DARK,
    textAlign: 'right',
  },
  totDivider: {
    borderTopWidth: 0.75,
    borderTopColor: BORDER,
    marginTop: 4,
    marginBottom: 4,
  },
  totRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totLabelFinal: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: DARK,
  },
  totValFinal: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: DARK,
    textAlign: 'right',
  },

  // ── Signature ────────────────────────────────────────────────────────────────
  signatureBlock: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  signatureLine: {
    width: 150,
    borderBottomWidth: 0.75,
    borderBottomColor: '#bbbbbb',
    marginBottom: 5,
    paddingBottom: 24,
  },
  signatureLabel: {
    fontSize: 7.5,
    color: '#bbbbbb',
    letterSpacing: 0.5,
  },
});

export default function ReciboDocument({ data, logoSrc }) {
  const {
    numero, fecha,
    nombre, telefono, email,
    items = [],
    vat = 0, subtotal = 0, vatAmount = 0, total = 0,
    moneda = 'USD',
  } = data;

  const monedaLabel = moneda === 'ARS' ? 'ARS' : 'USD';

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.titleBlock}>
              <Text style={styles.headerTitle}>RECIBO</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaBlock}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Nro</Text>
                <Text style={styles.metaValue}>{numero}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Fecha</Text>
                <Text style={styles.metaValue}>{fecha}</Text>
              </View>
            </View>
          </View>
          {logoSrc && (
            <Image src={logoSrc} style={styles.logoImage} />
          )}
        </View>

        {/* A nombre de */}
        <View style={styles.nombreSection}>
          <Text style={styles.nombreSectionLabel}>A NOMBRE DE</Text>
          <Text style={styles.nombreName}>{nombre}</Text>
          {!!telefono && <Text style={styles.nombreLine}>{telefono}</Text>}
          {!!email && <Text style={styles.nombreLine}>{email}</Text>}
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <View style={styles.colDesc}><Text style={styles.thLeft}>DESCRIPCIÓN</Text></View>
            <View style={styles.colQty}><Text style={styles.thCenter}>CANT.</Text></View>
            <View style={styles.colAmt}><Text style={styles.thRight}>MONTO</Text></View>
          </View>
          <View style={styles.tableBody}>
            {items.map((item, i) => {
              const isLast = i === items.length - 1;
              return (
                <View key={i} style={isLast ? styles.tableRowLast : styles.tableRow}>
                  <View style={styles.colDesc}><Text style={styles.tdLeft}>{item.description}</Text></View>
                  <View style={styles.colQty}><Text style={styles.tdCenter}>{item.quantity}</Text></View>
                  <View style={styles.colAmt}><Text style={styles.tdRight}>{fmt(item.amount, moneda)}</Text></View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsOuter}>
          <View style={styles.totalsBox}>
            <View style={styles.totRow}>
              <Text style={styles.totLabel}>Subtotal</Text>
              <Text style={styles.totVal}>{fmt(subtotal, moneda)}</Text>
            </View>
            <View style={styles.totRow}>
              <Text style={styles.totLabel}>VAT ({vat || 0}%)</Text>
              <Text style={styles.totVal}>{fmt(vatAmount, moneda)}</Text>
            </View>
            <View style={styles.totDivider} />
            <View style={styles.totRowFinal}>
              <Text style={styles.totLabelFinal}>Total {monedaLabel}</Text>
              <Text style={styles.totValFinal}>{fmt(total, moneda)}</Text>
            </View>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>FIRMA</Text>
        </View>

      </Page>
    </Document>
  );
}
