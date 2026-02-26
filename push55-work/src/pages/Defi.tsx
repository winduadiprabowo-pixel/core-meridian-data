/**
 * Defi.tsx — ZERØ MERIDIAN 2026 push24
 * push24 fixes:
 *   - Math.sin/cos → curated CHAIN_PALETTE (deterministic, no trig)
 *   - Dead 'hue' variable removed
 *   - willChange: transform on animated elements
 *   - Duplicate style props fixed
 * - Full DeFi Intelligence powered by DefiLlama (100% FREE)
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX ✓
 * - useCallback + useMemo ✓
 */

import {
  memo, useState, useCallback, useMemo, useRef, useEffect,
} from 'react';
import { useDefiLlama, type DLProtocol, type DLYield } from '@/hooks/useDefiLlama';
import { formatCompact } from '@/lib/formatters';
import {
  TrendingUp, TrendingDown, Search, RefreshCw, Loader2,
  Layers, BarChart3, Percent, ChevronDown, ChevronUp,
  DollarSign, AlertTriangle, Zap,
} from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = Object.freeze([
  'All', 'Dexes', 'Lending', 'Liquid Staking', 'Bridge',
  'CDP', 'Yield', 'Derivatives', 'RWA', 'Other',
]);

const CATEGORY_COLORS: Record<string, string> = Object.freeze({
  'Dexes':           'var(--zm-cyan)',
  'Lending':         'var(--zm-violet)',
  'Liquid Staking':  'var(--zm-positive)',
  'Bridge':          'var(--zm-warning)',
  'CDP':             'var(--zm-negative)',
  'Yield':           'var(--zm-positive)',
  'Derivatives':     'rgba(255,68,136,0.70)',
  'RWA':             'var(--zm-violet)',
  'Other':           'var(--zm-text-secondary)',
});

// push24: Curated palette — replaces Math.sin/cos color generation
const CHAIN_PALETTE: readonly string[] = Object.freeze([
  'var(--zm-cyan)',   // 0 — blue
  'var(--zm-positive)',   // 1 — emerald
  'var(--zm-violet)',  // 2 — violet
  'var(--zm-warning)',   // 3 — amber
  'var(--zm-negative)',  // 4 — rose
  'rgba(45,212,191,1)',   // 5 — teal
  'rgba(249,115,22,1)',   // 6 — orange
  'rgba(99,179,237,1)',   // 7 — sky
  'var(--zm-violet)',  // 8 — purple-light
  'var(--zm-positive)',  // 9 — green-light
  'rgba(255,68,136,0.70)',  // 10 — pink-light
  'rgba(147,197,253,1)',  // 11 — blue-light
  'rgba(134,239,172,1)',  // 12 — green
  'rgba(253,224,71,1)',   // 13 — yellow
  'rgba(216,180,254,1)',  // 14 — purple-pale
]);

function getCatColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'var(--zm-text-secondary)';
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MiniMetricProps {
  label:   string;
  value:   string;
  change?: number;
  icon:    React.ReactNode;
  accent:  string;
}

const MiniMetric = memo(({ label, value, change, icon, accent }: MiniMetricProps) => {
  const changeColor = change != null
    ? change >= 0 ? 'var(--zm-positive)' : 'var(--zm-negative)'
    : undefined;

  return (
    <div style={{
      flex:            1,
      borderRadius:    '8px',
      padding:         '12px',
      display:         'flex',
      flexDirection:   'column',
      gap:             '4px',
      background:      'var(--zm-card-bg)',
      border:          '1px solid var(--zm-card-border)',
      willChange:      'transform',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: accent }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--zm-text-faint)' }}>
          {label}
        </span>
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
        {value}
      </span>
      {change != null && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: changeColor }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}% (24h)
        </span>
      )}
    </div>
  );
});
MiniMetric.displayName = 'MiniMetric';

// ─── Chain TVL Chart (SVG) ────────────────────────────────────────────────────

