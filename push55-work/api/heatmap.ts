/**
 * api/heatmap.ts — ZERØ MERIDIAN Vercel Edge Function
 * Proxy CoinGecko coins/markets untuk HeatmapTile.
 * Mendukung timeframe: 1h, 24h, 7d via query param ?tf=
 * - 30s cache (stale-while-revalidate 60s)
 * - COEP-safe: same-origin response tidak diblokir require-corp
 * Runtime: Edge (Vercel)
 */

export const config = { runtime: 'edge' };

const CORS = Object.freeze({
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cross-Origin-Resource-Policy': 'cross-origin',
});

function buildUrl(limit: number): string {
  return (
    'https://api.coingecko.com/api/v3/coins/markets' +
    '?vs_currency=usd&order=market_cap_desc&per_page=' + limit +
    '&sparkline=false&price_change_percentage=1h,7d'
  );
}

function errRes(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...CORS } });
  }
  if (req.method !== 'GET') return errRes('Method not allowed', 405);

  const url    = new URL(req.url);
  const limit  = Math.min(Number(url.searchParams.get('limit') ?? 40), 100);
  const ctrl   = new AbortController();
  const timer  = setTimeout(() => ctrl.abort(), 8_000);

  try {
    const res = await fetch(buildUrl(limit), {
      signal:  ctrl.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return errRes('CoinGecko error: ' + res.status, 502);
    const data = await res.text();
    return new Response(data, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type':  'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-ZM-Source':   'edge-heatmap',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return errRes(msg.includes('abort') ? 'Timeout' : 'Edge error: ' + msg, 504);
  } finally {
    clearTimeout(timer);
  }
}
