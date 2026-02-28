/**
 * Dashboard.tsx — ZERØ MERIDIAN push108
 * push108: willChange:transform on animated container
 * MEGA VISUAL UPGRADE:
 * - Circular Fear & Greed gauge (SVG arc)
 * - Gradient metric cards dengan glow
 * - BTC dominance ring chart
 * - Live ticker scrollbar top
 * - Glassmorphism v2 + neon borders
 * - Mobile: stacked full-width cards
 * - Tablet: 2-col grid
 * - Desktop: 4-col + 2/3+1/3 layout
 */

import React, { Suspense, memo, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Skeleton from '../components/shared/Skeleton';
import GlassCard from '../components/shared/GlassCard';
import MetricCard from '../components/shared/MetricCard';
import { useCrypto } from '@/contexts/CryptoContext';
import { formatPrice, formatCompact } from '@/lib/formatters';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const TradingViewChart  = React.lazy(() => import('../components/tiles/TradingViewChart'));
const OrderBookTile     = React.lazy(() => import('../components/tiles/OrderBookTile'));
const HeatmapTile       = React.lazy(() => import('../components/tiles/HeatmapTile'));
const FundingRateTile   = React.lazy(() => import('../components/tiles/FundingRateTile'));
const LiquidationTile   = React.lazy(() => import('../components/tiles/LiquidationTile'));
const NewsTickerTile    = React.lazy(() => import('../components/tiles/NewsTickerTile'));
const WasmOrderBook     = React.lazy(() => import('../components/tiles/WasmOrderBook'));
const TokenTerminalTile = React.lazy(() => import('../components/tiles/TokenTerminalTile'));
const AISignalTile      = React.lazy(() => import('../components/tiles/AISignalTile'));

interface MetricCfg {
  label: string; assetId: string;
  fallbackValue: string; fallbackChange: number;
  accentColor: string; icon: string;
}

const METRIC_CONFIG: readonly MetricCfg[] = Object.freeze([
  { label: 'BTC / USD',  assetId: 'bitcoin',     fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(251,191,36,1)',  icon: '₿' },
  { label: 'ETH / USD',  assetId: 'ethereum',    fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(96,165,250,1)',  icon: 'Ξ' },
  { label: 'SOL / USD',  assetId: 'solana',      fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(167,139,250,1)', icon: '◎' },
  { label: 'BNB / USD',  assetId: 'binancecoin', fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(251,146,60,1)',  icon: '⬡' },
  { label: 'VOL 24H',   assetId: '_volume',      fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(34,255,170,1)',  icon: '◈' },
  { label: 'MKT CAP',   assetId: '_mcap',        fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(0,238,255,1)',   icon: '◉' },
  { label: 'BTC.D',     assetId: '_dominance',   fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(255,68,136,1)',  icon: '◐' },
  { label: 'ASSETS',    assetId: '_count',        fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(148,163,184,0.7)', icon: '#' },
]);

const containerVariants = Object.freeze({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
});
const tileVariants = Object.freeze({
  hidden:  { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
});

// ─── Circular Fear & Greed Gauge ─────────────────────────────────────────────

const FearGreedGauge = memo(() => {
  const { fearGreed } = useCrypto();
  const val = fearGreed?.value ?? 0;
  const label = fearGreed?.label ?? 'Loading...';

  const gaugeColor = useMemo(() => {
    if (val <= 20) return 'rgba(255,68,136,1)';
    if (val <= 40) return 'rgba(251,146,60,1)';
    if (val <= 60) return 'rgba(251,191,36,1)';
    if (val <= 80) return 'rgba(34,255,170,1)';
    return 'rgba(0,238,255,1)';
  }, [val]);

  const glowColor = useMemo(() => gaugeColor.replace('1)', '0.5)'), [gaugeColor]);

  // SVG arc math
  const size = 120;
  const cx = size / 2, cy = size / 2;
  const R = 46;
  const startAngle = -210, endAngle = 30;
  const totalArc = endAngle - startAngle;
  const fillArc = totalArc * (val / 100);

  function arc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
    const s = (startDeg - 90) * Math.PI / 180;
    const e = (endDeg - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return 'M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
      <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} aria-label={'Fear & Greed ' + val}>
        <defs>
          <filter id="gaugeglow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <path d={arc(cx, cy, R, startAngle, endAngle)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
        {/* Fill */}
        {val > 0 && (
          <path d={arc(cx, cy, R, startAngle, startAngle + fillArc)} fill="none" stroke={gaugeColor}
            strokeWidth="8" strokeLinecap="round" filter="url(#gaugeglow)"
            style={{ filter: '0 0 8px ' + glowColor }} />
        )}
        {/* Center value */}
        <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: 700, fill: gaugeColor }}>
          {val}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle"
          style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '7px', fill: 'rgba(138,138,158,0.7)', letterSpacing: '0.08em' }}>
          F&G INDEX
        </text>
      </svg>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', color: gaugeColor, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
        {label}
      </span>
    </div>
  );
});
FearGreedGauge.displayName = 'FearGreedGauge';

// ─── BTC Dominance Ring ───────────────────────────────────────────────────────

const DominanceRing = memo(() => {
  const { assets } = useCrypto();
  const { btcD, ethD } = useMemo(() => {
    const total = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
    const btc = assets.find(a => a.id === 'bitcoin');
    const eth = assets.find(a => a.id === 'ethereum');
    return {
      btcD: total > 0 && btc ? (btc.marketCap / total) * 100 : 0,
      ethD: total > 0 && eth ? (eth.marketCap / total) * 100 : 0,
    };
  }, [assets]);

  const size = 100;
  const cx = size / 2, cy = size / 2, R = 36, stroke = 7;
  const circ = 2 * Math.PI * R;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '6px' }}>
      <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle cx={cx} cy={cy} r={R} fill="none"
          stroke="rgba(34,255,170,0.9)" strokeWidth={stroke}
          strokeDasharray={circ * (ethD / 100) + ' ' + circ}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={R} fill="none"
          stroke="rgba(251,191,36,0.9)" strokeWidth={stroke}
          strokeDasharray={circ * (btcD / 100) + ' ' + circ}
          strokeDashoffset={circ * 0.25 - circ * (ethD / 100)}
          strokeLinecap="round" />
        <text x={cx} y={cy - 4} textAnchor="middle"
          style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:700, fill:'rgba(251,191,36,1)' }}>
          {btcD.toFixed(1)}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle"
          style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'7px', fill:'rgba(138,138,158,0.6)' }}>
          BTC.D
        </text>
      </svg>
      <div style={{ display:'flex', gap:'12px' }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'rgba(251,191,36,0.8)' }}>
          BTC {btcD.toFixed(1)}%
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'rgba(34,255,170,0.8)' }}>
          ETH {ethD.toFixed(1)}%
        </span>
      </div>
    </div>
  );
});
DominanceRing.displayName = 'DominanceRing';

