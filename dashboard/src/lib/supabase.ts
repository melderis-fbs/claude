import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
if (!supabaseAnonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

export interface MetricsSnapshot {
  id?: string; source: "ghl" | "meta" | "slack" | "sheets";
  data: Record<string, unknown>; recorded_at: string; created_at?: string;
}

export interface SyncLog {
  id?: string; status: "success" | "partial" | "error";
  sources_synced: string[]; errors: Record<string, string>; duration_ms: number; created_at?: string;
}

export async function upsertMetricsSnapshot(source: MetricsSnapshot["source"], data: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("metrics_snapshots").upsert({ source, data, recorded_at: new Date().toISOString() }, { onConflict: "source", ignoreDuplicates: false });
  if (error) throw new Error(`Failed to upsert ${source} snapshot: ${error.message}`);
}

export async function getLatestSnapshot(source: MetricsSnapshot["source"]): Promise<MetricsSnapshot | null> {
  const { data, error } = await supabase.from("metrics_snapshots").select("*").eq("source", source).order("recorded_at", { ascending: false }).limit(1).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get ${source} snapshot: ${error.message}`);
  }
  return data as MetricsSnapshot;
}

export async function logSync(log: Omit<SyncLog, "id" | "created_at">): Promise<void> {
  const { error } = await supabase.from("sync_logs").insert(log);
  if (error) console.error("Failed to log sync:", error.message);
}
