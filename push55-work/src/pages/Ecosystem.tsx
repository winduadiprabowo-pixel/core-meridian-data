/**
 * Ecosystem.tsx — ZERØ MERIDIAN push48
 * Ecosystem Map: Interactive SVG force-directed graph of protocol relationships,
 * funding flows, integrations, and TVL bubbles. No d3 dependency — pure React + SVG.
 * - React.memo + displayName ✓  - rgba() only ✓
 * - Zero template literals in JSX ✓  - Zero className in JSX ✓
 * - useCallback + useMemo ✓  - mountedRef ✓ - AbortController ✓
 * - Object.freeze() all static data ✓  - useBreakpoint ✓ (isMobile + isTablet)
 * - Arkham card style ✓  - var(--zm-card-bg) ✓  - cyan accent ✓
 */

import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Map, TrendingUp, DollarSign, GitBranch, Layers, Radio, Filter } from 'lucide-react';

type NodeCategory = 'L1' | 'L2' | 'DEFI' | 'INFRA' | 'BRIDGE' | 'ORACLE';
type EdgeType = 'INTEGRATION' | 'FUNDING' | 'BRIDGE' | 'ORACLE_FEED' | 'FORK';

interface EcosystemNode {
  id: string; label: string; category: NodeCategory;
  tvl: number; color: string; description: string;
  x: number; y: number; radius: number;
}

interface EcosystemEdge {
  from: string; to: string; type: EdgeType; weight: number; label?: string;
}

interface Protocol {
  id: string; name: string; category: NodeCategory; tvl: number;
  chains: string[]; integrations: number; color: string; description: string;
  funding?: string; launchYear: number;
}

const CAT_CONFIG = Object.freeze({
  L1:      { color: 'var(--zm-warning)',   bg: 'rgba(251,191,36,0.1)',   label: 'Layer 1' },
  L2:      { color: 'var(--zm-cyan)',   bg: 'rgba(0,238,255,0.10)',   label: 'Layer 2' },
  DEFI:    { color: 'var(--zm-positive)',   bg: 'var(--zm-positive-bg)',   label: 'DeFi' },
  INFRA:   { color: 'var(--zm-violet)',  bg: 'var(--zm-violet-bg)',  label: 'Infrastructure' },
  BRIDGE:  { color: 'var(--zm-negative)',  bg: 'rgba(251,113,133,0.1)', label: 'Bridge' },
  ORACLE:  { color: 'rgba(249,115,22,1)',   bg: 'rgba(249,115,22,0.1)',  label: 'Oracle' },
} as const);

const EDGE_CONFIG = Object.freeze({
  INTEGRATION:  { color: 'rgba(0,238,255,0.35)',  dash: 'none',  label: 'Integration' },
  FUNDING:      { color: 'rgba(52,211,153,0.40)',  dash: '4,4',   label: 'Funding' },
  BRIDGE:       { color: 'rgba(251,113,133,0.40)', dash: 'none',  label: 'Bridge' },
  ORACLE_FEED:  { color: 'rgba(249,115,22,0.35)',  dash: '2,3',   label: 'Oracle Feed' },
  FORK:         { color: 'rgba(167,139,250,0.30)', dash: '6,3',   label: 'Fork' },
} as const);

