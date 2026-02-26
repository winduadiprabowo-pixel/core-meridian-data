/**
 * Ordinals.tsx — ZERØ MERIDIAN push42
 * Ordinals & BRC-20: Inscription Feed, Token Rankings, Rare Sats, Fee Market
 * RESPONSIVE:
 *   Mobile  (<768px)  — 2×2 metrics, tab switcher (3 tabs), vertical fee bars
 *   Tablet  (768–1024) — stacked panels, 2-col metrics, horizontal fee bars
 *   Desktop (>1024px) — inscriptions + BRC-20 side by side, rare sats + fee market grid
 * - React.memo + displayName ✓  - rgba() only ✓  - Zero className in JSX ✓
 * - Zero template literals in JSX attrs ✓  - useBreakpoint ✓
 * - Object.freeze() all static data ✓  - useCallback + useMemo ✓  - mountedRef ✓
 */

import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Bitcoin } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type InsType  = 'text' | 'image' | 'json' | 'brc20';
type OrdTab   = 'Inscriptions' | 'BRC-20' | 'Rare Sats';
type Brc20St  = 'ACTIVE' | 'COMPLETE' | 'MINTING';

interface Inscription {
  id:          string;
  number:      number;
  type:        InsType;
  content:     string;
  feeRate:     number;
  sizeByte:    number;
  blockHeight: number;
  minsAgo:     number;
  accent:      string;
}

interface Brc20Token {
  ticker:       string;
  price:        number;
  change24h:    number;
  marketCap:    number;
  vol24h:       number;
  mintProgress: number;
  holders:      number;
  maxSupply:    string;
  status:       Brc20St;
  accent:       string;
}

