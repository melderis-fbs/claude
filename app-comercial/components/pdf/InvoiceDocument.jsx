import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

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
    paddingTop: 56,
    paddingBottom: 72,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#111111',
  },

  // Header: line + INVOICE
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  headerLineWrap: {
    flex: 1,
    marginRight: 20,
    paddingBottom: 5,
  },
  headerLine: {
    borderBottomWidth: 0.75,
    borderBottomColor: '#000000',
  },
  invoiceTitle: {
    fontSize: 38,
    letterSpacing: 9,
    fontFamily: 'Helvetica',
    color: '#000000',
    lineHeight: 1,
  },

  // Meta (right-aligned)
  metaBlock: {
    alignItems: 'flex-end',
    marginBottom: 34,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 0.8,
    marginRight: 10,
    color: '#000000',
  },
  metaValue: {
    fontSize: 8.5,
    color: '#111111',
    minWidth: 100,
  },

  // Two columns
  infoRow: {
    flexDirection: 'row',
    marginBottom: 36,
  },
  infoCol: {
    flex: 1,
  },
  sectionLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    letterSpacing: 1.5,
    color: '#aaaaaa',
    marginBottom: 8,
  },
  infoName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    marginBottom: 4,
  },
  infoLine: {
    fontSize: 8.5,
    color: '#555555',
    marginBottom: 2.5,
  },

  // Table
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 6,
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e8e8e8',
  },
  colDesc: { flex: 3 },
  colPrice: { width: 72, alignItems: 'flex-end' },
  colQty: { width: 36, alignItems: 'flex-end' },
  colTotal: { width: 76, alignItems: 'flex-end' },

  thText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 0.5,
    color: '#000000',
  },
  thRight: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 0.5,
    color: '#000000',
    textAlign: 'right',
  },
  tdText: { fontSize: 9, color: '#222222' },
  tdRight: { fontSize: 9, color: '#222222', textAlign: 'right' },

  // Totals
  totalsOuter: {
    alignItems: 'flex-end',
    marginTop: 22,
  },
  totalsBox: {
    width: 210,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 10,
  },
  totRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 0.5,
    color: '#000000',
  },
  totValue: {
    fontSize: 9,
    color: '#000000',
    textAlign: 'right',
  },
  totDivider: {
    borderTopWidth: 0.5,
    borderTopColor: '#000000',
    marginTop: 5,
    marginBottom: 5,
  },
  totRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totLabelFinal: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  totValueFinal: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textAlign: 'right',
  },

  // Signature
  signatureBlock: {
    marginTop: 52,
  },
  signatureImage: {
    width: 110,
    height: 46,
    objectFit: 'contain',
    marginBottom: 2,
  },
  signaturePlaceholder: {
    width: 120,
    borderBottomWidth: 0.5,
    borderBottomColor: '#aaaaaa',
    marginBottom: 6,
    paddingBottom: 30,
  },
  signatureName: {
    fontSize: 8.5,
    color: '#555555',
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

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLineWrap}>
            <View style={styles.headerLine} />
          </View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        {/* Meta block */}
        <View style={styles.metaBlock}>
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

        {/* BILLED TO / FROM */}
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.sectionLabel}>BILLED TO:</Text>
            <Text style={styles.infoName}>{nombre}</Text>
            {!!telefono && <Text style={styles.infoLine}>{telefono}</Text>}
            {!!email && <Text style={styles.infoLine}>{email}</Text>}
            {!!dni && <Text style={styles.infoLine}>DNI: {dni}</Text>}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.sectionLabel}>FROM:</Text>
            <Text style={styles.infoName}>BECCI LLC</Text>
            <Text style={styles.infoLine}>EIN: 35-2729822</Text>
            <Text style={styles.infoLine}>8 The Green Ste R, Dover</Text>
            <Text style={styles.infoLine}>Delaware 19901, USA</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableHeaderRow}>
          <View style={styles.colDesc}><Text style={styles.thText}>DESCRIPTION</Text></View>
          <View style={styles.colPrice}><Text style={styles.thRight}>UNIT PRICE</Text></View>
          <View style={styles.colQty}><Text style={styles.thRight}>QTY</Text></View>
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
                {fmt((Number(item.unitPrice) || 0) * (Number(item.qty) || 0), moneda)}
              </Text>
            </View>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsOuter}>
          <View style={styles.totalsBox}>
            <View style={styles.totRow}>
              <Text style={styles.totLabel}>SUBTOTAL</Text>
              <Text style={styles.totValue}>{fmt(subtotal, moneda)}</Text>
            </View>
            <View style={styles.totRow}>
              <Text style={styles.totLabel}>TAX ({tax || 0}%)</Text>
              <Text style={styles.totValue}>{fmt(taxAmount, moneda)}</Text>
            </View>
            <View style={styles.totDivider} />
            <View style={styles.totRowFinal}>
              <Text style={styles.totLabelFinal}>TOTAL {monedaLabel}</Text>
              <Text style={styles.totValueFinal}>{fmt(total, moneda)}</Text>
            </View>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          {firmaSrc ? (
            <Image src={firmaSrc} style={styles.signatureImage} />
          ) : (
            <View style={styles.signaturePlaceholder} />
          )}
          <Text style={styles.signatureName}>Victoria Becci</Text>
        </View>

      </Page>
    </Document>
  );
}
