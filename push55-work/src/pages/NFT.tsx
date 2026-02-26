/**
 * NFT.tsx — ZERØ MERIDIAN push44
 * NFT Intelligence: Top Collections, Wash Trading Detection, Whale Tracker
 * RESPONSIVE:
 *   Mobile  (<768px)  — compact header, 2×2 metrics, tab switcher (3 tabs)
 *   Tablet  (768–1024) — stacked full-width panels, no tab switcher
 *   Desktop (>1024px) — 3-col rich layout, all panels visible simultaneously
 * push44: FIX — restored proper JSX wrapper structure (motion.div was prematurely closed)
 * - React.memo + displayName ✓  - rgba() only ✓  - Zero className in JSX ✓
 * - Zero template literals in JSX attrs ✓  - useBreakpoint ✓
 * - Object.freeze() all static data ✓  - useCallback + useMemo ✓  - mountedRef ✓
 */

import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Image } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type NftStatus = 'HOT' | 'TRENDING' | 'COOLING' | 'DEAD';
type WashRisk  = 'LOW' | 'MEDIUM' | 'HIGH';
type NftTab    = 'Collections' | 'Wash Trading' | 'Whale Tracker';

interface NftCollection {
  rank:      number;
  name:      string;
  symbol:    string;
  floor:     number;
  vol24h:    number;
  change24h: number;
  sales24h:  number;
  holders:   number;
  supply:    number;
  status:    NftStatus;
  washRisk:  WashRisk;
  accent:    string;
}

interface NftWhale {
  address:     string;
  label:       string;
  collections: string;
  totalEth:    number;
  items:       number;
  profit30d:   number;
  tier:        string;
  tierColor:   string;
}

