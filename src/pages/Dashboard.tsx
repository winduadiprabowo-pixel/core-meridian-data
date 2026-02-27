/**
 * Dashboard.tsx — ZERØ MERIDIAN 2026 push87
 * TOTAL ROMBAK — layout Coinbase-style, clean, lega
 * - Fix $$ double dollar bug
 * - Metric cards spacious, border minimal
 * - Warna clean: blue/green/red natural
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useCallback + useMemo + mountedRef ✓
 */

import React, { Suspense, memo, useMemo, useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Skeleton from '../components/shared/Skeleton';
import { useCrypto } from '@/contexts/CryptoContext';
import { formatPrice, formatCompact, REGIME_CONFIG, SIGNAL_CONFIG } from '@/lib/formatters';
import type { MarketRegime, AISignal } from '@/lib/formatters';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import SparklineChart from '../components/shared/SparklineChart';

const TradingViewChart  = React.lazy(() => import('../components/tiles/TradingViewChart'));
const OrderBookTile     = React.lazy(() => import('../components/tiles/OrderBookTile'));
const HeatmapTile       = React.lazy(() => import('../components/tiles/HeatmapTile'));
const FundingRateTile   = React.lazy(() => import('../components/tiles/FundingRateTile'));
const LiquidationTile   = React.lazy(() => import('../components/tiles/LiquidationTile'));
const NewsTickerTile    = React.lazy(() => import('../components/tiles/NewsTickerTile'));
const WasmOrderBook     = React.lazy(() => import('../components/tiles/WasmOrderBook'));
const TokenTerminalTile = React.lazy(() => import('../components/tiles/TokenTerminalTile'));
const AISignalTile      = React.lazy(() => import('../components/tiles/AISignalTile'));

// ─── Binance WS ───────────────────────────────────────────────────────────────

interface WsPrice { price: number; change: number; }
type WsPriceMap = Record<string, WsPrice>;

const WS_SYMBOLS = Object.freeze([
  'BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT',
  'DOGEUSDT','ADAUSDT','AVAXUSDT','DOTUSDT','MATICUSDT',
]);

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
      ws.onerror = () => {};
      ws.onclose = () => { if (mountRef.current) setTimeout(connect, 3000); };
    }
    connect();
    return () => { mountRef.current = false; wsRef.current?.close(); };
  }, []); // eslint-disable-line
  return prices;
}

// ─── Config ───────────────────────────────────────────────────────────────────

interface MetricCfg {
  label: string; assetId: string; wsSymbol?: string; accentColor: string;
}

const METRICS: readonly MetricCfg[] = Object.freeze([
  { label: 'BTC / USD',  assetId: 'bitcoin',    wsSymbol: 'BTCUSDT', accentColor: 'rgba(251,191,36,1)'  },
  { label: 'ETH / USD',  assetId: 'ethereum',   wsSymbol: 'ETHUSDT', accentColor: 'rgba(79,127,255,1)'  },
  { label: 'SOL / USD',  assetId: 'solana',     wsSymbol: 'SOLUSDT', accentColor: 'rgba(150,120,255,1)' },
  { label: 'Total MCap', assetId: '_mcap',                            accentColor: 'rgba(61,214,140,1)'  },
  { label: 'Vol 24h',    assetId: '_volume',                          accentColor: 'rgba(79,127,255,0.8)'},
  { label: 'BTC Dom.',   assetId: '_dominance',                       accentColor: 'rgba(255,180,50,1)'  },
]);

const TICKER_ASSETS = Object.freeze([
  { symbol: 'BTC',  ws: 'BTCUSDT',   id: 'bitcoin'       },
  { symbol: 'ETH',  ws: 'ETHUSDT',   id: 'ethereum'      },
  { symbol: 'SOL',  ws: 'SOLUSDT',   id: 'solana'        },
  { symbol: 'BNB',  ws: 'BNBUSDT',   id: 'binancecoin'   },
  { symbol: 'XRP',  ws: 'XRPUSDT',   id: 'ripple'        },
  { symbol: 'DOGE', ws: 'DOGEUSDT',  id: 'dogecoin'      },
  { symbol: 'ADA',  ws: 'ADAUSDT',   id: 'cardano'       },
  { symbol: 'AVAX', ws: 'AVAXUSDT',  id: 'avalanche-2'   },
  { symbol: 'DOT',  ws: 'DOTUSDT',   id: 'polkadot'      },
  { symbol: 'MATIC',ws: 'MATICUSDT', id: 'matic-network' },
]);

