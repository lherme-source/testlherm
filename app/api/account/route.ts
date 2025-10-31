import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function GET() {
  const SIM = process.env.SIMULATION_MODE === 'true';
  const token = process.env.WHATSAPP_TOKEN;
  const wabaId = process.env.WABA_ID;
  const phoneEnv = process.env.PHONE_NUMBER_ID;

  if (SIM || !token || !wabaId) {
    // Fallback simulado usando env se houver
    return NextResponse.json({
      source: SIM ? 'simulation' : 'env-missing',
      wabaId: wabaId || '—',
      phones: phoneEnv ? [{ id: phoneEnv, display: '(defina via Graph)', status: 'Unknown' }] : [],
    }, { status: 200 });
  }

  try {
    // phones
    const fields = 'id,display_phone_number,verified_name,quality_rating';
    const res = await fetch(`https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?fields=${encodeURIComponent(fields)}&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: json?.error || 'Graph error' }, { status: res.status });
    }
    const phones = (json?.data || []).map((p: any) => ({
      id: p.id,
      display: p.display_phone_number || p.verified_name || p.id,
      status: p.quality_rating || '—',
    }));

    // Try to fetch WABA name
    let name = '';
    try {
      const wabaRes = await fetch(`https://graph.facebook.com/v21.0/${wabaId}?fields=id,name`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const wabaJson = await wabaRes.json();
      if (wabaRes.ok) name = wabaJson?.name || '';
    } catch {}

    return NextResponse.json({ source: 'live', wabaId, name, phones }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
