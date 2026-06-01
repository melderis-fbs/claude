import { NextResponse } from "next/server";
import { fetchGHLData } from "@/lib/ghl";
import { fetchMetaData } from "@/lib/meta";
import { fetchSlackMultipleChannels } from "@/lib/slack";
import { fetchSheetsData } from "@/lib/sheets";
import { upsertMetricsSnapshot, logSync } from "@/lib/supabase";

const SLACK_CHANNEL_IDS = (process.env.SLACK_CHANNEL_IDS || "").split(",").filter(Boolean);
const SHEETS_SPREADSHEET_ID = process.env.SHEETS_SPREADSHEET_ID || "";
const SHEETS_RANGE = process.env.SHEETS_RANGE || "Dashboard!A1:Z100";

export async function POST() {
  const startTime = Date.now();
  const errors: Record<string, string> = {};
  const sourcesSynced: string[] = [];

  try {
    const ghlData = await fetchGHLData();
    await upsertMetricsSnapshot("ghl", ghlData as unknown as Record<string, unknown>);
    sourcesSynced.push("ghl");
  } catch (err) { errors["ghl"] = err instanceof Error ? err.message : String(err); }

  try {
    const metaData = await fetchMetaData();
    await upsertMetricsSnapshot("meta", metaData as unknown as Record<string, unknown>);
    sourcesSynced.push("meta");
  } catch (err) { errors["meta"] = err instanceof Error ? err.message : String(err); }

  try {
    if (SLACK_CHANNEL_IDS.length > 0) {
      const slackData = await fetchSlackMultipleChannels(SLACK_CHANNEL_IDS);
      await upsertMetricsSnapshot("slack", { channels: slackData, syncedAt: new Date().toISOString() });
      sourcesSynced.push("slack");
    } else { errors["slack"] = "No SLACK_CHANNEL_IDS configured"; }
  } catch (err) { errors["slack"] = err instanceof Error ? err.message : String(err); }

  try {
    if (SHEETS_SPREADSHEET_ID) {
      const sheetsData = await fetchSheetsData(SHEETS_SPREADSHEET_ID, SHEETS_RANGE);
      await upsertMetricsSnapshot("sheets", sheetsData as unknown as Record<string, unknown>);
      sourcesSynced.push("sheets");
    } else { errors["sheets"] = "No SHEETS_SPREADSHEET_ID configured"; }
  } catch (err) { errors["sheets"] = err instanceof Error ? err.message : String(err); }

  const durationMs = Date.now() - startTime;
  const hasErrors = Object.keys(errors).length > 0;
  const status = sourcesSynced.length === 0 ? "error" : hasErrors ? "partial" : "success";

  try { await logSync({ status, sources_synced: sourcesSynced, errors, duration_ms: durationMs }); } catch {}

  return NextResponse.json(
    { status, sourcesSynced, errors: hasErrors ? errors : undefined, durationMs, timestamp: new Date().toISOString() },
    { status: status === "error" ? 500 : 200 }
  );
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "POST to /api/sync to trigger a sync" });
}
