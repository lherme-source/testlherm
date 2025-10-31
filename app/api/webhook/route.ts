import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { addWebhookEvent } from "@/lib/webhookStore";

// Ensure Node.js runtime (needed for 'crypto' module)
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  // Health check (user opening the URL without query params)
  if (!mode && !token && !challenge) {
    return NextResponse.json({ ok: true, service: 'whatsapp-webhook', message: 'Endpoint online. Configure Meta verification to complete setup.' }, { status: 200 });
  }
  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) return new NextResponse(challenge || "", { status: 200 });
  return new NextResponse("Forbidden", { status: 403 });
}

// Verify X-Hub-Signature-256 when APP_SECRET is set
function verifySignature(appSecret: string, rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  // Constant-time compare
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    // Read raw body for signature validation
    const raw = await req.text();
    const body = raw ? JSON.parse(raw) : {};

    const appSecret = process.env.APP_SECRET;
    const sig = req.headers.get("x-hub-signature-256");

    if (appSecret) {
      const ok = verifySignature(appSecret, raw, sig);
      if (!ok) {
        return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 403 });
      }
    }

    // Quickly acknowledge to avoid timeouts per Meta's requirements
    // Store event for later retrieval
    addWebhookEvent({ timestamp: Date.now(), body });
    
    // Optional: log basic info for debugging (do not log secrets)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[WEBHOOK] entries:', Array.isArray(body?.entry) ? body.entry.length : 0);
    }
    // Optionally, you can enqueue processing here (e.g., Queue/Background task)
    return NextResponse.json({ ok: true, entryCount: Array.isArray(body?.entry) ? body.entry.length : 0 }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Invalid payload" }, { status: 400 });
  }
}