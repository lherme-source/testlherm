import { NextResponse } from "next/server";
export async function GET(){ return NextResponse.json({ data: [
  { name: "boas_vindas_wj", category: "MARKETING", status: "APPROVED", language: "pt_BR" },
  { name: "aviso_pedidos_2026", category: "UTILITY", status: "APPROVED", language: "pt_BR" },
  { name: "cobranca_atraso", category: "UTILITY", status: "REJECTED", language: "pt_BR" },
] }, { status: 200 }); }