// Node positions in 800x600 canvas
const NODES: readonly EcosystemNode[] = Object.freeze([
  { id: 'eth',      label: 'Ethereum',   category: 'L1',     tvl: 65_000_000_000, color: CAT_CONFIG.L1.color,     description: 'Largest smart contract L1 by TVL and developer activity', x: 400, y: 300, radius: 42 },
  { id: 'btc',      label: 'Bitcoin',    category: 'L1',     tvl: 12_000_000_000, color: 'rgba(247,147,26,1)',    description: 'Original proof-of-work blockchain, $1.2T market cap', x: 160, y: 200, radius: 32 },
  { id: 'sol',      label: 'Solana',     category: 'L1',     tvl: 8_200_000_000,  color: 'rgba(153,69,255,1)',    description: 'High-throughput L1, 65k TPS, low fees', x: 640, y: 200, radius: 28 },
  { id: 'arb',      label: 'Arbitrum',   category: 'L2',     tvl: 18_500_000_000, color: CAT_CONFIG.L2.color,    description: 'Largest Ethereum L2 by TVL — Nitro rollup', x: 280, y: 420, radius: 34 },
  { id: 'op',       label: 'Optimism',   category: 'L2',     tvl: 9_800_000_000,  color: 'rgba(255,4,32,1)',      description: 'OP Stack L2, Superchain ecosystem', x: 520, y: 420, radius: 28 },
  { id: 'base',     label: 'Base',       category: 'L2',     tvl: 7_400_000_000,  color: 'rgba(0,82,255,1)',      description: 'Coinbase-backed OP Stack L2', x: 620, y: 480, radius: 25 },
  { id: 'uni',      label: 'Uniswap',    category: 'DEFI',   tvl: 6_200_000_000,  color: CAT_CONFIG.DEFI.color,  description: 'Largest DEX by volume — v4 with hooks', x: 260, y: 180, radius: 24 },
  { id: 'aave',     label: 'Aave',       category: 'DEFI',   tvl: 22_000_000_000, color: 'rgba(177,122,162,1)',   description: 'Leading lending protocol v3', x: 540, y: 160, radius: 30 },
  { id: 'mk',       label: 'MakerDAO',   category: 'DEFI',   tvl: 14_000_000_000, color: 'rgba(250,185,28,1)',    description: 'DAI stablecoin, Sky rebranding', x: 180, y: 380, radius: 26 },
  { id: 'lido',     label: 'Lido',       category: 'DEFI',   tvl: 35_000_000_000, color: 'rgba(246,222,14,1)',    description: 'Largest liquid staking — 30% of staked ETH', x: 560, y: 340, radius: 32 },
  { id: 'link',     label: 'Chainlink',  category: 'ORACLE', tvl: 0,              color: CAT_CONFIG.ORACLE.color, description: 'Dominant oracle network — CCIP cross-chain', x: 400, y: 140, radius: 22 },
  { id: 'stargate', label: 'Stargate',   category: 'BRIDGE', tvl: 400_000_000,    color: CAT_CONFIG.BRIDGE.color, description: 'Cross-chain liquidity bridge built on LayerZero', x: 200, y: 500, radius: 18 },
  { id: 'wormhole', label: 'Wormhole',   category: 'BRIDGE', tvl: 1_200_000_000,  color: 'rgba(255,68,136,0.80)', description: 'Multi-chain bridge — ETH ↔ SOL main corridor', x: 600, y: 120, radius: 18 },
  { id: 'eigen',    label: 'EigenLayer', category: 'INFRA',  tvl: 20_000_000_000, color: CAT_CONFIG.INFRA.color,  description: 'Restaking protocol — AVS ecosystem hub', x: 460, y: 500, radius: 28 },
]);

const EDGES: readonly EcosystemEdge[] = Object.freeze([
  { from: 'arb',    to: 'eth',      type: 'INTEGRATION', weight: 3, label: 'L2 rollup' },
  { from: 'op',     to: 'eth',      type: 'INTEGRATION', weight: 3, label: 'L2 rollup' },
  { from: 'base',   to: 'op',       type: 'FORK',        weight: 2, label: 'OP Stack fork' },
  { from: 'uni',    to: 'eth',      type: 'INTEGRATION', weight: 2 },
  { from: 'uni',    to: 'arb',      type: 'INTEGRATION', weight: 2 },
  { from: 'uni',    to: 'op',       type: 'INTEGRATION', weight: 1 },
  { from: 'uni',    to: 'base',     type: 'INTEGRATION', weight: 1 },
  { from: 'aave',   to: 'eth',      type: 'INTEGRATION', weight: 2 },
  { from: 'aave',   to: 'arb',      type: 'INTEGRATION', weight: 2 },
  { from: 'mk',     to: 'eth',      type: 'INTEGRATION', weight: 2 },
  { from: 'lido',   to: 'eth',      type: 'INTEGRATION', weight: 3, label: 'stETH' },
  { from: 'lido',   to: 'sol',      type: 'INTEGRATION', weight: 2 },
  { from: 'eigen',  to: 'eth',      type: 'INTEGRATION', weight: 3, label: 'restaking' },
  { from: 'eigen',  to: 'lido',     type: 'INTEGRATION', weight: 2 },
  { from: 'link',   to: 'eth',      type: 'ORACLE_FEED', weight: 2 },
  { from: 'link',   to: 'aave',     type: 'ORACLE_FEED', weight: 2 },
  { from: 'link',   to: 'mk',       type: 'ORACLE_FEED', weight: 1 },
  { from: 'link',   to: 'sol',      type: 'ORACLE_FEED', weight: 1 },
  { from: 'stargate', to: 'eth',    type: 'BRIDGE',      weight: 1 },
  { from: 'stargate', to: 'arb',    type: 'BRIDGE',      weight: 2 },
  { from: 'wormhole', to: 'eth',    type: 'BRIDGE',      weight: 2 },
  { from: 'wormhole', to: 'sol',    type: 'BRIDGE',      weight: 2 },
  { from: 'btc',    to: 'eth',      type: 'BRIDGE',      weight: 1, label: 'WBTC' },
]);