interface ChainChartProps {
  chains: Array<{ name: string; tvl: number }>;
}

const ChainChart = memo(({ chains }: ChainChartProps) => {
  const top = useMemo(() => chains.slice(0, 15), [chains]);
  const max = useMemo(() => Math.max(...top.map(c => c.tvl), 1), [top]);

  const W = 580; const H = 180; const BAR_H = 22; const GAP = 4; const LABEL_W = 90;

  return (
    <svg
      width="100%"
      viewBox={'0 0 ' + W + ' ' + (top.length * (BAR_H + GAP) + 20)}
      style={{ overflow: 'visible', willChange: 'transform' }}
    >
      {top.map((chain, i) => {
        const y     = i * (BAR_H + GAP);
        const barW  = ((chain.tvl / max) * (W - LABEL_W - 80));
        const color = CHAIN_PALETTE[i % CHAIN_PALETTE.length];

        return (
          <g key={chain.name}>
            <text
              x={LABEL_W - 6}
              y={y + BAR_H / 2 + 4}
              textAnchor="end"
              fontSize="10"
              fontFamily="'Space Mono', monospace"
              fill="rgba(148,163,184,0.8)"
            >
              {chain.name.length > 10 ? chain.name.slice(0, 9) + '…' : chain.name}
            </text>
            <rect
              x={LABEL_W}
              y={y}
              width={barW}
              height={BAR_H}
              rx={4}
              fill={color}
              opacity={0.75}
            />
            <text
              x={LABEL_W + barW + 6}
              y={y + BAR_H / 2 + 4}
              fontSize="10"
              fontFamily="'Space Mono', monospace"
              fill="rgba(138,138,158,0.70)"
            >
              {formatCompact(chain.tvl)}
            </text>
          </g>
        );
      })}
    </svg>
  );
});
ChainChart.displayName = 'ChainChart';

// ─── Protocol Row ─────────────────────────────────────────────────────────────

interface ProtocolRowProps {
  p:    DLProtocol;
  rank: number;
}

const ProtocolRow = memo(({ p, rank }: ProtocolRowProps) => {
  const c1d = p.change1d >= 0 ? 'var(--zm-positive)' : 'var(--zm-negative)';
  const c7d = p.change7d >= 0 ? 'var(--zm-positive)' : 'var(--zm-negative)';
  const cat = getCatColor(p.category);

  return (
    <div
      style={{
        display:       'flex',
        alignItems:    'center',
        padding:       '0 16px',
        gap:           '12px',
        height:        '48px',
        borderBottom:  '1px solid rgba(0,238,255,0.05)',
        transition:    'background 120ms',
        willChange:    'transform',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,238,255,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: '28px', flexShrink: 0, textAlign: 'right', color: 'var(--zm-text-faint)' }}>
        {rank}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '176px', flexShrink: 0, minWidth: 0 }}>
        {p.logo
          ? <img src={'/api/img?u=' + encodeURIComponent(p.logo)} alt="" crossOrigin="anonymous" style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }} />
          : (
            <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cat + '33', fontSize: 9, color: cat, fontFamily: "'JetBrains Mono', monospace" }}>
              {p.name.slice(0, 2).toUpperCase()}
            </div>
          )
        }
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--zm-text-primary)' }}>
            {p.name}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--zm-text-faint)' }}>
            {p.chains.slice(0, 2).join(', ')}
          </span>
        </div>
      </div>

      <span style={{ padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono-ui)', fontSize: '10px', flexShrink: 0, background: cat + '22', color: cat }}>
        {p.category}
      </span>

      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: '96px', flexShrink: 0, textAlign: 'right', marginLeft: 'auto', color: 'var(--zm-text-primary)' }}>
        {formatCompact(p.tvl)}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: '72px', flexShrink: 0, textAlign: 'right', color: c1d }}>
        {p.change1d >= 0 ? '+' : ''}{p.change1d.toFixed(2)}%
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: '72px', flexShrink: 0, textAlign: 'right', color: c7d }}>
        {p.change7d >= 0 ? '+' : ''}{p.change7d.toFixed(2)}%
      </span>
    </div>
  );
});
ProtocolRow.displayName = 'ProtocolRow';

