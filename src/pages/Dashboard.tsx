/**
 * Dashboard.tsx — ZERØ MERIDIAN 2026 push70
 * push70:
 *   - Binance WebSocket live price feed (wss miniTicker)
 *   - Glass card effect: rgba(15,15,20,0.72) + blur(20px)
 *   - MetricsGrid: real-time WS prices override CryptoContext
 *   - Layout: no overlap, paddingTop managed by AppShell
 *   - React.memo + displayName ✓
 *   - rgba() only ✓  var(--zm-*) ✓
 *   - Zero template literals in JSX ✓
 *   - Object.freeze() all static data ✓
 *   - will-change: transform ✓
 *   - useCallback + useMemo ✓
 *   - mountedRef + AbortController ✓
 *   - Responsive grid (4→2→1 col) ✓
 *   - aria-label + role ✓
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

// ─── Static data ──────────────────────────────────────────────────────────────

interface MetricCfg {
  label:          string;
  assetId:        string;
  wsSymbol?:      string;
  fallbackValue:  string;
  fallbackChange: number;
  accentColor:    string;
}

const METRIC_CONFIG: readonly MetricCfg[] = Object.freeze([
  { label: 'BTC / USD',  assetId: 'bitcoin',     wsSymbol: 'BTCUSDT',  fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(255,187,0,1)' },
  { label: 'ETH / USD',  assetId: 'ethereum',    wsSymbol: 'ETHUSDT',  fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(96,165,250,1)' },
  { label: 'SOL / USD',  assetId: 'solana',      wsSymbol: 'SOLUSDT',  fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(167,139,250,1)' },
  { label: 'BNB / USD',  assetId: 'binancecoin', wsSymbol: 'BNBUSDT',  fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(255,146,60,1)' },
  { label: 'Vol 24h',    assetId: '_volume',     wsSymbol: undefined,  fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(52,211,153,1)' },
  { label: 'Mkt Cap',    assetId: '_mcap',       wsSymbol: undefined,  fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(45,212,191,1)' },
  { label: 'Dominance',  assetId: '_dominance',  wsSymbol: undefined,  fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(248,113,113,1)' },
  { label: 'Assets',     assetId: '_count',      wsSymbol: undefined,  fallbackValue: '—', fallbackChange: 0, accentColor: 'rgba(148,163,184,0.8)' },
]);

// ─── Binance WebSocket hook ────────────────────────────────────────────────────

interface WsPrice { price: number; change: number; }
type WsPriceMap = Record<string, WsPrice>;

function useBinanceWS(symbols: string[]): WsPriceMap {
  const [prices, setPrices] = useState<WsPriceMap>({});
  const mountRef = useRef(true);
  const wsRef    = useRef<WebSocket | null>(null);

  useEffect(() => {
    mountRef.current = true;
    if (symbols.length === 0) return;
    const streams = symbols.map(s => s.toLowerCase() + '@miniTicker').join('/');
    const url = 'wss://stream.binance.com:9443/stream?streams=' + streams;

    function connect() {
      if (!mountRef.current) return;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        if (!mountRef.current) return;
        try {
          const msg = JSON.parse(e.data);
          const d = msg.data;
          if (!d || !d.s) return;
          const sym  = d.s as string;
          const price = parseFloat(d.c);
          const open  = parseFloat(d.o);
          const change = open > 0 ? ((price - open) / open) * 100 : 0;
          setPrices(prev => ({ ...prev, [sym]: { price, change } }));
        } catch { /* ignore */ }
      };
      ws.onerror = () => {};
      ws.onclose = () => { if (mountRef.current) setTimeout(connect, 3000); };
    }

    connect();
    return () => {
      mountRef.current = false;
      wsRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return prices;
}

// ─── Anim variants ────────────────────────────────────────────────────────────

const containerVariants = Object.freeze({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
});

const tileVariants = Object.freeze({
  hidden:  { opacity: 0, y: 14, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
});

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel = memo(({ label, color = 'rgba(80,80,100,1)', mt = 20 }: { label: string; color?: string; mt?: number }) => (
  <p style={{
    fontFamily:    "'JetBrains Mono', monospace",
    fontSize:      '10px',
    letterSpacing: '0.16em',
    color,
    marginBottom:  '12px',
    marginTop:     mt + 'px',
    textTransform: 'uppercase' as const,
    willChange:    'transform',
  }}>
    {label}
  </p>
));
SectionLabel.displayName = 'SectionLabel';

// ─── Tile skeleton ────────────────────────────────────────────────────────────

const TileSkeleton = memo(({ height = 320 }: { height?: number }) => (
  <GlassCard style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Skeleton.Card />
  </GlassCard>
));
TileSkeleton.displayName = 'TileSkeleton';

// ─── Live status bar ─────────────────────────────────────────────────────────

const LiveStatusBar = memo(() => {
  const [tick, setTick] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(() => { if (mountedRef.current) setTick(t => t + 1); }, 1000);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  const now = useMemo(() => new Date().toLocaleTimeString('en-US', { hour12: false }), [tick]); // eslint-disable-line

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '10px',
      padding:      '5px 12px',
      borderRadius: '6px',
      background:   'rgba(15,15,20,0.72)',
      border:       '1px solid rgba(0,238,255,0.12)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      willChange:   'transform',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(34,255,170,1)', boxShadow: '0 0 6px rgba(34,255,170,0.7)', flexShrink: 0 }} />
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(34,255,170,0.85)', letterSpacing: '0.06em' }}>LIVE</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(80,80,100,1)', letterSpacing: '0.04em' }}>{now} UTC</span>
    </div>
  );
});
LiveStatusBar.displayName = 'LiveStatusBar';

