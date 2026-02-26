/**
 * Tokens.tsx — ZERØ MERIDIAN 2026 Phase 12
 * Token Discovery: new listings, trending tokens, momentum scores, risk grades.
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX ✓
 * - Object.freeze() all static data ✓
 * - useCallback + useMemo ✓
 * - mountedRef ✓
 * - aria-label + role ✓
 * - var(--zm-*) theme-aware ✓ ← push25
 */

import React, {
  memo, useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Token {
  id:          string;
  symbol:      string;
  name:        string;
  category:    string;
  chain:       string;
  price:       number;
  change24h:   number;
  change7d:    number;
  volume24h:   number;
  mcap:        number;
  momentum:    number;   // 0-100
  risk:        'LOW' | 'MED' | 'HIGH' | 'EXTREME';
  isNew:       boolean;  // Listed < 30 days
  trending:    boolean;
  launchDate:  string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const TOKENS: readonly Token[] = Object.freeze([
  { id: 'pepe2',    symbol: 'PEPE2',  name: 'Pepe 2.0',         category: 'Meme',    chain: 'ETH',  price: 0.00000182, change24h: 142.3,  change7d: 890.1,  volume24h: 420_000_000,  mcap: 1_200_000_000, momentum: 98, risk: 'EXTREME', isNew: true,  trending: true,  launchDate: '2026-02-20' },
  { id: 'eigen',    symbol: 'EIGEN',  name: 'Eigenlayer',       category: 'DeFi',    chain: 'ETH',  price: 8.42,       change24h: 28.4,   change7d: 62.1,   volume24h: 380_000_000,  mcap: 4_200_000_000, momentum: 91, risk: 'MED',    isNew: false, trending: true,  launchDate: '2024-09-30' },
  { id: 'honey',    symbol: 'HONEY',  name: 'HoneyBee Finance', category: 'Yield',   chain: 'BASE', price: 0.0842,     change24h: 67.2,   change7d: 215.8,  volume24h: 85_000_000,   mcap: 420_000_000,   momentum: 89, risk: 'HIGH',   isNew: true,  trending: true,  launchDate: '2026-02-10' },
  { id: 'zeal',     symbol: 'ZEAL',   name: 'Zeal Protocol',    category: 'Infra',   chain: 'SOL',  price: 1.24,       change24h: 18.9,   change7d: 44.2,   volume24h: 62_000_000,   mcap: 620_000_000,   momentum: 82, risk: 'MED',    isNew: true,  trending: true,  launchDate: '2026-01-28' },
  { id: 'ondo',     symbol: 'ONDO',   name: 'Ondo Finance',     category: 'RWA',     chain: 'ETH',  price: 1.68,       change24h: 14.2,   change7d: 38.5,   volume24h: 145_000_000,  mcap: 2_400_000_000, momentum: 78, risk: 'LOW',    isNew: false, trending: true,  launchDate: '2024-01-18' },
  { id: 'gpu',      symbol: 'GPU',    name: 'GPU Protocol',     category: 'AI/DePIN', chain: 'ETH', price: 0.284,      change24h: 44.8,   change7d: 120.3,  volume24h: 94_000_000,   mcap: 850_000_000,   momentum: 86, risk: 'HIGH',   isNew: true,  trending: true,  launchDate: '2026-02-01' },
  { id: 'moodeng',  symbol: 'MOO',    name: 'Moo Deng',         category: 'Meme',    chain: 'SOL',  price: 0.00428,    change24h: -12.4,  change7d: 340.2,  volume24h: 210_000_000,  mcap: 2_100_000_000, momentum: 72, risk: 'EXTREME', isNew: false, trending: true,  launchDate: '2025-10-15' },
  { id: 'drift',    symbol: 'DRIFT',  name: 'Drift Protocol',   category: 'Perp DEX', chain: 'SOL', price: 0.92,       change24h: 8.4,    change7d: 22.1,   volume24h: 48_000_000,   mcap: 460_000_000,   momentum: 68, risk: 'MED',    isNew: false, trending: false, launchDate: '2024-11-20' },
  { id: 'grass',    symbol: 'GRASS',  name: 'Grass Network',    category: 'DePIN',   chain: 'SOL',  price: 2.84,       change24h: 22.1,   change7d: 58.4,   volume24h: 128_000_000,  mcap: 1_420_000_000, momentum: 80, risk: 'MED',    isNew: false, trending: true,  launchDate: '2024-10-28' },
  { id: 'zro',      symbol: 'ZRO',    name: 'LayerZero',        category: 'Infra',   chain: 'ETH',  price: 6.24,       change24h: -4.2,   change7d: 12.8,   volume24h: 72_000_000,   mcap: 3_100_000_000, momentum: 58, risk: 'LOW',    isNew: false, trending: false, launchDate: '2024-06-20' },
  { id: 'zeus',     symbol: 'ZEUS',   name: 'Zeus Network',     category: 'Infra',   chain: 'SOL',  price: 0.142,      change24h: 35.6,   change7d: 88.2,   volume24h: 56_000_000,   mcap: 280_000_000,   momentum: 84, risk: 'HIGH',   isNew: true,  trending: true,  launchDate: '2026-01-15' },
  { id: 'rez',      symbol: 'REZ',    name: 'Renzo Protocol',   category: 'LRT',     chain: 'ETH',  price: 0.0618,     change24h: 18.2,   change7d: 42.8,   volume24h: 38_000_000,   mcap: 310_000_000,   momentum: 74, risk: 'MED',    isNew: false, trending: false, launchDate: '2024-04-30' },
  { id: 'io',       symbol: 'IO',     name: 'io.net',           category: 'AI/DePIN', chain: 'SOL', price: 4.82,       change24h: 12.4,   change7d: 28.6,   volume24h: 92_000_000,   mcap: 1_200_000_000, momentum: 77, risk: 'MED',    isNew: false, trending: true,  launchDate: '2024-06-11' },
  { id: 'npc',      symbol: 'NPC',    name: 'NPC AI',           category: 'AI',      chain: 'BASE', price: 0.0042,     change24h: 88.4,   change7d: 280.1,  volume24h: 48_000_000,   mcap: 180_000_000,   momentum: 93, risk: 'EXTREME', isNew: true,  trending: true,  launchDate: '2026-02-18' },
  { id: 'kite',     symbol: 'KITE',   name: 'Kite Finance',     category: 'DeFi',    chain: 'ARB',  price: 0.284,      change24h: -8.2,   change7d: 18.4,   volume24h: 22_000_000,   mcap: 140_000_000,   momentum: 52, risk: 'HIGH',   isNew: true,  trending: false, launchDate: '2026-02-05' },
]);

const CATEGORIES: readonly string[] = Object.freeze([
  'All', 'Meme', 'DeFi', 'AI/DePIN', 'DePIN', 'AI', 'RWA', 'Infra', 'LRT', 'Yield', 'Perp DEX',
]);

// Semantic risk colors — BOLEH hardcoded (universal data meaning)
const RISK_COLORS = Object.freeze({
  LOW:     { bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.35)',  text: 'rgba(34,255,170,0.90)'  },
  MED:     { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',   text: 'rgba(251,191,36,0.9)'  },
  HIGH:    { bg: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.35)',  text: 'rgba(251,146,60,0.9)'  },
  EXTREME: { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.35)', text: 'rgba(248,113,113,0.9)' },
});

// Semantic chain colors — BOLEH hardcoded (brand colors)
const CHAIN_COLORS = Object.freeze({
  ETH:  'rgba(0,238,255,0.90)',
  SOL:  'rgba(167,139,250,0.9)',
  BASE: 'rgba(45,212,191,0.9)',
  ARB:  'rgba(34,255,170,0.90)',
  BNB:  'rgba(251,191,36,0.9)',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(p: number): string {
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1)    return '$' + p.toFixed(2);
  if (p >= 0.01) return '$' + p.toFixed(4);
  return '$' + p.toFixed(8);
}

function fmtVol(n: number): string {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(0) + 'M';
  return '$' + (n / 1e3).toFixed(0) + 'K';
}

// ─── Momentum Gauge (canvas) ──────────────────────────────────────────────────

const MomentumGauge = memo<{ score: number; size?: number }>(({ score, size = 36 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r  = size / 2 - 3;

    // BG arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth   = 3;
    ctx.lineCap     = 'round';
    ctx.stroke();

    // Score arc — semantic color (universally understood)
    const pct   = score / 100;
    const start = Math.PI * 0.75;
    const end   = start + pct * Math.PI * 1.5;
    const hue   = score >= 80 ? 'var(--zm-positive)' : score >= 60 ? 'var(--zm-warning)' : 'rgba(248,113,113,1)';

    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.strokeStyle = hue;
    ctx.lineWidth   = 3;
    ctx.stroke();

    // Center text
    ctx.fillStyle    = 'rgba(255,255,255,0.88)';
    ctx.font         = 'bold ' + (size * 0.28) + 'px Space Mono, monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(score), cx, cy);
  }, [score, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size + 'px', height: size + 'px', display: 'block' }}
      aria-label={'Momentum score ' + score}
    />
  );
});
MomentumGauge.displayName = 'MomentumGauge';

// ─── Token Card ───────────────────────────────────────────────────────────────

const TokenCard = memo<{ token: Token }>(({ token }) => {
  const riskStyle = RISK_COLORS[token.risk];
  const chainColor = (CHAIN_COLORS as Record<string, string>)[token.chain] || 'var(--zm-text-secondary)';

  const cardStyle = useMemo(() => ({
    background:   'var(--zm-surface-2)',
    border:       '1px solid var(--zm-divider)',
    borderRadius: '12px',
    padding:      '16px',
    position:     'relative' as const,
    overflow:     'hidden',
  }), []);

  return (
    <div style={cardStyle}>
      {/* New badge */}
      {token.isNew && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          fontFamily: "'Space Mono', monospace", fontSize: '7px',
          padding: '2px 6px', borderRadius: '3px',
          background: 'var(--zm-violet-bg)',
          border: '1px solid var(--zm-violet-border)',
          color: 'var(--zm-violet)',
          letterSpacing: '0.1em',
        }}>
          NEW
        </div>
      )}
      {token.trending && !token.isNew && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          fontFamily: "'Space Mono', monospace", fontSize: '7px',
          padding: '2px 6px', borderRadius: '3px',
          background: 'var(--zm-warning-bg)',
          border: '1px solid var(--zm-warning-border)',
          color: 'var(--zm-warning)',
          letterSpacing: '0.1em',
        }}>
          🔥 HOT
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
        <MomentumGauge score={token.momentum} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, color: 'var(--zm-text-primary)' }}>{token.symbol}</span>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: '8px',
              padding: '1px 5px', borderRadius: '3px',
              background: 'var(--zm-surface-3)',
              color: chainColor,
              border: '1px solid var(--zm-divider)',
            }}>{token.chain}</span>
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{token.name}</div>
        </div>
      </div>

      {/* Price + changes */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '16px', fontWeight: 700, color: 'var(--zm-text-primary)', marginBottom: '6px' }}>{fmtPrice(token.price)}</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: token.change24h >= 0 ? 'rgba(34,255,170,0.90)' : 'rgba(248,113,113,0.9)' }}>
            {(token.change24h >= 0 ? '+' : '') + token.change24h.toFixed(1) + '% 24H'}
          </span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: token.change7d >= 0 ? 'rgba(34,255,170,0.90)' : 'rgba(248,113,113,0.9)' }}>
            {(token.change7d >= 0 ? '+' : '') + token.change7d.toFixed(1) + '% 7D'}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--zm-text-faint)', letterSpacing: '0.06em', marginBottom: '2px' }}>VOLUME</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'var(--zm-text-secondary)' }}>{fmtVol(token.volume24h)}</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--zm-text-faint)', letterSpacing: '0.06em', marginBottom: '2px' }}>MCAP</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'var(--zm-text-secondary)' }}>{fmtVol(token.mcap)}</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--zm-text-faint)', letterSpacing: '0.06em', marginBottom: '2px' }}>CATEGORY</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'var(--zm-text-secondary)' }}>{token.category}</div>
        </div>
      </div>

      {/* Risk badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: '8px',
          padding: '3px 8px', borderRadius: '4px',
          background: riskStyle.bg,
          border: '1px solid ' + riskStyle.border,
          color: riskStyle.text,
          letterSpacing: '0.06em',
        }}>
          {token.risk + ' RISK'}
        </span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--zm-text-faint)' }}>{token.launchDate}</span>
      </div>
    </div>
  );
});
TokenCard.displayName = 'TokenCard';

// ─── Tokens ───────────────────────────────────────────────────────────────────

type TokenTab = 'Trending' | 'New Listings' | 'High Momentum' | 'All';
type SortMode = 'momentum' | 'change24h' | 'volume24h' | 'mcap';

const SORT_OPTIONS: readonly { key: SortMode; label: string }[] = Object.freeze([
  { key: 'momentum',  label: 'Momentum' },
  { key: 'change24h', label: '24H Chg'  },
  { key: 'volume24h', label: 'Volume'   },
  { key: 'mcap',      label: 'MCap'     },
] as const);

const TOKEN_TABS: readonly TokenTab[] = Object.freeze(['Trending', 'New Listings', 'High Momentum', 'All']);

const Tokens = memo(() => {
  const mountedRef = useRef(true);
  const { isMobile, isTablet } = useBreakpoint();
  const [tab, setTab]           = useState<TokenTab>('Trending');
  const [category, setCategory] = useState('All');
  const [sortMode, setSortMode] = useState<SortMode>('momentum');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleTab      = useCallback((t: TokenTab) => { if (mountedRef.current) setTab(t); }, []);
  const handleCategory = useCallback((c: string) => { if (mountedRef.current) setCategory(c); }, []);
  const handleSort     = useCallback((s: SortMode) => { if (mountedRef.current) setSortMode(s); }, []);
  const handleSearch   = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { if (mountedRef.current) setSearch(e.target.value); }, []);

  const displayed = useMemo(() => {
    let list = [...TOKENS];
    if (tab === 'Trending')      list = list.filter(t => t.trending);
    if (tab === 'New Listings')  list = list.filter(t => t.isNew);
    if (tab === 'High Momentum') list = list.filter(t => t.momentum >= 80);
    if (category !== 'All') list = list.filter(t => t.category === category);
    if (search) list = list.filter(t =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()),
    );
    list.sort((a, b) => b[sortMode] - a[sortMode]);
    return list;
  }, [tab, category, sortMode, search]);

  const pageStyle = useMemo(() => ({
    minHeight:  '100vh',
    background: 'var(--zm-bg-base)',
    fontFamily: "'Space Mono', monospace",
  }), []);

  return (
    <div style={pageStyle} aria-label="Token discovery" role="main">

      {/* Header */}
      <div style={{ padding: isMobile ? '16px 16px 14px' : '24px 28px 20px', borderBottom: '1px solid var(--zm-divider)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.04em' }}>
              TOKEN DISCOVERY
            </h1>
            <p style={{ margin: '4px 0 0', fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>
              {TOKENS.length + ' TOKENS · MOMENTUM + RISK SCORING'}
            </p>
          </div>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search token..."
            aria-label="Search tokens"
            style={{
              fontFamily:   "'Space Mono', monospace",
              fontSize:     '11px',
              background:   'var(--zm-surface-2)',
              border:       '1px solid var(--zm-divider)',
              borderRadius: '8px',
              padding:      '8px 14px',
              color:        'var(--zm-text-primary)',
              outline:      'none',
              width: isMobile ? '100%' : '200px',
            }}
          />
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', padding: isMobile ? '14px 16px' : '14px 28px' }}>
        {([
          { label: 'Trending',      value: String(TOKENS.filter(t => t.trending).length),              sub: 'tokens' },
          { label: 'New Listings',  value: String(TOKENS.filter(t => t.isNew).length),                sub: 'last 30D' },
          { label: 'High Momentum', value: String(TOKENS.filter(t => t.momentum >= 80).length),        sub: 'score ≥80' },
          { label: 'Avg Momentum',  value: Math.round(TOKENS.reduce((s, t) => s + t.momentum, 0) / TOKENS.length).toString(), sub: 'all tokens' },
        ] as const).map(c => (
          <div key={c.label} style={{
            flex: 1,
            background: 'var(--zm-surface-1)',
            border: '1px solid var(--zm-divider)',
            borderRadius: '10px',
            padding: '12px 16px',
          }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)', letterSpacing: '0.1em', marginBottom: '4px', textTransform: 'uppercase' }}>{c.label}</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '20px', fontWeight: 700, color: 'var(--zm-text-primary)', marginBottom: '2px' }}>{c.value}</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs + Sort */}
      <div style={{ padding: isMobile ? '8px 16px' : '8px 28px', borderBottom: '1px solid var(--zm-divider)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px' }} role="tablist" aria-label="Token filter tabs">
          {TOKEN_TABS.map(t => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => handleTab(t)}
              style={{
                fontFamily:    "'Space Mono', monospace",
                fontSize:      '10px',
                letterSpacing: '0.04em',
                padding:       '6px 12px',
                borderRadius:  '6px',
                border:        tab === t ? '1px solid var(--zm-accent-border)' : '1px solid transparent',
                background:    tab === t ? 'var(--zm-accent-dim)' : 'transparent',
                color:         tab === t ? 'var(--zm-accent)' : 'var(--zm-text-secondary)',
                cursor:        'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>SORT</span>
          {SORT_OPTIONS.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => handleSort(s.key)}
              aria-pressed={sortMode === s.key}
              style={{
                fontFamily:    "'Space Mono', monospace",
                fontSize:      '9px',
                padding:       '4px 8px',
                borderRadius:  '5px',
                border:        sortMode === s.key ? '1px solid var(--zm-violet-border)' : '1px solid var(--zm-divider)',
                background:    sortMode === s.key ? 'var(--zm-violet-bg)' : 'transparent',
                color:         sortMode === s.key ? 'var(--zm-violet)' : 'var(--zm-text-faint)',
                cursor:        'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: '6px', padding: isMobile ? '12px 16px' : '12px 28px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => handleCategory(c)}
            aria-pressed={category === c}
            style={{
              fontFamily:    "'Space Mono', monospace",
              fontSize:      '9px',
              padding:       '4px 10px',
              borderRadius:  '5px',
              border:        category === c ? '1px solid var(--zm-positive-border)' : '1px solid var(--zm-divider)',
              background:    category === c ? 'var(--zm-positive-bg)' : 'transparent',
              color:         category === c ? 'var(--zm-positive)' : 'var(--zm-text-faint)',
              cursor:        'pointer',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div style={{ padding: isMobile ? '8px 16px 24px' : '8px 28px 28px' }}>
        {displayed.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {displayed.map(t => (
              <TokenCard key={t.id} token={t} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '48px', textAlign: 'center', fontFamily: "'Space Mono', monospace", fontSize: '12px', color: 'var(--zm-text-faint)' }}>
            No tokens match your filters.
          </div>
        )}
      </div>
    </div>
  );
});

Tokens.displayName = 'Tokens';
export default Tokens;