// ─── Yield Row ────────────────────────────────────────────────────────────────

const YieldRow = memo(({ y, rank }: { y: DLYield; rank: number }) => {
  const apyColor = y.apy > 20 ? 'var(--zm-warning)' : y.apy > 5 ? 'var(--zm-positive)' : 'var(--zm-text-secondary)';
  const ilColor  = y.ilRisk === 'YES' ? 'var(--zm-negative)' : 'var(--zm-positive)';

  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        padding:      '0 16px',
        gap:          '12px',
        height:       '44px',
        borderBottom: '1px solid rgba(0,238,255,0.05)',
        transition:   'background 120ms',
        willChange:   'transform',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,238,255,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: '28px', flexShrink: 0, textAlign: 'right', color: 'var(--zm-text-faint)' }}>
        {rank}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', width: '144px', flexShrink: 0, minWidth: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--zm-text-primary)' }}>
          {y.symbol}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--zm-text-faint)' }}>
          {y.project + ' · ' + y.chain}
        </span>
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700, width: '80px', textAlign: 'right', flexShrink: 0, marginLeft: 'auto', color: apyColor }}>
        {y.apy.toFixed(2)}%
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', width: '96px', textAlign: 'right', flexShrink: 0, color: 'var(--zm-text-secondary)' }}>
        {formatCompact(y.tvlUsd)}
      </span>
      <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', width: '40px', textAlign: 'center', flexShrink: 0, color: ilColor }}>
        {y.ilRisk === 'YES' ? '⚠ IL' : '✓'}
      </span>
    </div>
  );
});
YieldRow.displayName = 'YieldRow';

// ─── Tab Button ───────────────────────────────────────────────────────────────

interface TabBtnProps {
  label:   string;
  active:  boolean;
  onClick: () => void;
  count?:  number;
}

const TabBtn = memo(({ label, active, onClick, count }: TabBtnProps) => (
  <button
    onClick={onClick}
    aria-label={(active ? 'Current tab: ' : 'Switch to ') + label + ' tab'}
    aria-selected={active}
    role="tab"
    style={{
      padding:      '6px 12px',
      borderRadius: '4px',
      fontFamily:   'var(--font-mono-ui)',
      fontSize:     '12px',
      transition:   'all 0.15s',
      cursor:       'pointer',
      background:   active ? 'rgba(0,238,255,0.15)' : 'transparent',
      color:        active ? 'var(--zm-cyan)' : 'var(--zm-text-faint)',
      border:       active ? '1px solid rgba(34,211,238,0.3)' : '1px solid transparent',
      willChange:   'transform',
    }}
  >
    {label}{count != null ? ' (' + count + ')' : ''}
  </button>
));
TabBtn.displayName = 'TabBtn';

// ─── Defi Page ────────────────────────────────────────────────────────────────

type SortKey = 'tvl' | 'change1d' | 'change7d' | 'name';
type TabType  = 'protocols' | 'chains' | 'yields';

