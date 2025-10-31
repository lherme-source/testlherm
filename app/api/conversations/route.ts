import { NextResponse } from "next/server";
import { getConversations } from "@/lib/webhookStore";

export const runtime = 'nodejs';

export async function GET() {
  try {
    const conversations = getConversations();
    return NextResponse.json({ ok: true, conversations }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
