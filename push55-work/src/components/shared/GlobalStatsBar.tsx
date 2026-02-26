/**
 * GlobalStatsBar.tsx — ZERØ MERIDIAN push43
 * push43: Offline/reconnect state — skeleton shimmer + RECONNECTING indicator
 *         Mobile overflow fix — stats area uses minWidth:0 + overflow hidden
 *         Brand dot: pure cyan (removed old blue)
 * push40: 40px height, live clock, ticker scroll
 * - React.memo + displayName ✓  - rgba() only ✓  - var(--zm-*) ✓
 * - Zero className in JSX ✓  - useCallback + useMemo ✓  - mountedRef ✓
 */

import { memo, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { formatCompact } from '@/lib/formatters';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Fear & Greed badge ───────────────────────────────────────────────────────

const FG_COLORS = Object.freeze([
  { max: 25,  color: 'var(--zm-negative)', bg: 'var(--zm-negative-bg)', label: 'Ext. Fear'  },
  { max: 45,  color: 'var(--zm-warning)',  bg: 'var(--zm-warning-bg)',  label: 'Fear'        },
  { max: 55,  color: 'var(--zm-text-secondary)', bg: 'rgba(138,138,158,0.15)', label: 'Neutral'     },
  { max: 75,  color: 'var(--zm-positive)',  bg: 'rgba(52,211,153,0.15)',  label: 'Greed'       },
  { max: 100, color: 'rgba(16,185,129,1)',  bg: 'rgba(16,185,129,0.18)', label: 'Ext. Greed'  },
]);

const FearGreedBadge = memo(({ value }) => {
  const cfg = useMemo(() =>
    FG_COLORS.find(c => value <= c.max) ?? FG_COLORS[FG_COLORS.length - 1],
    [value]
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>
        F&G
      </span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '1px 7px', borderRadius: '4px',
        background: cfg.bg,
        border: '1px solid ' + cfg.color.replace('1)', '0.30)'),
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700, color: cfg.color }}>
          {value}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: cfg.color, fontWeight: 500 }}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
});
FearGreedBadge.displayName = 'FearGreedBadge';

// ─── Stat item ────────────────────────────────────────────────────────────────

const StatItem = memo(({ label, value, change, accent }) => {
  const changeColor = change != null
    ? (change >= 0 ? 'var(--zm-positive)' : 'var(--zm-negative)')
    : undefined;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600, color: accent ?? 'var(--zm-text-primary)' }}>
        {value}
      </span>
      {change != null && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px', fontWeight: 500, color: changeColor,
          padding: '0 4px', borderRadius: '3px',
          background: change >= 0 ? 'var(--zm-positive-bg)' : 'rgba(251,113,133,0.10)',
        }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      )}
    </div>
  );
});
StatItem.displayName = 'StatItem';

// ─── Divider ──────────────────────────────────────────────────────────────────

const Div = memo(() => (
  <div style={{ width: 1, height: 16, background: 'var(--zm-divider-strong)', flexShrink: 0 }} />
));
Div.displayName = 'Div';

// ─── Mini scrolling ticker ────────────────────────────────────────────────────

const MiniTicker = memo(({ items }) => {
  if (!items || items.length === 0) return null;
  const doubled = [...items, ...items];
  return (
    <div style={{
      overflow: 'hidden', flex: 1, minWidth: 0,
      maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
      WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '24px',
        whiteSpace: 'nowrap',
        animation: 'zm-ticker-scroll 40s linear infinite',
      }}>
        {doubled.map((item, i) => {
          const pos = item.change >= 0;
          const col = pos ? 'var(--zm-positive)' : 'var(--zm-negative)';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, color: 'var(--zm-text-secondary)', letterSpacing: '0.04em' }}>
                {item.symbol}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--zm-text-primary)' }}>
                {item.price}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 600, color: col,
                padding: '0 4px', borderRadius: '3px',
                background: pos ? 'var(--zm-positive-bg)' : 'rgba(251,113,133,0.10)',
              }}>
                {pos ? '+' : ''}{item.change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
MiniTicker.displayName = 'MiniTicker';

// ─── Live clock ───────────────────────────────────────────────────────────────

const LiveClock = memo(() => {
  const mountedRef = useRef(true);
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(() => {
      if (mountedRef.current) setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: 'var(--zm-positive)',
        boxShadow: '0 0 6px rgba(34,255,170,0.80)', flexShrink: 0,
      }} />
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'rgba(34,255,170,0.90)', fontWeight: 600, letterSpacing: '0.06em' }}>
        LIVE
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)', letterSpacing: '0.04em' }}>
        {time} UTC
      </span>
    </div>
  );
});
LiveClock.displayName = 'LiveClock';

