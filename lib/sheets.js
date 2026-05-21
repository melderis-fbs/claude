import {
  getMockNegocioData,
  getMockAgendasData,
  getMockLlamadasData,
  getMockClosersData,
  getMockAnunciosData,
  getMockIngresosEgresosData,
} from './mockData.js';

const MOCK_MODE = !process.env.APPS_SCRIPT_URL;

// Normaliza mes a 'yyyy-MM' en caso de que el Apps Script devuelva nombres en español
const MESES_ES = {
  'enero':'01','febrero':'02','marzo':'03','abril':'04','mayo':'05','junio':'06',
  'julio':'07','agosto':'08','septiembre':'09','octubre':'10','noviembre':'11','diciembre':'12'
};
function normalizeMes(mes) {
  if (!mes) return mes;
  const s = String(mes).trim();
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  const lower = s.toLowerCase();
  for (const [name, num] of Object.entries(MESES_ES)) {
    if (lower.startsWith(name)) {
      const ym = s.match(/\d{4}/);
      const year = ym ? ym[0] : String(new Date().getFullYear());
      return `${year}-${num}`;
    }
  }
  return s;
}
function normalizeRows(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(r => r && r.mes ? { ...r, mes: normalizeMes(r.mes) } : r);
}

async function fetchTab(tab) {
  const url = `${process.env.APPS_SCRIPT_URL}?tab=${tab}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Error ${res.status} al obtener tab "${tab}"`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export async function getNegocioData() {
  if (MOCK_MODE) return getMockNegocioData();
  try { return normalizeRows(await fetchTab('negocio')); }
  catch (err) { console.error('getNegocioData:', err.message); return getMockNegocioData(); }
}

export async function getAgendasData() {
  if (MOCK_MODE) return getMockAgendasData();
  try { return normalizeRows(await fetchTab('agendas')); }
  catch (err) { console.error('getAgendasData:', err.message); return getMockAgendasData(); }
}

export async function getLlamadasData() {
  if (MOCK_MODE) return getMockLlamadasData();
  try { return normalizeRows(await fetchTab('llamadas')); }
  catch (err) { console.error('getLlamadasData:', err.message); return getMockLlamadasData(); }
}

export async function getClosersData() {
  if (MOCK_MODE) return getMockClosersData();
  try { return normalizeRows(await fetchTab('closers')); }
  catch (err) { console.error('getClosersData:', err.message); return getMockClosersData(); }
}

export async function getAnunciosData() {
  if (MOCK_MODE) return getMockAnunciosData();
  try { return normalizeRows(await fetchTab('anuncios')); }
  catch (err) { console.error('getAnunciosData:', err.message); return getMockAnunciosData(); }
}

export async function getIngresosEgresosData() {
  if (MOCK_MODE) return getMockIngresosEgresosData();
  try {
    const result = await fetchTab('ingresos');
    // ingresos devuelve { egresos, cobranzas, comentarios }
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      return {
        egresos:     normalizeRows(result.egresos),
        cobranzas:   normalizeRows(result.cobranzas),
        comentarios: result.comentarios,
      };
    }
    return result;
  }
  catch (err) { console.error('getIngresosEgresosData:', err.message); return getMockIngresosEgresosData(); }
}
