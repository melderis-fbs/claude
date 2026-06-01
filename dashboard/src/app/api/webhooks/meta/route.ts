import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

const META_APP_SECRET = process.env.META_APP_SECRET || "";
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";

function verifyMetaSignature(rawBody: string, signature: string | null): boolean {
  if (!META_APP_SECRET) return true;
  if (!signature || !signature.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", META_APP_SECRET).update(rawBody).digest("hex");
  const received = signature.slice("sha256=".length);
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === META_VERIFY_TOKEN) return new Response(challenge, { status: 200 });
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { object: string; entry: Array<{ id: string; time: number; changes: Array<{ value: Record<string, unknown>; field: string }> }> };
  try { payload = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const processingErrors: string[] = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "leadgen") continue;
      const leadData = change.value;
      try {
        await supabase.from("webhook_events").insert({
          source: "meta", event_type: "lead.created",
          payload: { ...leadData, entry_id: entry.id, entry_time: entry.time },
          processed_at: new Date().toISOString(),
        });
        const fieldData = leadData.field_data as Array<{ name: string; values: string[] }> | undefined;
        if (fieldData && fieldData.length > 0) {
          const fields: Record<string, string> = {};
          for (const f of fieldData) fields[f.name] = f.values[0] || "";
          await supabase.from("meta_leads").insert({
            leadgen_id: leadData.leadgen_id, form_id: leadData.form_id,
            ad_id: leadData.ad_id, adset_id: leadData.adset_id,
            campaign_id: leadData.campaign_id, page_id: leadData.page_id,
            full_name: fields["full_name"] || fields["name"] || null,
            email: fields["email"] || null,
            phone_number: fields["phone_number"] || fields["phone"] || null,
            raw_fields: fields,
            created_time: leadData.created_time ? new Date((leadData.created_time as number) * 1000).toISOString() : new Date().toISOString(),
          });
        }
      } catch (err) { processingErrors.push(err instanceof Error ? err.message : String(err)); }
    }
  }

  if (processingErrors.length > 0) return NextResponse.json({ received: true, partialErrors: processingErrors }, { status: 207 });
  return NextResponse.json({ received: true });
}
