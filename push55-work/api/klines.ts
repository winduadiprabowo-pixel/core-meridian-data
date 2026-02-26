/**
 * api/klines.ts — ZERØ MERIDIAN Vercel Edge Function
 * Proxy Binance /api/v3/klines untuk TradingViewChart.
 * Query params: ?symbol=BTCUSDT&interval=1h&limit=200
 * - 10s cache (klines berubah tiap candle)
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

const ALLOWED_SYMBOLS = new Set([
  'BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT',
  'ADAUSDT','AVAXUSDT','DOGEUSDT','LINKUSDT','DOTUSDT',
]);

const ALLOWED_INTERVALS = new Set([
  '1m','3m','5m','15m','30m','1h','2h','4h','6h','12h','1d','1w',
]);

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

  const params   = new URL(req.url).searchParams;
  const symbol   = (params.get('symbol') ?? 'BTCUSDT').toUpperCase();
  const interval = params.get('interval') ?? '1h';
  const limit    = Math.min(Number(params.get('limit') ?? 200), 500);

  if (!ALLOWED_SYMBOLS.has(symbol))   return errRes('Invalid symbol', 400);
  if (!ALLOWED_INTERVALS.has(interval)) return errRes('Invalid interval', 400);

  const binanceUrl =
    'https://api.binance.com/api/v3/klines?symbol=' + symbol +
    '&interval=' + interval + '&limit=' + limit;

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);

  try {
    const res = await fetch(binanceUrl, {
      signal:  ctrl.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return errRes('Binance error: ' + res.status, 502);
    const data = await res.text();

    // Short cache — klines change every candle close
    const cacheSeconds = interval === '1m' ? 5 : interval === '5m' ? 15 : 30;

    return new Response(data, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type':  'application/json',
        'Cache-Control': 'public, s-maxage=' + cacheSeconds + ', stale-while-revalidate=10',
        'X-ZM-Source':   'edge-klines',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return errRes(msg.includes('abort') ? 'Timeout' : 'Edge error: ' + msg, 504);
  } finally {
    clearTimeout(timer);
  }
}
