import { NextResponse } from "next/server";

export async function GET(){
  const SIM = process.env.SIMULATION_MODE === "true";
  const token = process.env.WHATSAPP_TOKEN;
  const wabaId = process.env.WABA_ID;

  if (!SIM && token && wabaId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${wabaId}/message_templates?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch (e:any) {
      return NextResponse.json({ error: e?.message || 'Failed to fetch templates' }, { status: 500 });
    }
  }

  // Fallback simulated data
  return NextResponse.json({ data: [
    { name: "boas_vindas_wj", category: "MARKETING", status: "APPROVED", language: "pt_BR" },
    { name: "aviso_pedidos_2026", category: "UTILITY", status: "APPROVED", language: "pt_BR" },
    { name: "cobranca_atraso", category: "UTILITY", status: "REJECTED", language: "pt_BR" },
  ] }, { status: 200 });
}