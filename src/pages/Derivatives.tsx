/**
 * Derivatives.tsx — ZERØ MERIDIAN 2026 push26
 * push26: Full var(--zm-*) migration (0% → ~80%)
 * Real-time derivatives dashboard:
 * - Funding rates (Coinglass public, 30s refresh)
 * - Open interest (Coinglass public, 30s refresh)
 * - Long/Short ratio (Coinglass public, 30s refresh)
 * - Live liquidation feed (useLiquidations WS hook)
 * - Pure SVG charts, zero recharts
 * - Full React.memo + displayName, useCallback, useMemo
 * - mountedRef + AbortController on all fetches
 * - rgba() only, zero hsl() ✓
 * - var(--zm-*) theme-aware ✓ ← push26
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
import { useBreakpoint } from '@/hooks/useBreakpoint';

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

const INITIAL: DerivState = Object.freeze({
  funding: [],
  openInterest: [],
  longShort: [],
  loading: true,
  lastFetch: 0,
  error: null,
} as DerivState);

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
  const color = isPositive ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)';
  const bgColor = isPositive ? 'rgba(52,211,153,0.08)' : 'rgba(251,113,133,0.08)';

  const nextMs = item.nextFunding - Date.now();
  const nextHr = Math.floor(nextMs / 3600000);
  const nextMin = Math.floor((nextMs % 3600000) / 60000);
  const nextLabel = nextMs > 0 ? nextHr + 'h ' + nextMin + 'm' : '—';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 16px',
        borderBottom: '1px solid var(--zm-divider)',
        transition: 'background 0.12s',
        willChange: 'transform',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--zm-surface-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 700, width: '56px', color: 'var(--zm-text-primary)', flexShrink: 0 }}>
        {item.symbol}
      </span>

      {/* Rate bar */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{ background: bgColor, color, padding: '2px 8px', borderRadius: '4px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 700, minWidth: '72px', textAlign: 'right' }}
        >
          {(pct >= 0 ? '+' : '') + pct.toFixed(4) + '%'}
        </div>
        {isHot && (
          <span style={{ fontSize: '10px', color: 'rgba(251,191,36,0.9)' }}>🔥</span>
        )}
      </div>

      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', width: '64px', textAlign: 'right', color: 'var(--zm-text-secondary)', flexShrink: 0 }}>
        {nextLabel}
      </span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', width: '56px', textAlign: 'right', color: 'var(--zm-text-faint)', flexShrink: 0 }}>
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
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 16px',
        borderBottom: '1px solid var(--zm-divider)',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--zm-surface-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Bar bg */}
      <div
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: barPct + '%',
          background: 'var(--zm-accent-dim)',
          willChange: 'width',
          transition: 'width 0.5s ease',
        }}
      />
      <span style={{ position: 'relative', fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, width: '56px', color: 'var(--zm-text-primary)', flexShrink: 0 }}>
        {item.symbol}
      </span>
      <span style={{ position: 'relative', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 600, flex: 1, textAlign: 'right', color: 'var(--zm-accent)' }}>
        {'$' + formatCompactNum(item.openInterest)}
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
    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--zm-divider)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
          {item.symbol}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 600, color: 'rgba(52,211,153,0.9)' }}>
            {'L ' + longPct.toFixed(1) + '%'}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 600, color: 'rgba(251,113,133,0.9)' }}>
            {'S ' + shortPct.toFixed(1) + '%'}
          </span>
        </div>
      </div>
      <div style={{ position: 'relative', height: '6px', borderRadius: '999px', overflow: 'hidden', background: 'var(--zm-surface-2)' }}>
        <div
          style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: '999px 0 0 999px', width: longPct + '%', background: 'rgba(52,211,153,0.75)', willChange: 'width', transition: 'width 0.5s ease' }}
        />
        <div
          style={{ position: 'absolute', right: 0, top: 0, height: '100%', borderRadius: '0 999px 999px 0', width: shortPct + '%', background: 'rgba(251,113,133,0.75)', willChange: 'width', transition: 'width 0.5s ease' }}
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
      <line x1={PAD.l} y1={midY} x2={W - PAD.r} y2={midY} stroke="var(--zm-accent-bg)" strokeWidth="1" />

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
              fill="var(--zm-text-secondary)"
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
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingDown size={12} style={{ color: 'rgba(251,113,133,0.8)' }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-secondary)' }}>LONG LIQ</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 700, color: 'rgba(251,113,133,1)' }}>
            {'$' + formatCompactNum(longUsd)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 700, color: 'rgba(52,211,153,1)' }}>
            {'$' + formatCompactNum(shortUsd)}
          </span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-secondary)' }}>SHORT LIQ</span>
          <TrendingUp size={12} style={{ color: 'rgba(52,211,153,0.8)' }} />
        </div>
      </div>
      <div style={{ position: 'relative', height: '8px', borderRadius: '999px', overflow: 'hidden', background: 'var(--zm-surface-2)' }}>
        <div
          style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: '999px 0 0 999px', width: longPct + '%', background: 'rgba(251,113,133,0.7)', willChange: 'width', transition: 'width 0.5s ease' }}
        />
        <div
          style={{ position: 'absolute', right: 0, top: 0, height: '100%', borderRadius: '0 999px 999px 0', width: shortPct + '%', background: 'rgba(52,211,153,0.7)', willChange: 'width', transition: 'width 0.5s ease' }}
        />
      </div>
    </div>
  );
});
LiqSummary.displayName = 'LiqSummary';