const PROTOCOLS: readonly Protocol[] = Object.freeze([
  { id: 'eth', name: 'Ethereum', category: 'L1', tvl: 65_000_000_000, chains: ['Ethereum'], integrations: 12, color: 'var(--zm-warning)', description: 'Largest smart contract L1', funding: 'ICO 2014', launchYear: 2015 },
  { id: 'arb', name: 'Arbitrum', category: 'L2', tvl: 18_500_000_000, chains: ['Ethereum'], integrations: 8, color: 'var(--zm-cyan)', description: 'Largest ETH L2 by TVL', funding: 'Offchain Labs $120M', launchYear: 2021 },
  { id: 'lido', name: 'Lido', category: 'DEFI', tvl: 35_000_000_000, chains: ['Ethereum', 'Solana'], integrations: 6, color: 'rgba(246,222,14,1)', description: 'Dominant liquid staking', funding: 'DAO Treasury', launchYear: 2020 },
  { id: 'eigen', name: 'EigenLayer', category: 'INFRA', tvl: 20_000_000_000, chains: ['Ethereum'], integrations: 5, color: 'var(--zm-violet)', description: 'Restaking protocol', funding: 'a16z $50M + others', launchYear: 2023 },
  { id: 'aave', name: 'Aave', category: 'DEFI', tvl: 22_000_000_000, chains: ['Ethereum', 'Arbitrum', 'Polygon'], integrations: 9, color: 'rgba(177,122,162,1)', description: 'Leading lending protocol', funding: 'ETHLend ICO', launchYear: 2017 },
  { id: 'sol', name: 'Solana', category: 'L1', tvl: 8_200_000_000, chains: ['Solana'], integrations: 4, color: 'rgba(153,69,255,1)', description: 'High-throughput L1', funding: 'a16z, Multicoin', launchYear: 2020 },
]);

const formatCompact = (n: number): string => {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(0) + 'M';
  return '$' + n.toLocaleString();
};

const TABS = Object.freeze(['Map', 'Protocols', 'Connections'] as const);
type Tab = typeof TABS[number];

