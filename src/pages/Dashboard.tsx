/**
 * Dashboard.tsx — ZERØ MERIDIAN 2026 push77
 * push77: Professional layout upgrade
 *   - Metric cards instant load (no skeleton flicker)
 *   - Clean section hierarchy like pro dashboards
 *   - Removed TERMINAL vXX badge
 *   - Better grid proportions
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useCallback + useMemo + mountedRef ✓
 */

import React, { Suspense, memo, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import GlassCard from '../components/shared/GlassCard';
import MetricCard from '../components/shared/MetricCard';
import Skeleton from '../components/shared/Skeleton';
import { useCrypto } from '@/contexts/CryptoContext';
import { formatPrice } from '@/lib/formatters';
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

// ─── Binance WS hook ──────────────────────────────────────────────────────────

interface WsPrice { price: number; change: number; }
type WsPriceMap = Record<string, WsPrice>;

const WS_SYMBOLS = Object.freeze(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT']);

function useBinanceWS(symbols: readonly string[]): WsPriceMap {
  const [prices, setPrices] = useState<WsPriceMap>({});
  const mountRef = useRef(true);
  const wsRef    = useRef<WebSocket | null>(null);

  useEffect(() => {
    mountRef.current = true;
    const streams = symbols.map(s => s.toLowerCase() + '@miniTicker').join('/');
    const url = 'wss://stream.binance.com:9443/stream?streams=' + streams;

    function connect() {
      if (!mountRef.current) return;
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        if (!mountRef.current) return;
        try {
          const d = JSON.parse(e.data).data;
          if (!d?.s) return;
          const price  = parseFloat(d.c);
          const open   = parseFloat(d.o);
          const change = open > 0 ? ((price - open) / open) * 100 : 0;
          setPrices(prev => ({ ...prev, [d.s]: { price, change } }));
        } catch { /* ignore */ }
      };
      ws.onerror  = () => {};
      ws.onclose  = () => { if (mountRef.current) setTimeout(connect, 3000); };
    }
    connect();
    return () => { mountRef.current = false; wsRef.current?.close(); };
  }, []); // eslint-disable-line

  return prices;
}

// ─── Static metric config ─────────────────────────────────────────────────────

interface MetricCfg {
  label: string; assetId: string; wsSymbol?: string;
  accentColor: string; icon?: string;
}

const METRICS: readonly MetricCfg[] = Object.freeze([
  { label: 'BTC / USD',  assetId: 'bitcoin',     wsSymbol: 'BTCUSDT', accentColor: 'rgba(251,191,36,1)' },
  { label: 'ETH / USD',  assetId: 'ethereum',    wsSymbol: 'ETHUSDT', accentColor: 'rgba(96,165,250,1)' },
  { label: 'SOL / USD',  assetId: 'solana',      wsSymbol: 'SOLUSDT', accentColor: 'rgba(167,139,250,1)' },
  { label: 'BNB / USD',  assetId: 'binancecoin', wsSymbol: 'BNBUSDT', accentColor: 'rgba(255,146,60,1)' },
  { label: 'Vol 24h',    assetId: '_volume',      accentColor: 'rgba(52,211,153,1)' },
  { label: 'Market Cap', assetId: '_mcap',        accentColor: 'rgba(45,212,191,1)' },
  { label: 'BTC Dom.',   assetId: '_dominance',   accentColor: 'rgba(248,113,113,1)' },
  { label: 'Assets',     assetId: '_count',       accentColor: 'rgba(148,163,184,0.8)' },
]);

// ─── Anim variants ────────────────────────────────────────────────────────────

const containerVariants = Object.freeze({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
});

const rowVariants = Object.freeze({
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
});

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = memo(({ label, color = 'rgba(0,238,255,0.4)', mt = 24 }: { label: string; color?: string; mt?: number }) => (
  <div style={{
    display:        'flex',
    alignItems:     'center',
    gap:            '8px',
    marginTop:      mt + 'px',
    marginBottom:   '12px',
  }}>
    <div style={{ width: 2, height: 12, background: color, borderRadius: 1 }} />
    <span style={{
      fontFamily:    "'JetBrains Mono', monospace",
      fontSize:      '10px',
      letterSpacing: '0.18em',
      color,
      textTransform: 'uppercase' as const,
    }}>
      {label}
    </span>
  </div>
));
SectionHeader.displayName = 'SectionHeader';

// ─── Tile skeleton ────────────────────────────────────────────────────────────

const TileSkeleton = memo(({ height = 320 }: { height?: number }) => (
  <GlassCard style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Skeleton.Card />
  </GlassCard>
));
TileSkeleton.displayName = 'TileSkeleton';

// ─── Live metric card ─────────────────────────────────────────────────────────

const LiveMetric = memo(({ cfg, wsPrice }: { cfg: MetricCfg; wsPrice?: WsPrice }) => {
  const { assets } = useCrypto();

  const { value, change } = useMemo(() => {
    if (wsPrice && cfg.wsSymbol) {
      const p = wsPrice.price;
      const fmt = p >= 1000
        ? '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 })
        : '$' + p.toFixed(2);
      return { value: fmt, change: wsPrice.change };
    }
    if (cfg.assetId === '_volume') {
      const t = assets.reduce((s, a) => s + (a.volume24h ?? 0), 0);
      return t > 0 ? { value: '$' + (t / 1e9).toFixed(1) + 'B', change: 0 } : { value: '—', change: 0 };
    }
    if (cfg.assetId === '_mcap') {
      const t = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
      return t > 0 ? { value: '$' + (t / 1e12).toFixed(2) + 'T', change: 0 } : { value: '—', change: 0 };
    }
    if (cfg.assetId === '_dominance') {
      const btc   = assets.find(a => a.id === 'bitcoin');
      const total = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
      if (btc && total > 0) return { value: ((btc.marketCap / total) * 100).toFixed(1) + '%', change: 0 };
      return { value: '—', change: 0 };
    }
    if (cfg.assetId === '_count') {
      return { value: assets.length > 0 ? assets.length.toString() : '—', change: 0 };
    }
    const asset = assets.find(a => a.id === cfg.assetId);
    if (!asset) return { value: '—', change: 0 };
    const fmt = asset.price >= 1000
      ? '$' + asset.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : '$' + asset.price.toFixed(2);
    return { value: fmt, change: asset.change24h ?? 0 };
  }, [assets, cfg, wsPrice]);

  return (
    <MetricCard
      label={cfg.label}
      value={value}
      change={change !== 0 ? change : undefined}
      accentColor={cfg.accentColor}
    />
  );
});
LiveMetric.displayName = 'LiveMetric';

// ─── Market quick bar ─────────────────────────────────────────────────────────

const MarketBar = memo(({ wsMap }: { wsMap: WsPriceMap }) => {
  const { assets } = useCrypto();
  const top5 = useMemo(() => assets.slice(0, 5), [assets]);
  if (top5.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px', marginBottom: '20px' }}>
      {top5.map(asset => {
        const ws  = wsMap[asset.symbol.toUpperCase() + 'USDT'];
        const chg = ws ? ws.change : asset.change24h;
        const prc = ws ? ws.price  : asset.price;
        const pos = chg >= 0;
        return (
          <div key={asset.id} style={{
            flex:          '0 0 auto',
            display:       'flex',
            alignItems:    'center',
            gap:           '10px',
            padding:       '8px 14px',
            borderRadius:  '8px',
            background:    'rgba(15,15,20,0.72)',
            border:        '1px solid rgba(32,42,68,1)',
            backdropFilter:'blur(20px)',
            minWidth:      '140px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 700, color: 'rgba(240,240,248,0.6)', letterSpacing: '0.08em' }}>
                {asset.symbol.toUpperCase()}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600, color: 'rgba(240,240,248,1)', marginTop: '1px' }}>
                {formatPrice(prc)}
              </span>
            </div>
            <span style={{
              fontFamily:   "'JetBrains Mono', monospace",
              fontSize:     '10px',
              fontWeight:   600,
              color:        pos ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)',
              background:   pos ? 'rgba(34,255,170,0.08)' : 'rgba(255,68,136,0.08)',
              border:       '1px solid ' + (pos ? 'rgba(34,255,170,0.2)' : 'rgba(255,68,136,0.2)'),
              borderRadius: '4px',
              padding:      '2px 6px',
              whiteSpace:   'nowrap' as const,
            }}>
              {(pos ? '+' : '') + chg.toFixed(2) + '%'}
            </span>
          </div>
        );
      })}
    </div>
  );
});
MarketBar.displayName = 'MarketBar';

