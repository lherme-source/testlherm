import { NextRequest, NextResponse } from "next/server";
const SIMULATION = process.env.SIMULATION_MODE === "true";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, template, lang = "pt_BR", components = [] } = body || {};
    if (!to || !template) return NextResponse.json({ error: "Missing 'to' or 'template'." }, { status: 400 });
    if (SIMULATION) return NextResponse.json({ simulated: true, to, template, lang, components, id: `sim_${Date.now()}` }, { status: 200 });
    const token = process.env.WHATSAPP_TOKEN, phoneId = process.env.PHONE_NUMBER_ID;
    if (!token || !phoneId) return NextResponse.json({ error: "Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID env." }, { status: 500 });
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name: template, language: { code: lang }, components } })
    });
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e:any) { return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 }); }
}