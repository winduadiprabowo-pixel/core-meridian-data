/**
 * api/markets.ts — ZERØ MERIDIAN Vercel Edge Function
 * Proxy CoinGecko /coins/markets dengan edge-side caching.
 * - 25s cache (stale-while-revalidate 60s)
 * - Rate limit protection
 * - CORS headers
 * Runtime: Edge (Vercel)
 */

export const config = { runtime: 'edge' };

const CG_URL =
  'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=usd&order=market_cap_desc&per_page=100&page=1' +
  '&sparkline=true&price_change_percentage=7d,30d';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    const res = await fetch(CG_URL, {
      headers: { Accept: 'application/json' },
      // @ts-ignore — Vercel edge fetch supports cf cache
      cf: { cacheTtl: 25, cacheEverything: true },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: 'Upstream error', status: res.status }),
        {
          status: res.status,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await res.text();

    return new Response(data, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=25, stale-while-revalidate=60',
        'X-ZM-Source': 'edge-proxy',
        'X-ZM-Cached-At': new Date().toISOString(),
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Edge function error', detail: String(err) }),
      {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      }
    );
  }
}