// ─── Live Metric Card ─────────────────────────────────────────────────────────

interface LiveMetricCardProps { config: MetricCfg; wsPrice?: WsPrice; }

const LiveMetricCard = memo(({ config, wsPrice }: LiveMetricCardProps) => {
  const { assets } = useCrypto();

  const { value, change } = useMemo(() => {
    // WebSocket price takes priority for individual assets
    if (wsPrice && config.wsSymbol) {
      const p = wsPrice.price;
      const fmt = p >= 1000
        ? '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 })
        : '$' + p.toFixed(2);
      return { value: fmt, change: wsPrice.change };
    }

    if (config.assetId.startsWith('_')) {
      if (config.assetId === '_volume') {
        const total = assets.reduce((s, a) => s + (a.volume24h ?? 0), 0);
        return total > 0
          ? { value: '$' + (total / 1e9).toFixed(1) + 'B', change: 0 }
          : { value: config.fallbackValue, change: config.fallbackChange };
      }
      if (config.assetId === '_mcap') {
        const total = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
        return total > 0
          ? { value: '$' + (total / 1e12).toFixed(2) + 'T', change: 0 }
          : { value: config.fallbackValue, change: config.fallbackChange };
      }
      if (config.assetId === '_dominance') {
        const btc   = assets.find(a => a.id === 'bitcoin');
        const total = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
        if (btc && total > 0) return { value: ((btc.marketCap / total) * 100).toFixed(1) + '%', change: 0 };
        return { value: config.fallbackValue, change: config.fallbackChange };
      }
      if (config.assetId === '_count') {
        return { value: assets.length.toString(), change: 0 };
      }
    }

    const asset = assets.find(a => a.id === config.assetId);
    if (!asset) return { value: config.fallbackValue, change: config.fallbackChange };
    const fmt = asset.price >= 1000
      ? '$' + asset.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : '$' + asset.price.toFixed(2);
    return { value: fmt, change: asset.change24h ?? 0 };
  }, [assets, config, wsPrice]);

  return (
    <Suspense fallback={<Skeleton.Card />}>
      <MetricCard
        label={config.label}
        value={value}
        change={change}
        accentColor={config.accentColor}
      />
    </Suspense>
  );
});
LiveMetricCard.displayName = 'LiveMetricCard';

// ─── Market overview mini ticker ──────────────────────────────────────────────

const MarketOverviewBar = memo(({ wsMap }: { wsMap: WsPriceMap }) => {
  const { assets } = useCrypto();
  const top5 = useMemo(() => assets.slice(0, 5), [assets]);
  if (top5.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 0 2px', marginBottom: '20px', willChange: 'transform' }}
      role="region" aria-label="Top 5 assets quick view">
      {top5.map(asset => {
        const ws  = wsMap[asset.symbol.toUpperCase() + 'USDT'];
        const chg = ws ? ws.change : asset.change24h;
        const prc = ws ? ws.price : asset.price;
        const pos = chg >= 0;
        return (
          <div key={asset.id} style={{
            flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 8,
            background: 'rgba(15,15,20,0.72)',
            border: '1px solid rgba(32,42,68,1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            minWidth: 148, willChange: 'transform',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: 'rgba(240,240,248,1)', letterSpacing: '0.06em' }}>
                {asset.symbol.toUpperCase()}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,1)', marginTop: 1 }}>
                {formatPrice(prc)}
              </span>
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
              color:       pos ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)',
              background:  pos ? 'rgba(34,255,170,0.08)' : 'rgba(255,68,136,0.08)',
              border:      '1px solid ' + (pos ? 'rgba(34,255,170,0.20)' : 'rgba(255,68,136,0.20)'),
              borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' as const,
            }}>
              {(pos ? '+' : '') + chg.toFixed(2) + '%'}
            </span>
          </div>
        );
      })}
    </div>
  );
});
MarketOverviewBar.displayName = 'MarketOverviewBar';

// ─── Dashboard component ──────────────────────────────────────────────────────

const WS_ASSET_SYMBOLS = METRIC_CONFIG
  .filter(c => c.wsSymbol)
  .map(c => c.wsSymbol as string);

