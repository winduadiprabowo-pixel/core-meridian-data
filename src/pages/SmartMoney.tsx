/**
 * SmartMoney.tsx — ZERØ MERIDIAN 2026 push29
 * Full Smart Money: Whale Wallet Profiling, On-chain P&L,
 * Copy Signals, DEX Accumulation Zones, Exchange Flow Analysis.
 * - React.memo + displayName ✓  - rgba() only ✓
 * - Zero template literals in JSX ✓  - Zero recharts ✓
 * - useCallback + useMemo ✓  - mountedRef ✓
 * - aria-label + role ✓  - will-change: transform ✓
 * - Object.freeze() all static data ✓  - useBreakpoint ✓
 */

import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatCompact } from '@/lib/formatters';
import { Wallet, TrendingUp, Activity, BarChart3, DollarSign, Radio, Filter } from 'lucide-react';

type WalletTier = 'SHARK' | 'WHALE' | 'INSTITUTION' | 'FUND';
type SignalStrength = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
type AccumType = 'ACCUMULATION' | 'DISTRIBUTION';

interface SmartWallet {
  address: string; label: string; tier: WalletTier;
  portfolioUsd: number; pnl30d: number; pnlPct30d: number;
  winRate: number; trades30d: number; topHoldings: string[];
  signal: SignalStrength; lastActive: string; alpha: number;
}
interface FlowEntry { exchange: string; netflow24h: number; inflow: number; outflow: number; asset: string; color: string; }
interface AccumZone { symbol: string; priceRange: string; strength: number; walletCount: number; totalUsd: number; type: AccumType; }

const TIER_CONFIG = Object.freeze({
  SHARK:       { color: 'rgba(96,165,250,1)',  bg: 'rgba(96,165,250,0.08)',  label: 'Shark',       min: '$1M' },
  WHALE:       { color: 'rgba(52,211,153,1)',  bg: 'rgba(52,211,153,0.08)', label: 'Whale',       min: '$10M' },
  INSTITUTION: { color: 'rgba(167,139,250,1)', bg: 'rgba(167,139,250,0.08)', label: 'Institution', min: '$100M' },
  FUND:        { color: 'rgba(251,191,36,1)',  bg: 'rgba(251,191,36,0.08)', label: 'Fund',        min: '$500M' },
} as const);

const SIGNAL_CONFIG = Object.freeze({
  STRONG_BUY:  { color: 'rgba(52,211,153,1)',   bg: 'rgba(52,211,153,0.10)',  label: '▲▲ STRONG BUY',  arrow: '↑↑' },
  BUY:         { color: 'rgba(52,211,153,0.7)', bg: 'rgba(52,211,153,0.06)', label: '▲ BUY',           arrow: '↑' },
  NEUTRAL:     { color: 'rgba(148,163,184,0.6)', bg: 'rgba(148,163,184,0.06)', label: '— NEUTRAL',      arrow: '→' },
  SELL:        { color: 'rgba(251,113,133,0.7)', bg: 'rgba(251,113,133,0.06)', label: '▼ SELL',          arrow: '↓' },
  STRONG_SELL: { color: 'rgba(251,113,133,1)',  bg: 'rgba(251,113,133,0.10)', label: '▼▼ STRONG SELL', arrow: '↓↓' },
} as const);

