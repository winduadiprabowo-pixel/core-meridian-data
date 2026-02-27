/**
 * useSocialSentiment.ts — ZERØ MERIDIAN 2026 push85
 * Fear & Greed (Alternative.me), Funding Rate + OI (Binance Futures).
 * - mountedRef pattern ✓  useCallback ✓  useMemo ✓  Object.freeze ✓
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface FearGreedPoint {
  value: number;
  label: string;
  timestamp: number;
}

export interface FundingData {
  symbol: string;
  rate: number;      // raw, e.g. 0.0001 = 0.01%
  ratePct: number;   // rate * 100
  annualized: number; // rate * 3 * 365 * 100 (%)
  oiUsd: number;
  signal: 'LONG' | 'SHORT' | 'NEUTRAL';
}

export interface SentimentData {
  fearGreed: FearGreedPoint[];       // latest first, up to 7
  current: FearGreedPoint | null;
  funding: FundingData[];
  loadingFG: boolean;
  loadingFunding: boolean;
  errorFG: string | null;
  errorFunding: string | null;
  refreshFunding: () => void;
  lastUpdatedFunding: number | null;
}

const FUNDING_SYMBOLS = Object.freeze([
  'BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT',
  'ADAUSDT','AVAXUSDT','DOTUSDT','LINKUSDT','MATICUSDT',
]);

function toFundingSignal(rate: number): 'LONG' | 'SHORT' | 'NEUTRAL' {
  if (rate > 0.0001) return 'SHORT'; // positive funding → longs paying → crowded long → bearish signal
  if (rate < -0.0001) return 'LONG'; // negative funding → shorts paying → crowded short → bullish signal
  return 'NEUTRAL';
}

async function fetchFearGreed(): Promise<FearGreedPoint[]> {
  const res = await fetch('https://api.alternative.me/fng/?limit=7', {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error('FnG error');
  const data = await res.json();
  return (data.data ?? []).map((d: any): FearGreedPoint => ({
    value: parseInt(d.value, 10),
    label: d.value_classification,
    timestamp: parseInt(d.timestamp, 10) * 1000,
  }));
}

async function fetchFundingAndOI(): Promise<FundingData[]> {
  const [fundingRes, oiRes] = await Promise.allSettled([
    fetch('https://fapi.binance.com/fapi/v1/premiumIndex', { signal: AbortSignal.timeout(8000) }),
    fetch('https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT', { signal: AbortSignal.timeout(8000) }),
  ]);

  // Fetch all OI in parallel
  const oiResults = await Promise.allSettled(
    FUNDING_SYMBOLS.map(sym =>
      fetch('https://fapi.binance.com/fapi/v1/openInterest?symbol=' + sym, {
        signal: AbortSignal.timeout(8000),
      }).then(r => r.json())
    )
  );

  let fundingMap: Record<string, number> = {};
  if (fundingRes.status === 'fulfilled' && fundingRes.value.ok) {
    const allFunding: any[] = await fundingRes.value.json();
    for (const f of allFunding) {
      if (FUNDING_SYMBOLS.includes(f.symbol)) {
        fundingMap[f.symbol] = parseFloat(f.lastFundingRate ?? '0');
      }
    }
  }

  // We need price for OI USD: fetch BTC prices from CoinGecko for rough estimate
  // For simplicity, use Binance 24hr ticker price
  const priceRes = await fetch(
    'https://fapi.binance.com/fapi/v1/ticker/price',
    { signal: AbortSignal.timeout(8000) }
  ).then(r => r.json()).catch(() => []);

  const priceMap: Record<string, number> = {};
  for (const p of priceRes) {
    priceMap[p.symbol] = parseFloat(p.price);
  }

  return FUNDING_SYMBOLS.map((sym, i): FundingData => {
    const rate = fundingMap[sym] ?? 0;
    const oiResult = oiResults[i];
    let oiAmt = 0;
    if (oiResult.status === 'fulfilled') {
      const d = oiResult.value;
      oiAmt = parseFloat(d.openInterest ?? '0');
    }
    const price = priceMap[sym] ?? 0;
    const oiUsd = oiAmt * price;
    return {
      symbol: sym.replace('USDT', ''),
      rate,
      ratePct: rate * 100,
      annualized: rate * 3 * 365 * 100,
      oiUsd,
      signal: toFundingSignal(rate),
    };
  });
}

export function useSocialSentiment(): SentimentData {
  const [fearGreed, setFearGreed] = useState<FearGreedPoint[]>([]);
  const [funding, setFunding] = useState<FundingData[]>([]);
  const [loadingFG, setLoadingFG] = useState(true);
  const [loadingFunding, setLoadingFunding] = useState(true);
  const [errorFG, setErrorFG] = useState<string | null>(null);
  const [errorFunding, setErrorFunding] = useState<string | null>(null);
  const [lastUpdatedFunding, setLastUpdatedFunding] = useState<number | null>(null);
  const mountedRef = useRef(true);

  const loadFearGreed = useCallback(async () => {
    try {
      const data = await fetchFearGreed();
      if (!mountedRef.current) return;
      setFearGreed(data);
      setErrorFG(null);
    } catch {
      if (mountedRef.current) setErrorFG('F&G unavailable');
    } finally {
      if (mountedRef.current) setLoadingFG(false);
    }
  }, []);

  const loadFunding = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoadingFunding(true);
    try {
      const data = await fetchFundingAndOI();
      if (!mountedRef.current) return;
      setFunding(data);
      setLastUpdatedFunding(Date.now());
      setErrorFunding(null);
    } catch {
      if (mountedRef.current) setErrorFunding('Funding data unavailable');
    } finally {
      if (mountedRef.current) setLoadingFunding(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadFearGreed();
    loadFunding();
    const fgInterval = setInterval(loadFearGreed, 5 * 60 * 1000);
    const fundingInterval = setInterval(loadFunding, 60 * 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(fgInterval);
      clearInterval(fundingInterval);
    };
  }, [loadFearGreed, loadFunding]);

  const current = fearGreed[0] ?? null;

  return useMemo(() => ({
    fearGreed,
    current,
    funding,
    loadingFG,
    loadingFunding,
    errorFG,
    errorFunding,
    refreshFunding: loadFunding,
    lastUpdatedFunding,
  }), [fearGreed, current, funding, loadingFG, loadingFunding, errorFG, errorFunding, loadFunding, lastUpdatedFunding]);
}
