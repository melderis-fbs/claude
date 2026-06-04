import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const DARK = '#282727';

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
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#111111',
    fontSize: 9,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 3,
    borderBottomColor: DARK,
    paddingBottom: 16,
    marginBottom: 28,
  },
  headerLeft: {},
  headerTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 30,
    color: DARK,
    marginBottom: 10,
  },
  headerMeta: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  headerMetaLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: DARK,
    marginRight: 6,
  },
  headerMetaValue: {
    fontSize: 8.5,
    color: DARK,
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  logoImage: {
    width: 130,
    height: 60,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    width: 130,
    height: 60,
    borderWidth: 1,
    borderColor: '#cccccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    fontSize: 8,
    color: '#999999',
  },

  // A nombre de
  nombreBlock: {
    marginBottom: 28,
  },
  nombreLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 0.8,
    color: '#888888',
    marginBottom: 8,
  },
  nombreName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: DARK,
    marginBottom: 3,
  },
  nombreLine: {
    fontSize: 8.5,
    color: '#555555',
    marginBottom: 2.5,
  },

  // Table
  tableWrapper: {
    borderWidth: 1,
    borderColor: DARK,
    marginBottom: 22,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: DARK,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableHeaderTextLeft: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  tableHeaderTextCenter: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#ffffff',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tableHeaderTextRight: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#ffffff',
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#dddddd',
  },
  tableRowFirst: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  colDesc: { flex: 3 },
  colQty: { width: 64, alignItems: 'center' },
  colAmount: { width: 84, alignItems: 'flex-end' },

  tdText: { fontSize: 9, color: '#222222' },
  tdCenter: { fontSize: 9, color: '#222222', textAlign: 'center' },
  tdRight: { fontSize: 9, color: '#222222', textAlign: 'right' },

  // Totals
  totalsBlock: {
    alignItems: 'flex-end',
    marginBottom: 36,
  },
  totalsInner: {
    minWidth: 200,
  },
  totRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totLabel: {
    fontSize: 8.5,
    color: '#555555',
    marginRight: 20,
  },
  totValue: {
    fontSize: 9,
    color: '#222222',
    textAlign: 'right',
    minWidth: 90,
  },
  totLabelBold: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: DARK,
    marginRight: 20,
  },
  totValueBold: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: DARK,
    textAlign: 'right',
    minWidth: 90,
  },

  // Signature
  signatureBlock: {
    marginTop: 36,
  },
  signatureLine: {
    width: 140,
    borderBottomWidth: 0.75,
    borderBottomColor: '#888888',
    marginBottom: 5,
    paddingBottom: 28,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#aaaaaa',
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
            <Text style={styles.headerTitle}>RECIBO</Text>
            <View style={styles.headerMeta}>
              <Text style={styles.headerMetaLabel}>Recibo Nro:</Text>
              <Text style={styles.headerMetaValue}>{numero}</Text>
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.headerMetaLabel}>Fecha:</Text>
              <Text style={styles.headerMetaValue}>{fecha}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {logoSrc ? (
              <Image src={logoSrc} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>FOUNDERS LOGO</Text>
              </View>
            )}
          </View>
        </View>

        {/* A nombre de */}
        <View style={styles.nombreBlock}>
          <Text style={styles.nombreLabel}>A NOMBRE DE:</Text>
          <Text style={styles.nombreName}>{nombre}</Text>
          {!!telefono && <Text style={styles.nombreLine}>{telefono}</Text>}
          {!!email && <Text style={styles.nombreLine}>{email}</Text>}
        </View>

        {/* Table */}
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}>
              <Text style={styles.tableHeaderTextLeft}>DESCRIPTION</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.tableHeaderTextCenter}>QUANTITY</Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={styles.tableHeaderTextRight}>AMOUNT</Text>
            </View>
          </View>

          {items.map((item, i) => (
            <View key={i} style={i === 0 ? styles.tableRowFirst : styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.tdText}>{item.description}</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={styles.tdCenter}>{item.quantity}</Text>
              </View>
              <View style={styles.colAmount}>
                <Text style={styles.tdRight}>{fmt(item.amount, moneda)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsInner}>
            <View style={styles.totRow}>
              <Text style={styles.totLabel}>Subtotal</Text>
              <Text style={styles.totValue}>{fmt(subtotal, moneda)}</Text>
            </View>
            <View style={styles.totRow}>
              <Text style={styles.totLabel}>VAT ({vat || 0}%)</Text>
              <Text style={styles.totValue}>{fmt(vatAmount, moneda)}</Text>
            </View>
            <View style={styles.totRow}>
              <Text style={styles.totLabelBold}>Total {monedaLabel}</Text>
              <Text style={styles.totValueBold}>{fmt(total, moneda)}</Text>
            </View>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Firma</Text>
        </View>

      </Page>
    </Document>
  );
}