interface RareSat {
  type:        string;
  description: string;
  count:       string;
  rarity:      string;
  lastSale:    string;
  color:       string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const INSCRIPTIONS: readonly Inscription[] = Object.freeze([
  { id: '8f3a', number: 68324411, type: 'brc20',  content: 'Transfer: 500,000 ORDI',    feeRate: 42, sizeByte: 218,   blockHeight: 879441, minsAgo: 2,  accent: 'var(--zm-warning)' },
  { id: 'c21b', number: 68324410, type: 'image',  content: 'Pixel Art #3841',            feeRate: 38, sizeByte: 12400, blockHeight: 879441, minsAgo: 3,  accent: 'var(--zm-violet)' },
  { id: '9d7f', number: 68324409, type: 'brc20',  content: 'Mint: 1,000 SATS',           feeRate: 35, sizeByte: 182,   blockHeight: 879440, minsAgo: 4,  accent: 'var(--zm-warning)' },
  { id: 'e44c', number: 68324408, type: 'text',   content: 'gm from block 879440',       feeRate: 30, sizeByte: 86,    blockHeight: 879440, minsAgo: 4,  accent: 'var(--zm-cyan)' },
  { id: '1b8a', number: 68324407, type: 'json',   content: '{p: sns, op: reg, name: x}', feeRate: 28, sizeByte: 340,   blockHeight: 879440, minsAgo: 5,  accent: 'var(--zm-positive)' },
  { id: 'a93d', number: 68324406, type: 'image',  content: 'Ordinal Punk #892',          feeRate: 45, sizeByte: 8200,  blockHeight: 879439, minsAgo: 7,  accent: 'var(--zm-negative)' },
  { id: '7c1e', number: 68324405, type: 'brc20',  content: 'Deploy: MEME max=21T',       feeRate: 52, sizeByte: 284,   blockHeight: 879439, minsAgo: 8,  accent: 'rgba(251,146,60,1)' },
  { id: 'd02b', number: 68324404, type: 'text',   content: 'Snipers gonna snipe',        feeRate: 22, sizeByte: 74,    blockHeight: 879438, minsAgo: 12, accent: 'var(--zm-cyan)' },
]);

const BRC20_TOKENS: readonly Brc20Token[] = Object.freeze([
  { ticker: 'ORDI', price: 42.18,   change24h:  8.2, marketCap: 885000000, vol24h: 124000000, mintProgress: 100, holders: 18412, maxSupply: '21,000,000',       status: 'COMPLETE', accent: 'var(--zm-warning)' },
  { ticker: 'SATS', price: 0.00043, change24h:  3.1, marketCap: 900000000, vol24h:  87000000, mintProgress: 100, holders: 31820, maxSupply: '2.1 Quadrillion',   status: 'COMPLETE', accent: 'var(--zm-cyan)' },
  { ticker: 'RATS', price: 0.00021, change24h: 12.4, marketCap: 441000000, vol24h:  52000000, mintProgress: 100, holders: 14200, maxSupply: '1,000,000,000,000', status: 'COMPLETE', accent: 'var(--zm-negative)' },
  { ticker: 'MEME', price: 0.00614, change24h: -4.2, marketCap: 129000000, vol24h:  18000000, mintProgress: 100, holders:  8921, maxSupply: '21,000,000,000',    status: 'COMPLETE', accent: 'var(--zm-positive)' },
  { ticker: 'COOK', price: 0.00189, change24h: 21.8, marketCap:  39000000, vol24h:  31000000, mintProgress:  84, holders:  4312, maxSupply: '21,000,000,000',    status: 'MINTING',  accent: 'var(--zm-violet)' },
  { ticker: 'PUPS', price: 18.42,   change24h: -1.8, marketCap:  18000000, vol24h:   4200000, mintProgress: 100, holders:  2941, maxSupply: '1,000,000',         status: 'COMPLETE', accent: 'rgba(251,146,60,1)' },
]);

const RARE_SATS: readonly RareSat[] = Object.freeze([
  { type: 'Uncommon',  description: 'First sat of each block',           count: '~879,441',  rarity: '1 per block',    lastSale: '0.12 BTC',   color: 'var(--zm-positive)' },
  { type: 'Rare',      description: 'First sat of each difficulty adj.', count: '~370',      rarity: '~1 per 2016 bl', lastSale: '0.85 BTC',   color: 'var(--zm-cyan)' },
  { type: 'Epic',      description: 'First sat of each halving epoch',   count: '4',         rarity: '1 per halving',  lastSale: '8.40 BTC',   color: 'var(--zm-violet)' },
  { type: 'Legendary', description: 'First sat of each cycle',           count: '3',         rarity: '~1 per 6yr',     lastSale: '32.0 BTC',   color: 'var(--zm-warning)' },
  { type: 'Mythic',    description: 'The genesis sat (first ever)',      count: '1',         rarity: 'Unique',         lastSale: 'Not listed', color: 'var(--zm-negative)' },
]);

const FEE_RATES = Object.freeze([
  { label: 'No Priority', rate: 12, color: 'rgba(138,138,158,0.70)' },
  { label: 'Low',         rate: 22, color: 'var(--zm-positive)' },
  { label: 'Medium',      rate: 38, color: 'var(--zm-warning)' },
  { label: 'High',        rate: 55, color: 'rgba(251,146,60,1)' },
  { label: 'Fastest',     rate: 78, color: 'var(--zm-negative)' },
]);

const ORD_METRICS = Object.freeze([
  { label: 'Total Inscriptions', value: '68.3M',    sub: '+12,441 today',      subPos: true,  accent: 'var(--zm-warning)' },
  { label: 'BRC-20 Market Cap',  value: '$2.41B',   sub: '+4.1% 24h',          subPos: true,  accent: 'var(--zm-cyan)' },
  { label: 'Avg Fee Rate',        value: '38 s/vB', sub: 'sat per vByte',      subPos: true,  accent: 'rgba(251,146,60,1)' },
  { label: 'Active BRC-20',       value: '47,280',  sub: 'deployed tickers',   subPos: true,  accent: 'var(--zm-violet)' },
]);

const STATUS_COLOR = Object.freeze({
  COMPLETE: { c: 'var(--zm-positive)',  bg: 'var(--zm-positive-bg)',  b: 'rgba(52,211,153,0.25)' },
  MINTING:  { c: 'var(--zm-warning)', bg: 'rgba(251,191,36,0.10)',  b: 'rgba(251,191,36,0.25)' },
  ACTIVE:   { c: 'var(--zm-cyan)', bg: 'rgba(0,238,255,0.10)',  b: 'rgba(34,211,238,0.25)' },
} as const);

const INS_TYPE_CFG = Object.freeze({
  brc20: { color: 'var(--zm-warning)',  bg: 'rgba(251,191,36,0.10)',  label: 'BRC-20' },
  image: { color: 'var(--zm-violet)', bg: 'var(--zm-violet-bg)', label: 'IMAGE' },
  json:  { color: 'var(--zm-positive)',  bg: 'var(--zm-positive-bg)',  label: 'JSON' },
  text:  { color: 'var(--zm-cyan)',  bg: 'rgba(0,238,255,0.10)',  label: 'TEXT' },
} as const);

const TABS_ORD: readonly OrdTab[] = Object.freeze(['Inscriptions', 'BRC-20', 'Rare Sats']);
const MAX_FEE_RATE = Math.max(...FEE_RATES.map(f => f.rate));

const containerV = Object.freeze({ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } });
const itemV      = Object.freeze({ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } });

// ─── SectionLabel ─────────────────────────────────────────────────────────────

const SectionLabel = memo(({ label, mt = 20 }: { label: string; mt?: number }) => (
  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', letterSpacing: '0.14em',
    color: 'var(--zm-text-faint)', marginBottom: '10px', marginTop: mt + 'px', textTransform: 'uppercase' }}>
    {label}
  </p>
));
SectionLabel.displayName = 'OrdSectionLabel';

// ─── Ord Metric Card ──────────────────────────────────────────────────────────

const OrdMetricCard = memo(({ m, compact }: { m: typeof ORD_METRICS[number]; compact: boolean }) => (
  <div style={{ background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)',
    borderRadius: 'var(--zm-card-radius)', padding: compact ? '12px 14px' : '14px 16px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
      background: 'linear-gradient(90deg, transparent, ' + m.accent + ', transparent)',
      borderRadius: '20px 20px 0 0', opacity: 0.7 }} />
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: compact ? '9px' : '10px',
      textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--zm-text-faint)', marginBottom: '6px' }}>
      {m.label}
    </div>
    <div style={{ fontFamily: "'JetBrains Mono', monospace",
      fontSize: compact ? '1.1rem' : '1.3rem',
      fontWeight: 700, color: m.accent, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{m.value}</div>
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px',
      color: m.subPos ? 'var(--zm-positive)' : 'var(--zm-negative)', marginTop: '5px' }}>{m.sub}</div>
  </div>
));
OrdMetricCard.displayName = 'OrdMetricCard';

// ─── Type Badge ───────────────────────────────────────────────────────────────

const TypeBadge = memo(({ type }: { type: InsType }) => {
  const cfg = INS_TYPE_CFG[type];
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', fontWeight: 700,
      padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.06em', flexShrink: 0, whiteSpace: 'nowrap',
      background: cfg.bg, color: cfg.color, border: '1px solid ' + cfg.color.replace('1)', '0.25)') }}>
      {cfg.label}
    </span>
  );
});
TypeBadge.displayName = 'TypeBadge';

// ─── Inscription Row ──────────────────────────────────────────────────────────

const InscriptionRow = memo(({ ins, isMobile }: { ins: Inscription; isMobile: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px',
    padding: '10px 0', borderBottom: '1px solid var(--zm-divider)' }}>
    <div style={{ width: 8, height: 8, borderRadius: '50%',
      background: ins.accent, flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
          fontWeight: 700, color: ins.accent }}>#{ins.number.toLocaleString()}</span>
        <TypeBadge type={ins.type} />
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: isMobile ? '10px' : '11px',
        color: 'var(--zm-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {ins.content}
      </div>
    </div>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
        fontWeight: 600, color: 'var(--zm-text-primary)' }}>{ins.feeRate} s/vB</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
        color: 'var(--zm-text-faint)', marginTop: '1px' }}>{ins.minsAgo}m ago</div>
    </div>
    {!isMobile && (
      <div style={{ textAlign: 'right', minWidth: '72px', flexShrink: 0 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
          color: 'var(--zm-text-secondary)' }}>Blk {ins.blockHeight.toLocaleString()}</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
          color: 'var(--zm-text-faint)' }}>
          {ins.sizeByte >= 1000 ? (ins.sizeByte / 1000).toFixed(1) + 'KB' : ins.sizeByte + 'B'}
        </div>
      </div>
    )}
  </div>
));
InscriptionRow.displayName = 'InscriptionRow';

// ─── Inscriptions Panel ───────────────────────────────────────────────────────

const InscriptionsPanel = memo(({ isMobile }: { isMobile: boolean }) => (
  <div style={{ background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)',
    borderRadius: 'var(--zm-card-radius)', padding: isMobile ? '14px' : '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px',
        fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Latest Inscriptions
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isMobile && (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
            color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>NUM · TYPE · FEE · BLOCK</span>
        )}
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
          padding: '2px 7px', borderRadius: '5px',
          background: 'rgba(251,191,36,0.10)', color: 'rgba(251,191,36,0.85)',
          border: '1px solid rgba(251,191,36,0.22)', letterSpacing: '0.06em' }}>LIVE</span>
      </div>
    </div>
    {INSCRIPTIONS.map(ins => <InscriptionRow key={ins.id} ins={ins} isMobile={isMobile} />)}
  </div>
));
InscriptionsPanel.displayName = 'InscriptionsPanel';