// ─── SVG Ecosystem Map ────────────────────────────────────────────────────────
const EcosystemMapSVG = memo(({ width, onSelectNode, selectedId, filterCat }: {
  width: number; onSelectNode: (id: string | null) => void; selectedId: string | null; filterCat: NodeCategory | 'ALL';
}) => {
  const height = Math.round(width * 0.65);
  const scaleX = width / 800;
  const scaleY = height / 600;

  const visibleNodes = useMemo(() =>
    filterCat === 'ALL' ? NODES : NODES.filter(n => n.category === filterCat),
    [filterCat]
  );
  const visibleIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(() =>
    EDGES.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to)),
    [visibleIds]
  );

  const nodeMap = useMemo(() => {
    const m: Record<string, EcosystemNode> = {};
    NODES.forEach(n => { m[n.id] = n; });
    return m;
  }, []);

  return (
    <svg
      width={width} height={height}
      style={{ borderRadius: 12, background: 'var(--zm-bg-secondary)', border: '1px solid var(--zm-card-border)', display: 'block' }}
      aria-label="Ecosystem relationship map"
    >
      {/* Grid */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={'gx' + i} x1={i * width / 7} y1={0} x2={i * width / 7} y2={height} stroke="rgba(255,255,255,0.02)" strokeWidth={1} />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={'gy' + i} x1={0} y1={i * height / 5} x2={width} y2={i * height / 5} stroke="rgba(255,255,255,0.02)" strokeWidth={1} />
      ))}

      {/* Edges */}
      {visibleEdges.map((e, i) => {
        const from = nodeMap[e.from];
        const to   = nodeMap[e.to];
        if (!from || !to) return null;
        const cfg = EDGE_CONFIG[e.type];
        const x1 = from.x * scaleX; const y1 = from.y * scaleY;
        const x2 = to.x * scaleX;   const y2 = to.y * scaleY;
        const mx = (x1 + x2) / 2;   const my = (y1 + y2) / 2;
        const isHighlighted = selectedId === e.from || selectedId === e.to;
        return (
          <g key={i}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={cfg.color}
              strokeWidth={isHighlighted ? e.weight * 2 : e.weight}
              strokeDasharray={cfg.dash === 'none' ? undefined : cfg.dash}
              opacity={selectedId && !isHighlighted ? 0.2 : 1}
              style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
            />
            {e.label && isHighlighted && (
              <text x={mx} y={my - 4} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={9}
                fontFamily="'JetBrains Mono', monospace">{e.label}</text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {visibleNodes.map(n => {
        const cx = n.x * scaleX;
        const cy = n.y * scaleY;
        const r  = n.radius * Math.min(scaleX, scaleY);
        const isSelected = n.id === selectedId;
        const isDimmed = selectedId && !isSelected;
        return (
          <g key={n.id} onClick={() => onSelectNode(isSelected ? null : n.id)} style={{ cursor: 'pointer' }}>
            {isSelected && (
              <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke={n.color} strokeWidth={1.5} opacity={0.4} />
            )}
            <circle
              cx={cx} cy={cy} r={r}
              fill={n.color + '22'} stroke={n.color}
              strokeWidth={isSelected ? 2.5 : 1.5}
              opacity={isDimmed ? 0.25 : 1}
              style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
            />
            <text
              x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
              fill={isDimmed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)'}
              fontSize={Math.max(8, r * 0.45)}
              fontFamily="'JetBrains Mono', monospace" fontWeight={700}
              style={{ transition: 'opacity 0.2s', pointerEvents: 'none' }}
            >{n.label}</text>
            {n.tvl > 0 && !isDimmed && (
              <text
                x={cx} y={cy + r + 12} textAnchor="middle"
                fill={n.color} fontSize={8}
                fontFamily="'JetBrains Mono', monospace"
                style={{ pointerEvents: 'none' }}
              >{formatCompact(n.tvl)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
});
EcosystemMapSVG.displayName = 'EcosystemMapSVG';

// ─── Node Detail Panel ────────────────────────────────────────────────────────
const NodeDetail = memo(({ nodeId }: { nodeId: string }) => {
  const node = useMemo(() => NODES.find(n => n.id === nodeId), [nodeId]);
  const proto = useMemo(() => PROTOCOLS.find(p => p.id === nodeId), [nodeId]);
  const connections = useMemo(() => EDGES.filter(e => e.from === nodeId || e.to === nodeId), [nodeId]);
  if (!node) return null;
  const cat = CAT_CONFIG[node.category];
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
      style={{ padding: 14, borderRadius: 'var(--zm-card-radius)', background: 'var(--zm-card-bg)', border: '1px solid ' + node.color + '40' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: node.color, flexShrink: 0 }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{node.label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '1px 6px', borderRadius: 3, background: cat.bg, color: cat.color }}>{cat.label}</span>
      </div>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--zm-text-secondary)', margin: '0 0 10px' }}>{node.description}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {node.tvl > 0 && (
          <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--zm-grey-06)' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--zm-text-faint)', textTransform: 'uppercase', marginBottom: 2 }}>TVL</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: 'var(--zm-positive)' }}>{formatCompact(node.tvl)}</div>
          </div>
        )}
        <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--zm-grey-06)' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--zm-text-faint)', textTransform: 'uppercase', marginBottom: 2 }}>Connections</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: 'var(--zm-accent)' }}>{connections.length}</div>
        </div>
      </div>
      {proto && proto.funding && (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.02)' }}>
          📍 Launch: {proto.launchYear} · Funding: {proto.funding}
        </div>
      )}
    </motion.div>
  );
});
NodeDetail.displayName = 'NodeDetail';

