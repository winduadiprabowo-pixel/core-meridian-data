/**
 * Derivatives.tsx — ZERØ MERIDIAN
 * Real-time derivatives dashboard:
 * - Funding rates (Coinglass public, 30s refresh)
 * - Open interest (Coinglass public, 30s refresh)
 * - Long/Short ratio (Coinglass public, 30s refresh)
 * - Live liquidation feed (useLiquidations WS hook)
 * - Pure SVG charts, zero recharts
 * - Full React.memo + displayName, useCallback, useMemo
 * - mountedRef + AbortController on all fetches
 * - rgba() only, zero hsl()
 */

import {
  memo, useState, useEffect, useRef, useCallback, useMemo, useReducer,
} from 'react';
import { useLiquidations } from '@/hooks/useLiquidations';
import { formatCompactNum, formatPrice } from '@/lib/formatters';
import {
  TrendingUp, TrendingDown, Zap, Activity, BarChart3,
  AlertTriangle, RefreshCw, Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FundingRate {
  symbol: string;
  rate: number;       // e.g. 0.0001 = 0.01%
  nextFunding: number; // ms epoch
  exchange: string;
}

interface OpenInterest {
  symbol: string;
  openInterest: number; // USD
  change24h: number;    // pct
}

interface LongShortRatio {
  symbol: string;
  longRatio: number;  // 0-1
  shortRatio: number; // 0-1
}

interface DerivState {
  funding: FundingRate[];
  openInterest: OpenInterest[];
  longShort: LongShortRatio[];
  loading: boolean;
  lastFetch: number;
  error: string | null;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const TRACKED_SYMBOLS = Object.freeze([
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP',
  'ADA', 'AVAX', 'DOGE', 'LINK', 'ARB',
] as const);

// Coinglass public endpoints (no API key needed, rate limit ~30req/min)
const CG_BASE = 'https://open-api.coinglass.com/public/v2';
const REFRESH_MS = 30_000;

// Fallback: if Coinglass unavailable, use Binance fundingRate REST
const BINANCE_FUNDING = 'https://fapi.binance.com/fapi/v1/premiumIndex';

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_FUNDING'; payload: FundingRate[] }
  | { type: 'SET_OI'; payload: OpenInterest[] }
  | { type: 'SET_LS'; payload: LongShortRatio[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_FETCH'; payload: number };

const INITIAL: DerivState = {
  funding: [],
  openInterest: [],
  longShort: [],
  loading: true,
  lastFetch: 0,
  error: null,
};

function reducer(state: DerivState, action: Action): DerivState {
  switch (action.type) {
    case 'SET_FUNDING':    return { ...state, funding: action.payload };
    case 'SET_OI':         return { ...state, openInterest: action.payload };
    case 'SET_LS':         return { ...state, longShort: action.payload };
    case 'SET_LOADING':    return { ...state, loading: action.payload };
    case 'SET_ERROR':      return { ...state, error: action.payload };
    case 'SET_LAST_FETCH': return { ...state, lastFetch: action.payload, loading: false };
    default:               return state;
  }
}

// ─── Data fetcher hook ────────────────────────────────────────────────────────

function useDerivData() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const mountedRef = useRef(true);
  const abortRef = useRef(new AbortController());

  const fetchBinanceFunding = useCallback(async () => {
    try {
      const res = await fetch(BINANCE_FUNDING, { signal: abortRef.current.signal });
      if (!res.ok) return;
      const data = await res.json() as Array<{
        symbol: string;
        lastFundingRate: string;
        nextFundingTime: number;
      }>;
      if (!mountedRef.current) return;

      const filtered: FundingRate[] = data
        .filter(d => TRACKED_SYMBOLS.some(s => d.symbol === s + 'USDT'))
        .map(d => ({
          symbol: d.symbol.replace('USDT', ''),
          rate: parseFloat(d.lastFundingRate),
          nextFunding: d.nextFundingTime,
          exchange: 'Binance',
        }))
        .sort((a, b) => Math.abs(b.rate) - Math.abs(a.rate));

      dispatch({ type: 'SET_FUNDING', payload: filtered });
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
    }
  }, []);

  // Open interest from Binance fapi (public, no key needed)
  const fetchOI = useCallback(async () => {
    try {
      const results: OpenInterest[] = [];
      await Promise.allSettled(
        TRACKED_SYMBOLS.slice(0, 8).map(async sym => {
          try {
            const res = await fetch(
              'https://fapi.binance.com/fapi/v1/openInterest?symbol=' + sym + 'USDT',
              { signal: abortRef.current.signal }
            );
            if (!res.ok) return;
            const d = await res.json() as { openInterest: string; symbol: string };
            // Get 24h stats for change
            const statsRes = await fetch(
              'https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=' + sym + 'USDT',
              { signal: abortRef.current.signal }
            );
            if (!statsRes.ok) return;
            const stats = await statsRes.json() as { lastPrice: string };
            const oiUsd = parseFloat(d.openInterest) * parseFloat(stats.lastPrice);
            results.push({ symbol: sym, openInterest: oiUsd, change24h: 0 });
          } catch { /* skip this symbol */ }
        })
      );
      if (!mountedRef.current) return;
      const sorted = results.sort((a, b) => b.openInterest - a.openInterest);
      dispatch({ type: 'SET_OI', payload: sorted });
    } catch { /* silent */ }
  }, []);

  // Long/Short ratio from Binance fapi (public)
  const fetchLS = useCallback(async () => {
    try {
      const results: LongShortRatio[] = [];
      await Promise.allSettled(
        TRACKED_SYMBOLS.slice(0, 8).map(async sym => {
          try {
            const res = await fetch(
              'https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=' + sym + 'USDT&period=5m&limit=1',
              { signal: abortRef.current.signal }
            );
            if (!res.ok) return;
            const d = await res.json() as Array<{ longAccount: string; shortAccount: string }>;
            if (!d[0]) return;
            const long = parseFloat(d[0].longAccount);
            const short = parseFloat(d[0].shortAccount);
            results.push({ symbol: sym, longRatio: long, shortRatio: short });
          } catch { /* skip */ }
        })
      );
      if (!mountedRef.current) return;
      dispatch({ type: 'SET_LS', payload: results });
    } catch { /* silent */ }
  }, []);

  const fetchAll = useCallback(async () => {
    dispatch({ type: 'SET_ERROR', payload: null });
    await Promise.allSettled([fetchBinanceFunding(), fetchOI(), fetchLS()]);
    if (mountedRef.current) {
      dispatch({ type: 'SET_LAST_FETCH', payload: Date.now() });
    }
  }, [fetchBinanceFunding, fetchOI, fetchLS]);

  useEffect(() => {
    mountedRef.current = true;
    abortRef.current = new AbortController();
    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_MS);
    return () => {
      mountedRef.current = false;
      abortRef.current.abort();
      clearInterval(interval);
    };
  }, [fetchAll]);

  return { state, refetch: fetchAll };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Funding Rate Row
const FundingRow = memo(({ item }: { item: FundingRate }) => {
  const pct = item.rate * 100;
  const isPositive = pct >= 0;
  const isHot = Math.abs(pct) > 0.05;
  const color = isPositive ? 'var(--zm-positive)' : 'var(--zm-negative)';
  const bgColor = isPositive ? 'rgba(52,211,153,0.08)' : 'rgba(251,113,133,0.08)';

  const nextMs = item.nextFunding - Date.now();
  const nextHr = Math.floor(nextMs / 3600000);
  const nextMin = Math.floor((nextMs % 3600000) / 60000);
  const nextLabel = nextMs > 0 ? nextHr + 'h ' + nextMin + 'm' : '—';

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 transition-colors"
      style={{ borderBottom: '1px solid rgba(96,165,250,0.05)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--zm-surface-1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span
        className="font-mono-ui text-xs font-bold w-14"
        style={{ color: 'rgba(226,232,240,0.9)' }}
      >
        {item.symbol}
      </span>

      {/* Rate bar */}
      <div className="flex-1 flex items-center gap-2">
        <div
          className="px-2 py-0.5 rounded font-mono text-xs font-bold"
          style={{ background: bgColor, color, minWidth: 72, textAlign: 'right' }}
        >
          {(pct >= 0 ? '+' : '') + pct.toFixed(4) + '%'}
        </div>
        {isHot && (
          <span className="text-[10px]" style={{ color: 'rgba(251,191,36,0.9)' }}>🔥</span>
        )}
      </div>

      <span className="font-mono text-[10px] w-16 text-right" style={{ color: 'rgba(148,163,184,0.45)' }}>
        {nextLabel}
      </span>
      <span className="font-mono-ui text-[10px] w-14 text-right" style={{ color: 'rgba(138,138,158,0.35)' }}>
        {item.exchange}
      </span>
    </div>
  );
});
FundingRow.displayName = 'FundingRow';

// Open Interest Row
const OIRow = memo(({ item, maxOI }: { item: OpenInterest; maxOI: number }) => {
  const barPct = maxOI > 0 ? (item.openInterest / maxOI) * 100 : 0;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 relative transition-colors"
      style={{ borderBottom: '1px solid rgba(96,165,250,0.05)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--zm-surface-1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Bar bg */}
      <div
        className="absolute left-0 top-0 bottom-0 transition-all duration-500"
        style={{
          width: barPct + '%',
          background: 'rgba(96,165,250,0.06)',
          willChange: 'width',
        }}
      />
      <span className="relative font-mono-ui text-xs font-bold w-14" style={{ color: 'rgba(226,232,240,0.9)' }}>
        {item.symbol}
      </span>
      <span className="relative font-mono text-xs font-semibold flex-1 text-right" style={{ color: 'var(--zm-accent)' }}>
        ${formatCompactNum(item.openInterest)}
      </span>
    </div>
  );
});
OIRow.displayName = 'OIRow';

// Long/Short Bar
const LSBar = memo(({ item }: { item: LongShortRatio }) => {
  const longPct = item.longRatio * 100;
  const shortPct = item.shortRatio * 100;
  const isLongDom = longPct > 50;

  return (
    <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(96,165,250,0.05)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono-ui text-xs font-bold" style={{ color: 'rgba(226,232,240,0.9)' }}>
          {item.symbol}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold" style={{ color: 'rgba(34,255,170,0.90)' }}>
            L {longPct.toFixed(1)}%
          </span>
          <span className="font-mono text-[10px] font-semibold" style={{ color: 'rgba(255,68,136,0.90)' }}>
            S {shortPct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--zm-glass-bg)' }}>
        <div
          className="absolute left-0 top-0 h-full rounded-l-full transition-all duration-500"
          style={{ width: longPct + '%', background: 'rgba(52,211,153,0.75)', willChange: 'width' }}
        />
        <div
          className="absolute right-0 top-0 h-full rounded-r-full transition-all duration-500"
          style={{ width: shortPct + '%', background: 'rgba(251,113,133,0.75)', willChange: 'width' }}
        />
      </div>
    </div>
  );
});
LSBar.displayName = 'LSBar';

// Funding rate SVG mini chart (shows distribution)
const FundingDistChart = memo(({ data }: { data: FundingRate[] }) => {
  if (data.length === 0) return null;

  const W = 300;
  const H = 60;
  const PAD = { t: 4, b: 16, l: 4, r: 4 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const rates = data.map(d => d.rate * 100);
  const maxAbs = Math.max(...rates.map(Math.abs), 0.01);
  const midY = PAD.t + cH / 2;
  const barW = Math.floor(cW / rates.length) - 2;

  return (
    <svg width="100%" viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="none" style={{ display: 'block', height: H }}>
      {/* Zero line */}
      <line x1={PAD.l} y1={midY} x2={W - PAD.r} y2={midY} stroke="var(--zm-accent-border)" strokeWidth="1" />

      {rates.map((r, i) => {
        const x = PAD.l + i * (cW / rates.length) + 1;
        const barH = Math.abs(r) / maxAbs * (cH / 2 - 2);
        const isPos = r >= 0;
        const y = isPos ? midY - barH : midY;
        const fill = isPos ? 'rgba(52,211,153,0.75)' : 'rgba(251,113,133,0.75)';
        const sym = data[i]?.symbol ?? '';

        return (
          <g key={sym}>
            <rect x={x} y={y} width={barW} height={Math.max(barH, 1)} fill={fill} rx="1" />
            <text
              x={x + barW / 2}
              y={H - 3}
              textAnchor="middle"
              fontSize="7"
              fontFamily="'IBM Plex Mono', monospace"
              fill="rgba(148,163,184,0.45)"
            >
              {sym}
            </text>
          </g>
        );
      })}
    </svg>
  );
});
FundingDistChart.displayName = 'FundingDistChart';

// Liquidation summary bar
const LiqSummary = memo(({ longUsd, shortUsd }: { longUsd: number; shortUsd: number }) => {
  const total = longUsd + shortUsd;
  const longPct = total > 0 ? (longUsd / total) * 100 : 50;
  const shortPct = total > 0 ? (shortUsd / total) * 100 : 50;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingDown size={12} style={{ color: 'rgba(255,68,136,0.80)' }} />
          <span className="font-mono-ui text-[10px]" style={{ color: 'rgba(138,138,158,0.50)' }}>LONG LIQ</span>
          <span className="font-mono text-xs font-bold" style={{ color: 'var(--zm-negative)' }}>
            ${formatCompactNum(longUsd)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold" style={{ color: 'var(--zm-positive)' }}>
            ${formatCompactNum(shortUsd)}
          </span>
          <span className="font-mono-ui text-[10px]" style={{ color: 'rgba(138,138,158,0.50)' }}>SHORT LIQ</span>
          <TrendingUp size={12} style={{ color: 'rgba(34,255,170,0.80)' }} />
        </div>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--zm-surface-2)' }}>
        <div
          className="absolute left-0 top-0 h-full rounded-l-full transition-all duration-500"
          style={{ width: longPct + '%', background: 'rgba(251,113,133,0.7)', willChange: 'width' }}
        />
        <div
          className="absolute right-0 top-0 h-full rounded-r-full transition-all duration-500"
          style={{ width: shortPct + '%', background: 'rgba(34,255,170,0.70)', willChange: 'width' }}
        />
      </div>
    </div>
  );
});
LiqSummary.displayName = 'LiqSummary';

// ─── Main Page ────────────────────────────────────────────────────────────────

const Derivatives = memo(() => {
  const { state, refetch } = useDerivData();
  const liq = useLiquidations();

  const maxOI = useMemo(() =>
    Math.max(...state.openInterest.map(o => o.openInterest), 1),
    [state.openInterest]
  );

  const avgFunding = useMemo(() => {
    if (state.funding.length === 0) return 0;
    return state.funding.reduce((s, f) => s + f.rate, 0) / state.funding.length * 100;
  }, [state.funding]);

  const totalOI = useMemo(() =>
    state.openInterest.reduce((s, o) => s + o.openInterest, 0),
    [state.openInterest]
  );

  const dominantLS = useMemo(() => {
    const btc = state.longShort.find(l => l.symbol === 'BTC');
    return btc ?? null;
  }, [state.longShort]);

  const recentLiqs = useMemo(() => liq.events.slice(0, 30), [liq.events]);

  const wsColor = liq.wsStatus === 'connected'
    ? 'var(--zm-positive)'
    : liq.wsStatus === 'reconnecting'
    ? 'var(--zm-warning)'
    : 'var(--zm-negative)';

  const lastFetchLabel = useMemo(() => {
    if (!state.lastFetch) return '—';
    const diff = Math.floor((Date.now() - state.lastFetch) / 1000);
    return diff + 's ago';
  }, [state.lastFetch]);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold font-mono-ui zm-gradient-text">Derivatives & Perps</h1>
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: wsColor, boxShadow: liq.wsStatus === 'connected' ? '0 0 5px ' + wsColor : 'none', willChange: 'transform' }}
          />
          <span className="font-mono-ui text-[10px]" style={{ color: 'rgba(34,255,170,0.90)' }}>
            LIQ LIVE · Binance Futures
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded"
          style={{ background: 'var(--zm-surface-1)', border: '1px solid rgba(96,165,250,0.07)' }}
        >
          <span className="font-mono-ui text-[10px]" style={{ color: 'rgba(138,138,158,0.50)' }}>
            REST · {lastFetchLabel}
          </span>
        </div>
        <button
          onClick={refetch}
          aria-label="Refresh data"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ml-auto"
          style={{ border: '1px solid rgba(96,165,250,0.12)', color: 'rgba(138,138,158,0.50)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--zm-accent-bg)'; e.currentTarget.style.color = 'var(--zm-accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(138,138,158,0.50)'; }}
        >
          <RefreshCw size={11} />
          <span className="font-mono-ui text-[10px]">Refresh</span>
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Avg Funding Rate',
            value: (avgFunding >= 0 ? '+' : '') + avgFunding.toFixed(4) + '%',
            color: avgFunding >= 0 ? 'var(--zm-positive)' : 'var(--zm-negative)',
            icon: Activity,
            sub: '8h rate · ' + state.funding.length + ' pairs',
          },
          {
            label: 'Total Open Interest',
            value: '$' + formatCompactNum(totalOI),
            color: 'var(--zm-accent)',
            icon: BarChart3,
            sub: state.openInterest.length + ' pairs tracked',
          },
          {
            label: 'BTC Long/Short',
            value: dominantLS
              ? (dominantLS.longRatio * 100).toFixed(1) + '% / ' + (dominantLS.shortRatio * 100).toFixed(1) + '%'
              : '—',
            color: dominantLS && dominantLS.longRatio > 0.5 ? 'var(--zm-positive)' : 'var(--zm-negative)',
            icon: TrendingUp,
            sub: '5m period · Binance',
          },
          {
            label: '24h Liquidations',
            value: '$' + formatCompactNum(liq.stats.totalLongLiqUsd + liq.stats.totalShortLiqUsd),
            color: 'var(--zm-warning)',
            icon: Zap,
            sub: liq.stats.eventsPerMinute + ' events/min',
          },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="zm-glass zm-corners px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={11} style={{ color: 'rgba(138,138,158,0.40)' }} />
                <span className="font-mono-ui text-[10px] uppercase tracking-wider" style={{ color: 'rgba(138,138,158,0.40)' }}>
                  {stat.label}
                </span>
              </div>
              <div className="font-mono text-base font-bold" style={{ color: stat.color }}>
                {state.loading && !stat.value.includes('$0') ? (
                  <Loader2 size={14} className="animate-spin" style={{ color: stat.color }} />
                ) : stat.value}
              </div>
              <div className="font-mono-ui text-[9px] mt-0.5" style={{ color: 'rgba(138,138,158,0.30)' }}>
                {stat.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* ── Funding Rates ── */}
        <div className="zm-glass zm-corners overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(96,165,250,0.07)' }}
          >
            <div className="flex items-center gap-2">
              <Activity size={13} style={{ color: 'rgba(96,165,250,0.8)' }} />
              <span className="font-mono-ui text-xs font-semibold" style={{ color: 'rgba(226,232,240,0.85)' }}>
                Funding Rates
              </span>
            </div>
            <span className="font-mono-ui text-[10px]" style={{ color: 'rgba(138,138,158,0.35)' }}>
              8h · Binance Perps
            </span>
          </div>

          {/* Mini chart */}
          <div className="px-3 pt-3 pb-1">
            <FundingDistChart data={state.funding} />
          </div>

          {/* Column headers */}
          <div
            className="grid px-4 py-1.5"
            style={{
              gridTemplateColumns: '56px 1fr 64px 56px',
              borderBottom: '1px solid rgba(96,165,250,0.06)',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            {['PAIR', 'RATE', 'NEXT', 'EX'].map(h => (
              <span key={h} className="font-mono-ui text-[9px] uppercase tracking-wider" style={{ color: 'rgba(138,138,158,0.35)' }}>
                {h}
              </span>
            ))}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
            {state.loading && state.funding.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(96,165,250,0.5)' }} />
              </div>
            ) : state.funding.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <span className="font-mono-ui text-xs" style={{ color: 'rgba(138,138,158,0.30)' }}>No data</span>
              </div>
            ) : (
              state.funding.map(item => <FundingRow key={item.symbol} item={item} />)
            )}
          </div>
        </div>

        {/* ── Open Interest + Long/Short ── */}
        <div className="flex flex-col gap-4">

          {/* OI */}
          <div className="zm-glass zm-corners overflow-hidden flex-1">
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: '1px solid rgba(96,165,250,0.07)' }}
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={13} style={{ color: 'rgba(180,130,255,0.80)' }} />
                <span className="font-mono-ui text-xs font-semibold" style={{ color: 'rgba(226,232,240,0.85)' }}>
                  Open Interest
                </span>
              </div>
              <span className="font-mono-ui text-[10px]" style={{ color: 'rgba(138,138,158,0.35)' }}>
                Binance Futures
              </span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
              {state.loading && state.openInterest.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={18} className="animate-spin" style={{ color: 'rgba(96,165,250,0.5)' }} />
                </div>
              ) : (
                state.openInterest.map(item => <OIRow key={item.symbol} item={item} maxOI={maxOI} />)
              )}
            </div>
          </div>

          {/* Long/Short */}
          <div className="zm-glass zm-corners overflow-hidden flex-1">
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: '1px solid rgba(96,165,250,0.07)' }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={13} style={{ color: 'rgba(34,255,170,0.80)' }} />
                <span className="font-mono-ui text-xs font-semibold" style={{ color: 'rgba(226,232,240,0.85)' }}>
                  Long / Short Ratio
                </span>
              </div>
              <span className="font-mono-ui text-[10px]" style={{ color: 'rgba(138,138,158,0.35)' }}>
                5m · Global Accounts
              </span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
              {state.loading && state.longShort.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={18} className="animate-spin" style={{ color: 'rgba(96,165,250,0.5)' }} />
                </div>
              ) : (
                state.longShort.map(item => <LSBar key={item.symbol} item={item} />)
              )}
            </div>
          </div>
        </div>

        {/* ── Live Liquidation Feed ── */}
        <div className="zm-glass zm-corners overflow-hidden flex flex-col">
          <div
            className="flex items-center justify-between px-4 py-2.5 shrink-0"
            style={{ borderBottom: '1px solid rgba(96,165,250,0.07)' }}
          >
            <div className="flex items-center gap-2">
              <Zap size={13} style={{ color: 'rgba(255,187,0,0.80)' }} />
              <span className="font-mono-ui text-xs font-semibold" style={{ color: 'rgba(226,232,240,0.85)' }}>
                Live Liquidations
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded"
              style={{ background: 'var(--zm-surface-1)', border: '1px solid rgba(96,165,250,0.07)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: wsColor, willChange: 'transform' }}
              />
              <span className="font-mono-ui text-[9px]" style={{ color: 'rgba(138,138,158,0.50)' }}>
                {liq.wsStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Liq summary */}
          <div style={{ borderBottom: '1px solid rgba(96,165,250,0.06)' }}>
            <LiqSummary
              longUsd={liq.stats.totalLongLiqUsd}
              shortUsd={liq.stats.totalShortLiqUsd}
            />
          </div>

          {/* Stats row */}
          <div
            className="flex items-center gap-4 px-4 py-1.5 shrink-0"
            style={{ borderBottom: '1px solid rgba(96,165,250,0.05)', background: 'rgba(255,255,255,0.01)' }}
          >
            <div>
              <span className="font-mono-ui text-[9px]" style={{ color: 'rgba(138,138,158,0.40)' }}>Events/min </span>
              <span className="font-mono text-[10px] font-bold" style={{ color: 'rgba(251,191,36,0.9)' }}>
                {liq.stats.eventsPerMinute}
              </span>
            </div>
            {liq.stats.largestEvent && (
              <div>
                <span className="font-mono-ui text-[9px]" style={{ color: 'rgba(138,138,158,0.40)' }}>Largest </span>
                <span className="font-mono text-[10px] font-bold" style={{ color: 'rgba(251,191,36,0.9)' }}>
                  ${formatCompactNum(liq.stats.largestEvent.usdValue)}
                </span>
              </div>
            )}
            <AlertTriangle size={10} style={{ color: 'rgba(138,138,158,0.30)', marginLeft: 'auto' }} />
          </div>

          {/* Feed */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 400 }}>
            {recentLiqs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Zap size={22} style={{ color: 'rgba(148,163,184,0.2)' }} />
                <span className="font-mono-ui text-xs" style={{ color: 'rgba(138,138,158,0.30)' }}>
                  Waiting for liquidations…
                </span>
              </div>
            ) : (
              recentLiqs.map(ev => {
                const isLong = ev.side === 'SELL';
                const color = isLong ? 'var(--zm-negative)' : 'var(--zm-positive)';
                const label = isLong ? 'LONG' : 'SHORT';
                const sym = ev.symbol.replace('USDT', '');
                const diff = Date.now() - ev.timestamp;
                const ago = diff < 60000
                  ? Math.floor(diff / 1000) + 's'
                  : Math.floor(diff / 60000) + 'm';

                return (
                  <div
                    key={ev.id}
                    className="flex items-center gap-2 px-4 py-1.5 transition-colors"
                    style={{
                      borderBottom: '1px solid rgba(96,165,250,0.04)',
                      background: ev.isWhale ? 'rgba(251,191,36,0.03)' : 'transparent',
                    }}
                  >
                    {ev.isWhale && <span className="text-[10px]">🐋</span>}
                    <span className="font-mono-ui text-[10px] font-bold w-10" style={{ color }}>
                      {label}
                    </span>
                    <span className="font-mono text-[10px] font-bold w-10" style={{ color: 'rgba(226,232,240,0.8)' }}>
                      {sym}
                    </span>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--zm-text-secondary)' }}>
                      {formatPrice(ev.lastFilledPrice)}
                    </span>
                    <span
                      className="font-mono text-[10px] font-semibold ml-auto"
                      style={{ color: ev.isMajor ? 'var(--zm-warning)' : 'rgba(148,163,184,0.55)' }}
                    >
                      ${formatCompactNum(ev.usdValue)}
                    </span>
                    <span className="font-mono text-[9px] w-5 text-right" style={{ color: 'rgba(138,138,158,0.30)' }}>
                      {ago}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
Derivatives.displayName = 'Derivatives';

export default Derivatives;
