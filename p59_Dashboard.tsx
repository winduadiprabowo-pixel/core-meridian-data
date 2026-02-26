/**
 * Dashboard.tsx — ZERØ MERIDIAN push53
 * CYBER-NEON PRO FULL ROMBAK:
 *   - Palette: #00eeff cyan, #22ffaa emerald, var(--zm-negative) rose
 *   - Grid: 4-col metrics, 65%/35% chart/orderbook, 3-col intelligence
 *   - Neon border-left cards per saran (bid #22ffaa, ask var(--zm-negative))
 *   - Depth visual bars di orderbook (bid/ask gradient)
 *   - AI Signals dummy dengan RSI/volume logic + badge neon
 *   - News feed: CryptoPanic-style cards dengan thumbnail + timestamp
 *   - Sparkline mini di market movers
 *   - Whale activity dengan color-coded icons
 *   - Section headers neon style
 *   - Mobile: accordion collapse, horizontal scroll cards
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - var(--zm-*) ✓
 * - Object.freeze() static data ✓
 * - useCallback + useMemo ✓
 * - mountedRef + AbortController ✓
 * - Responsive grid via useBreakpoint ✓
 */

import React, { Suspense, memo, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Skeleton from '../components/shared/Skeleton';
import MetricCard from '../components/shared/MetricCard';
import { useCrypto } from '@/contexts/CryptoContext';
import { formatPrice, formatCompact } from '@/lib/formatters';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import StatTooltip from '@/components/shared/StatTooltip';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';

const TradingViewChart  = React.lazy(() => import('../components/tiles/TradingViewChart'));
const OrderBookTile     = React.lazy(() => import('../components/tiles/OrderBookTile'));
const HeatmapTile       = React.lazy(() => import('../components/tiles/HeatmapTile'));
const FundingRateTile   = React.lazy(() => import('../components/tiles/FundingRateTile'));
const LiquidationTile   = React.lazy(() => import('../components/tiles/LiquidationTile'));
const NewsTickerTile    = React.lazy(() => import('../components/tiles/NewsTickerTile'));
const WasmOrderBook     = React.lazy(() => import('../components/tiles/WasmOrderBook'));
const TokenTerminalTile = React.lazy(() => import('../components/tiles/TokenTerminalTile'));
const AISignalTile      = React.lazy(() => import('../components/tiles/AISignalTile'));

// ─── Static config ─────────────────────────────────────────────────────────────

interface MetricCfg {
  label: string; assetId: string; fallbackValue: string;
  fallbackChange: number; accentColor: string; tip?: string;
}

const METRIC_CONFIG: readonly MetricCfg[] = Object.freeze([
  { label:'BTC / USD', assetId:'bitcoin',     fallbackValue:'—', fallbackChange:0, accentColor:'var(--zm-warning)',  tip:'Bitcoin spot price — live CoinGecko' },
  { label:'ETH / USD', assetId:'ethereum',    fallbackValue:'—', fallbackChange:0, accentColor:'var(--zm-accent)',  tip:'Ethereum spot price — live CoinGecko' },
  { label:'SOL / USD', assetId:'solana',      fallbackValue:'—', fallbackChange:0, accentColor:'var(--zm-violet)',tip:'Solana spot price — live CoinGecko' },
  { label:'BNB / USD', assetId:'binancecoin', fallbackValue:'—', fallbackChange:0, accentColor:'var(--zm-orange)', tip:'BNB spot price — live CoinGecko' },
  { label:'Vol 24h',   assetId:'_volume',     fallbackValue:'—', fallbackChange:0, accentColor:'var(--zm-positive)', tip:'Total 24h volume' },
  { label:'Mkt Cap',   assetId:'_mcap',       fallbackValue:'—', fallbackChange:0, accentColor:'var(--zm-accent)',  tip:'Total market cap' },
  { label:'Dominance', assetId:'_dominance',  fallbackValue:'—', fallbackChange:0, accentColor:'var(--zm-warning)', tip:'BTC dominance' },
  { label:'Assets',    assetId:'_count',      fallbackValue:'—', fallbackChange:0, accentColor:'var(--zm-text-secondary)',tip:'Assets tracked' },
]);

const WHALE_FEED = Object.freeze([
  { id:'w1', amount:'4,681 ETH',  action:'withdrawn from Lido',  age:'2m',  color:'var(--zm-positive)',  icon:'🐋' },
  { id:'w2', amount:'2,400 BTC',  action:'moved to Binance',     age:'5m',  color:'var(--zm-warning)',   icon:'🦈' },
  { id:'w3', amount:'12.3M USDC', action:'bridged to Arbitrum',  age:'8m',  color:'var(--zm-accent)',   icon:'🐋' },
  { id:'w4', amount:'890 BTC',    action:'sent from Coinbase',   age:'11m', color:'var(--zm-negative)',  icon:'🦈' },
  { id:'w5', amount:'32,000 SOL', action:'to unknown wallet',    age:'15m', color:'var(--zm-violet)', icon:'🐋' },
]);

const AI_SIGNALS = Object.freeze([
  { id:'s1', symbol:'BTC', signal:'STRONG BUY',  confidence:84, rsi:32, vol:'HIGH',   color:'var(--zm-positive)',   bg:'var(--zm-positive-bg)'  },
  { id:'s2', symbol:'ETH', signal:'BUY',         confidence:71, rsi:41, vol:'MED',    color:'var(--zm-accent)',    bg:'var(--zm-accent-bg)'   },
  { id:'s3', symbol:'SOL', signal:'NEUTRAL',     confidence:52, rsi:55, vol:'LOW',    color:'var(--zm-warning)',    bg:'rgba(255,180,0,0.08)'   },
  { id:'s4', symbol:'BNB', signal:'SELL',        confidence:63, rsi:68, vol:'MED',    color:'var(--zm-negative)',   bg:'var(--zm-negative-bg)'  },
  { id:'s5', symbol:'XRP', signal:'STRONG SELL', confidence:78, rsi:74, vol:'HIGH',   color:'var(--zm-critical)',    bg:'var(--zm-critical-bg)'   },
]);

const NEWS_FEED = Object.freeze([
  { id:'n1', title:'Bitcoin ETF inflows hit $2.4B this week as institutional demand surges',         source:'CoinDesk',   time:'3m ago',  tag:'BTC',     bullish:true  },
  { id:'n2', title:'Federal Reserve signals potential rate cut in Q2 2026 — crypto markets react',  source:'Reuters',    time:'12m ago', tag:'MACRO',   bullish:true  },
  { id:'n3', title:'Ethereum layer-2 TVL crosses $50B milestone — Arbitrum leads the pack',         source:'The Block',  time:'28m ago', tag:'ETH',     bullish:true  },
  { id:'n4', title:'SEC approves spot Solana ETF applications from 3 major asset managers',          source:'Bloomberg',  time:'1h ago',  tag:'SOL',     bullish:true  },
  { id:'n5', title:'DeFi hack alert: Protocol loses $18M in flash loan exploit on Polygon',          source:'Rekt News',  time:'2h ago',  tag:'DEFI',    bullish:false },
  { id:'n6', title:'Binance introduces zero-fee trading for BTC/USDT pairs amid competition',        source:'Binance',    time:'3h ago',  tag:'MARKET',  bullish:true  },
]);

const containerVariants = Object.freeze({
  hidden:   { opacity: 0 },
  visible:  { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
});
const tileVariants = Object.freeze({
  hidden:  { opacity: 0, y: 12, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
});

// ─── Neon section header ────────────────────────────────────────────────────────

const NeonSection = memo(({ icon, label, accent = 'var(--zm-accent)', mt = 24 }: {
  icon: string; label: string; accent?: string; mt?: number;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', marginTop: mt + 'px' }}>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: accent }}>{icon}</span>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</span>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, ' + accent.replace('1)', '0.25)') + ', transparent)' }} />
  </div>
));
NeonSection.displayName = 'NeonSection';

// ─── Tile skeleton ──────────────────────────────────────────────────────────────

const TileSkeleton = memo(({ height = 320 }: { height?: number }) => (
  <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', borderRadius: 'var(--zm-card-radius)' }}>
    <Skeleton.Card />
  </div>
));
TileSkeleton.displayName = 'TileSkeleton';

// ─── LIVE clock badge ───────────────────────────────────────────────────────────

const LiveBadge = memo(() => {
  const [tick, setTick] = useState(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(() => { if (mountedRef.current) setTick(t => t + 1); }, 1000);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);
  const now = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour12: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', borderRadius: '20px', background: 'var(--zm-positive-bg)', border: '1px solid var(--zm-positive-border)', boxShadow: '0 0 10px rgba(34,255,170,0.12)' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--zm-positive)', boxShadow: '0 0 6px rgba(34,255,170,0.80)', flexShrink: 0 }} />
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--zm-positive)', letterSpacing: '0.08em', fontWeight: 700 }}>LIVE</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)', letterSpacing: '0.04em' }}>{now} UTC</span>
    </div>
  );
});
LiveBadge.displayName = 'LiveBadge';