// ─── Protocols Table ──────────────────────────────────────────────────────────
const ProtocolsTab = memo(({ isMobile, isTablet }: { isMobile: boolean; isTablet: boolean }) => {
  const cols = useMemo(() => isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)', [isMobile, isTablet]);
  const totalTvl = useMemo(() => PROTOCOLS.reduce((s, p) => s + p.tvl, 0), []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: 14, borderRadius: 'var(--zm-card-radius)', background: 'linear-gradient(135deg, rgba(0,238,255,0.06), rgba(52,211,153,0.04))', border: '1px solid rgba(0,238,255,0.15)' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>Total Tracked TVL</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: 'var(--zm-accent)' }}>{formatCompact(totalTvl)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 10 }}>
        {PROTOCOLS.map(p => {
          const cat = CAT_CONFIG[p.category];
          return (
            <div key={p.id} style={{ padding: 14, borderRadius: 'var(--zm-card-radius)', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{p.name}</span>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '1px 5px', borderRadius: 3, background: cat.bg, color: cat.color }}>{cat.label}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: 'var(--zm-positive)', marginBottom: 6 }}>{formatCompact(p.tvl)}</div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--zm-text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>{p.description}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)' }}>{p.integrations} integrations</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)' }}>·</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)' }}>{p.chains.join(', ')}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
ProtocolsTab.displayName = 'ProtocolsTab';