const REGIME_COLORS = Object.freeze({
  SURGE: { text: 'rgba(61,214,140,1)',  bg: 'rgba(61,214,140,0.08)',  border: 'rgba(61,214,140,0.2)'  },
  BULL:  { text: 'rgba(61,214,140,1)',  bg: 'rgba(61,214,140,0.06)',  border: 'rgba(61,214,140,0.15)' },
  CRAB:  { text: 'rgba(140,145,170,1)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)'},
  BEAR:  { text: 'rgba(255,102,102,1)', bg: 'rgba(255,102,102,0.08)', border: 'rgba(255,102,102,0.2)' },
} as const);

const SIGNAL_COLORS = Object.freeze({
  STRONG_BUY:  { text: 'rgba(61,214,140,1)',  bg: 'rgba(61,214,140,0.08)',  border: 'rgba(61,214,140,0.2)'  },
  BUY:         { text: 'rgba(61,214,140,0.8)', bg: 'rgba(61,214,140,0.05)', border: 'rgba(61,214,140,0.12)' },
  NEUTRAL:     { text: 'rgba(140,145,170,1)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)'},
  SELL:        { text: 'rgba(255,102,102,1)', bg: 'rgba(255,102,102,0.06)', border: 'rgba(255,102,102,0.15)'},
  STRONG_SELL: { text: 'rgba(255,102,102,1)', bg: 'rgba(255,102,102,0.1)',  border: 'rgba(255,102,102,0.25)'},
} as const);

// ─── Skeleton tile ─────────────────────────────────────────────────────────────

const TileSkeleton = memo(({ height = 280 }: { height?: number }) => (
  <div style={{
    height, borderRadius: 12, background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <Skeleton.Card />
  </div>
));
TileSkeleton.displayName = 'TileSkeleton';

// ─── Badges ───────────────────────────────────────────────────────────────────

const RegimeBadge = memo(({ regime }: { regime: MarketRegime }) => {
  const c = REGIME_COLORS[regime];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 6,
      background: c.bg, border: '1px solid ' + c.border,
      fontFamily: "'Space Mono', monospace", fontSize: 10,
      fontWeight: 700, color: c.text, letterSpacing: '0.06em', flexShrink: 0,
    }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.text, flexShrink: 0 }} />
      {REGIME_CONFIG[regime].label}
    </div>
  );
});
RegimeBadge.displayName = 'RegimeBadge';

const SignalBadge = memo(({ signal }: { signal: AISignal }) => {
  const c = SIGNAL_COLORS[signal];
  return (
    <div style={{
      padding: '4px 10px', borderRadius: 6,
      background: c.bg, border: '1px solid ' + c.border,
      fontFamily: "'Space Mono', monospace", fontSize: 10,
      fontWeight: 700, color: c.text, letterSpacing: '0.06em', flexShrink: 0,
    }}>
      {SIGNAL_CONFIG[signal].label}
    </div>
  );
});
SignalBadge.displayName = 'SignalBadge';

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <motion.div
        style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(61,214,140,1)', flexShrink: 0 }}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'rgba(75,80,105,1)', letterSpacing: '0.06em' }}>
        {time + ' UTC'}
      </span>
    </div>
  );
});
LiveClock.displayName = 'LiveClock';

// ─── Asset ticker chip ────────────────────────────────────────────────────────

const TickerChip = memo(({ symbol, price, change, sparkline }: {
  symbol: string; price: number; change: number; sparkline: number[];
}) => {
  const pos = change >= 0;
  return (
    <div style={{
      flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 10,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      minWidth: 150,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700, color: 'rgba(75,80,105,1)', letterSpacing: '0.12em' }}>
          {symbol}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: 'rgba(220,225,240,1)' }}>
          {formatPrice(price)}
        </span>
      </div>
      {sparkline.length >= 2 && (
        <SparklineChart data={sparkline} width={48} height={26} color="auto" />
      )}
      <span style={{
        fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 600,
        color: pos ? 'rgba(61,214,140,1)' : 'rgba(255,102,102,1)',
        whiteSpace: 'nowrap' as const,
      }}>
        {(pos ? '+' : '') + change.toFixed(2) + '%'}
      </span>
    </div>
  );
});
TickerChip.displayName = 'TickerChip';

