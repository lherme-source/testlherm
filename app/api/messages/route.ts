import { NextRequest, NextResponse } from 'next/server';

type SendText = { type: 'text'; to: string; text: { body: string } };
type SendImage = { type: 'image'; to: string; image: { link: string; caption?: string } };
type SendDocument = { type: 'document'; to: string; document: { link: string; caption?: string; filename?: string } };
type SendPayload = SendText | SendImage | SendDocument;

export async function POST(req: NextRequest) {
  try {
    const SIM = process.env.SIMULATION_MODE === 'true';
    const phoneId = process.env.PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;

    const payload = (await req.json()) as Partial<SendPayload> & Record<string, any>;
    const { type, to } = payload as any;
    if (!to || !type) return NextResponse.json({ ok: false, error: "Missing 'to' or 'type'" }, { status: 400 });

    // Basic validation per type
    if (type === 'text' && !payload?.text?.body) return NextResponse.json({ ok: false, error: "Missing text.body" }, { status: 400 });
    if (type === 'image' && !payload?.image?.link) return NextResponse.json({ ok: false, error: "Missing image.link" }, { status: 400 });
    if (type === 'document' && !payload?.document?.link) return NextResponse.json({ ok: false, error: "Missing document.link" }, { status: 400 });

    if (SIM) {
      return NextResponse.json({ simulated: true, id: `sim_${Date.now()}`, payload });
    }

    if (!token || !phoneId) {
      return NextResponse.json({ ok: false, error: 'Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID env.' }, { status: 500 });
    }

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type,
        ...(type === 'text' ? { text: { preview_url: false, body: payload.text.body } } : {}),
        ...(type === 'image' ? { image: payload.image } : {}),
        ...(type === 'document' ? { document: payload.document } : {}),
      })
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown' }, { status: 400 });
  }
}