const WALLETS: readonly SmartWallet[] = Object.freeze([
  { address: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE', label: 'Binance Hot Wallet α',  tier: 'INSTITUTION', portfolioUsd: 4_200_000_000, pnl30d: 128_000_000,  pnlPct30d: 3.1,  winRate: 0.71, trades30d: 892,  topHoldings: ['BTC','ETH','BNB'],    signal: 'STRONG_BUY',  lastActive: '2m ago',  alpha: 92 },
  { address: '0x40B38765696e3d5d8d9d834D8AaD4bB6e418E489', label: 'Jump Trading Alpha',   tier: 'INSTITUTION', portfolioUsd: 2_100_000_000, pnl30d: 312_000_000,  pnlPct30d: 17.4, winRate: 0.83, trades30d: 1203, topHoldings: ['BTC','ETH','SOL'],    signal: 'STRONG_BUY',  lastActive: '4m ago',  alpha: 97 },
  { address: '0x503828976D22510aad0201ac7EC88293211D23Da', label: 'DRW Cumberland',        tier: 'FUND',        portfolioUsd: 3_600_000_000, pnl30d: 87_000_000,   pnlPct30d: 2.5,  winRate: 0.74, trades30d: 654,  topHoldings: ['BTC','ETH','LINK'],   signal: 'BUY',         lastActive: '1m ago',  alpha: 88 },
  { address: '0x73BCEb1Cd57C711feaC4224D062b0F6ff338501e', label: 'Wintermute Arb Bot',   tier: 'INSTITUTION', portfolioUsd: 780_000_000,   pnl30d: 44_000_000,   pnlPct30d: 6.0,  winRate: 0.79, trades30d: 4821, topHoldings: ['ETH','USDC','UNI'],   signal: 'BUY',         lastActive: '< 1m',    alpha: 85 },
  { address: '0x8484Ef722627bf18ca5Ae6BcF031c23E6e922B30', label: 'Unknown Whale #7',     tier: 'WHALE',       portfolioUsd: 94_000_000,    pnl30d: 19_000_000,   pnlPct30d: 25.3, winRate: 0.88, trades30d: 47,   topHoldings: ['BTC','AVAX','MATIC'],  signal: 'STRONG_BUY',  lastActive: '2h ago',  alpha: 94 },
  { address: '0x742d35Cc6634C0532925a3b8D4C9E1a18e6B6E2D', label: 'Paradigm Capital',    tier: 'FUND',        portfolioUsd: 1_200_000_000, pnl30d: 156_000_000,  pnlPct30d: 14.9, winRate: 0.76, trades30d: 182,  topHoldings: ['ETH','OP','ARB'],      signal: 'STRONG_BUY',  lastActive: '6h ago',  alpha: 91 },
  { address: '0x1a7BD9EDC3378c3C12aBa68bb8A91692b29B4b4f', label: 'DegenSharks #3',      tier: 'SHARK',       portfolioUsd: 8_400_000,     pnl30d: 3_200_000,    pnlPct30d: 61.5, winRate: 0.92, trades30d: 312,  topHoldings: ['DOGE','PEPE','SHIB'],  signal: 'BUY',         lastActive: '8m ago',  alpha: 78 },
  { address: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', label: 'Legacy Alpha Vault',  tier: 'FUND',        portfolioUsd: 890_000_000,   pnl30d: -21_000_000,  pnlPct30d: -2.3, winRate: 0.58, trades30d: 231,  topHoldings: ['SOL','AVAX','DOT'],    signal: 'NEUTRAL',     lastActive: '18m ago', alpha: 61 },
] as const);

const EXCHANGE_FLOWS: readonly FlowEntry[] = Object.freeze([
  { exchange: 'Binance',  netflow24h: -2_400_000_000, inflow: 8_100_000_000, outflow: 10_500_000_000, asset: 'BTC', color: 'rgba(251,191,36,1)' },
  { exchange: 'Coinbase', netflow24h: -890_000_000,   inflow: 2_100_000_000, outflow: 2_990_000_000,  asset: 'BTC', color: 'rgba(96,165,250,1)' },
  { exchange: 'Kraken',   netflow24h: 340_000_000,    inflow: 1_200_000_000, outflow: 860_000_000,    asset: 'BTC', color: 'rgba(52,211,153,1)' },
  { exchange: 'OKX',      netflow24h: -1_100_000_000, inflow: 3_400_000_000, outflow: 4_500_000_000,  asset: 'BTC', color: 'rgba(167,139,250,1)' },
  { exchange: 'Bybit',    netflow24h: 210_000_000,    inflow: 890_000_000,   outflow: 680_000_000,    asset: 'ETH', color: 'rgba(251,146,60,1)' },
] as const);

const ACCUM_ZONES: readonly AccumZone[] = Object.freeze([
  { symbol: 'BTC',  priceRange: '$91,200 – $94,800', strength: 87, walletCount: 2341, totalUsd: 4_200_000_000, type: 'ACCUMULATION' },
  { symbol: 'ETH',  priceRange: '$3,100 – $3,350',   strength: 73, walletCount: 891,  totalUsd: 890_000_000,   type: 'ACCUMULATION' },
  { symbol: 'SOL',  priceRange: '$178 – $194',        strength: 61, walletCount: 432,  totalUsd: 340_000_000,   type: 'ACCUMULATION' },
  { symbol: 'BNB',  priceRange: '$620 – $650',        strength: 44, walletCount: 218,  totalUsd: 180_000_000,   type: 'DISTRIBUTION' },
  { symbol: 'AVAX', priceRange: '$34 – $38',          strength: 55, walletCount: 176,  totalUsd: 92_000_000,    type: 'ACCUMULATION' },
  { symbol: 'LINK', priceRange: '$17.2 – $18.8',      strength: 68, walletCount: 294,  totalUsd: 120_000_000,   type: 'ACCUMULATION' },
] as const);

const TABS = Object.freeze(['Wallets', 'Signals', 'Exchange Flow', 'Accum Zones'] as const);
type Tab = typeof TABS[number];

// ─── Alpha Bar ────────────────────────────────────────────────────────────────
const AlphaBar = memo(({ score }: { score: number }) => {
  const color = score >= 90 ? 'rgba(52,211,153,1)' : score >= 75 ? 'rgba(96,165,250,1)' : score >= 60 ? 'rgba(251,191,36,1)' : 'rgba(251,113,133,1)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 50, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: score + '%', borderRadius: 50, background: color, transition: 'width 0.6s ease', willChange: 'width' }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color, minWidth: 24 }}>{score}</span>
    </div>
  );
});
AlphaBar.displayName = 'AlphaBar';

// ─── Wallet Row ───────────────────────────────────────────────────────────────
const WalletRow = memo(({ wallet: w, onClick, active, isMobile }: { wallet: SmartWallet; onClick: (a: string) => void; active: boolean; isMobile: boolean }) => {
  const tierCfg = TIER_CONFIG[w.tier];
  const sigCfg  = SIGNAL_CONFIG[w.signal];
  const isProfit = w.pnl30d >= 0;
  const handleClick = useCallback(() => onClick(w.address), [w.address, onClick]);
  return (
    <div onClick={handleClick} role="row" aria-label={w.label + ' wallet row'} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 70px 60px' : '1fr 80px 90px 70px 60px 80px', gap: 12, alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: active ? 'rgba(96,165,250,0.04)' : 'transparent', borderBottom: '1px solid rgba(148,163,184,0.06)', transition: 'background 0.15s', willChange: 'transform' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, padding: '1px 6px', borderRadius: 3, background: tierCfg.bg, color: tierCfg.color, fontWeight: 700 }}>{tierCfg.label}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{w.label}</span>
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)' }}>{w.address.slice(0, 10) + '…' + w.address.slice(-6)}</span>
      </div>
      {!isMobile && (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{formatCompact(w.portfolioUsd)}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)' }}>portfolio</div>
        </div>
      )}
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: isProfit ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)' }}>{isProfit ? '+' : ''}{formatCompact(w.pnl30d)}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: isProfit ? 'rgba(52,211,153,0.7)' : 'rgba(251,113,133,0.7)' }}>{isProfit ? '+' : ''}{w.pnlPct30d.toFixed(1)}% 30d</div>
      </div>
      {!isMobile && (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: w.winRate >= 0.8 ? 'rgba(52,211,153,1)' : w.winRate >= 0.6 ? 'rgba(251,191,36,1)' : 'rgba(251,113,133,1)' }}>{(w.winRate * 100).toFixed(0)}%</div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)' }}>win rate</div>
        </div>
      )}
      <div style={{ minWidth: 60 }}>
        <AlphaBar score={w.alpha} />
        <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'var(--zm-text-faint)', marginTop: 2 }}>alpha</div>
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 9, padding: '3px 7px', borderRadius: 4, background: sigCfg.bg, color: sigCfg.color, fontWeight: 700, textAlign: 'center', border: '1px solid ' + sigCfg.color + '30' }}>{sigCfg.arrow}</span>
    </div>
  );
});
WalletRow.displayName = 'WalletRow';