interface WashAlert {
  collection: string;
  riskScore:  number;
  flagged:    number;
  vol24h:     number;
  reason:     string;
  color:      string;
  bg:         string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const COLLECTIONS: readonly NftCollection[] = Object.freeze([
  { rank: 1, name: 'Bored Ape Yacht Club', symbol: 'BAYC',  floor: 18.2, vol24h: 312.4, change24h:  4.8, sales24h: 18, holders: 5821, supply: 10000, status: 'TRENDING', washRisk: 'LOW',    accent: 'var(--zm-warning)' },
  { rank: 2, name: 'CryptoPunks',          symbol: 'PUNK',  floor: 45.1, vol24h: 189.6, change24h: -2.1, sales24h:  4, holders: 3512, supply: 10000, status: 'HOT',      washRisk: 'LOW',    accent: 'var(--zm-cyan)' },
  { rank: 3, name: 'Pudgy Penguins',       symbol: 'PPG',   floor: 12.4, vol24h: 445.2, change24h: 18.3, sales24h: 36, holders: 4821, supply:  8888, status: 'HOT',      washRisk: 'LOW',    accent: 'var(--zm-violet)' },
  { rank: 4, name: 'Azuki',               symbol: 'AZUKI', floor:  9.8, vol24h: 213.7, change24h:  6.2, sales24h: 21, holders: 4321, supply: 10000, status: 'TRENDING', washRisk: 'LOW',    accent: 'var(--zm-negative)' },
  { rank: 5, name: 'Milady Maker',         symbol: 'MILADY',floor:  3.2, vol24h: 167.4, change24h: 31.4, sales24h: 52, holders: 3890, supply: 10000, status: 'HOT',      washRisk: 'MEDIUM', accent: 'var(--zm-positive)' },
  { rank: 6, name: 'DeGods',              symbol: 'DGOD',  floor:  2.1, vol24h:  98.3, change24h: -8.4, sales24h: 47, holders: 4521, supply: 10000, status: 'COOLING',  washRisk: 'LOW',    accent: 'rgba(251,146,60,1)' },
  { rank: 7, name: 'Okay Bears',          symbol: 'OKAY',  floor:  1.4, vol24h:  77.6, change24h: -4.1, sales24h: 56, holders: 3201, supply: 10000, status: 'COOLING',  washRisk: 'MEDIUM', accent: 'rgba(148,163,184,0.8)' },
  { rank: 8, name: 'Doodles',             symbol: 'DOODL', floor:  1.9, vol24h:  54.1, change24h:  1.2, sales24h: 29, holders: 4891, supply: 10000, status: 'TRENDING', washRisk: 'LOW',    accent: 'rgba(45,212,191,1)' },
]);

const WHALES: readonly NftWhale[] = Object.freeze([
  { address: '0x1919...a8b2', label: 'Pranksy',        collections: 'BAYC, PUNK, Azuki',   totalEth: 4821,  items: 812, profit30d:  342, tier: 'ELITE',       tierColor: 'var(--zm-warning)' },
  { address: '0x8a9d...f341', label: 'Punk6529',       collections: 'PUNK, BAYC',          totalEth: 12400, items: 441, profit30d: 1201, tier: 'LEGENDARY',   tierColor: 'var(--zm-violet)' },
  { address: '0x3fce...11bc', label: 'Anonymous #7',   collections: 'PPG, Milady, OKAY',   totalEth: 1230,  items: 234, profit30d:  -44, tier: 'WHALE',       tierColor: 'var(--zm-cyan)' },
  { address: '0xc721...88a1', label: 'GigaMind',       collections: 'Azuki, DOODL',        totalEth:  890,  items: 178, profit30d:  127, tier: 'WHALE',       tierColor: 'var(--zm-positive)' },
  { address: '0x9d41...22ee', label: 'Treasury Alpha', collections: 'BAYC, DeGods',        totalEth: 2310,  items:  96, profit30d:  -89, tier: 'INSTITUTION', tierColor: 'var(--zm-negative)' },
]);

const WASH_ALERTS: readonly WashAlert[] = Object.freeze([
  { collection: 'Milady Maker', riskScore: 74, flagged:  23, vol24h: 167.4, reason: 'Circular trades detected between 12 wallets',       color: 'var(--zm-warning)',  bg: 'rgba(251,191,36,0.07)' },
  { collection: 'Okay Bears',   riskScore: 61, flagged:  14, vol24h:  77.6, reason: 'Rapid buy/sell cycles under 2-minute windows',      color: 'var(--zm-warning)',  bg: 'rgba(251,191,36,0.07)' },
  { collection: 'Otherdeed',    riskScore: 88, flagged: 156, vol24h: 412.1, reason: 'Same-wallet arb inflating floor price signals',     color: 'var(--zm-negative)', bg: 'rgba(251,113,133,0.07)' },
]);

const NFT_METRICS = Object.freeze([
  { label: 'Total Vol 24H',    value: '1.56K ETH', sub: '+8.4% vs yesterday', subPos: true,  accent: 'var(--zm-cyan)' },
  { label: 'Top Floor (PUNK)', value: '45.1 ETH',  sub: '-2.1% 24h',          subPos: false, accent: 'var(--zm-warning)' },
  { label: 'Unique Buyers',    value: '2,841',      sub: 'active wallets 24h', subPos: true,  accent: 'var(--zm-positive)' },
  { label: 'Wash Risk Alerts', value: '3',          sub: 'collections flagged',subPos: false, accent: 'var(--zm-negative)' },
]);

const STATUS_CFG = Object.freeze({
  HOT:      { color: 'var(--zm-negative)', bg: 'rgba(251,113,133,0.10)', label: '\uD83D\uDD25 HOT' },
  TRENDING: { color: 'var(--zm-cyan)',  bg: 'rgba(0,238,255,0.10)',  label: '\u25B2 TREND' },
  COOLING:  { color: 'var(--zm-warning)',  bg: 'rgba(251,191,36,0.10)',  label: '\u25C6 COOLING' },
  DEAD:     { color: 'var(--zm-text-secondary)', bg: 'rgba(148,163,184,0.08)', label: '\u25BC DEAD' },
} as const);

const WASH_CFG = Object.freeze({
  LOW:    { color: 'var(--zm-positive)',   label: 'LOW' },
  MEDIUM: { color: 'var(--zm-warning)',   label: 'MED' },
  HIGH:   { color: 'var(--zm-negative)',  label: 'HIGH' },
} as const);

const TABS: readonly NftTab[] = Object.freeze(['Collections', 'Wash Trading', 'Whale Tracker']);

const containerV = Object.freeze({ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } });
const itemV      = Object.freeze({ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } });

// ─── SectionLabel ─────────────────────────────────────────────────────────────

const SectionLabel = memo(({ label, mt = 20 }: { label: string; mt?: number }) => (
  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', letterSpacing: '0.14em',
    color: 'var(--zm-text-faint)', marginBottom: '10px', marginTop: mt + 'px', textTransform: 'uppercase' }}>
    {label}
  </p>
));
SectionLabel.displayName = 'NFTSectionLabel';