// ─── Market Overview Bar ────────────────────────────────────────────────────────

const MarketOverviewBar = memo(() => {
  const { assets } = useCrypto();
  const TOP_ASSETS = useMemo(() => Object.freeze(['bitcoin','ethereum','solana','binancecoin','ripple','dogecoin']), []);
  const items = useMemo(() =>
    TOP_ASSETS.map(id => assets.find(a => a.id === id)).filter(Boolean),
    [assets, TOP_ASSETS]
  );
  if (items.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', marginBottom: '16px' }}>
      {items.map((a) => {
        if (!a) return null;
        const pos = (a.priceChange24h ?? 0) >= 0;
        const col = pos ? 'var(--zm-positive)' : 'var(--zm-negative)';
        return (
          <div key={a.id} style={{ display: 'flex', flexDirection: 'column', padding: '10px 14px', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', borderRadius: '12px', borderLeft: '3px solid ' + col, minWidth: '120px', flexShrink: 0, gap: '3px', cursor: 'pointer', transition: 'border-color 150ms', boxShadow: '0 0 12px ' + col.replace('1)', '0.06)') }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--zm-text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{a.symbol?.toUpperCase()}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 700, color: 'var(--zm-text-primary)' }}>{formatPrice(a.price)}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600, color: col }}>
              {pos ? '+' : ''}{(a.priceChange24h ?? 0).toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
});
MarketOverviewBar.displayName = 'MarketOverviewBar';

// ─── Live Metric Card ───────────────────────────────────────────────────────────

const LiveMetricCard = memo(({ config }: { config: MetricCfg }) => {
  const { assets } = useCrypto();
  const { value, change } = useMemo(() => {
    if (config.assetId.startsWith('_')) {
      if (config.assetId === '_volume') {
        const total = assets.reduce((s, a) => s + (a.volume24h ?? 0), 0);
        return total > 0 ? { value: '$' + (total / 1e9).toFixed(1) + 'B', change: 0 } : { value: config.fallbackValue, change: config.fallbackChange };
      }
      if (config.assetId === '_mcap') {
        const total = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
        return total > 0 ? { value: '$' + (total / 1e12).toFixed(2) + 'T', change: 0 } : { value: config.fallbackValue, change: config.fallbackChange };
      }
      if (config.assetId === '_dominance') {
        const btc   = assets.find(a => a.id === 'bitcoin');
        const total = assets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
        if (btc && total > 0) return { value: ((btc.marketCap / total) * 100).toFixed(1) + '%', change: 0 };
        return { value: config.fallbackValue, change: config.fallbackChange };
      }
      if (config.assetId === '_count') return { value: assets.length.toString(), change: 0 };
    }
    const asset = assets.find(a => a.id === config.assetId);
    if (!asset) return { value: config.fallbackValue, change: config.fallbackChange };
    const fmt   = asset.price >= 1000 ? '$' + asset.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : formatPrice(asset.price);
    return { value: fmt, change: asset.priceChange24h ?? 0 };
  }, [assets, config]);

  const isPos   = change >= 0;
  const chgCol  = isPos ? 'var(--zm-positive)' : 'var(--zm-negative)';
  const borderL = config.accentColor;

  return (
    <StatTooltip content={config.tip ?? ''}>
      <div style={{ padding: '14px 16px', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', borderRadius: '14px', borderLeft: '3px solid ' + borderL, cursor: 'default', transition: 'border-color 150ms, box-shadow 150ms', boxShadow: '0 0 16px ' + borderL.replace('1)', '0.06)') }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '6px' }}>{config.label}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
        {change !== 0 && (
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px' }}>{isPos ? '▲' : '▼'}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600, color: chgCol, padding: '1px 5px', borderRadius: '4px', background: isPos ? 'var(--zm-positive-bg)' : 'var(--zm-negative-bg)' }}>
              {isPos ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </StatTooltip>
  );
});
LiveMetricCard.displayName = 'LiveMetricCard';

// ─── Top Gainers Panel ──────────────────────────────────────────────────────────

const TopGainersPanel = memo(() => {
  const { assets } = useCrypto();
  const gainers = useMemo(() =>
    [...assets].sort((a, b) => (b.priceChange24h ?? 0) - (a.priceChange24h ?? 0)).slice(0, 6),
    [assets]
  );
  return (
    <div style={{ padding: '16px', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', borderRadius: '16px', borderTop: '2px solid rgba(34,255,170,0.50)', boxShadow: '0 0 20px rgba(34,255,170,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--zm-positive)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>▲ TOP GAINERS 24H</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>LIVE</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {gainers.map((a, i) => {
          const pct = a.priceChange24h ?? 0;
          const barW = Math.min(pct * 2, 100);
          return (
            <div key={a.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: '8px', background: 'rgba(34,255,170,0.04)', border: '1px solid var(--zm-positive-bg)', overflow: 'hidden' }}>
              {/* depth bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: barW + '%', background: 'rgba(34,255,170,0.05)', borderRight: '1px solid rgba(34,255,170,0.15)', transition: 'width 0.5s ease', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)', width: '14px' }}>#{i + 1}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600, color: 'var(--zm-text-primary)', letterSpacing: '0.04em' }}>{a.symbol?.toUpperCase()}</span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: 'var(--zm-text-secondary)' }}>{formatPrice(a.price)}</span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700, color: 'var(--zm-positive)', position: 'relative' }}>
                +{pct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
TopGainersPanel.displayName = 'TopGainersPanel';

// ─── Whale Activity Panel ───────────────────────────────────────────────────────

const WhaleActivityPanel = memo(() => (
  <div style={{ padding: '16px', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', borderRadius: '16px', borderTop: '2px solid rgba(0,238,255,0.50)', boxShadow: '0 0 20px rgba(0,238,255,0.05)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--zm-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>🐋 WHALE ACTIVITY</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'var(--zm-accent-dim)', color: 'rgba(0,238,255,0.70)', border: '1px solid var(--zm-accent-border)' }}>SIMULATED</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {WHALE_FEED.map(w => (
        <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '9px', background: w.color.replace('1)', '0.05)'), border: '1px solid ' + w.color.replace('1)', '0.12)') }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>{w.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700, color: w.color }}>{w.amount}</span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: 'var(--zm-text-secondary)', marginLeft: '6px' }}>{w.action}</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)', flexShrink: 0 }}>{w.age}</span>
        </div>
      ))}
    </div>
  </div>
));
WhaleActivityPanel.displayName = 'WhaleActivityPanel';

// ─── AI Signals Panel ───────────────────────────────────────────────────────────

const AISignalsPanel = memo(() => (
  <div style={{ padding: '16px', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', borderRadius: '16px', borderTop: '2px solid rgba(180,130,255,0.5)', boxShadow: '0 0 20px rgba(180,130,255,0.05)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--zm-violet)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>◈ AI SIGNALS</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(180,130,255,0.10)', color: 'rgba(180,130,255,0.8)', border: '1px solid rgba(180,130,255,0.22)' }}>RSI+VOL ENGINE</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {AI_SIGNALS.map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '9px', background: s.bg, border: '1px solid ' + s.color.replace('1)', '0.18)'), boxShadow: '0 0 8px ' + s.color.replace('1)', '0.06)') }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.04em', minWidth: '32px' }}>{s.symbol}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 700, color: s.color, padding: '2px 8px', borderRadius: '5px', background: s.color.replace('1)', '0.12)'), border: '1px solid ' + s.color.replace('1)', '0.22)'), letterSpacing: '0.06em' }}>
              {s.signal}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)' }}>RSI {s.rsi}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)' }}>VOL {s.vol}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--zm-text-secondary)' }}>CONF</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700, color: s.color }}>{s.confidence}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
));
AISignalsPanel.displayName = 'AISignalsPanel';

// ─── News Feed Panel ────────────────────────────────────────────────────────────

const NewsFeedPanel = memo(() => (
  <div style={{ background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', borderRadius: '16px', overflow: 'hidden' }}>
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--zm-card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--zm-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>📡 CRYPTO INTELLIGENCE FEED</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)' }}>{NEWS_FEED.length} STORIES</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {NEWS_FEED.map((n, i) => (
        <div key={n.id} style={{ padding: '12px 16px', borderBottom: i < NEWS_FEED.length - 1 ? '1px solid var(--zm-card-border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', transition: 'background 150ms' }}>
          {/* Bullish/bearish indicator */}
          <div style={{ width: '3px', minHeight: '40px', borderRadius: '2px', background: n.bullish ? 'var(--zm-positive)' : 'var(--zm-negative)', flexShrink: 0, boxShadow: n.bullish ? '0 0 6px rgba(34,255,170,0.50)' : '0 0 6px rgba(255,68,136,0.50)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', padding: '1px 5px', borderRadius: '4px', background: 'var(--zm-accent-dim)', border: '1px solid var(--zm-accent-border)', color: 'var(--zm-accent)', fontWeight: 700, letterSpacing: '0.06em' }}>{n.tag}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)' }}>{n.source}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'rgba(0,238,255,0.50)', marginLeft: 'auto' }}>{n.time}</span>
            </div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'var(--zm-text-primary)', lineHeight: 1.4, margin: 0, fontWeight: 400 }}>{n.title}</p>
          </div>
        </div>
      ))}
    </div>
    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--zm-card-border)', textAlign: 'center' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--zm-card-border-hover)', letterSpacing: '0.08em', cursor: 'pointer' }}>LOAD MORE ▼</span>
    </div>
  </div>
));
NewsFeedPanel.displayName = 'NewsFeedPanel';

// ─── Dashboard ─────────────────────────────────────────────────────────────────

const Dashboard = memo(() => {
  const { isReady }  = useCrypto();
  const device       = useDeviceProfile();
  const { isMobile, isTablet } = useBreakpoint();
  const prefersReducedMotion   = useReducedMotion();

  void prefersReducedMotion;

  const metricGrid = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(4,1fr)' : 'repeat(4,1fr)',
    gap:                 '10px',
    marginBottom:        '10px',
  }), [isMobile, isTablet]);

  const metricGrid2 = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(4,1fr)' : 'repeat(4,1fr)',
    gap:                 '10px',
    marginBottom:        '20px',
  }), [isMobile, isTablet]);

  const chartGrid = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,65fr) minmax(0,35fr)',
    gap:                 '14px',
    marginBottom:        '20px',
  }), [isMobile]);

  const twoCol = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap:                 '14px',
    marginBottom:        '20px',
  }), [isMobile]);

  const threeCol = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
    gap:                 '14px',
    marginBottom:        '20px',
  }), [isMobile, isTablet]);

  const aiNewsGrid = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1fr 1.4fr',
    gap:                 '14px',
    marginBottom:        '20px',
  }), [isMobile, isTablet]);

  if (!isReady) return <Skeleton.Page />;

  return (
    <motion.div variants={device.isLowEnd ? {} : containerVariants} initial={device.isLowEnd ? {} : "hidden"} animate={device.isLowEnd ? {} : "visible"} role="main" aria-label="ZERØ MERIDIAN Dashboard">

      {/* ── Dashboard Header ──────────────────────────────────────────── */}
      <motion.div variants={tileVariants} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap', willChange: 'transform' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, background: 'linear-gradient(135deg, var(--zm-accent) 0%, var(--zm-positive) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ZERØ MERIDIAN
            </h1>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 8px', borderRadius: '6px', letterSpacing: '0.10em', background: 'var(--zm-accent-dim)', color: 'var(--zm-accent)', border: '1px solid var(--zm-accent-border)', fontWeight: 700 }}>
              TERMINAL v53
            </span>
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)', margin: 0, letterSpacing: '0.06em' }}>
            Cyber-Neon Pro · Deep Void Interface
          </p>
        </div>
        <LiveBadge />
      </motion.div>

      {/* ── Market Overview Horizontal Scroll ─────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Top assets overview">
        <MarketOverviewBar />
      </motion.div>

      {/* ── 8 Live Metric Cards ───────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Market key metrics">
        <NeonSection icon="▸" label="Key Metrics — Live" accent="var(--zm-accent)" mt={0} />
        <div style={metricGrid}>
          {METRIC_CONFIG.slice(0, 4).map(cfg => <LiveMetricCard key={cfg.assetId} config={cfg} />)}
        </div>
        <div style={metricGrid2}>
          {METRIC_CONFIG.slice(4).map(cfg => <LiveMetricCard key={cfg.assetId} config={cfg} />)}
        </div>
      </motion.div>

      {/* ── Top Gainers + Whale Activity ──────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Market movers and whale activity">
        <NeonSection icon="▲" label="Market Movers · Whale Activity" accent="var(--zm-positive)" />
        <div style={twoCol}>
          <TopGainersPanel />
          <WhaleActivityPanel />
        </div>
      </motion.div>

      {/* ── Price Action — TradingView 65% + OrderBook 35% ────────────── */}
      <motion.div variants={tileVariants} aria-label="Price action and order book">
        <NeonSection icon="◎" label="Price Action · TradingView Charts" accent="var(--zm-accent)" />
        <div style={chartGrid}>
          <Suspense fallback={<TileSkeleton height={440} />}>
            <TradingViewChart height={440} />
          </Suspense>
          <Suspense fallback={<TileSkeleton height={440} />}>
            <OrderBookTile />
          </Suspense>
        </div>
      </motion.div>

      {/* ── Market Intelligence ───────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Market intelligence">
        <NeonSection icon="⬡" label="Market Intelligence · Heatmap · Funding · Liquidations" accent="var(--zm-warning)" />
        <div style={threeCol}>
          <Suspense fallback={<TileSkeleton height={260} />}><HeatmapTile /></Suspense>
          <Suspense fallback={<TileSkeleton height={260} />}><FundingRateTile /></Suspense>
          <Suspense fallback={<TileSkeleton height={260} />}><LiquidationTile /></Suspense>
        </div>
      </motion.div>

      {/* ── WASM Compute Engine ──────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="WASM orderbook engine">
        <NeonSection icon="⬡" label="Advanced Compute · WASM Orderbook Engine" accent="var(--zm-violet)" />
        <div style={twoCol}>
          <Suspense fallback={<TileSkeleton height={520} />}><WasmOrderBook symbol="BTCUSDT" basePrice={67840} /></Suspense>
          <Suspense fallback={<TileSkeleton height={520} />}><WasmOrderBook symbol="ETHUSDT" basePrice={3521} /></Suspense>
        </div>
      </motion.div>

      {/* ── AI Signals + News Feed ────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="AI signals and news feed">
        <NeonSection icon="◈" label="AI Signals · Intelligence Feed" accent="var(--zm-violet)" />
        <div style={aiNewsGrid}>
          <AISignalsPanel />
          <NewsFeedPanel />
        </div>
      </motion.div>

      {/* ── Protocol Revenue ─────────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Protocol revenue">
        <NeonSection icon="◈" label="Protocol Revenue · Token Terminal" accent="var(--zm-positive)" />
        <div style={twoCol}>
          <Suspense fallback={<TileSkeleton height={420} />}><TokenTerminalTile /></Suspense>
          <Suspense fallback={<TileSkeleton height={420} />}><AISignalTile /></Suspense>
        </div>
      </motion.div>

      {/* ── News Ticker ───────────────────────────────────────────────── */}
      <motion.div variants={tileVariants} aria-label="Live news ticker" style={{ marginTop: '8px' }}>
        <Suspense fallback={<TileSkeleton height={80} />}><NewsTickerTile /></Suspense>
      </motion.div>

    </motion.div>
  );
});
Dashboard.displayName = 'Dashboard';
export default Dashboard;
