/**
 * api/global.ts — ZERØ MERIDIAN Vercel Edge Function
 * GET /api/global?t=global  → CoinGecko /global
 * GET /api/global?t=fng     → Alternative.me Fear & Greed
 * Runtime: Edge — zero "functions" block di vercel.json
 */

export const config = { runtime: 'edge' };

const CG_GLOBAL_URL = 'https://api.coingecko.com/api/v3/global';
const FNG_URL       = 'https://api.alternative.me/fng/?limit=1';

const CORS = Object.freeze({
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

function errRes(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function handleGlobal(signal: AbortSignal): Promise<Response> {
  const res = await fetch(CG_GLOBAL_URL, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return errRes('CoinGecko error: ' + res.status, 502);
  const raw = await res.text();
  return new Response(raw, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      'X-ZM-Source': 'edge-global',
    },
  });
}

async function handleFng(signal: AbortSignal): Promise<Response> {
  const res = await fetch(FNG_URL, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return errRes('FNG error: ' + res.status, 502);
  const raw = await res.text();
  return new Response(raw, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      'X-ZM-Source': 'edge-fng',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...CORS } });
  }
  if (req.method !== 'GET') return errRes('Method not allowed', 405);

  const t          = new URL(req.url).searchParams.get('t');
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 8_000);

  try {
    if (t === 'fng') return await handleFng(controller.signal);
    return await handleGlobal(controller.signal);
  } catch (err: unknown) {
    const msg       = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes('abort');
    return errRes(
      isTimeout ? 'Gateway timeout' : 'Edge error: ' + msg,
      isTimeout ? 504 : 500
    );
  } finally {
    clearTimeout(timeout);
  }
}