// ─── BRC-20 Row ───────────────────────────────────────────────────────────────

const Brc20Row = memo(({ t, isMobile }: { t: Brc20Token; isMobile: boolean }) => {
  const st = STATUS_COLOR[t.status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px',
      padding: isMobile ? '10px 0' : '11px 0', borderBottom: '1px solid var(--zm-divider)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.accent, flexShrink: 0,
        boxShadow: '0 0 5px ' + t.accent.replace('1)', '0.45)') }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px',
          fontWeight: 700, color: t.accent, letterSpacing: '0.04em' }}>{t.ticker}</div>
        {!isMobile && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
            color: 'var(--zm-text-faint)', marginTop: '1px' }}>
            {t.holders.toLocaleString()} holders · Max {t.maxSupply}
          </div>
        )}
      </div>
      {/* Mint progress */}
      <div style={{ minWidth: isMobile ? '44px' : '64px', flexShrink: 0 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
          color: 'var(--zm-text-faint)', marginBottom: '4px', textAlign: 'right' }}>
          {t.mintProgress}%
        </div>
        <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ height: '100%', width: t.mintProgress + '%',
            background: t.accent, borderRadius: '2px' }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', minWidth: isMobile ? '60px' : '72px', flexShrink: 0 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
          fontWeight: 700, color: 'var(--zm-text-primary)' }}>
          {t.price >= 1 ? '$' + t.price.toFixed(2) : '$' + t.price.toFixed(5)}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', marginTop: '1px',
          color: t.change24h >= 0 ? 'var(--zm-positive)' : 'var(--zm-negative)' }}>
          {(t.change24h >= 0 ? '+' : '') + t.change24h.toFixed(1) + '%'}
        </div>
      </div>
      {!isMobile && (
        <div style={{ textAlign: 'right', minWidth: '64px', flexShrink: 0 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
            color: 'var(--zm-text-secondary)' }}>{'$' + (t.marketCap / 1e6).toFixed(0) + 'M'}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
            color: 'var(--zm-text-faint)' }}>mcap</div>
        </div>
      )}
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
        padding: '2px 6px', borderRadius: '4px', flexShrink: 0,
        background: st.bg, color: st.c, border: '1px solid ' + st.b, letterSpacing: '0.04em' }}>
        {t.status}
      </span>
    </div>
  );
});
Brc20Row.displayName = 'Brc20Row';

// ─── BRC-20 Panel ─────────────────────────────────────────────────────────────

const Brc20Panel = memo(({ isMobile }: { isMobile: boolean }) => (
  <div style={{ background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)',
    borderRadius: 'var(--zm-card-radius)', padding: isMobile ? '14px' : '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px',
        fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        BRC-20 Tokens
      </span>
      {!isMobile && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
          color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>TICKER · MINT% · PRICE · MCAP</span>
      )}
    </div>
    {BRC20_TOKENS.map(t => <Brc20Row key={t.ticker} t={t} isMobile={isMobile} />)}
  </div>
));
Brc20Panel.displayName = 'Brc20Panel';

// ─── Rare Sats Panel ──────────────────────────────────────────────────────────

const RareSatsPanel = memo(({ isMobile }: { isMobile: boolean }) => (
  <div style={{ background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)',
    borderRadius: 'var(--zm-card-radius)', padding: isMobile ? '14px' : '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px',
        fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Rare Sat Tracker
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
        color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>Rodarmor Rarity Index</span>
    </div>
    <div style={{ display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '10px' }}>
      {RARE_SATS.map(s => (
        <div key={s.type} style={{ padding: '14px 16px', borderRadius: '12px',
          background: s.color.replace('1)', '0.06)'),
          border: '1px solid ' + s.color.replace('1)', '0.22)') }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0,
              boxShadow: '0 0 8px ' + s.color.replace('1)', '0.5)') }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px',
              fontWeight: 700, color: s.color, letterSpacing: '0.04em' }}>{s.type}</span>
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px',
            color: 'var(--zm-text-secondary)', marginBottom: '10px', lineHeight: 1.4 }}>{s.description}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
                color: 'var(--zm-text-faint)', letterSpacing: '0.08em', marginBottom: '2px' }}>SUPPLY</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
                fontWeight: 700, color: 'var(--zm-text-primary)' }}>{s.count}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
                color: 'var(--zm-text-faint)', letterSpacing: '0.08em', marginBottom: '2px' }}>LAST SALE</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
                fontWeight: 700, color: s.color }}>{s.lastSale}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
));
RareSatsPanel.displayName = 'RareSatsPanel';

