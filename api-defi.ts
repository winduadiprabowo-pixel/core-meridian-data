/**
 * api/defi.ts — ZERØ MERIDIAN Vercel Edge Function
 * Proxy DefiLlama endpoints untuk useDefiLlama hook.
 * Query param: ?t=protocols|chains|yields|global
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

const ENDPOINTS: Record<string, { url: string; ttl: number }> = Object.freeze({
  protocols:    { url: 'https://api.llama.fi/protocols',                    ttl: 60  },
  chains:       { url: 'https://api.llama.fi/v2/chains',                   ttl: 120 },
  yields:       { url: 'https://yields.llama.fi/pools',                    ttl: 120 },
  global:       { url: 'https://api.llama.fi/v2/globalTvl',                ttl: 60  },
  stablecoins:  { url: 'https://stablecoins.llama.fi/stablecoins?includePrices=true', ttl: 120 },
});

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

  const t = new URL(req.url).searchParams.get('t') ?? 'protocols';
  const ep = ENDPOINTS[t];
  if (!ep) return errRes('Unknown endpoint: ' + t, 400);

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);

  try {
    const res = await fetch(ep.url, {
      signal:  ctrl.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return errRes('DefiLlama error: ' + res.status, 502);
    const data = await res.text();
    return new Response(data, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type':  'application/json',
        'Cache-Control': 'public, s-maxage=' + ep.ttl + ', stale-while-revalidate=30',
        'X-ZM-Source':   'edge-defi-' + t,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return errRes(msg.includes('abort') ? 'Timeout' : 'Edge error: ' + msg, 504);
  } finally {
    clearTimeout(timer);
  }
}