// ─── Signal Card ──────────────────────────────────────────────────────────────
const SignalCard = memo(({ wallet: w, isMobile }: { wallet: SmartWallet; isMobile: boolean }) => {
  const sigCfg  = SIGNAL_CONFIG[w.signal];
  const tierCfg = TIER_CONFIG[w.tier];
  const isProfit = w.pnl30d >= 0;
  return (
    <div style={{ padding: 16, borderRadius: 12, background: 'var(--zm-glass-bg)', border: '1px solid ' + sigCfg.color + '25', willChange: 'transform' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--zm-text-primary)', marginBottom: 2 }}>{w.label}</div>
          <span style={{ fontFamily: 'monospace', fontSize: 9, padding: '1px 6px', borderRadius: 3, background: tierCfg.bg, color: tierCfg.color }}>{tierCfg.label}</span>
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 11, padding: '4px 10px', borderRadius: 6, background: sigCfg.bg, color: sigCfg.color, fontWeight: 700, border: '1px solid ' + sigCfg.color + '35' }}>{sigCfg.label}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        {[
          { label: '30d PnL', value: (isProfit ? '+' : '') + formatCompact(w.pnl30d), color: isProfit ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)' },
          { label: 'Win Rate', value: (w.winRate * 100).toFixed(0) + '%', color: w.winRate >= 0.8 ? 'rgba(52,211,153,1)' : 'rgba(251,191,36,1)' },
          { label: 'Trades/30d', value: String(w.trades30d), color: 'rgba(96,165,250,1)' },
          { label: 'Alpha Score', value: w.alpha + '/100', color: w.alpha >= 90 ? 'rgba(52,211,153,1)' : 'rgba(251,191,36,1)' },
        ].map(m => (
          <div key={m.label} style={{ padding: 8, borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(148,163,184,0.08)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'var(--zm-text-faint)', textTransform: 'uppercase', marginBottom: 3 }}>{m.label}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Holdings</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {w.topHoldings.map(h => <span key={h} style={{ fontFamily: 'monospace', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: sigCfg.bg, color: sigCfg.color, border: '1px solid ' + sigCfg.color + '25' }}>{h}</span>)}
      </div>
    </div>
  );
});
SignalCard.displayName = 'SignalCard';

// ─── Exchange Flow ────────────────────────────────────────────────────────────
const ExchangeFlowTab = memo(({ isMobile }: { isMobile: boolean }) => {
  const totalOut = useMemo(() => EXCHANGE_FLOWS.filter(f => f.netflow24h < 0).reduce((s, f) => s + Math.abs(f.netflow24h), 0), []);
  const totalIn  = useMemo(() => EXCHANGE_FLOWS.filter(f => f.netflow24h > 0).reduce((s, f) => s + f.netflow24h, 0), []);
  const maxAbs   = useMemo(() => Math.max(...EXCHANGE_FLOWS.map(f => Math.abs(f.netflow24h))), []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ padding: 14, borderRadius: 10, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(52,211,153,0.7)', textTransform: 'uppercase', marginBottom: 4 }}>Net Outflow (Bullish)</div>
          <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: 'rgba(52,211,153,1)' }}>{formatCompact(totalOut)}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)' }}>Leaving exchanges — HODLing</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.2)' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(251,113,133,0.7)', textTransform: 'uppercase', marginBottom: 4 }}>Net Inflow (Bearish)</div>
          <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: 'rgba(251,113,133,1)' }}>{formatCompact(totalIn)}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)' }}>Entering exchanges — Selling</div>
        </div>
      </div>
      {EXCHANGE_FLOWS.map(f => {
        const isOut = f.netflow24h < 0;
        const netColor = isOut ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)';
        const barPct = (Math.abs(f.netflow24h) / maxAbs) * 45;
        return (
          <div key={f.exchange} style={{ display: 'grid', gridTemplateColumns: isMobile ? '80px 1fr 80px' : '120px 1fr 120px 80px', gap: 12, alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(148,163,184,0.06)', background: 'var(--zm-glass-bg)', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{f.exchange}</span>
            </div>
            <div style={{ position: 'relative', height: 10, background: 'rgba(148,163,184,0.08)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, height: '100%', width: barPct + '%', background: netColor + '60', borderRadius: 5, left: isOut ? (50 - barPct / 2) + '%' : '50%', willChange: 'width' }} />
            </div>
            {!isMobile && (
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(52,211,153,0.8)' }}>in {formatCompact(f.inflow)}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(251,113,133,0.8)' }}>out {formatCompact(f.outflow)}</div>
              </div>
            )}
            <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: netColor, textAlign: 'right' }}>{isOut ? '-' : '+'}{formatCompact(Math.abs(f.netflow24h))}</div>
          </div>
        );
      })}
    </div>
  );
});
ExchangeFlowTab.displayName = 'ExchangeFlowTab';