// ─── Fee Market Panel ─────────────────────────────────────────────────────────
// Mobile:  horizontal progress bars (compact rows)
// Desktop: vertical bar chart (visual)

const FeePanel = memo(({ isMobile }: { isMobile: boolean }) => (
  <div style={{ background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)',
    borderRadius: 'var(--zm-card-radius)', padding: isMobile ? '14px' : '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px',
        fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Bitcoin Fee Market
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
        color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>sat/vByte · LIVE</span>
    </div>

    {/* Mobile: horizontal bars */}
    {isMobile && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {FEE_RATES.map(f => (
          <div key={f.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px',
                color: 'var(--zm-text-secondary)', letterSpacing: '0.04em' }}>{f.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
                fontWeight: 700, color: f.color }}>{f.rate} s/vB</span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px',
              background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '3px',
                width: Math.round(f.rate / MAX_FEE_RATE * 100) + '%',
                background: f.color, transition: 'width 600ms ease' }} />
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Desktop: vertical bar chart */}
    {!isMobile && (
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '120px' }}>
        {FEE_RATES.map(f => (
          <div key={f.label} style={{ flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
              fontWeight: 700, color: f.color }}>{f.rate}</div>
            <div style={{ width: '100%', position: 'relative',
              height: Math.round(f.rate / MAX_FEE_RATE * 80) + 'px',
              background: f.color.replace('1)', '0.18)'),
              borderRadius: '4px 4px 0 0',
              border: '1px solid ' + f.color.replace('1)', '0.35)'),
              overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0,
                height: '3px', background: f.color, borderRadius: '4px 4px 0 0' }} />
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px',
              color: 'var(--zm-text-faint)', textAlign: 'center',
              letterSpacing: '0.04em', lineHeight: 1.3 }}>{f.label}</div>
          </div>
        ))}
      </div>
    )}
  </div>
));
FeePanel.displayName = 'FeePanel';

// ─── Tab Bar (mobile only) ────────────────────────────────────────────────────

const TabBarOrd = memo(({ tab, onTab }: { tab: OrdTab; onTab: (t: OrdTab) => void }) => (
  <div style={{ display: 'flex', gap: '4px', background: 'var(--zm-surface-1)',
    border: '1px solid var(--zm-divider)', borderRadius: '12px',
    padding: '4px', marginBottom: '14px' }}>
    {TABS_ORD.map(t => (
      <button key={t} onClick={() => onTab(t)} style={{
        flex: 1, padding: '8px 4px', borderRadius: '9px', cursor: 'pointer',
        fontFamily: "'Space Mono', monospace", fontSize: '9px',
        fontWeight: tab === t ? 700 : 400, letterSpacing: '0.04em', textTransform: 'uppercase',
        background:  tab === t ? 'rgba(251,191,36,0.10)' : 'transparent',
        color:       tab === t ? 'var(--zm-warning)' : 'var(--zm-text-faint)',
        border:      tab === t ? '1px solid rgba(251,191,36,0.25)' : '1px solid transparent',
        transition: 'all 150ms ease',
      }}>{t}</button>
    ))}
  </div>
));
TabBarOrd.displayName = 'OrdTabBar';

// ─── Ordinals Page ────────────────────────────────────────────────────────────