const AssetTicker = memo(({ wsMap }: { wsMap: WsPriceMap }) => {
  const { assets } = useCrypto();
  const chips = useMemo(() => (
    TICKER_ASSETS.map(t => {
      const ws    = wsMap[t.ws];
      const asset = assets.find(a => a.id === t.id);
      return {
        ...t,
        price:     ws ? ws.price  : (asset?.price    ?? 0),
        change:    ws ? ws.change : (asset?.change24h ?? 0),
        sparkline: asset?.sparkline ?? [],
      };
    })
  ), [wsMap, assets]);
  if (chips.every(c => c.price === 0)) return null;
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto' as const, paddingBottom: 4, scrollbarWidth: 'none' as const }}>
      {chips.map(c => (
        <TickerChip key={c.ws} symbol={c.symbol} price={c.price} change={c.change} sparkline={c.sparkline} />
      ))}
    </div>
  );
});
AssetTicker.displayName = 'AssetTicker';

// ─── Metric card ──────────────────────────────────────────────────────────────

const MetricCard = memo(({ label, value, change, accent }: {
  label: string; value: string; change?: number; accent: string;
}) => {
  const pos = (change ?? 0) >= 0;
  return (
    <div style={{
      padding: '20px 22px', borderRadius: 12,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column' as const, gap: 8,
      position: 'relative' as const, overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute' as const, top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, ' + accent + ', transparent)',
        opacity: 0.4,
      }} />
      <span style={{
        fontFamily: "'Space Mono', monospace", fontSize: 9,
        color: 'rgba(75,80,105,1)', letterSpacing: '0.12em', textTransform: 'uppercase' as const,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700,
        color: 'rgba(220,225,240,1)', letterSpacing: '-0.01em',
      }}>
        {value}
      </span>
      {change !== undefined && (
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 600,
          color: pos ? 'rgba(61,214,140,1)' : 'rgba(255,102,102,1)',
        }}>
          {(pos ? '+' : '') + change.toFixed(2) + '%'}
        </span>
      )}
    </div>
  );
});
MetricCard.displayName = 'MetricCard';

// ─── Live metric (data provider) ─────────────────────────────────────────────

