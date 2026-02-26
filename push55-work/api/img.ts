/**
 * api/img.ts — ZERØ MERIDIAN image proxy
 * Proxy external coin images (CoinGecko, DeFiLlama, etc.)
 * Adds Cross-Origin-Resource-Policy: cross-origin so COEP doesn't block them.
 * Runtime: Edge (Vercel)
 */

export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ALLOWED_ORIGINS = Object.freeze([
  'assets.coingecko.com',
  'coin-images.coingecko.com',
  'icons.llama.fi',
  'cdn.moralis.io',
  'token-icons.s3.amazonaws.com',
  'static.tokenterminal.com',
  'messari.io',
  'assets.messari.io',
]);

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url   = new URL(req.url);
  const imgUrl = url.searchParams.get('u');

  if (!imgUrl) {
    return new Response('Missing ?u= parameter', { status: 400, headers: CORS });
  }

  let parsed: URL;
  try {
    parsed = new URL(imgUrl);
  } catch {
    return new Response('Invalid URL', { status: 400, headers: CORS });
  }

  // Only proxy from known safe origins
  if (!ALLOWED_ORIGINS.some(o => parsed.hostname === o || parsed.hostname.endsWith('.' + o))) {
    return new Response('Origin not allowed', { status: 403, headers: CORS });
  }

  try {
    const res = await fetch(imgUrl, {
      headers: { Accept: 'image/*' },
    });

    if (!res.ok) {
      return new Response('Upstream error', { status: res.status, headers: CORS });
    }

    const contentType = res.headers.get('content-type') ?? 'image/png';
    const body = await res.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type':                    contentType,
        'Cross-Origin-Resource-Policy':    'cross-origin',
        'Cache-Control':                   'public, max-age=86400, stale-while-revalidate=604800',
        'X-ZM-Proxied':                    'true',
      },
    });
  } catch (err) {
    return new Response('Proxy error: ' + String(err), { status: 502, headers: CORS });
  }
}
