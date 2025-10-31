import { NextResponse } from "next/server";
import { getWebhookEvents } from "@/lib/webhookStore";

export const runtime = "nodejs";

/**
 * GET /api/stats
 * 
 * Returns campaign statistics extracted from webhook events:
 * - sent: total messages sent (status updates with "sent")
 * - delivered: status = "delivered"
 * - failed: status = "failed"
 * - read: status = "read"
 * - replied: incoming messages from users
 */
export async function GET() {
  try {
    const events = getWebhookEvents();
    
    let sent = 0;
    let delivered = 0;
    let failed = 0;
    let read = 0;
    let replied = 0;

    for (const evt of events) {
      const entry = evt.body?.entry?.[0];
      if (!entry) continue;
      
      const value = entry.changes?.[0]?.value;
      if (!value) continue;

      // Count status updates (outgoing message tracking)
      if (value.statuses) {
        for (const st of value.statuses) {
          if (st.status === 'sent') sent++;
          else if (st.status === 'delivered') delivered++;
          else if (st.status === 'failed') failed++;
          else if (st.status === 'read') read++;
        }
      }

      // Count incoming messages (user replies)
      if (value.messages && value.messages.length > 0) {
        replied += value.messages.length;
      }
    }

    return NextResponse.json({
      ok: true,
      stats: {
        sent,
        delivered,
        failed,
        read,
        replied,
        total: sent + delivered + failed + read + replied
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
