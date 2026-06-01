import { NextResponse } from "next/server";
import { fetchMetaData } from "@/lib/meta";
import { getLatestSnapshot } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const live = searchParams.get("live") === "true";
  try {
    if (live) {
      const data = await fetchMetaData();
      return NextResponse.json({ source: "live", data, fetchedAt: new Date().toISOString() });
    }
    const snapshot = await getLatestSnapshot("meta");
    if (snapshot) return NextResponse.json({ source: "cache", data: snapshot.data, recordedAt: snapshot.recorded_at });
    const data = await fetchMetaData();
    return NextResponse.json({ source: "live", data, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch Meta metrics", details: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