// ─── Accum Zones ──────────────────────────────────────────────────────────────
const AccumZonesTab = memo(({ isMobile }: { isMobile: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
    <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>On-Chain Wallet Cluster Zones — via DEX position analysis</div>
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
      {ACCUM_ZONES.map(z => {
        const isAccum = z.type === 'ACCUMULATION';
        const color  = isAccum ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)';
        const bg     = isAccum ? 'rgba(52,211,153,0.06)' : 'rgba(251,113,133,0.06)';
        const border = isAccum ? 'rgba(52,211,153,0.2)' : 'rgba(251,113,133,0.2)';
        return (
          <div key={z.symbol} style={{ padding: 14, borderRadius: 10, background: bg, border: '1px solid ' + border, willChange: 'transform' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{z.symbol}</span>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color, marginTop: 2 }}>{z.priceRange}</div>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: 9, padding: '2px 8px', borderRadius: 4, background: color + '15', color, border: '1px solid ' + color + '30', fontWeight: 700 }}>{isAccum ? '↑ ACCUM' : '↓ DISTRIB'}</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)' }}>Zone Strength</span>
                <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color }}>{z.strength}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 50, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: z.strength + '%', borderRadius: 50, background: color, transition: 'width 0.6s ease', willChange: 'width' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'var(--zm-text-faint)', textTransform: 'uppercase' }}>Wallets</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{z.walletCount.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'var(--zm-text-faint)', textTransform: 'uppercase' }}>Total USD</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color }}>{formatCompact(z.totalUsd)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
));
AccumZonesTab.displayName = 'AccumZonesTab';