// ─── Main Page ────────────────────────────────────────────────────────────────

const Derivatives = memo(() => {
  const { isMobile, isTablet } = useBreakpoint();
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
    ? 'rgba(52,211,153,1)'
    : liq.wsStatus === 'reconnecting'
    ? 'rgba(251,191,36,1)'
    : 'rgba(251,113,133,1)';

  const lastFetchLabel = useMemo(() => {
    if (!state.lastFetch) return '—';
    const diff = Math.floor((Date.now() - state.lastFetch) / 1000);
    return diff + 's ago';
  }, [state.lastFetch]);

  const CARD_STYLE = Object.freeze({
    background: 'var(--zm-glass-bg)',
    border: '1px solid var(--zm-glass-border)',
    borderRadius: '12px',
    overflow: 'hidden' as const,
  });

  const PANEL_HDR = Object.freeze({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid var(--zm-glass-border)',
    background: 'var(--zm-surface-1)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.04em' }}>
          DERIVATIVES &amp; PERPS
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '6px', background: 'var(--zm-positive-bg)', border: '1px solid var(--zm-positive-border)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: wsColor, boxShadow: liq.wsStatus === 'connected' ? '0 0 5px ' + wsColor : 'none', willChange: 'transform', flexShrink: 0 }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'rgba(52,211,153,0.9)' }}>
            LIQ LIVE · Binance Futures
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '6px', background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-secondary)' }}>
            {'REST · ' + lastFetchLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={refetch}
          aria-label="Refresh derivatives data"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--zm-accent-border)', color: 'var(--zm-text-secondary)', background: 'transparent', cursor: 'pointer', marginLeft: 'auto', fontFamily: "'Space Mono', monospace", fontSize: '10px', willChange: 'transform' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--zm-accent-dim)'; e.currentTarget.style.color = 'rgba(96,165,250,1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--zm-text-secondary)'; }}
        >
          <RefreshCw size={11} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          {
            label: 'Avg Funding Rate',
            value: (avgFunding >= 0 ? '+' : '') + avgFunding.toFixed(4) + '%',
            color: avgFunding >= 0 ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)',
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
            color: dominantLS && dominantLS.longRatio > 0.5 ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)',
            icon: TrendingUp,
            sub: '5m period · Binance',
          },
          {
            label: '24h Liquidations',
            value: '$' + formatCompactNum(liq.stats.totalLongLiqUsd + liq.stats.totalShortLiqUsd),
            color: 'rgba(251,191,36,1)',
            icon: Zap,
            sub: liq.stats.eventsPerMinute + ' events/min',
          },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} style={{ ...CARD_STYLE, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Icon size={11} style={{ color: 'var(--zm-text-secondary)' }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.06em', color: 'var(--zm-text-secondary)', textTransform: 'uppercase' }}>
                  {stat.label}
                </span>
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '16px', fontWeight: 700, color: stat.color, minHeight: '24px' }}>
                {state.loading && stat.value === '—' ? (
                  <Loader2 size={14} style={{ color: stat.color, animation: 'spin 1s linear infinite' }} />
                ) : stat.value}
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', marginTop: '4px', color: 'var(--zm-text-faint)' }}>
                {stat.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>

        {/* ── Funding Rates ── */}
        <div style={CARD_STYLE}>
          <div style={PANEL_HDR}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={13} style={{ color: 'var(--zm-accent)' }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                FUNDING RATES
              </span>
            </div>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)' }}>
              8h · Binance Perps
            </span>
          </div>

          {/* Mini chart */}
          <div style={{ padding: '12px 12px 4px' }}>
            <FundingDistChart data={state.funding} />
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 64px 56px', padding: '6px 16px', borderBottom: '1px solid var(--zm-divider-strong)', background: 'var(--zm-surface-1)' }}>
            {['PAIR', 'RATE', 'NEXT', 'EX'].map(h => (
              <span key={h} style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.06em', color: 'var(--zm-text-faint)' }}>
                {h}
              </span>
            ))}
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '320px' }}>
            {state.loading && state.funding.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 size={20} style={{ color: 'var(--zm-accent)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : state.funding.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'var(--zm-text-faint)' }}>No data</span>
              </div>
            ) : (
              state.funding.map(item => <FundingRow key={item.symbol} item={item} />)
            )}
          </div>
        </div>

        {/* ── Open Interest + Long/Short ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* OI */}
          <div style={{ ...CARD_STYLE, flex: 1 }}>
            <div style={PANEL_HDR}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={13} style={{ color: 'rgba(167,139,250,0.8)' }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                  OPEN INTEREST
                </span>
              </div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)' }}>
                Binance Futures
              </span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
              {state.loading && state.openInterest.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
                  <Loader2 size={18} style={{ color: 'var(--zm-accent)', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                state.openInterest.map(item => <OIRow key={item.symbol} item={item} maxOI={maxOI} />)
              )}
            </div>
          </div>

          {/* Long/Short */}
          <div style={{ ...CARD_STYLE, flex: 1 }}>
            <div style={PANEL_HDR}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={13} style={{ color: 'rgba(52,211,153,0.8)' }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                  LONG / SHORT RATIO
                </span>
              </div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)' }}>
                5m · Global Accounts
              </span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
              {state.loading && state.longShort.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
                  <Loader2 size={18} style={{ color: 'var(--zm-accent)', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                state.longShort.map(item => <LSBar key={item.symbol} item={item} />)
              )}
            </div>
          </div>
        </div>

        {/* ── Live Liquidation Feed ── */}
        <div style={{ ...CARD_STYLE, display: 'flex', flexDirection: 'column' }}>
          <div style={{ ...PANEL_HDR, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={13} style={{ color: 'rgba(251,191,36,0.8)' }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                LIVE LIQUIDATIONS
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 6px', borderRadius: '4px', background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: wsColor, willChange: 'transform', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-secondary)' }}>
                {liq.wsStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Liq summary */}
          <div style={{ borderBottom: '1px solid var(--zm-divider-strong)', flexShrink: 0 }}>
            <LiqSummary
              longUsd={liq.stats.totalLongLiqUsd}
              shortUsd={liq.stats.totalShortLiqUsd}
            />
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '6px 16px', borderBottom: '1px solid var(--zm-divider)', background: 'var(--zm-surface-1)', flexShrink: 0 }}>
            <div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-secondary)' }}>Events/min </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: 'rgba(251,191,36,0.9)' }}>
                {liq.stats.eventsPerMinute}
              </span>
            </div>
            {liq.stats.largestEvent && (
              <div>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-secondary)' }}>Largest </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: 'rgba(251,191,36,0.9)' }}>
                  {'$' + formatCompactNum(liq.stats.largestEvent.usdValue)}
                </span>
              </div>
            )}
            <AlertTriangle size={10} style={{ color: 'var(--zm-text-faint)', marginLeft: 'auto' }} />
          </div>

          {/* Feed */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
            {recentLiqs.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '8px' }}>
                <Zap size={22} style={{ color: 'var(--zm-text-faint)' }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'var(--zm-text-faint)' }}>
                  Waiting for liquidations…
                </span>
              </div>
            ) : (
              recentLiqs.map(ev => {
                const isLong = ev.side === 'SELL';
                const color = isLong ? 'rgba(251,113,133,1)' : 'rgba(52,211,153,1)';
                const label = isLong ? 'LONG' : 'SHORT';
                const sym = ev.symbol.replace('USDT', '');
                const diff = Date.now() - ev.timestamp;
                const ago = diff < 60000
                  ? Math.floor(diff / 1000) + 's'
                  : Math.floor(diff / 60000) + 'm';

                return (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 16px',
                      borderBottom: '1px solid var(--zm-divider)',
                      background: ev.isWhale ? 'rgba(251,191,36,0.03)' : 'transparent',
                      transition: 'background 0.12s',
                    }}
                  >
                    {ev.isWhale && <span style={{ fontSize: '10px' }}>🐋</span>}
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', fontWeight: 700, width: '40px', color, flexShrink: 0 }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, width: '40px', color: 'var(--zm-text-primary)', flexShrink: 0 }}>
                      {sym}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--zm-text-secondary)' }}>
                      {formatPrice(ev.lastFilledPrice)}
                    </span>
                    <span
                      style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 600, marginLeft: 'auto', color: ev.isMajor ? 'rgba(251,191,36,1)' : 'var(--zm-text-secondary)' }}
                    >
                      {'$' + formatCompactNum(ev.usdValue)}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', width: '20px', textAlign: 'right', color: 'var(--zm-text-faint)', flexShrink: 0 }}>
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
