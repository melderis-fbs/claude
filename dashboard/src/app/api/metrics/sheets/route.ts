import { NextResponse } from "next/server";
import { fetchSheetsData } from "@/lib/sheets";
import { getLatestSnapshot } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const live = searchParams.get("live") === "true";
  const spreadsheetId = searchParams.get("spreadsheetId") || process.env.SHEETS_SPREADSHEET_ID || "";
  const range = searchParams.get("range") || process.env.SHEETS_RANGE || "Dashboard!A1:Z100";
  try {
    const snapshot = await getLatestSnapshot("sheets");
    if (!live && snapshot) return NextResponse.json({ source: "cache", data: snapshot.data, recordedAt: snapshot.recorded_at });
    if (!spreadsheetId) return NextResponse.json({ error: "No SHEETS_SPREADSHEET_ID configured" }, { status: 400 });
    const data = await fetchSheetsData(spreadsheetId, range);
    return NextResponse.json({ source: "live", data, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch Sheets data", details: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