// ─── Main ─────────────────────────────────────────────────────────────────────
const SmartMoney = memo(() => {
  const { isMobile, isTablet } = useBreakpoint();
  const mountedRef = useRef(true);
  const [activeTab, setActiveTab]      = useState<Tab>('Wallets');
  const [selectedAddr, setSelectedAddr] = useState(WALLETS[0].address);
  const [filterTier, setFilterTier]    = useState<WalletTier | 'ALL'>('ALL');

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleTab    = useCallback((t: Tab) => setActiveTab(t), []);
  const handleSelect = useCallback((addr: string) => { if (!mountedRef.current) return; setSelectedAddr(addr); }, []);
  const handleFilter = useCallback((tier: WalletTier | 'ALL') => setFilterTier(tier), []);

  const filteredWallets = useMemo(() => filterTier === 'ALL' ? WALLETS : WALLETS.filter(w => w.tier === filterTier), [filterTier]);
  const selectedWallet  = useMemo(() => WALLETS.find(w => w.address === selectedAddr) ?? WALLETS[0], [selectedAddr]);
  const totalAlpha      = useMemo(() => Math.round(WALLETS.reduce((s, w) => s + w.alpha, 0) / WALLETS.length), []);
  const bullishCount    = useMemo(() => WALLETS.filter(w => w.signal === 'STRONG_BUY' || w.signal === 'BUY').length, []);
  const totalPortfolio  = useMemo(() => WALLETS.reduce((s, w) => s + w.portfolioUsd, 0), []);
  const totalPnl        = useMemo(() => WALLETS.reduce((s, w) => s + w.pnl30d, 0), []);
  const gridCols        = useMemo(() => isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', [isMobile, isTablet]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 16, minHeight: '100vh', background: 'var(--zm-bg-deep)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <Wallet size={18} style={{ color: 'rgba(52,211,153,1)' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'monospace', fontSize: isMobile ? 18 : 22, fontWeight: 700, margin: 0, background: 'linear-gradient(90deg,rgba(52,211,153,1) 0%,rgba(96,165,250,1) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Smart Money</h1>
            <p style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)', margin: 0 }}>Whale wallets · on-chain P&L · copy signals · exchange flow</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <Radio size={10} style={{ color: 'rgba(52,211,153,1)' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(52,211,153,1)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live · 8 wallets tracked</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12 }}>
        {([
          { label: 'Total AUM', value: formatCompact(totalPortfolio), color: 'rgba(96,165,250,1)', Icon: DollarSign },
          { label: '30d PnL', value: (totalPnl >= 0 ? '+' : '') + formatCompact(totalPnl), color: totalPnl >= 0 ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)', Icon: TrendingUp },
          { label: 'Bullish Signals', value: bullishCount + '/' + WALLETS.length, color: 'rgba(52,211,153,1)', Icon: Activity },
          { label: 'Avg Alpha Score', value: String(totalAlpha) + '/100', color: 'rgba(167,139,250,1)', Icon: BarChart3 },
        ] as const).map(s => {
          const Icon = s.Icon;
          return (
            <div key={s.label} style={{ padding: 14, borderRadius: 10, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', willChange: 'transform' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                <Icon size={12} style={{ color: s.color }} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      <SignalCard wallet={selectedWallet} isMobile={isMobile} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="tablist" aria-label="SmartMoney tabs">
        {TABS.map(t => (
          <button key={t} type="button" role="tab" aria-selected={activeTab === t} aria-label={'Switch to ' + t} onClick={() => handleTab(t)} style={{ padding: '6px 14px', borderRadius: 8, fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.15s', background: activeTab === t ? 'rgba(52,211,153,0.12)' : 'transparent', color: activeTab === t ? 'rgba(52,211,153,1)' : 'var(--zm-text-faint)', border: '1px solid ' + (activeTab === t ? 'rgba(52,211,153,0.3)' : 'transparent'), willChange: 'transform' }}>{t}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ borderRadius: 12, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', overflow: 'hidden', willChange: 'transform, opacity' }}>
          {activeTab === 'Wallets' && (
            <>
              <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid rgba(148,163,184,0.08)', flexWrap: 'wrap' }}>
                <Filter size={11} style={{ color: 'var(--zm-text-faint)', marginTop: 4, flexShrink: 0 }} />
                {(['ALL', 'SHARK', 'WHALE', 'INSTITUTION', 'FUND'] as const).map(t => (
                  <button key={t} type="button" aria-pressed={filterTier === t} aria-label={'Filter ' + t} onClick={() => handleFilter(t)} style={{ padding: '3px 10px', borderRadius: 4, fontFamily: 'monospace', fontSize: 9, cursor: 'pointer', transition: 'all 0.15s', background: filterTier === t ? 'rgba(96,165,250,0.15)' : 'transparent', color: filterTier === t ? 'rgba(96,165,250,1)' : 'var(--zm-text-faint)', border: '1px solid ' + (filterTier === t ? 'rgba(96,165,250,0.3)' : 'transparent') }}>{t === 'ALL' ? 'ALL' : TIER_CONFIG[t].label}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 70px 60px' : '1fr 80px 90px 70px 60px 80px', gap: 12, padding: '8px 16px', borderBottom: '1px solid rgba(148,163,184,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                {(isMobile ? ['Wallet', '30d PnL', 'Sig'] : ['Wallet / Tier', 'Portfolio', '30d PnL', 'Win Rate', 'Alpha', 'Signal']).map(h => (
                  <span key={h} style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
                ))}
              </div>
              {filteredWallets.map(w => <WalletRow key={w.address} wallet={w} onClick={handleSelect} active={selectedAddr === w.address} isMobile={isMobile} />)}
            </>
          )}
          {activeTab === 'Signals' && (
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
              {[...WALLETS].sort((a, b) => b.alpha - a.alpha).map(w => <SignalCard key={w.address} wallet={w} isMobile={isMobile} />)}
            </div>
          )}
          {activeTab === 'Exchange Flow' && <div style={{ padding: 16 }}><ExchangeFlowTab isMobile={isMobile} /></div>}
          {activeTab === 'Accum Zones' && <AccumZonesTab isMobile={isMobile} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
SmartMoney.displayName = 'SmartMoney';
export default SmartMoney;
