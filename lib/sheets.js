import {
  getMockNegocioData,
  getMockAgendasData,
  getMockLlamadasData,
  getMockClosersData,
  getMockAnunciosData,
  getMockIngresosEgresosData,
} from './mockData.js';

const MOCK_MODE = !process.env.APPS_SCRIPT_URL;

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
  try { return await fetchTab('negocio'); }
  catch (err) { console.error('getNegocioData:', err.message); return getMockNegocioData(); }
}

export async function getAgendasData() {
  if (MOCK_MODE) return getMockAgendasData();
  try { return await fetchTab('agendas'); }
  catch (err) { console.error('getAgendasData:', err.message); return getMockAgendasData(); }
}

export async function getLlamadasData() {
  if (MOCK_MODE) return getMockLlamadasData();
  try { return await fetchTab('llamadas'); }
  catch (err) { console.error('getLlamadasData:', err.message); return getMockLlamadasData(); }
}

export async function getClosersData() {
  if (MOCK_MODE) return getMockClosersData();
  try { return await fetchTab('closers'); }
  catch (err) { console.error('getClosersData:', err.message); return getMockClosersData(); }
}

export async function getAnunciosData() {
  if (MOCK_MODE) return getMockAnunciosData();
  try { return await fetchTab('anuncios'); }
  catch (err) { console.error('getAnunciosData:', err.message); return getMockAnunciosData(); }
}

export async function getIngresosEgresosData() {
  if (MOCK_MODE) return getMockIngresosEgresosData();
  try { return await fetchTab('ingresos'); }
  catch (err) { console.error('getIngresosEgresosData:', err.message); return getMockIngresosEgresosData(); }
}