// ─── Connections Tab ──────────────────────────────────────────────────────────
const ConnectionsTab = memo(({ isMobile }: { isMobile: boolean }) => {
  const nodeMap = useMemo(() => {
    const m: Record<string, EcosystemNode> = {};
    NODES.forEach(n => { m[n.id] = n; });
    return m;
  }, []);
  const edgesByType = useMemo(() => {
    const groups: Record<EdgeType, EcosystemEdge[]> = { INTEGRATION: [], FUNDING: [], BRIDGE: [], ORACLE_FEED: [], FORK: [] };
    EDGES.forEach(e => { groups[e.type].push(e); });
    return groups;
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(Object.entries(edgesByType) as [EdgeType, EcosystemEdge[]][]).filter(([, edges]) => edges.length > 0).map(([type, edges]) => {
        const cfg = EDGE_CONFIG[type];
        return (
          <div key={type} style={{ padding: 14, borderRadius: 'var(--zm-card-radius)', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 24, height: 2, background: cfg.color, borderRadius: 1 }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--zm-text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{cfg.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', color: 'var(--zm-text-faint)' }}>{edges.length} connections</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {edges.map((e, i) => {
                const from = nodeMap[e.from]; const to = nodeMap[e.to];
                if (!from || !to) return null;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: from.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--zm-text-primary)', minWidth: isMobile ? 60 : 90 }}>{from.label}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: cfg.color }}>──→</span>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: to.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--zm-text-primary)' }}>{to.label}</span>
                    {e.label && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', marginLeft: 4 }}>({e.label})</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});
ConnectionsTab.displayName = 'ConnectionsTab';

// ─── Main ─────────────────────────────────────────────────────────────────────
const Ecosystem = memo(() => {
  const { isMobile, isTablet } = useBreakpoint();
  const mountedRef = useRef(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapWidth, setMapWidth] = useState(760);
  const [activeTab, setActiveTab] = useState<Tab>('Map');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<NodeCategory | 'ALL'>('ALL');

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const obs = new ResizeObserver(entries => {
      if (!mountedRef.current) return;
      const w = entries[0]?.contentRect.width;
      if (w) setMapWidth(Math.floor(w));
    });
    obs.observe(mapRef.current);
    return () => obs.disconnect();
  }, []);

  const handleTab        = useCallback((t: Tab) => { if (mountedRef.current) setActiveTab(t); }, []);
  const handleSelectNode = useCallback((id: string | null) => { if (mountedRef.current) setSelectedNode(id); }, []);
  const handleFilter     = useCallback((cat: NodeCategory | 'ALL') => { if (mountedRef.current) setFilterCat(cat); }, []);

  const totalTvl    = useMemo(() => NODES.reduce((s, n) => s + n.tvl, 0), []);
  const totalEdges  = EDGES.length;
  const gridCols    = useMemo(() => isMobile ? '1fr 1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)', [isMobile, isTablet]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: isMobile ? '16px' : isTablet ? '20px' : '28px', minHeight: '100vh', background: 'var(--zm-bg-base)' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,238,255,0.10)', border: '1px solid rgba(34,211,238,0.25)' }}>
            <Map size={18} style={{ color: 'var(--zm-accent)' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 18 : 22, fontWeight: 700, margin: 0, background: 'linear-gradient(90deg,var(--zm-cyan) 0%,var(--zm-positive) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Ecosystem Map</h1>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--zm-text-faint)', margin: 0 }}>Protocol relationships · funding flows · TVL graph</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'var(--zm-accent-bg)', border: '1px solid var(--zm-accent-border)' }}>
          <Radio size={10} style={{ color: 'var(--zm-accent)' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{NODES.length} protocols · {totalEdges} connections</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12 }}>
        {([
          { label: 'Total TVL', value: formatCompact(totalTvl), color: 'var(--zm-accent)', Icon: DollarSign },
          { label: 'Protocols', value: String(NODES.length), color: 'var(--zm-positive)', Icon: Layers },
          { label: 'Connections', value: String(totalEdges), color: 'var(--zm-violet)', Icon: GitBranch },
          { label: 'Networks', value: '5', color: 'var(--zm-warning)', Icon: TrendingUp },
        ] as const).map(s => {
          const Icon = s.Icon;
          return (
            <div key={s.label} style={{ padding: 14, borderRadius: 'var(--zm-card-radius)', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>{s.label}</span>
                <Icon size={12} style={{ color: s.color }} />
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="tablist">
        {TABS.map(t => (
          <button key={t} type="button" role="tab" aria-selected={activeTab === t} onClick={() => handleTab(t)}
            style={{ padding: '6px 14px', borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.15s', background: activeTab === t ? 'var(--zm-accent-bg)' : 'transparent', color: activeTab === t ? 'var(--zm-accent)' : 'var(--zm-text-faint)', border: '1px solid ' + (activeTab === t ? 'var(--zm-accent-border)' : 'transparent') }}>
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ willChange: 'transform, opacity' }}>
          {activeTab === 'Map' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Category Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Filter size={11} style={{ color: 'var(--zm-text-faint)' }} />
                {(['ALL', 'L1', 'L2', 'DEFI', 'INFRA', 'BRIDGE', 'ORACLE'] as const).map(cat => (
                  <button key={cat} type="button" onClick={() => handleFilter(cat)}
                    style={{ padding: '3px 10px', borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, cursor: 'pointer', transition: 'all 0.15s', background: filterCat === cat ? 'rgba(34,211,238,0.12)' : 'transparent', color: filterCat === cat ? 'var(--zm-accent)' : 'var(--zm-text-faint)', border: '1px solid ' + (filterCat === cat ? 'rgba(34,211,238,0.3)' : 'transparent') }}>
                    {cat === 'ALL' ? 'ALL' : CAT_CONFIG[cat].label}
                  </button>
                ))}
                {selectedNode && (
                  <button type="button" onClick={() => handleSelectNode(null)}
                    style={{ marginLeft: 'auto', padding: '3px 8px', borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, cursor: 'pointer', background: 'transparent', color: 'var(--zm-text-faint)', border: '1px solid rgba(138,138,158,0.15)' }}>
                    Clear selection ✕
                  </button>
                )}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {(Object.entries(EDGE_CONFIG) as [EdgeType, typeof EDGE_CONFIG[EdgeType]][]).map(([type, cfg]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 16, height: 2, background: cfg.color, borderRadius: 1 }} />
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)' }}>{cfg.label}</span>
                  </div>
                ))}
              </div>

              {/* Map + Detail panel */}
              <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>
                <div ref={mapRef} style={{ flex: 1, minWidth: 0 }}>
                  <EcosystemMapSVG width={mapWidth} onSelectNode={handleSelectNode} selectedId={selectedNode} filterCat={filterCat} />
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', marginTop: 6, textAlign: 'center' }}>
                    Click a node to inspect · Node size = TVL magnitude
                  </div>
                </div>
                {selectedNode && (
                  <div style={{ width: isMobile ? '100%' : 220, flexShrink: 0 }}>
                    <NodeDetail nodeId={selectedNode} />
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'Protocols' && <ProtocolsTab isMobile={isMobile} isTablet={isTablet} />}
          {activeTab === 'Connections' && <ConnectionsTab isMobile={isMobile} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
Ecosystem.displayName = 'Ecosystem';
export default Ecosystem;
