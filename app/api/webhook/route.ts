import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) return new NextResponse(challenge || "", { status: 200 });
  return new NextResponse("Forbidden", { status: 403 });
}
export async function POST(req: NextRequest) { try { const body = await req.json(); return NextResponse.json({ ok: true, received: body }, { status: 200 }); } catch(e:any){ return NextResponse.json({ ok: false, error: e?.message||'Invalid payload' }, { status: 400 }); } }