// ─── Reconnecting indicator ───────────────────────────────────────────────────

const ReconnectingBar = memo(() => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
    <motion.div
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: 6, height: 6, borderRadius: '50%',
        background: 'var(--zm-warning)',
        flexShrink: 0,
      }}
    />
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '10px',
      color: 'rgba(251,191,36,0.75)',
      letterSpacing: '0.10em',
      fontWeight: 600,
    }}>
      RECONNECTING
    </span>
  </div>
));
ReconnectingBar.displayName = 'ReconnectingBar';

// ─── Skeleton bar (first load / offline) ──────────────────────────────────────

const SHIMMER_WIDTHS = Object.freeze([60, 80, 52, 68, 72, 56]);

const SkeletonBar = memo(() => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
    {SHIMMER_WIDTHS.map((w, i) => (
      <div key={i} style={{
        width: w, height: 10, borderRadius: 4, flexShrink: 0,
        background: 'linear-gradient(90deg, var(--zm-surface-2) 25%, rgba(255,255,255,0.10) 50%, var(--zm-surface-2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s ease infinite',
        animationDelay: (i * 0.1) + 's',
      }} />
    ))}
  </div>
));
SkeletonBar.displayName = 'SkeletonBar';

// ─── GlobalStatsBar ───────────────────────────────────────────────────────────

const GlobalStatsBar = memo(() => {
  const stats = useGlobalStats();

  const mcapStr = useMemo(() => formatCompact(stats.totalMarketCap), [stats.totalMarketCap]);
  const volStr  = useMemo(() => formatCompact(stats.totalVolume24h),  [stats.totalVolume24h]);

  // Detect offline: loading + has previously loaded data = reconnecting
  // loading + no data yet = first load skeleton
  const isFirstLoad    = stats.loading && stats.lastUpdate === 0;
  const isReconnecting = stats.loading && stats.lastUpdate > 0;

  const containerStyle = useMemo(() => ({
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 200,
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 16px',
    background: 'var(--zm-topbar-bg)',
    borderBottom: '1px solid var(--zm-glass-border)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    overflow: 'hidden',
    willChange: 'transform',
  }), []);

  // ── First load: full skeleton ─────────────────────────────────────────
  if (isFirstLoad) {
    return (
      <div style={containerStyle} role="region" aria-label="Global market stats bar" aria-busy="true">
        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'rgba(0,238,255,0.40)',
          }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 700, color: 'var(--zm-text-faint)', letterSpacing: '0.12em' }}>
            ZM
          </span>
        </div>
        <Div />
        <SkeletonBar />
      </div>
    );
  }

  return (
    <div style={containerStyle} role="region" aria-label="Global market stats bar">
      {/* Brand mark — cyan dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--zm-cyan)',
          boxShadow: '0 0 7px rgba(34,211,238,0.55)',
        }} />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 700, color: 'var(--zm-accent)', letterSpacing: '0.12em' }}>
          ZM
        </span>
      </div>

      <Div />

      {/* Live clock or reconnecting indicator */}
      <AnimatePresence mode="wait">
        {isReconnecting ? (
          <motion.div key="reconnect"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ReconnectingBar />
          </motion.div>
        ) : (
          <motion.div key="clock"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LiveClock />
          </motion.div>
        )}
      </AnimatePresence>

      <Div />

      {/* Stats — flex with minWidth:0 to prevent mobile overflow */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        flex: 1, minWidth: 0, overflow: 'hidden',
      }}>
        <StatItem label="MCAP"    value={mcapStr} change={stats.marketCapChange24h} />
        <Div />
        <StatItem label="VOL 24H" value={volStr} />
        <Div />
        <StatItem label="BTC.D"   value={stats.btcDominance.toFixed(1) + '%'} accent="var(--zm-warning)" />
        <Div />
        <StatItem label="ETH.D"   value={stats.ethDominance.toFixed(1) + '%'} accent="var(--zm-violet)" />
        <Div />
        <FearGreedBadge value={stats.fearGreedValue} />
      </div>
    </div>
  );
});
GlobalStatsBar.displayName = 'GlobalStatsBar';

export default GlobalStatsBar;