// ─── Live Clock ───────────────────────────────────────────────────────────────

const LiveClock = memo(() => {
  const [t, setT] = useState(0);
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const id = setInterval(() => { if (m.current) setT(x => x+1); }, 1000);
    return () => { m.current = false; clearInterval(id); };
  }, []);
  const now = useMemo(() => new Date().toLocaleTimeString('en-US', { hour12: false }), [t]); // eslint-disable-line
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'5px 12px',
      background:'rgba(0,238,255,0.04)', border:'1px solid rgba(0,238,255,0.12)',
      borderRadius:'6px' }}>
      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'rgba(34,255,170,1)',
        boxShadow:'0 0 8px rgba(34,255,170,0.8)', flexShrink:0 }} />
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'rgba(34,255,170,0.85)', letterSpacing:'0.06em' }}>
        LIVE
      </span>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'rgba(138,138,158,0.6)', letterSpacing:'0.04em' }}>
        {now} UTC
      </span>
    </div>
  );
});
LiveClock.displayName = 'LiveClock';

// ─── Horizontal scroll ticker ─────────────────────────────────────────────────

const QuickTicker = memo(() => {
  const { assets } = useCrypto();
  const top = useMemo(() => assets.slice(0, 8), [assets]);
  if (!top.length) return null;
  return (
    <div style={{ display:'flex', gap:'4px', overflowX:'auto', paddingBottom:'2px', marginBottom:'20px',
      scrollbarWidth:'none' as const }}>
      {top.map(a => {
        const pos = a.change24h >= 0;
        return (
          <div key={a.id} style={{ flexShrink:0, display:'flex', alignItems:'center', gap:'8px',
            padding:'6px 12px', borderRadius:'8px',
            background: pos ? 'rgba(34,255,170,0.04)' : 'rgba(255,68,136,0.04)',
            border: '1px solid ' + (pos ? 'rgba(34,255,170,0.12)' : 'rgba(255,68,136,0.12)'),
            minWidth:'130px' }}>
            {a.image && <img src={a.image} alt="" style={{ width:'16px', height:'16px', borderRadius:'50%', flexShrink:0 }} />}
            <div style={{ display:'flex', flexDirection:'column' as const }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', fontWeight:700,
                color:'rgba(230,230,242,1)' }}>
                {a.symbol.toUpperCase()}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'rgba(138,138,158,0.7)' }}>
                {formatPrice(a.price)}
              </span>
            </div>
            <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', fontWeight:600,
              color: pos ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)',
              background: pos ? 'rgba(34,255,170,0.08)' : 'rgba(255,68,136,0.08)',
              border:'1px solid ' + (pos ? 'rgba(34,255,170,0.2)' : 'rgba(255,68,136,0.2)'),
              borderRadius:'4px', padding:'1px 5px', whiteSpace:'nowrap' as const }}>
              {(pos ? '+' : '') + a.change24h.toFixed(2) + '%'}
            </span>
          </div>
        );
      })}
    </div>
  );
});
QuickTicker.displayName = 'QuickTicker';

