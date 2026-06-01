import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface GHLWebhookEvent {
  type: string; locationId: string; contactId?: string;
  opportunityId?: string; appointmentId?: string;
  data: Record<string, unknown>; timestamp: string;
}

const GHL_WEBHOOK_SECRET = process.env.GHL_WEBHOOK_SECRET || "";

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!GHL_WEBHOOK_SECRET || !signature) return !GHL_WEBHOOK_SECRET;
  return signature === GHL_WEBHOOK_SECRET;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-ghl-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: GHLWebhookEvent;
  try { event = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  try {
    const eventType = event.type || "unknown";
    await supabase.from("webhook_events").insert({
      source: "ghl", event_type: eventType,
      payload: event.data || event,
      contact_id: event.contactId,
      opportunity_id: event.opportunityId,
      appointment_id: event.appointmentId,
      processed_at: new Date().toISOString(),
    });
    return NextResponse.json({ received: true, type: event.type });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Webhook processing failed", details: message }, { status: 500 });
  }
}