// ─── Metric Card ──────────────────────────────────────────────────────────────

const NFTMetricCard = memo(({ m, compact }: { m: typeof NFT_METRICS[number]; compact: boolean }) => (
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
      fontWeight: 700, color: m.accent, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
      {m.value}
    </div>
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px',
      color: m.subPos ? 'var(--zm-positive)' : 'var(--zm-negative)', marginTop: '5px' }}>
      {m.sub}
    </div>
  </div>
));
NFTMetricCard.displayName = 'NFTMetricCard';

// ─── Collection Row ───────────────────────────────────────────────────────────

const CollectionRow = memo(({ c, isMobile }: { c: NftCollection; isMobile: boolean }) => {
  const statusCfg = STATUS_CFG[c.status];
  const washCfg   = WASH_CFG[c.washRisk];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px',
      padding: isMobile ? '9px 0' : '11px 0', borderBottom: '1px solid var(--zm-divider)' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
        color: 'var(--zm-text-faint)', width: isMobile ? '16px' : '20px',
        flexShrink: 0, textAlign: 'right' }}>{c.rank}</span>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.accent, flexShrink: 0,
        boxShadow: '0 0 6px ' + c.accent.replace('1)', '0.45)') }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: isMobile ? '11px' : '12px',
          fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.02em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
          color: 'var(--zm-text-faint)', marginTop: '1px' }}>
          {c.symbol} · {c.supply.toLocaleString()} items
        </div>
      </div>
      <div style={{ textAlign: 'right', minWidth: isMobile ? '52px' : '62px', flexShrink: 0 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
          fontWeight: 700, color: 'var(--zm-text-primary)' }}>{c.floor.toFixed(2)} \u039E</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', marginTop: '1px',
          color: c.change24h >= 0 ? 'var(--zm-positive)' : 'var(--zm-negative)' }}>
          {(c.change24h >= 0 ? '+' : '') + c.change24h.toFixed(1) + '%'}
        </div>
      </div>
      {!isMobile && (
        <div style={{ textAlign: 'right', minWidth: '70px', flexShrink: 0 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
            color: 'var(--zm-text-secondary)' }}>{c.vol24h.toFixed(1)} \u039E</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
            color: 'var(--zm-text-faint)' }}>{c.sales24h} sales</div>
        </div>
      )}
      {!isMobile && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
          padding: '2px 6px', borderRadius: '5px', flexShrink: 0,
          background: statusCfg.bg, color: statusCfg.color,
          border: '1px solid ' + statusCfg.color.replace('1)', '0.25)') }}>{statusCfg.label}</span>
      )}
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
        fontWeight: 700, color: washCfg.color, flexShrink: 0, minWidth: '28px', textAlign: 'center' }}>
        {washCfg.label}
      </span>
    </div>
  );
});
CollectionRow.displayName = 'CollectionRow';

// ─── Collections Panel ────────────────────────────────────────────────────────

const CollectionsPanel = memo(({ isMobile }: { isMobile: boolean }) => (
  <div style={{ background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)',
    borderRadius: 'var(--zm-card-radius)', padding: isMobile ? '14px' : '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px',
        fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Top Collections
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isMobile && (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
            color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>FLOOR · VOL24H · STATUS · WASH</span>
        )}
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
          padding: '2px 7px', borderRadius: '5px',
          background: 'rgba(0,238,255,0.10)', color: 'rgba(34,211,238,0.85)',
          border: '1px solid rgba(34,211,238,0.22)', letterSpacing: '0.06em' }}>LIVE</span>
      </div>
    </div>
    <div>
      {COLLECTIONS.map(c => <CollectionRow key={c.symbol} c={c} isMobile={isMobile} />)}
    </div>
  </div>
));
CollectionsPanel.displayName = 'CollectionsPanel';

// ─── Whale Row ────────────────────────────────────────────────────────────────

