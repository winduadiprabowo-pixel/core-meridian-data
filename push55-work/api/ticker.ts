/**
 * api/ticker.ts — Vercel Edge Function
 * Binance 24hr ticker proxy — fixes COEP require-corp violation.
 * Supports ?symbol=BTCUSDT or ?symbols=["BTCUSDT","ETHUSDT"]
 */
export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const url    = new URL(req.url);
  const symbol  = url.searchParams.get('symbol');
  const symbols = url.searchParams.get('symbols');

  let binanceUrl: string;
  if (symbol) {
    binanceUrl = 'https://api.binance.com/api/v3/ticker/24hr?symbol=' + symbol.toUpperCase();
  } else if (symbols) {
    binanceUrl = 'https://api.binance.com/api/v3/ticker/24hr?symbols=' + encodeURIComponent(symbols);
  } else {
    return new Response(JSON.stringify({ error: 'symbol or symbols param required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(binanceUrl, {
      headers: { 'Accept': 'application/json' },
    });
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: 'upstream ' + upstream.status }), {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const data = await upstream.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (e: unknown) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
