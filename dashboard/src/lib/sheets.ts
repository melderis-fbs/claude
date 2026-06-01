import { google } from "googleapis";

export interface SheetsRow { [key: string]: string | number | null; }

export interface SheetsData {
  spreadsheetId: string; range: string; headers: string[];
  rows: SheetsRow[]; rawValues: string[][]; lastUpdated: string;
}

export interface CloserMetrics {
  name: string; leads: number; llamadas: number; citas: number; ventas: number;
  tasaCierre: number; ingresos: number; meta: number; cumplimiento: number;
}

export interface CobranzaRow {
  cliente: string; monto: number; fechaVencimiento: string;
  estado: "pagado" | "pendiente" | "vencido" | "parcial"; diasVencidos: number; responsable: string;
}

export interface CuotasData {
  totalCuotas: number; cuotasPagadas: number; cuotasPendientes: number; cuotasVencidas: number;
  montoCobrado: number; montoPendiente: number; tasaRecuperacion: number; rows: CobranzaRow[];
}

function getAuthClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set");
  let credentials: Record<string, unknown>;
  try { credentials = JSON.parse(serviceAccountJson); }
  catch { throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON"); }
  return new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
}

export async function fetchSheetsData(spreadsheetId: string, range: string): Promise<SheetsData> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range, valueRenderOption: "FORMATTED_VALUE", dateTimeRenderOption: "FORMATTED_STRING" });
  const rawValues = (response.data.values || []) as string[][];
  if (rawValues.length === 0) return { spreadsheetId, range, headers: [], rows: [], rawValues: [], lastUpdated: new Date().toISOString() };
  const headers = rawValues[0];
  const rows: SheetsRow[] = rawValues.slice(1).map((row) => {
    const obj: SheetsRow = {};
    headers.forEach((header, index) => {
      const value = row[index] ?? null;
      if (value !== null) {
        const n = parseFloat(value.replace(/[,%$]/g, ""));
        obj[header] = isNaN(n) ? value : n;
      } else { obj[header] = null; }
    });
    return obj;
  });
  return { spreadsheetId, range, headers, rows, rawValues, lastUpdated: new Date().toISOString() };
}

export async function fetchCloserMetrics(spreadsheetId: string, range = "Closers!A1:J50"): Promise<CloserMetrics[]> {
  const data = await fetchSheetsData(spreadsheetId, range);
  return data.rows.map((row) => {
    const leads = (row["Leads"] as number) || 0;
    const ventas = (row["Ventas"] as number) || 0;
    const meta = (row["Meta"] as number) || 0;
    return {
      name: (row["Nombre"] as string) || "Unknown", leads, llamadas: (row["Llamadas"] as number) || 0,
      citas: (row["Citas"] as number) || 0, ventas, tasaCierre: leads > 0 ? Math.round((ventas / leads) * 1000) / 10 : 0,
      ingresos: (row["Ingresos"] as number) || 0, meta, cumplimiento: meta > 0 ? Math.round((ventas / meta) * 1000) / 10 : 0,
    };
  });
}

export async function fetchCobranza(spreadsheetId: string, range = "Cobranza!A1:G200"): Promise<CuotasData> {
  const data = await fetchSheetsData(spreadsheetId, range);
  const now = new Date();
  const cobranzaRows: CobranzaRow[] = data.rows.map((row) => {
    const fechaVencimiento = (row["Fecha Vencimiento"] as string) || "";
    const fechaDate = fechaVencimiento ? new Date(fechaVencimiento) : null;
    const diasVencidos = fechaDate && fechaDate < now ? Math.floor((now.getTime() - fechaDate.getTime()) / 86400000) : 0;
    const estadoRaw = ((row["Estado"] as string) || "").toLowerCase();
    let estado: CobranzaRow["estado"] = "pendiente";
    if (estadoRaw.includes("pagado") || estadoRaw.includes("paid")) estado = "pagado";
    else if (estadoRaw.includes("vencido") || estadoRaw.includes("overdue")) estado = "vencido";
    else if (estadoRaw.includes("parcial") || estadoRaw.includes("partial")) estado = "parcial";
    return { cliente: (row["Cliente"] as string) || "", monto: (row["Monto"] as number) || 0, fechaVencimiento, estado, diasVencidos, responsable: (row["Responsable"] as string) || "" };
  });
  const cuotasPagadas = cobranzaRows.filter((r) => r.estado === "pagado").length;
  const cuotasVencidas = cobranzaRows.filter((r) => r.estado === "vencido").length;
  const cuotasPendientes = cobranzaRows.filter((r) => r.estado === "pendiente" || r.estado === "parcial").length;
  const montoCobrado = cobranzaRows.filter((r) => r.estado === "pagado").reduce((sum, r) => sum + r.monto, 0);
  const montoPendiente = cobranzaRows.filter((r) => r.estado !== "pagado").reduce((sum, r) => sum + r.monto, 0);
  const totalMonto = montoCobrado + montoPendiente;
  return { totalCuotas: cobranzaRows.length, cuotasPagadas, cuotasPendientes, cuotasVencidas, montoCobrado, montoPendiente, tasaRecuperacion: totalMonto > 0 ? Math.round((montoCobrado / totalMonto) * 1000) / 10 : 0, rows: cobranzaRows };
}
