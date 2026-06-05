import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const DARK = '#1a1a1a';
const GRAY = '#666666';
const LIGHT = '#f4f4f4';
const LINE  = '#dddddd';

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
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: DARK,
    fontSize: 9,
  },

  // ── Top header ───────────────────────────────────────────────────────────────
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  fromBlock: {},
  fromName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: DARK,
    marginBottom: 3,
  },
  fromLine: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 1.5,
  },
  docTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 34,
    color: DARK,
    letterSpacing: 1,
    lineHeight: 1,
  },

  // ── Info card ────────────────────────────────────────────────────────────────
  infoCard: {
    flexDirection: 'row',
    backgroundColor: LIGHT,
    borderRadius: 4,
    padding: 20,
    marginBottom: 28,
  },
  infoLeft: {
    flex: 1,
    paddingRight: 20,
  },
  infoRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  infoSectionLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 0.8,
    color: DARK,
    marginBottom: 7,
  },
  infoName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: DARK,
    marginBottom: 3,
  },
  infoLine: {
    fontSize: 8.5,
    color: GRAY,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 0.5,
    color: GRAY,
    marginRight: 8,
  },
  metaValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: DARK,
    minWidth: 80,
    textAlign: 'right',
  },

  // ── Table ────────────────────────────────────────────────────────────────────
  tableHeadRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: DARK,
    paddingBottom: 6,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
    paddingVertical: 8,
  },
  colDesc:  { flex: 1 },
  colPrice: { width: 72, alignItems: 'flex-end' },
  colQty:   { width: 40, alignItems: 'flex-end' },
  colTotal: { width: 80, alignItems: 'flex-end' },
  thText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 0.6,
    color: DARK,
  },
  thRight: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 0.6,
    color: DARK,
    textAlign: 'right',
  },
  tdText:  { fontSize: 9, color: DARK },
  tdRight: { fontSize: 9, color: DARK, textAlign: 'right' },

  // ── Totals ───────────────────────────────────────────────────────────────────
  totalsSection: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  totalsBox: {
    width: 220,
  },
  totDividerTop: {
    borderTopWidth: 1.5,
    borderTopColor: DARK,
    marginBottom: 8,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subtotalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    letterSpacing: 0.5,
    color: DARK,
  },
  subtotalValue: {
    fontSize: 9,
    color: DARK,
    textAlign: 'right',
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  taxLabel: { fontSize: 8.5, color: GRAY },
  taxValue:  { fontSize: 8.5, color: GRAY, textAlign: 'right' },
  totDividerBottom: {
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    marginBottom: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: DARK,
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: DARK,
    textAlign: 'right',
  },

  // ── Signature ────────────────────────────────────────────────────────────────
  signatureBlock: {
    marginTop: 48,
  },
  signatureImage: {
    width: 110,
    height: 46,
    objectFit: 'contain',
    marginBottom: 4,
  },
  signaturePlaceholder: {
    width: 150,
    borderBottomWidth: 0.75,
    borderBottomColor: '#bbbbbb',
    paddingBottom: 26,
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 8.5,
    color: GRAY,
  },
});

export default function InvoiceDocument({ data, firmaSrc }) {
  const {
    numero, fecha, dueDate,
    nombre, telefono, email, dni,
    items = [],
    tax = 0, subtotal = 0, taxAmount = 0, total = 0,
    moneda = 'USD',
  } = data;

  const monedaLabel = moneda === 'ARS' ? 'ARS' : 'USD';

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Top: from info + title */}
        <View style={styles.topRow}>
          <View style={styles.fromBlock}>
            <Text style={styles.fromName}>BECCI LLC</Text>
            <Text style={styles.fromLine}>EIN: 35-2729822</Text>
            <Text style={styles.fromLine}>8 The Green Ste R, Dover</Text>
            <Text style={styles.fromLine}>Delaware 19901, USA</Text>
          </View>
          <Text style={styles.docTitle}>INVOICE</Text>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoLeft}>
            <Text style={styles.infoSectionLabel}>BILLED TO:</Text>
            <Text style={styles.infoName}>{nombre}</Text>
            {!!telefono && <Text style={styles.infoLine}>{telefono}</Text>}
            {!!email    && <Text style={styles.infoLine}>{email}</Text>}
            {!!dni      && <Text style={styles.infoLine}>DNI: {dni}</Text>}
          </View>
          <View style={styles.infoRight}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>INVOICE NO:</Text>
              <Text style={styles.metaValue}>{numero}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>DATE:</Text>
              <Text style={styles.metaValue}>{fecha}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>DUE DATE:</Text>
              <Text style={styles.metaValue}>{dueDate}</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableHeadRow}>
          <View style={styles.colDesc}> <Text style={styles.thText}>DESCRIPTION</Text></View>
          <View style={styles.colPrice}><Text style={styles.thRight}>UNIT PRICE</Text></View>
          <View style={styles.colQty}>  <Text style={styles.thRight}>QTY</Text></View>
          <View style={styles.colTotal}><Text style={styles.thRight}>TOTAL</Text></View>
        </View>

        {items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.colDesc}>
              <Text style={styles.tdText}>{item.description}</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.tdRight}>{fmt(item.unitPrice, moneda)}</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.tdRight}>{item.qty}</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.tdRight}>
                {fmt((Number(item.unitPrice) || 0) * (Number(item.qty) || 1), moneda)}
              </Text>
            </View>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totDividerTop} />
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>SUBTOTAL</Text>
              <Text style={styles.subtotalValue}>{fmt(subtotal, moneda)}</Text>
            </View>
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>Tax ({tax || 0}%)</Text>
              <Text style={styles.taxValue}>{fmt(taxAmount, moneda)}</Text>
            </View>
            <View style={styles.totDividerBottom} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL {monedaLabel}</Text>
              <Text style={styles.totalValue}>{fmt(total, moneda)}</Text>
            </View>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          {firmaSrc
            ? <Image src={firmaSrc} style={styles.signatureImage} />
            : <View style={styles.signaturePlaceholder} />
          }
          <Text style={styles.signatureName}>Victoria Becci</Text>
        </View>

      </Page>
    </Document>
  );
}