const Ordinals = memo(() => {
  const { isMobile, isTablet } = useBreakpoint();
  const [tab, setTab]         = useState<OrdTab>('Inscriptions');
  const [isReady, setIsReady] = useState(false);
  const mountedRef             = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const id = requestAnimationFrame(() => { if (mountedRef.current) setIsReady(true); });
    return () => { mountedRef.current = false; cancelAnimationFrame(id); };
  }, []);

  const onTab = useCallback((t: OrdTab) => setTab(t), []);

  const metricGridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: '10px', marginBottom: '20px',
  }), [isMobile, isTablet]);

  const mainGridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1fr 1fr',
    gap: '14px', marginBottom: '20px',
  }), [isMobile, isTablet]);

  const bottomGridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1.4fr 1fr',
    gap: '14px', marginBottom: '20px',
  }), [isMobile, isTablet]);

  if (!isReady) return (
    <div style={{ padding: '20px' }}>
      <div style={{ height: 28, width: '40%', borderRadius: 8,
        background: 'var(--zm-surface-2)', marginBottom: 20 }} />
      <div style={{ height: 200, borderRadius: 20, background: 'var(--zm-surface-1)' }} />
    </div>
  );

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible"
      role="main" aria-label="Ordinals and BRC-20 Dashboard">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <motion.div variants={itemV} style={{
        display: 'flex',
        alignItems:     isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        flexDirection:  isMobile ? 'column' : 'row',
        marginBottom: '20px', gap: '12px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: isMobile ? 36 : 44, height: isMobile ? 36 : 44,
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)',
          }}>
            <Bitcoin size={isMobile ? 18 : 22} style={{ color: 'var(--zm-warning)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Space Mono', monospace",
              fontSize: isMobile ? '16px' : '20px', fontWeight: 700,
              color: 'var(--zm-text-primary)', letterSpacing: '0.04em' }}>ORDINALS & BRC-20</h1>
            <p style={{ margin: '3px 0 0', fontFamily: "'IBM Plex Mono', monospace",
              fontSize: isMobile ? '9px' : '11px', color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>
              {isMobile
                ? 'Inscriptions · BRC-20 · Rare Sats'
                : 'Live Inscription Feed · BRC-20 Rankings · Rare Sats · Bitcoin Fee Market'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '8px',
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%',
            background: 'var(--zm-warning)', display: 'inline-block' }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px',
            color: 'var(--zm-warning)', letterSpacing: '0.08em' }}>
            {isMobile ? 'BTC LIVE' : 'LIVE · BTC MAINNET'}
          </span>
        </div>
      </motion.div>

      {/* ── Metric Cards ─────────────────────────────────────────────── */}
      <motion.div variants={itemV}>
        <SectionLabel label="▸ Ordinals Market Overview" mt={0} />
        <div style={metricGridStyle}>
          {ORD_METRICS.map(m => <OrdMetricCard key={m.label} m={m} compact={isMobile} />)}
        </div>
      </motion.div>

      {/* ═══ MOBILE: Tab Switcher ═══════════════════════════════════════ */}
      {isMobile && (
        <motion.div variants={itemV}>
          <TabBarOrd tab={tab} onTab={onTab} />
          {tab === 'Inscriptions' && <InscriptionsPanel isMobile={true} />}
          {tab === 'BRC-20'       && <Brc20Panel isMobile={true} />}
          {tab === 'Rare Sats'    && (
            <>
              <RareSatsPanel isMobile={true} />
              <div style={{ marginTop: '14px' }}><FeePanel isMobile={true} /></div>
            </>
          )}
        </motion.div>
      )}

      {/* ═══ TABLET: Stacked full-width panels ══════════════════════════ */}
      {isTablet && !isMobile && (
        <>
          <motion.div variants={itemV}>
            <SectionLabel label="▸ Latest Inscriptions · BRC-20 Tokens" />
            <div style={mainGridStyle}>
              <InscriptionsPanel isMobile={false} />
              <Brc20Panel isMobile={false} />
            </div>
          </motion.div>
          <motion.div variants={itemV}>
            <SectionLabel label="▸ Rare Sats" />
            <RareSatsPanel isMobile={false} />
          </motion.div>
          <motion.div variants={itemV} style={{ marginTop: '14px' }}>
            <SectionLabel label="▸ Bitcoin Fee Market" />
            <FeePanel isMobile={false} />
          </motion.div>
        </>
      )}

      {/* ═══ DESKTOP: Full grid — all panels visible ════════════════════ */}
      {!isMobile && !isTablet && (
        <>
          <motion.div variants={itemV}>
            <SectionLabel label="▸ Latest Inscriptions · BRC-20 Token Rankings" />
            <div style={mainGridStyle}>
              <InscriptionsPanel isMobile={false} />
              <Brc20Panel isMobile={false} />
            </div>
          </motion.div>
          <motion.div variants={itemV}>
            <SectionLabel label="▸ Rare Sat Tracker · Bitcoin Fee Market" />
            <div style={bottomGridStyle}>
              <RareSatsPanel isMobile={false} />
              <FeePanel isMobile={false} />
            </div>
          </motion.div>
        </>
      )}

    </motion.div>
  );
});
Ordinals.displayName = 'Ordinals';

export default Ordinals;
