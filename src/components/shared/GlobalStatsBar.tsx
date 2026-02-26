/**
 * GlobalStatsBar.tsx — ZERØ MERIDIAN 2026
 * Top bar: total mcap, volume, BTC/ETH dominance, fear & greed, active cryptos.
 * Data: CoinGecko /global + Alternative.me (100% FREE)
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX ✓
 * - useCallback + useMemo ✓
 */

import { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { formatCompact } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

// ─── FearGreed Gauge ──────────────────────────────────────────────────────────

interface FearGreedProps {
  value: number;
  label: string;
}

const FG_COLORS = Object.freeze([
  { max: 25,  color: 'rgba(251,113,133,1)',  bg: 'rgba(251,113,133,0.15)' }, // Extreme Fear
  { max: 45,  color: 'rgba(251,191,36,1)',   bg: 'rgba(251,191,36,0.15)'  }, // Fear
  { max: 55,  color: 'rgba(148,163,184,1)',  bg: 'rgba(148,163,184,0.15)' }, // Neutral
  { max: 75,  color: 'rgba(52,211,153,1)',   bg: 'rgba(52,211,153,0.15)'  }, // Greed
  { max: 100, color: 'rgba(16,185,129,1)',   bg: 'rgba(16,185,129,0.2)'   }, // Extreme Greed
]);

const FearGreedBadge = memo(({ value, label }: FearGreedProps) => {
  const cfg = useMemo(() => {
    return FG_COLORS.find(c => value <= c.max) ?? FG_COLORS[FG_COLORS.length - 1];
  }, [value]);

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono-ui text-[10px]" style={{ color: 'var(--zm-text-faint)' }}>
        F&G
      </span>
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 rounded"
        style={{ background: cfg.bg }}
      >
        <span className="font-mono text-[11px] font-bold" style={{ color: cfg.color }}>
          {value}
        </span>
        <span className="font-mono-ui text-[10px]" style={{ color: cfg.color }}>
          {label}
        </span>
      </div>
    </div>
  );
});
FearGreedBadge.displayName = 'FearGreedBadge';

// ─── Stat Item ────────────────────────────────────────────────────────────────

interface StatItemProps {
  label:    string;
  value:    string;
  change?:  number;
  accent?:  string;
}

const StatItem = memo(({ label, value, change, accent }: StatItemProps) => {
  const changeColor = change != null
    ? change >= 0 ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)'
    : undefined;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="font-mono-ui text-[10px]" style={{ color: 'var(--zm-text-faint)' }}>
        {label}
      </span>
      <span
        className="font-mono text-[11px] font-semibold"
        style={{ color: accent ?? 'var(--zm-text-primary)' }}
      >
        {value}
      </span>
      {change != null && (
        <span className="font-mono text-[10px]" style={{ color: changeColor }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      )}
    </div>
  );
});
StatItem.displayName = 'StatItem';

// ─── Divider ─────────────────────────────────────────────────────────────────

const Div = memo(() => (
  <div
    className="shrink-0"
    style={{ width: 1, height: 14, background: 'rgba(96,165,250,0.15)' }}
  />
));
Div.displayName = 'Div';

// ─── Scrolling Ticker ─────────────────────────────────────────────────────────

interface TickerItem {
  symbol: string;
  price:  string;
  change: number;
}

interface MiniTickerProps {
  items: TickerItem[];
}

const MiniTicker = memo(({ items }: MiniTickerProps) => {
  if (items.length === 0) return null;
  // Duplicate for seamless scroll
  const doubled = [...items, ...items];

  return (
    <div
      className="overflow-hidden flex-1"
      style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}
    >
      <div
        className="flex items-center gap-6 whitespace-nowrap"
        style={{ animation: 'zm-ticker-scroll 40s linear infinite' }}
      >
        {doubled.map((item, i) => {
          const col = item.change >= 0 ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)';
          return (
            <div key={i} className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono-ui text-[10px] font-semibold" style={{ color: 'var(--zm-text-secondary)' }}>
                {item.symbol}
              </span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--zm-text-primary)' }}>
                {item.price}
              </span>
              <span className="font-mono text-[10px]" style={{ color: col }}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
MiniTicker.displayName = 'MiniTicker';

// ─── GlobalStatsBar ───────────────────────────────────────────────────────────

const GlobalStatsBar = memo(() => {
  const stats = useGlobalStats();

  const mcapStr   = useMemo(() => formatCompact(stats.totalMarketCap),  [stats.totalMarketCap]);
  const volStr    = useMemo(() => formatCompact(stats.totalVolume24h),   [stats.totalVolume24h]);
  const activeStr = useMemo(() => formatCompact(stats.activeCryptos),    [stats.activeCryptos]);

  if (stats.loading && stats.lastUpdate === 0) {
    return (
      <div
        className="w-full px-4 flex items-center"
        style={{
          height: 32,
          background: 'rgba(2,6,23,0.9)',
          borderBottom: '1px solid rgba(96,165,250,0.08)',
        }}
      >
        <div
          className="h-2 rounded-full"
          style={{ width: 200, background: 'rgba(96,165,250,0.1)', animation: 'pulse 2s infinite' }}
        />
      </div>
    );
  }

  return (
    <div
      className="w-full px-4 flex items-center gap-4 overflow-hidden"
      style={{
        position:   'fixed' as const,
        top:        0,
        left:       0,
        right:      0,
        zIndex:     100,
        height:     32,
        background: 'rgba(2,6,23,0.95)',
        borderBottom: '1px solid rgba(96,165,250,0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Left: stats */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1">
          <Activity size={11} style={{ color: 'rgba(96,165,250,0.6)' }} />
          <span
            className="font-mono-ui text-[10px] font-semibold tracking-widest"
            style={{ color: 'rgba(96,165,250,0.8)' }}
          >
            ZERØ
          </span>
        </div>

        <Div />
        <StatItem
          label="MCAP"
          value={mcapStr}
          change={stats.marketCapChange24h}
        />
        <Div />
        <StatItem label="VOL 24H" value={volStr} />
        <Div />
        <StatItem
          label="BTC.D"
          value={stats.btcDominance.toFixed(1) + '%'}
          accent="rgba(251,191,36,1)"
        />
        <Div />
        <StatItem
          label="ETH.D"
          value={stats.ethDominance.toFixed(1) + '%'}
          accent="rgba(167,139,250,1)"
        />
        <Div />
        <FearGreedBadge value={stats.fearGreedValue} label={stats.fearGreedLabel} />
        <Div />
        <StatItem label="ASSETS" value={activeStr} />
      </div>
    </div>
  );
});
GlobalStatsBar.displayName = 'GlobalStatsBar';

export default GlobalStatsBar;
