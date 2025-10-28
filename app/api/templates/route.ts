import { NextResponse } from "next/server";

export async function GET() {
  // Mock template list
  const items = [
    { name: "boas_vindas_wj", category: "MARKETING", status: "APPROVED", language: "pt_BR" },
    { name: "aviso_pedidos_2026", category: "UTILITY", status: "APPROVED", language: "pt_BR" },
    { name: "cobrança_atraso", category: "UTILITY", status: "REJECTED", language: "pt_BR" },
  ];
  return NextResponse.json({ data: items }, { status: 200 });
}
