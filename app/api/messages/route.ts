import { NextRequest, NextResponse } from 'next/server';

/**
 * Placeholder de envio de mensagens.
 * TODO: Trocar por chamada real da Graph API do WhatsApp Business (v20+).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // TODO: validar, chamar Graph API com token do process.env.WABA_ACCESS_TOKEN
    return NextResponse.json({ ok: true, echo: body });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown' }, { status: 400 });
  }
}
