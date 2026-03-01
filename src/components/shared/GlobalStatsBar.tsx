/**
 * GlobalStatsBar.tsx — ZERØ MERIDIAN push128
 * push128: Fix TypeError "Cannot read properties of undefined (reading 'loading')"
 *   - Fix: useGlobalStats() returns GlobalStats directly, not { stats }
 *   - Fix: marketCapChange → marketCapChange24h, activeCurrencies → activeCryptos
 * - React.memo + displayName ✓  rgba() only ✓  Zero className ✓
 * - useCallback + useMemo + mountedRef ✓
 */

import { memo, useMemo, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { formatCompact } from '@/lib/formatters';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useDevicePerf } from '@/hooks/useDevicePerf';

const FONT_MONO = "'JetBrains Mono', monospace";

// ─── Sparkline ────────────────────────────────────────────────────────────────

interface SparkProps { values: number[]; color: string; width?: number; height?: number; }

const Spark = memo(({ values, color, width = 48, height = 16 }: SparkProps) => {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return x + ',' + y;
  }).join(' ');
  return (
    <svg width={width} height={height} aria-hidden="true" style={{ flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});
Spark.displayName = 'Spark';

// ─── StatPill ─────────────────────────────────────────────────────────────────

interface PillProps {
  label:    string;
  value:    string;
  change?:  number;
  spark?:   number[];
  color?:   string;
}

const StatPill = memo(({ label, value, change, spark, color = 'rgba(0,238,255,1)' }: PillProps) => {
  const prefersRM = useReducedMotion();
  const isPos = (change ?? 0) >= 0;
  const changeColor = isPos ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)';

  return (
    <motion.div
      style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
      whileHover={prefersRM ? {} : { opacity: 0.85 }}
    >
      <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: 'rgba(80,85,110,1)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        {label}
      </span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color }}>
        {value}
      </span>
      {change !== undefined && (
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: changeColor }}>
          {isPos ? '+' : ''}{change.toFixed(1)}%
        </span>
      )}
      {spark && spark.length > 1 && <Spark values={spark} color={color} />}
    </motion.div>
  );
});
StatPill.displayName = 'StatPill';

// ─── Divider ──────────────────────────────────────────────────────────────────

const Div = memo(() => (
  <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} aria-hidden="true" />
));
Div.displayName = 'Div';

// ─── GlobalStatsBar ───────────────────────────────────────────────────────────

const GlobalStatsBar = memo(() => {
  const mountedRef = useRef(true);
  // FIX: useGlobalStats() returns GlobalStats directly — no destructuring
  const stats      = useGlobalStats();
  const { isMobile } = useBreakpoint();
  const { blur }   = useDevicePerf();

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const barStyle = useMemo(() => ({
    position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 200, height: 28,
    background: 'rgba(5,6,12,1)',
    ...(blur
      ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
      : {}
    ),
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, overflow: 'hidden',
  }), [blur]);

  const scrollStyle = useMemo(() => ({
    display: 'flex', alignItems: 'center', gap: 12,
    overflowX: 'auto' as const, scrollbarWidth: 'none' as const,
    flex: 1, minWidth: 0,
  }), []);

  if (stats.loading && stats.lastUpdate === 0) {
    return (
      <div style={barStyle}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: 'rgba(80,85,110,1)', letterSpacing: '0.1em' }}>
          LOADING MARKET DATA...
        </div>
      </div>
    );
  }

  // FIX: Use correct field names from GlobalStats interface
  const totalMcap  = stats.totalMarketCap      ?? 0;
  const totalVol   = stats.totalVolume24h       ?? 0;
  const btcDom     = stats.btcDominance         ?? 0;
  const ethDom     = stats.ethDominance         ?? 0;
  const mcapChange = stats.marketCapChange24h   ?? 0;  // was: marketCapChange
  const actCoins   = stats.activeCryptos        ?? 0;  // was: activeCurrencies

  return (
    <div style={barStyle} role="complementary" aria-label="Global market statistics">
      <div style={scrollStyle}>

        <StatPill
          label="MCAP"
          value={'$' + formatCompact(totalMcap)}
          change={mcapChange}
          color="rgba(0,238,255,1)"
        />

        {!isMobile && <Div />}

        {!isMobile && (
          <StatPill
            label="24H VOL"
            value={'$' + formatCompact(totalVol)}
            color="rgba(148,163,184,1)"
          />
        )}

        <Div />

        <StatPill
          label="BTC.D"
          value={btcDom.toFixed(1) + '%'}
          color="rgba(251,191,36,1)"
        />

        {!isMobile && <Div />}

        {!isMobile && (
          <StatPill
            label="ETH.D"
            value={ethDom.toFixed(1) + '%'}
            color="rgba(139,92,246,1)"
          />
        )}

        {!isMobile && <Div />}

        {!isMobile && (
          <StatPill
            label="COINS"
            value={actCoins.toLocaleString()}
            color="rgba(148,163,184,1)"
          />
        )}

      </div>

      {/* Timestamp */}
      {stats.lastUpdate > 0 && (
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: 'rgba(60,65,90,1)', flexShrink: 0, marginLeft: 'auto' }}>
          {new Date(stats.lastUpdate).toLocaleTimeString('en-US', { hour12: false })}
        </span>
      )}
    </div>
  );
});

GlobalStatsBar.displayName = 'GlobalStatsBar';
export default GlobalStatsBar;
