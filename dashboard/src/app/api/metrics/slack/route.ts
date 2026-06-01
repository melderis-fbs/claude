import { NextResponse } from "next/server";
import { fetchSlackMultipleChannels } from "@/lib/slack";
import { getLatestSnapshot } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const live = searchParams.get("live") === "true";
  try {
    const snapshot = await getLatestSnapshot("slack");
    if (!live && snapshot) return NextResponse.json({ source: "cache", data: snapshot.data, recordedAt: snapshot.recorded_at });
    const ids = (process.env.SLACK_CHANNEL_IDS || "").split(",").filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ error: "No SLACK_CHANNEL_IDS configured" }, { status: 400 });
    const data = await fetchSlackMultipleChannels(ids);
    return NextResponse.json({ source: "live", data, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch Slack data", details: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