// ─── LiveMetricCard ───────────────────────────────────────────────────────────

const LiveMetricCard = memo(({ config }: { config: MetricCfg }) => {
  const { assets } = useCrypto();
  const { value, change } = useMemo(() => {
    if (config.assetId === '_volume') {
      const t = assets.reduce((s,a) => s + (a.volume24h??0), 0);
      return t > 0 ? { value: '$' + (t/1e9).toFixed(1)+'B', change: 0 } : { value: config.fallbackValue, change: 0 };
    }
    if (config.assetId === '_mcap') {
      const t = assets.reduce((s,a) => s + (a.marketCap??0), 0);
      return t > 0 ? { value: '$' + (t/1e12).toFixed(2)+'T', change: 0 } : { value: config.fallbackValue, change: 0 };
    }
    if (config.assetId === '_dominance') {
      const btc = assets.find(a => a.id === 'bitcoin');
      const tot = assets.reduce((s,a) => s + (a.marketCap??0), 0);
      if (btc && tot > 0) return { value: ((btc.marketCap/tot)*100).toFixed(1)+'%', change: 0 };
      return { value: config.fallbackValue, change: 0 };
    }
    if (config.assetId === '_count') return { value: assets.length.toString(), change: 0 };
    const a = assets.find(x => x.id === config.assetId);
    if (!a) return { value: config.fallbackValue, change: config.fallbackChange };
    const fmt = a.price >= 1000
      ? '$' + a.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : '$' + a.price.toFixed(2);
    return { value: fmt, change: a.change24h ?? 0 };
  }, [assets, config]);

  return (
    <Suspense fallback={<div style={{ height:92, background:'rgba(255,255,255,0.03)', borderRadius:10 }} />}>
      <MetricCard label={config.icon + '  ' + config.label} value={value} change={change} accentColor={config.accentColor} />
    </Suspense>
  );
});
LiveMetricCard.displayName = 'LiveMetricCard';

// ─── Section label ────────────────────────────────────────────────────────────

const Sec = memo(({ label, color, mt = 20 }: { label: string; color?: string; mt?: number }) => (
  <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', letterSpacing:'0.18em',
    color: color ?? 'rgba(80,80,100,1)', marginBottom:'10px', marginTop:mt+'px',
    textTransform:'uppercase' as const }}>
    {label}
  </p>
));
Sec.displayName = 'Sec';