const WhaleRow = memo(({ w, isMobile }: { w: NftWhale; isMobile: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 0', borderBottom: '1px solid var(--zm-divider)' }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px',
        fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.02em' }}>{w.label}</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
        color: 'var(--zm-text-faint)', marginTop: '2px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {isMobile ? w.address.slice(0, 16) + '\u2026' : w.address} · {w.collections}
      </div>
    </div>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
        fontWeight: 700, color: w.tierColor }}>{w.totalEth.toLocaleString()} \u039E</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', marginTop: '1px',
        color: w.profit30d >= 0 ? 'var(--zm-positive)' : 'var(--zm-negative)' }}>
        {(w.profit30d >= 0 ? '+' : '') + w.profit30d} \u039E 30d
      </div>
    </div>
    {!isMobile && (
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
        padding: '2px 6px', borderRadius: '5px', letterSpacing: '0.06em', flexShrink: 0,
        background: w.tierColor.replace('1)', '0.10)'), color: w.tierColor,
        border: '1px solid ' + w.tierColor.replace('1)', '0.25)') }}>{w.tier}</span>
    )}
  </div>
));
WhaleRow.displayName = 'WhaleRow';

// ─── Whale Panel ──────────────────────────────────────────────────────────────

const WhalePanel = memo(({ isMobile }: { isMobile: boolean }) => (
  <div style={{ background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)',
    borderRadius: 'var(--zm-card-radius)', padding: isMobile ? '14px' : '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px',
        fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Whale Tracker
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
        padding: '2px 7px', borderRadius: '5px',
        background: 'var(--zm-violet-bg)', color: 'rgba(167,139,250,0.85)',
        border: '1px solid rgba(167,139,250,0.22)', letterSpacing: '0.06em' }}>TOP 5</span>
    </div>
    {WHALES.map(w => <WhaleRow key={w.address} w={w} isMobile={isMobile} />)}
  </div>
));
WhalePanel.displayName = 'WhalePanel';

// ─── Wash Panel ───────────────────────────────────────────────────────────────

const WashPanel = memo(({ isMobile }: { isMobile: boolean }) => (
  <div style={{ background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)',
    borderRadius: 'var(--zm-card-radius)', padding: isMobile ? '14px' : '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px',
          fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Wash Trading Alerts
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
          padding: '1px 6px', borderRadius: '4px',
          background: 'rgba(251,113,133,0.10)', color: 'var(--zm-negative)',
          border: '1px solid rgba(251,113,133,0.25)' }}>3 FLAGGED</span>
      </div>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
        color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>AI DETECTION ENGINE v2</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {WASH_ALERTS.map((a, i) => (
        <div key={i} style={{ padding: isMobile ? '12px' : '14px 16px',
          borderRadius: '12px', background: a.bg,
          border: '1px solid ' + a.color.replace('1)', '0.25)') }}>
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%',
                background: a.color, flexShrink: 0, marginTop: '3px' }} />
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px',
                  fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.02em' }}>{a.collection}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px',
                  color: 'var(--zm-text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>{a.reason}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: isMobile ? '16px' : '20px',
              flexShrink: 0, alignItems: 'center' }}>
              {['RISK SCORE', 'FLAGGED TXS', !isMobile ? 'VOL 24H' : ''].filter(Boolean).map((lbl, li) => (
                <div key={li} style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px',
                    color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>{lbl}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '16px',
                    fontWeight: 700, color: li === 0 ? a.color : 'var(--zm-text-primary)' }}>
                    {li === 0 ? a.riskScore : li === 1 ? a.flagged : a.vol24h.toFixed(1) + ' \u039E'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: '10px', height: '3px', borderRadius: '2px',
            background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: a.riskScore + '%',
              background: a.color, borderRadius: '2px', transition: 'width 600ms ease' }} />
          </div>
        </div>
      ))}
    </div>
  </div>
));
WashPanel.displayName = 'WashPanel';

// ─── Tab Bar (mobile only) ────────────────────────────────────────────────────

const TabBar = memo(({ tab, onTab }: { tab: NftTab; onTab: (t: NftTab) => void }) => (
  <div style={{ display: 'flex', gap: '4px', background: 'var(--zm-surface-1)',
    border: '1px solid var(--zm-divider)', borderRadius: '12px',
    padding: '4px', marginBottom: '14px' }}>
    {TABS.map(t => (
      <button key={t} onClick={() => onTab(t)} style={{
        flex: 1, padding: '8px 4px', borderRadius: '9px', cursor: 'pointer',
        fontFamily: "'Space Mono', monospace", fontSize: '9px',
        fontWeight: tab === t ? 700 : 400, letterSpacing: '0.04em', textTransform: 'uppercase',
        background:  tab === t ? 'var(--zm-accent-bg)' : 'transparent',
        color:       tab === t ? 'var(--zm-accent)' : 'var(--zm-text-faint)',
        border:      tab === t ? '1px solid var(--zm-accent-border)' : '1px solid transparent',
        transition: 'all 150ms ease',
      }}>{t}</button>
    ))}
  </div>
));
TabBar.displayName = 'NFTTabBar';

