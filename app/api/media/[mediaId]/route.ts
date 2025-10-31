import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: { mediaId: string } }) {
  const SIM = process.env.SIMULATION_MODE === 'true';
  const token = process.env.WHATSAPP_TOKEN;
  const mediaId = params.mediaId;

  if (!mediaId) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing mediaId' }), { status: 400 });
  }
  if (SIM) {
    return new Response(JSON.stringify({ ok: false, error: 'Media proxy disabled in simulation mode' }), { status: 400 });
  }
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing WHATSAPP_TOKEN env.' }), { status: 500 });
  }

  try {
    // 1) Get media URL from Graph API
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meta = await metaRes.json();
    if (!metaRes.ok || !meta?.url) {
      return new Response(JSON.stringify({ ok: false, status: metaRes.status, meta }), { status: metaRes.status });
    }

    // 2) Fetch the media binary using the returned URL (requires same Authorization header)
    const fileRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } });
    if (!fileRes.ok || !fileRes.body) {
      const text = await fileRes.text();
      return new Response(JSON.stringify({ ok: false, status: fileRes.status, error: text }), { status: fileRes.status });
    }

    // 3) Stream back to client with content-type and basic cache
    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = fileRes.headers.get('content-length') || undefined;

    return new Response(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        ...(contentLength ? { 'Content-Length': contentLength } : {}),
        'Cache-Control': 'private, max-age=3600'
      }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Unknown error' }), { status: 500 });
  }
}