const TileSkeleton = memo(({ h = 320 }: { h?: number }) => (
  <GlassCard style={{ height:h, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'rgba(0,238,255,0.3)', letterSpacing:'0.1em' }}>
      LOADING…
    </div>
  </GlassCard>
));
TileSkeleton.displayName = 'TileSkeleton';

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = memo(() => {
  const [ready, setReady] = useState(false);
  const m = useRef(true);
  const { isMobile, isTablet } = useBreakpoint();

  useEffect(() => {
    m.current = true;
    const id = requestAnimationFrame(() => { if (m.current) setReady(true); });
    return () => { m.current = false; cancelAnimationFrame(id); };
  }, []);

  const g4 = useMemo(() => ({
    display:'grid',
    gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
    gap:'12px', marginBottom:'12px',
  }), [isMobile, isTablet]);

  const gMain = useMemo(() => ({
    display:'grid',
    gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
    gap:'16px', marginBottom:'20px',
  }), [isMobile]);

  const g3 = useMemo(() => ({
    display:'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
    gap:'16px', marginBottom:'20px',
  }), [isMobile, isTablet]);

  const g2 = useMemo(() => ({
    display:'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap:'16px', marginBottom:'20px',
  }), [isMobile]);

  if (!ready) return (
    <div style={{ padding:'20px' }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'rgba(0,238,255,0.4)', letterSpacing:'0.1em' }}>
        INITIALIZING TERMINAL…
      </div>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" role="main" aria-label="ZERØ MERIDIAN Dashboard" style={{ willChange:'transform' }}>

      {/* ── Header ── */}
      <motion.div variants={tileVariants} style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
        marginBottom:'20px', gap:'12px', flexWrap:'wrap' as const }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
            <h1 style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'20px', fontWeight:700,
              color:'rgba(230,230,242,1)', letterSpacing:'0.08em', margin:0,
              textShadow:'0 0 20px rgba(0,238,255,0.3)' }}>
              ZERØ MERIDIAN
            </h1>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'8px', padding:'2px 8px',
              borderRadius:'4px', letterSpacing:'0.14em',
              background:'rgba(0,238,255,0.08)', color:'rgba(0,238,255,0.7)',
              border:'1px solid rgba(0,238,255,0.2)' }}>
              TERMINAL v24
            </span>
          </div>
          <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px',
            color:'rgba(80,80,100,1)', letterSpacing:'0.08em', margin:0 }}>
            Institutional-grade crypto intelligence
          </p>
        </div>
        <LiveClock />
      </motion.div>

      {/* ── Quick Ticker ── */}
      <motion.div variants={tileVariants}><QuickTicker /></motion.div>

      {/* ── F&G + Dominance + Metrics ── */}
      <motion.div variants={tileVariants} style={{ marginBottom:'20px' }}>
        <Sec label="▸ Market Overview — Live" mt={0} />
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '120px 100px 1fr', gap:'16px', alignItems:'start' }}>
          {/* F&G Gauge */}
          <GlassCard style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} accentColor="rgba(0,238,255,0.5)">
            <FearGreedGauge />
          </GlassCard>
          {/* Dominance Ring */}
          {!isMobile && (
            <GlassCard style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'12px' }} accentColor="rgba(251,191,36,0.5)">
              <DominanceRing />
            </GlassCard>
          )}
          {/* Metric Grid */}
          <div>
            <div style={g4}>
              {METRIC_CONFIG.slice(0,4).map(cfg => <LiveMetricCard key={cfg.assetId} config={cfg} />)}
            </div>
            <div style={{ ...g4, marginBottom:0 }}>
              {METRIC_CONFIG.slice(4).map(cfg => <LiveMetricCard key={cfg.assetId} config={cfg} />)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Chart + OrderBook ── */}
      <motion.div variants={tileVariants}>
        <Sec label="▸ Price Action · Charts" />
        <div style={gMain}>
          <Suspense fallback={<TileSkeleton h={440} />}><TradingViewChart height={440} /></Suspense>
          <Suspense fallback={<TileSkeleton h={440} />}><OrderBookTile /></Suspense>
        </div>
      </motion.div>

      {/* ── Intelligence ── */}
      <motion.div variants={tileVariants}>
        <Sec label="▸ Market Intelligence" />
        <div style={g3}>
          <Suspense fallback={<TileSkeleton h={280} />}><HeatmapTile /></Suspense>
          <Suspense fallback={<TileSkeleton h={280} />}><FundingRateTile /></Suspense>
          <Suspense fallback={<TileSkeleton h={280} />}><LiquidationTile /></Suspense>
        </div>
      </motion.div>

      {/* ── WASM ── */}
      <motion.div variants={tileVariants}>
        <Sec label="⬡ WASM Orderbook Engine" color="rgba(167,139,250,0.45)" />
        <div style={g2}>
          <Suspense fallback={<TileSkeleton h={500} />}><WasmOrderBook symbol="BTCUSDT" basePrice={67840} /></Suspense>
          <Suspense fallback={<TileSkeleton h={500} />}><WasmOrderBook symbol="ETHUSDT" basePrice={3521} /></Suspense>
        </div>
      </motion.div>

      {/* ── Protocol + AI ── */}
      <motion.div variants={tileVariants}>
        <Sec label="◈ Protocol Revenue · AI Signals" color="rgba(34,255,170,0.4)" />
        <div style={g2}>
          <Suspense fallback={<TileSkeleton h={400} />}><TokenTerminalTile /></Suspense>
          <Suspense fallback={<TileSkeleton h={400} />}><AISignalTile /></Suspense>
        </div>
      </motion.div>

      {/* ── News ── */}
      <motion.div variants={tileVariants}>
        <Sec label="▸ Market News" mt={4} />
        <Suspense fallback={<TileSkeleton h={80} />}><NewsTickerTile /></Suspense>
      </motion.div>

    </motion.div>
  );
});
Dashboard.displayName = 'Dashboard';
export default Dashboard;