// ─── Live clock ───────────────────────────────────────────────────────────────

const LiveClock = memo(() => {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(() => { if (mountedRef.current) setTime(new Date().toLocaleTimeString('en-US', { hour12: false })); }, 1000);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(15,15,20,0.72)', border: '1px solid rgba(0,238,255,0.1)', backdropFilter: 'blur(20px)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(34,255,170,1)', boxShadow: '0 0 6px rgba(34,255,170,0.6)', flexShrink: 0 }} />
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(34,255,170,0.85)', letterSpacing: '0.06em' }}>LIVE</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(80,80,100,1)' }}>{time} UTC</span>
    </div>
  );
});
LiveClock.displayName = 'LiveClock';

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = memo(() => {
  const mountedRef = useRef(true);
  const { isMobile, isTablet } = useBreakpoint();
  const wsMap = useBinanceWS(WS_SYMBOLS);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const col4 = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap:                 '10px',
    marginBottom:        '10px',
  }), [isMobile, isTablet]);

  const col2chart = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
    gap:                 '14px',
    marginBottom:        '14px',
  }), [isMobile]);

  const col3 = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    gap:                 '14px',
    marginBottom:        '14px',
  }), [isMobile, isTablet]);

  const col2 = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap:                 '14px',
    marginBottom:        '14px',
  }), [isMobile]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="main"
      aria-label="ZERØ MERIDIAN Dashboard"
    >
      {/* ── Page header ── */}
      <motion.div variants={rowVariants} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' as const }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, color: 'rgba(240,240,248,1)', letterSpacing: '0.06em', margin: '0 0 4px' }}>
            Dashboard
          </h1>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: 'rgba(80,80,100,1)', letterSpacing: '0.06em', margin: 0 }}>
            Institutional-grade crypto intelligence · Always free
          </p>
        </div>
        <LiveClock />
      </motion.div>

      {/* ── Market quick bar ── */}
      <motion.div variants={rowVariants}>
        <MarketBar wsMap={wsMap} />
      </motion.div>

      {/* ── 8 metric cards ── */}
      <motion.div variants={rowVariants}>
        <SectionHeader label="Key Metrics — Binance Live" color="rgba(0,238,255,0.4)" mt={0} />
        <div style={col4}>
          {METRICS.slice(0, 4).map(cfg => (
            <LiveMetric key={cfg.assetId} cfg={cfg} wsPrice={cfg.wsSymbol ? wsMap[cfg.wsSymbol] : undefined} />
          ))}
        </div>
        <div style={{ ...col4, marginBottom: '20px' }}>
          {METRICS.slice(4).map(cfg => (
            <LiveMetric key={cfg.assetId} cfg={cfg} wsPrice={cfg.wsSymbol ? wsMap[cfg.wsSymbol] : undefined} />
          ))}
        </div>
      </motion.div>

      {/* ── Price action + orderbook ── */}
      <motion.div variants={rowVariants}>
        <SectionHeader label="Price Action · TradingView" color="rgba(96,165,250,0.45)" />
        <div style={col2chart}>
          <Suspense fallback={<TileSkeleton height={420} />}>
            <TradingViewChart height={420} />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={420} />}>
            <OrderBookTile />
          </Suspense>
        </div>
      </motion.div>

      {/* ── Market intelligence ── */}
      <motion.div variants={rowVariants}>
        <SectionHeader label="Market Intelligence" color="rgba(167,139,250,0.45)" />
        <div style={col3}>
          <Suspense fallback={<TileSkeleton height={260} />}><HeatmapTile /></Suspense>
          <Suspense fallback={<TileSkeleton height={260} />}><FundingRateTile /></Suspense>
          <Suspense fallback={<TileSkeleton height={260} />}><LiquidationTile /></Suspense>
        </div>
      </motion.div>

      {/* ── WASM compute ── */}
      <motion.div variants={rowVariants}>
        <SectionHeader label="WASM Orderbook Engine" color="rgba(176,130,255,0.45)" />
        <div style={col2}>
          <Suspense fallback={<TileSkeleton height={480} />}>
            <WasmOrderBook symbol="BTCUSDT" basePrice={wsMap['BTCUSDT']?.price ?? 67840} />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={480} />}>
            <WasmOrderBook symbol="ETHUSDT" basePrice={wsMap['ETHUSDT']?.price ?? 3521} />
          </Suspense>
        </div>
      </motion.div>

      {/* ── Protocol revenue + AI signals ── */}
      <motion.div variants={rowVariants}>
        <SectionHeader label="Protocol Revenue · AI Signals" color="rgba(34,255,170,0.45)" />
        <div style={col2}>
          <Suspense fallback={<TileSkeleton height={400} />}><TokenTerminalTile /></Suspense>
          <Suspense fallback={<TileSkeleton height={400} />}><AISignalTile /></Suspense>
        </div>
      </motion.div>

      {/* ── News ── */}
      <motion.div variants={rowVariants}>
        <SectionHeader label="Market News" color="rgba(80,80,100,0.6)" mt={4} />
        <Suspense fallback={<TileSkeleton height={80} />}><NewsTickerTile /></Suspense>
      </motion.div>
    </motion.div>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