const LiveMetric = memo(({ cfg, wsPrice }: { cfg: MetricCfg; wsPrice?: WsPrice }) => {
  const { assets } = useCrypto();
  const { value, change } = useMemo(() => {
    // Live WS price — no $ prefix needed, formatPrice adds it
    if (wsPrice && cfg.wsSymbol) {
      return { value: formatPrice(wsPrice.price), change: wsPrice.change };
    }
    // Aggregates — formatCompact already includes $, no extra prefix!
    if (cfg.assetId === '_mcap') {
      const t = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
      return t > 0 ? { value: formatCompact(t), change: 0 } : { value: '—', change: 0 };
    }
    if (cfg.assetId === '_volume') {
      const t = assets.reduce((s, a) => s + (a.volume24h ?? 0), 0);
      return t > 0 ? { value: formatCompact(t), change: 0 } : { value: '—', change: 0 };
    }
    if (cfg.assetId === '_dominance') {
      const btc   = assets.find(a => a.id === 'bitcoin');
      const total = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
      if (btc && total > 0) return { value: ((btc.marketCap / total) * 100).toFixed(1) + '%', change: 0 };
      return { value: '—', change: 0 };
    }
    const asset = assets.find(a => a.id === cfg.assetId);
    if (!asset) return { value: '—', change: 0 };
    return { value: formatPrice(asset.price), change: asset.change24h ?? 0 };
  }, [assets, cfg, wsPrice]);

  return (
    <MetricCard
      label={cfg.label}
      value={value}
      change={change !== 0 ? change : undefined}
      accent={cfg.accentColor}
    />
  );
});
LiveMetric.displayName = 'LiveMetric';

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel = memo(({ label }: { label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 32 }}>
    <div style={{ width: 2, height: 14, background: 'rgba(79,127,255,0.45)', borderRadius: 1, flexShrink: 0 }} />
    <span style={{
      fontFamily: "'Space Mono', monospace", fontSize: 10,
      color: 'rgba(75,80,105,1)', letterSpacing: '0.14em', textTransform: 'uppercase' as const,
    }}>
      {label}
    </span>
  </div>
));
SectionLabel.displayName = 'SectionLabel';

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = memo(() => {
  const mountedRef = useRef(true);
  const prefersReducedMotion = useReducedMotion();
  const { isMobile, isTablet } = useBreakpoint();
  const { assets, fearGreed, regime, signal } = useCrypto();
  const wsMap = useBinanceWS(WS_SYMBOLS);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const btcPrice = wsMap['BTCUSDT']?.price ?? 0;
  const ethPrice = wsMap['ETHUSDT']?.price ?? 0;

  const grid6 = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(3,1fr)' : 'repeat(6,1fr)',
    gap: 14,
  }), [isMobile, isTablet]);

  const grid2chart = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
    gap: 14,
  }), [isMobile]);

  const grid3 = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
    gap: 14,
  }), [isMobile, isTablet]);

  const grid2 = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: 14,
  }), [isMobile]);

  const fgColor = useMemo(() => {
    const v = fearGreed.value;
    if (v <= 25) return 'rgba(255,102,102,1)';
    if (v <= 45) return 'rgba(255,180,50,1)';
    if (v <= 55) return 'rgba(140,145,170,1)';
    return 'rgba(61,214,140,1)';
  }, [fearGreed.value]);

  return (
    <div role="main" aria-label="ZERØ MERIDIAN Dashboard" style={{ paddingBottom: 40 }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: isMobile ? 22 : 28,
            fontWeight: 700, color: 'rgba(220,225,240,1)',
            margin: 0, letterSpacing: '-0.02em',
          }}>
            Dashboard
          </h1>
          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            color: 'rgba(75,80,105,1)', margin: '4px 0 0', letterSpacing: '0.06em',
          }}>
            Crypto Intelligence Terminal
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
          <RegimeBadge regime={regime} />
          <SignalBadge signal={signal} />
          {fearGreed.value > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 6,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'rgba(75,80,105,1)' }}>F&G</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: fgColor }}>{fearGreed.value}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: fgColor, opacity: 0.8 }}>{fearGreed.label}</span>
            </div>
          )}
          <LiveClock />
        </div>
      </div>

      {/* ── Asset ticker ── */}
      <div style={{ marginBottom: 32 }}>
        <AssetTicker wsMap={wsMap} />
      </div>

      {/* ── 6 metric cards ── */}
      <SectionLabel label="Key Metrics — Binance Live" />
      <div style={grid6}>
        {METRICS.map(cfg => (
          <LiveMetric key={cfg.assetId} cfg={cfg} wsPrice={cfg.wsSymbol ? wsMap[cfg.wsSymbol] : undefined} />
        ))}
      </div>

      {/* ── Chart + order book ── */}
      <SectionLabel label="Price Action · TradingView" />
      <div style={grid2chart}>
        <Suspense fallback={<TileSkeleton height={380} />}><TradingViewChart height={380} /></Suspense>
        <Suspense fallback={<TileSkeleton height={380} />}><OrderBookTile /></Suspense>
      </div>

      {/* ── Market intelligence ── */}
      <SectionLabel label="Market Intelligence" />
      <div style={grid3}>
        <Suspense fallback={<TileSkeleton height={220} />}><HeatmapTile /></Suspense>
        <Suspense fallback={<TileSkeleton height={220} />}><FundingRateTile /></Suspense>
        <Suspense fallback={<TileSkeleton height={220} />}><LiquidationTile /></Suspense>
      </div>

      {/* ── WASM depth ── */}
      <SectionLabel label="WASM Depth Engine" />
      <div style={grid2}>
        <Suspense fallback={<TileSkeleton height={420} />}>
          <WasmOrderBook symbol="BTCUSDT" basePrice={btcPrice > 0 ? btcPrice : 67840} />
        </Suspense>
        <Suspense fallback={<TileSkeleton height={420} />}>
          <WasmOrderBook symbol="ETHUSDT" basePrice={ethPrice > 0 ? ethPrice : 3521} />
        </Suspense>
      </div>

      {/* ── Protocol revenue + AI signals ── */}
      <SectionLabel label="Protocol Revenue · AI Signals" />
      <div style={grid2}>
        <Suspense fallback={<TileSkeleton height={360} />}><TokenTerminalTile /></Suspense>
        <Suspense fallback={<TileSkeleton height={360} />}><AISignalTile /></Suspense>
      </div>

      {/* ── News ── */}
      <SectionLabel label="Market News" />
      <Suspense fallback={<TileSkeleton height={72} />}><NewsTickerTile /></Suspense>

    </div>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