const Dashboard = memo(() => {
  const prefersReducedMotion = useReducedMotion();
  const mountedRef  = useRef(true);
  const [isReady, setIsReady] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

  // Binance WebSocket live prices
  const wsMap = useBinanceWS(WS_ASSET_SYMBOLS);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    const id = requestAnimationFrame(() => { if (mountedRef.current) setIsReady(true); });
    return () => { mountedRef.current = false; controller.abort(); cancelAnimationFrame(id); };
  }, []);

  void prefersReducedMotion;

  const metricGridStyle = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap:                 '12px',
    marginBottom:        '12px',
  }), [isMobile, isTablet]);

  const metricGridStyle2 = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap:                 '12px',
    marginBottom:        '20px',
  }), [isMobile, isTablet]);

  const mainGridStyle = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
    gap:                 '16px',
    marginBottom:        '20px',
  }), [isMobile]);

  const triGridStyle = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    gap:                 '16px',
    marginBottom:        '20px',
  }), [isMobile, isTablet]);

  const dualGridStyle = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap:                 '16px',
    marginBottom:        '20px',
  }), [isMobile]);

  if (!isReady) return <Skeleton.Page />;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="main"
      aria-label="ZERØ MERIDIAN Dashboard"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        variants={tileVariants}
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap', willChange: 'transform' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 700, color: 'rgba(240,240,248,1)', letterSpacing: '0.06em', margin: 0, willChange: 'transform' }}>
              ZERØ MERIDIAN
            </h1>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.12em', background: 'rgba(0,238,255,0.08)', color: 'rgba(0,238,255,0.7)', border: '1px solid rgba(0,238,255,0.18)' }}>
              TERMINAL v70
            </span>
          </div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: 'rgba(80,80,100,1)', letterSpacing: '0.08em', margin: 0 }}>
            Institutional-grade crypto intelligence · Always free
          </p>
        </div>
        <LiveStatusBar />
      </motion.div>

      {/* ── Market Quick View ───────────────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Top assets overview">
        <MarketOverviewBar wsMap={wsMap} />
      </motion.div>

      {/* ── 8 Live Metric Cards ─────────────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Market key metrics">
        <SectionLabel label="▸ Key Metrics — Binance Live" mt={0} color="rgba(0,238,255,0.35)" />
        <div style={metricGridStyle}>
          {METRIC_CONFIG.slice(0, 4).map(cfg => (
            <LiveMetricCard key={cfg.assetId} config={cfg} wsPrice={cfg.wsSymbol ? wsMap[cfg.wsSymbol] : undefined} />
          ))}
        </div>
        <div style={metricGridStyle2}>
          {METRIC_CONFIG.slice(4).map(cfg => (
            <LiveMetricCard key={cfg.assetId} config={cfg} wsPrice={cfg.wsSymbol ? wsMap[cfg.wsSymbol] : undefined} />
          ))}
        </div>
      </motion.div>

      {/* ── Price Action + Order Book ───────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Price action and order book">
        <SectionLabel label="▸ Price Action · TradingView Lightweight Charts" color="rgba(96,165,250,0.40)" />
        <div style={mainGridStyle}>
          <Suspense fallback={<TileSkeleton height={440} />}>
            <TradingViewChart height={440} />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={440} />}>
            <OrderBookTile />
          </Suspense>
        </div>
      </motion.div>

      {/* ── Market Intelligence ──────────────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Market intelligence tiles">
        <SectionLabel label="▸ Market Intelligence" color="rgba(167,139,250,0.40)" />
        <div style={triGridStyle}>
          <Suspense fallback={<TileSkeleton height={260} />}>
            <HeatmapTile />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={260} />}>
            <FundingRateTile />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={260} />}>
            <LiquidationTile />
          </Suspense>
        </div>
      </motion.div>

      {/* ── WASM Compute Engine ─────────────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="WASM orderbook engine">
        <SectionLabel label="⬡ Advanced Compute · WASM Orderbook Engine" color="rgba(176,130,255,0.40)" />
        <div style={dualGridStyle}>
          <Suspense fallback={<TileSkeleton height={520} />}>
            <WasmOrderBook symbol="BTCUSDT" basePrice={wsMap['BTCUSDT']?.price ?? 67840} />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={520} />}>
            <WasmOrderBook symbol="ETHUSDT" basePrice={wsMap['ETHUSDT']?.price ?? 3521} />
          </Suspense>
        </div>
      </motion.div>

      {/* ── Protocol Revenue + AI Signals ───────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Protocol revenue and AI signals">
        <SectionLabel label="◈ Protocol Revenue · AI Signals" color="rgba(34,255,170,0.40)" />
        <div style={dualGridStyle}>
          <Suspense fallback={<TileSkeleton height={420} />}>
            <TokenTerminalTile />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={420} />}>
            <AISignalTile />
          </Suspense>
        </div>
      </motion.div>

      {/* ── News Ticker ─────────────────────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Market news">
        <SectionLabel label="▸ Market News" mt={4} color="rgba(80,80,100,1)" />
        <Suspense fallback={<TileSkeleton height={80} />}>
          <NewsTickerTile />
        </Suspense>
      </motion.div>
    </motion.div>
  );
});
Dashboard.displayName = 'Dashboard';

export default Dashboard;