const Defi = memo(() => {
  const data       = useDefiLlama();
  const { isMobile, isTablet } = useBreakpoint();
  const [query,    setQuery]    = useState('');
  const [category, setCategory] = useState('All');
  const [sortKey,  setSortKey]  = useState<SortKey>('tvl');
  const [sortAsc,  setSortAsc]  = useState(false);
  const [tab,      setTab]      = useState<TabType>('protocols');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleSearch   = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setQuery(e.target.value); }, []);
  const handleCategory = useCallback((cat: string) => setCategory(cat), []);
  const handleTab      = useCallback((t: TabType) => setTab(t), []);

  const handleSort = useCallback((k: SortKey) => {
    setSortKey(prev => {
      if (prev === k) setSortAsc(a => !a);
      else setSortAsc(false);
      return k;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.protocols
      .filter(p => {
        const matchQ   = !q || p.name.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q);
        const matchCat = category === 'All' || p.category === category;
        return matchQ && matchCat;
      })
      .sort((a, b) => {
        const mul = sortAsc ? 1 : -1;
        if (sortKey === 'name') return mul * a.name.localeCompare(b.name);
        return mul * (a[sortKey] - b[sortKey]);
      });
  }, [data.protocols, query, category, sortKey, sortAsc]);

  const totalTvlStr = useMemo(() => formatCompact(data.global?.totalTvl ?? 0), [data.global]);

  const sortIcon = useCallback((k: SortKey) => {
    if (sortKey !== k) return null;
    return sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
  }, [sortKey, sortAsc]);

  const catCounts = useMemo(() => {
    const map: Record<string, number> = {};
    data.protocols.forEach(p => { map[p.category] = (map[p.category] ?? 0) + 1; });
    return map;
  }, [data.protocols]);

  const TBLHDR = Object.freeze({
    display:         'flex',
    alignItems:      'center',
    padding:         '0 16px',
    gap:             '12px',
    height:          '36px',
    background:      'var(--zm-topbar-bg)',
    borderBottom:    '1px solid var(--zm-card-border)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono-ui)', margin: 0, background: 'linear-gradient(90deg, var(--zm-accent) 0%, var(--zm-violet) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            DeFi Intelligence
          </h1>
          <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.1em', background: 'var(--zm-positive-bg)', color: 'var(--zm-positive)' }}>
            DEFI LLAMA
          </span>
          <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,238,255,0.08)', color: 'rgba(0,238,255,0.60)' }}>
            100% FREE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {data.lastUpdate > 0 && (
            <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', color: 'var(--zm-text-faint)' }}>
              {'Updated ' + new Date(data.lastUpdate).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={data.refetch}
            aria-label="Refresh DeFi data"
            style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)' }}
          >
            {data.loading
              ? <Loader2 size={13} style={{ color: 'rgba(0,238,255,0.70)', animation: 'spin 1s linear infinite' }} />
              : <RefreshCw size={13} style={{ color: 'rgba(0,238,255,0.70)' }} />
            }
          </button>
        </div>
      </div>

      {/* Global Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <MiniMetric label="Total DeFi TVL" value={totalTvlStr} change={data.global?.change1d} icon={<Layers size={13} />} accent="var(--zm-cyan)" />
        <MiniMetric label="Protocols"      value={data.protocols.length.toString()}             icon={<BarChart3 size={13} />} accent="var(--zm-violet)" />
        <MiniMetric label="Chains"         value={data.chains.length.toString()}               icon={<Zap size={13} />}      accent="var(--zm-positive)" />
        <MiniMetric label="Yield Pools"    value={data.yields.length.toString()}               icon={<Percent size={13} />}  accent="var(--zm-warning)" />
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TabBtn label="Protocols" active={tab === 'protocols'} onClick={() => handleTab('protocols')} count={filtered.length} />
        <TabBtn label="Chains"    active={tab === 'chains'}    onClick={() => handleTab('chains')}    count={data.chains.length} />
        <TabBtn label="Yields"    active={tab === 'yields'}    onClick={() => handleTab('yields')}    count={data.yields.length} />
      </div>

      {/* Protocols */}
      {tab === 'protocols' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', minWidth: '200px' }}>
              <Search size={12} style={{ color: 'var(--zm-text-faint)' }} />
              <input
                type="text"
                placeholder="Search protocols..."
                value={query}
                onChange={handleSearch}
                aria-label="Search protocols"
                style={{ background: 'transparent', outline: 'none', fontFamily: 'var(--font-mono-ui)', fontSize: '12px', flex: 1, border: 'none', color: 'var(--zm-text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategory(cat)}
                  aria-label={'Filter by ' + cat + ' category'}
                  aria-pressed={category === cat}
                  style={{
                    padding:      '2px 8px',
                    borderRadius: '4px',
                    fontFamily:   'var(--font-mono-ui)',
                    fontSize:     '10px',
                    transition:   'all 0.15s',
                    cursor:       'pointer',
                    background:   category === cat ? getCatColor(cat) + '22' : 'transparent',
                    color:        category === cat ? getCatColor(cat) : 'var(--zm-text-faint)',
                    border:       category === cat ? '1px solid ' + getCatColor(cat) + '55' : '1px solid rgba(0,238,255,0.08)',
                    willChange:   'transform',
                  }}
                >
                  {cat}{cat !== 'All' && catCounts[cat] ? ' ' + catCounts[cat] : ''}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={TBLHDR}>
              <span style={{ width: '28px', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', width: '176px', flexShrink: 0, color: 'var(--zm-text-faint)' }}>Protocol</span>
              <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', flexShrink: 0, color: 'var(--zm-text-faint)' }}>Category</span>
              <button onClick={() => handleSort('tvl')} aria-label={'Sort by TVL' + (sortKey === 'tvl' ? (sortAsc ? ', ascending' : ', descending') : '')} style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', width: '96px', textAlign: 'right', marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: sortKey === 'tvl' ? 'var(--zm-cyan)' : 'var(--zm-text-faint)' }}>TVL {sortIcon('tvl')}</button>
              <button onClick={() => handleSort('change1d')} aria-label={'Sort by 24h change' + (sortKey === 'change1d' ? (sortAsc ? ', ascending' : ', descending') : '')} style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', width: '72px', textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: sortKey === 'change1d' ? 'var(--zm-cyan)' : 'var(--zm-text-faint)' }}>24h {sortIcon('change1d')}</button>
              <button onClick={() => handleSort('change7d')} aria-label={'Sort by 7d change' + (sortKey === 'change7d' ? (sortAsc ? ', ascending' : ', descending') : '')} style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', width: '72px', textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: sortKey === 'change7d' ? 'var(--zm-cyan)' : 'var(--zm-text-faint)' }}>7d {sortIcon('change7d')}</button>
            </div>
            {data.loading && filtered.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                <Loader2 size={24} style={{ color: 'rgba(0,238,255,0.50)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
                <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '12px', color: 'var(--zm-text-faint)' }}>No protocols found</span>
              </div>
            ) : (
              <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
                {filtered.slice(0, 60).map((p, i) => <ProtocolRow key={p.id} p={p} rank={i + 1} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chains */}
      {tab === 'chains' && (
        <div style={{ padding: '20px', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 size={14} style={{ color: 'var(--zm-positive)' }} />
            <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '12px', fontWeight: 600, color: 'var(--zm-text-primary)' }}>
              TVL by Chain (Top 15)
            </span>
          </div>
          {data.loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <Loader2 size={24} style={{ color: 'rgba(0,238,255,0.50)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <ChainChart chains={data.chains} />
          )}
        </div>
      )}

      {/* Yields */}
      {tab === 'yields' && (
        <div style={{ background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={TBLHDR}>
            <span style={{ width: '28px', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', width: '144px', flexShrink: 0, color: 'var(--zm-text-faint)' }}>Pool</span>
            <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', marginLeft: 'auto', width: '80px', textAlign: 'right', flexShrink: 0, color: 'var(--zm-text-faint)' }}>APY</span>
            <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', width: '96px', textAlign: 'right', flexShrink: 0, color: 'var(--zm-text-faint)' }}>TVL</span>
            <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '10px', width: '40px', textAlign: 'center', flexShrink: 0, color: 'var(--zm-text-faint)' }}>IL</span>
          </div>
          {data.loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <Loader2 size={24} style={{ color: 'rgba(0,238,255,0.50)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
              {data.yields.slice(0, 50).map((y, i) => <YieldRow key={y.pool + i} y={y} rank={i + 1} />)}
            </div>
          )}
        </div>
      )}

    </div>
  );
});
Defi.displayName = 'Defi';

export default Defi;
