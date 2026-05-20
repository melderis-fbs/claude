import {
  getMockOverviewData,
  getMockAgendasData,
  getMockLlamadasData,
  getMockClosersData,
  getMockAnunciosData,
  getMockIngresosEgresosData,
} from './mockData.js';

const MOCK_MODE =
  !process.env.GOOGLE_SHEETS_ID ||
  !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
  !process.env.GOOGLE_PRIVATE_KEY;

async function getGoogleAuth() {
  const { google } = await import('googleapis');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return auth;
}

async function readSheet(sheetName, range) {
  const { google } = await import('googleapis');
  const auth = await getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: `${sheetName}!${range}`,
  });
  return response.data.values || [];
}

export async function getOverviewData() {
  if (MOCK_MODE) return getMockOverviewData();
  try {
    const rows = await readSheet('Resumen', 'A1:B20');
    const data = {};
    rows.forEach(([key, value]) => {
      if (key) data[key] = value;
    });
    return {
      ingresosMes: parseInt(data['ingresosMes'] || 0),
      egresosMes: parseInt(data['egresosMes'] || 0),
      balanceNeto: parseInt(data['balanceNeto'] || 0),
      llamadasHoy: parseInt(data['llamadasHoy'] || 0),
      agendasHoy: parseInt(data['agendasHoy'] || 0),
      mejorCloser: data['mejorCloser'] || '',
      chartData: [],
      urgentes: [],
      topClosers: [],
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error reading Resumen sheet:', err);
    return getMockOverviewData();
  }
}

export async function getAgendasData() {
  if (MOCK_MODE) return getMockAgendasData();
  try {
    const rows = await readSheet('Agendas', 'A2:F200');
    return rows.map(([fecha, hora, cliente, nicho, estado, closer]) => ({
      fecha: fecha || '',
      hora: hora || '',
      cliente: cliente || '',
      nicho: nicho || '',
      estado: estado || '',
      closer: closer || '',
    }));
  } catch (err) {
    console.error('Error reading Agendas sheet:', err);
    return getMockAgendasData();
  }
}

export async function getLlamadasData() {
  if (MOCK_MODE) return getMockLlamadasData();
  try {
    const rows = await readSheet('Llamadas', 'A2:H500');
    return rows.map(([fecha, closer, cliente, resultado, proximoPaso, observaciones, duracion, fechaProximoContacto]) => ({
      fecha: fecha || '',
      closer: closer || '',
      cliente: cliente || '',
      resultado: resultado || '',
      proximoPaso: proximoPaso || '',
      observaciones: observaciones || '',
      duracion: duracion || '',
      fechaProximoContacto: fechaProximoContacto || '',
    }));
  } catch (err) {
    console.error('Error reading Llamadas sheet:', err);
    return getMockLlamadasData();
  }
}

export async function getClosersData() {
  if (MOCK_MODE) return getMockClosersData();
  try {
    const rows = await readSheet('Closers', 'A2:F100');
    return rows.map(([nombre, llamadas, cierres, tasa, ingresos, mes]) => ({
      nombre: nombre || '',
      llamadas: parseInt(llamadas || 0),
      cierres: parseInt(cierres || 0),
      tasa: parseFloat(tasa || 0),
      ingresos: parseInt(ingresos || 0),
      mes: mes || '',
    }));
  } catch (err) {
    console.error('Error reading Closers sheet:', err);
    return getMockClosersData();
  }
}

export async function getAnunciosData() {
  if (MOCK_MODE) return getMockAnunciosData();
  try {
    const rows = await readSheet('Anuncios', 'A2:J200');
    return rows.map(([mes, semana, inversion, impresiones, clics, cpm, cpc, ctr, leads, cpl]) => ({
      mes: mes || '',
      semana: semana || '',
      inversion: parseInt(inversion || 0),
      impresiones: parseInt(impresiones || 0),
      clics: parseInt(clics || 0),
      cpm: cpm || '0',
      cpc: cpc || '0',
      ctr: ctr || '0',
      leads: parseInt(leads || 0),
      cpl: cpl || '0',
    }));
  } catch (err) {
    console.error('Error reading Anuncios sheet:', err);
    return getMockAnunciosData();
  }
}

export async function getIngresosEgresosData() {
  if (MOCK_MODE) return getMockIngresosEgresosData();
  try {
    const ingRows = await readSheet('IngresosEgresos', 'A2:D200');
    const egrRows = await readSheet('IngresosEgresos', 'F2:I200');
    const ingresos = ingRows
      .filter(r => r[0])
      .map(([fecha, concepto, monto, mes]) => ({ fecha, concepto, monto: parseInt(monto || 0), mes }));
    const egresos = egrRows
      .filter(r => r[0])
      .map(([fecha, concepto, categoria, monto]) => ({ fecha, concepto, categoria, monto: parseInt(monto || 0) }));
    return { ingresos, egresos };
  } catch (err) {
    console.error('Error reading IngresosEgresos sheet:', err);
    return getMockIngresosEgresosData();
  }
}