// ─── NFT Page ─────────────────────────────────────────────────────────────────

const NFT = memo(() => {
  const { isMobile, isTablet } = useBreakpoint();
  const [tab, setTab]         = useState<NftTab>('Collections');
  const [isReady, setIsReady] = useState(false);
  const mountedRef             = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const id = requestAnimationFrame(() => { if (mountedRef.current) setIsReady(true); });
    return () => { mountedRef.current = false; cancelAnimationFrame(id); };
  }, []);

  const onTab = useCallback((t: NftTab) => setTab(t), []);

  const metricGridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: '10px', marginBottom: '20px',
  }), [isMobile, isTablet]);

  const mainGridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1.55fr 1fr',
    gap: '14px', marginBottom: '20px',
  }), [isMobile, isTablet]);

  if (!isReady) return (
    <div style={{ padding: '20px' }}>
      <div style={{ height: 28, width: '38%', borderRadius: 8, background: 'var(--zm-surface-2)', marginBottom: 20 }} />
      <div style={{ height: 200, borderRadius: 20, background: 'var(--zm-surface-1)' }} />
    </div>
  );

  return (
    <motion.div variants={containerV} initial="hidden" animate="visible"
      role="main" aria-label="NFT Intelligence Dashboard"
      style={{ padding: isMobile ? '16px' : '28px', maxWidth: '1600px' }}>

      {/* ═══ Page Header ══════════════════════════════════════════════════════ */}
      <motion.div variants={itemV} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
          background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image size={16} color="var(--zm-violet)" />
        </div>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: isMobile ? '14px' : '16px',
            fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.04em' }}>
            NFT Intelligence
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px',
            color: 'var(--zm-text-faint)', marginTop: '2px', letterSpacing: '0.06em' }}>
            COLLECTIONS · WASH TRADING · WHALE TRACKER
          </div>
        </div>
      </motion.div>

      {/* ═══ Metric Grid ══════════════════════════════════════════════════════ */}
      <motion.div variants={itemV}>
        <SectionLabel label="\u25B8 Market Overview" mt={0} />
        <div style={metricGridStyle}>
          {NFT_METRICS.map((m, i) => (
            <NFTMetricCard key={i} m={m} compact={isMobile} />
          ))}
        </div>
      </motion.div>

      {/* ═══ MOBILE: Tab Switcher ═══════════════════════════════════════════ */}
      {isMobile && (
        <motion.div variants={itemV}>
          <TabBar tab={tab} onTab={onTab} />
          {tab === 'Collections'   && <CollectionsPanel isMobile={true} />}
          {tab === 'Wash Trading'  && <WashPanel isMobile={true} />}
          {tab === 'Whale Tracker' && <WhalePanel isMobile={true} />}
        </motion.div>
      )}

      {/* ═══ TABLET: Stacked full-width panels ══════════════════════════════ */}
      {isTablet && !isMobile && (
        <>
          <motion.div variants={itemV}>
            <SectionLabel label="\u25B8 Top Collections" />
            <CollectionsPanel isMobile={false} />
          </motion.div>
          <motion.div variants={itemV} style={{ marginTop: '14px' }}>
            <SectionLabel label="\u25B8 Whale Tracker" />
            <WhalePanel isMobile={false} />
          </motion.div>
          <motion.div variants={itemV} style={{ marginTop: '14px' }}>
            <SectionLabel label="\u25B8 Wash Trading Detection" />
            <WashPanel isMobile={false} />
          </motion.div>
        </>
      )}

      {/* ═══ DESKTOP: All panels visible simultaneously ══════════════════════ */}
      {!isMobile && !isTablet && (
        <>
          <motion.div variants={itemV}>
            <SectionLabel label="\u25B8 Collections · Whale Tracker" />
            <div style={mainGridStyle}>
              <CollectionsPanel isMobile={false} />
              <WhalePanel isMobile={false} />
            </div>
          </motion.div>
          <motion.div variants={itemV}>
            <SectionLabel label="\u25B8 Wash Trading Detection · AI Engine" />
            <WashPanel isMobile={false} />
          </motion.div>
        </>
      )}

    </motion.div>
  );
});
NFT.displayName = 'NFT';

export default NFT;
