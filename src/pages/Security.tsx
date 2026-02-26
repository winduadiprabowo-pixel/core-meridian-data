/**
 * Security.tsx — ZERØ MERIDIAN 2026 push28
 * Full Security Dashboard: Smart Contract Audit Scores, Exploit History,
 * Rug Pull Risk Indicators, TVL Lock Analysis, Team Doxxing Status.
 * - React.memo + displayName ✓
 * - rgba() only, zero hsl() ✓
 * - Zero template literals in JSX ✓
 * - useCallback + useMemo ✓
 * - mountedRef ✓
 * - aria-label + role ✓
 * - will-change: transform ✓
 * - Object.freeze() all static data ✓
 * - useBreakpoint mobile layout ✓
 */

import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Lock,
  Users, FileText, TrendingDown, Eye, Zap, Clock, Search,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

const RISK_CONFIG = Object.freeze({
  CRITICAL: { color: 'rgba(239,68,68,1)',     bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)',  label: '☠ CRITICAL' },
  HIGH:     { color: 'rgba(251,113,133,1)',    bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.22)', label: '⚠ HIGH' },
  MEDIUM:   { color: 'rgba(251,191,36,1)',     bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.22)', label: '◈ MEDIUM' },
  LOW:      { color: 'rgba(96,165,250,1)',     bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.22)', label: '◆ LOW' },
  SAFE:     { color: 'rgba(52,211,153,1)',     bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.22)', label: '✓ SAFE' },
} as const);

interface ProjectSecurity {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  auditScore: number;         // 0-100
  auditFirm: string;
  riskLevel: RiskLevel;
  tvlLocked: boolean;
  tvlLockDays: number;
  teamDoxxed: boolean;
  exploitHistory: number;     // count
  lastExploit?: string;       // date string
  rugPullRisk: number;        // 0-100
  codeVerified: boolean;
  category: string;
  notes: string;
}

const PROJECTS: readonly ProjectSecurity[] = Object.freeze([
  { id: 'uniswap',     name: 'Uniswap V3',       symbol: 'UNI',   chain: 'ETH', auditScore: 96, auditFirm: 'Trail of Bits',  riskLevel: 'SAFE',     tvlLocked: true,  tvlLockDays: 365, teamDoxxed: true,  exploitHistory: 0, rugPullRisk: 2,  codeVerified: true,  category: 'DEX',     notes: 'Industry standard AMM, multiple audits' },
  { id: 'aave',        name: 'Aave V3',           symbol: 'AAVE',  chain: 'ETH', auditScore: 94, auditFirm: 'OpenZeppelin',   riskLevel: 'SAFE',     tvlLocked: true,  tvlLockDays: 730, teamDoxxed: true,  exploitHistory: 0, rugPullRisk: 3,  codeVerified: true,  category: 'Lending', notes: 'Largest lending protocol by TVL' },
  { id: 'compound',    name: 'Compound',          symbol: 'COMP',  chain: 'ETH', auditScore: 91, auditFirm: 'OpenZeppelin',   riskLevel: 'LOW',      tvlLocked: true,  tvlLockDays: 500, teamDoxxed: true,  exploitHistory: 1, lastExploit: '2022-07', rugPullRisk: 5,  codeVerified: true,  category: 'Lending', notes: 'Minor oracle exploit in 2022, patched' },
  { id: 'curve',       name: 'Curve Finance',     symbol: 'CRV',   chain: 'ETH', auditScore: 88, auditFirm: 'MixBytes',       riskLevel: 'LOW',      tvlLocked: true,  tvlLockDays: 400, teamDoxxed: false, exploitHistory: 1, lastExploit: '2023-07', rugPullRisk: 8,  codeVerified: true,  category: 'DEX',     notes: 'Reentrancy exploit 2023, fully recovered' },
  { id: 'sushiswap',   name: 'SushiSwap',         symbol: 'SUSHI', chain: 'ETH', auditScore: 80, auditFirm: 'Quantstamp',     riskLevel: 'MEDIUM',   tvlLocked: false, tvlLockDays: 0,   teamDoxxed: false, exploitHistory: 2, lastExploit: '2021-09', rugPullRisk: 18, codeVerified: true,  category: 'DEX',     notes: 'Founder rug pull 2020, team changed' },
  { id: 'pancakeswap', name: 'PancakeSwap',       symbol: 'CAKE',  chain: 'BSC', auditScore: 83, auditFirm: 'CertiK',         riskLevel: 'LOW',      tvlLocked: true,  tvlLockDays: 180, teamDoxxed: false, exploitHistory: 1, lastExploit: '2022-03', rugPullRisk: 12, codeVerified: true,  category: 'DEX',     notes: 'BSC dominant DEX, centralized risks' },
  { id: 'balancer',    name: 'Balancer',          symbol: 'BAL',   chain: 'ETH', auditScore: 85, auditFirm: 'Trail of Bits',  riskLevel: 'LOW',      tvlLocked: true,  tvlLockDays: 300, teamDoxxed: true,  exploitHistory: 1, lastExploit: '2022-08', rugPullRisk: 7,  codeVerified: true,  category: 'DEX',     notes: 'Flash loan attack 2022, resolved' },
  { id: 'gmx',         name: 'GMX',               symbol: 'GMX',   chain: 'ARB', auditScore: 87, auditFirm: 'ABDK',           riskLevel: 'LOW',      tvlLocked: true,  tvlLockDays: 200, teamDoxxed: false, exploitHistory: 0, rugPullRisk: 10, codeVerified: true,  category: 'Perps',   notes: 'Leading perp DEX, anonymous team' },
  { id: 'dydx',        name: 'dYdX',              symbol: 'DYDX',  chain: 'ETH', auditScore: 90, auditFirm: 'Peckshield',     riskLevel: 'SAFE',     tvlLocked: true,  tvlLockDays: 365, teamDoxxed: true,  exploitHistory: 0, rugPullRisk: 4,  codeVerified: true,  category: 'Perps',   notes: 'Regulated entity, US-based team' },
  { id: 'convex',      name: 'Convex Finance',    symbol: 'CVX',   chain: 'ETH', auditScore: 82, auditFirm: 'MixBytes',       riskLevel: 'MEDIUM',   tvlLocked: false, tvlLockDays: 0,   teamDoxxed: false, exploitHistory: 0, rugPullRisk: 20, codeVerified: true,  category: 'Yield',   notes: 'Anonymous team, high CVX concentration' },
  { id: 'lido',        name: 'Lido Finance',      symbol: 'LDO',   chain: 'ETH', auditScore: 93, auditFirm: 'Sigma Prime',    riskLevel: 'LOW',      tvlLocked: true,  tvlLockDays: 730, teamDoxxed: true,  exploitHistory: 0, rugPullRisk: 5,  codeVerified: true,  category: 'LST',     notes: 'Largest LST protocol, DAO controlled' },
  { id: 'maker',       name: 'MakerDAO',          symbol: 'MKR',   chain: 'ETH', auditScore: 95, auditFirm: 'OpenZeppelin',   riskLevel: 'SAFE',     tvlLocked: true,  tvlLockDays: 999, teamDoxxed: true,  exploitHistory: 0, rugPullRisk: 2,  codeVerified: true,  category: 'Stablecoin', notes: 'Battle-tested, oldest major DeFi protocol' },
] as const);

const EXPLOIT_LOG = Object.freeze([
  { date: '2023-07', protocol: 'Curve Finance',  chain: 'ETH', lossUsd: 70_000_000,  type: 'Reentrancy',    resolved: true  },
  { date: '2023-03', protocol: 'Euler Finance',  chain: 'ETH', lossUsd: 196_000_000, type: 'Flash Loan',    resolved: true  },
  { date: '2022-10', protocol: 'Mango Markets',  chain: 'SOL', lossUsd: 117_000_000, type: 'Oracle Manip',  resolved: false },
  { date: '2022-08', protocol: 'Nomad Bridge',   chain: 'ETH', lossUsd: 190_000_000, type: 'Logic Error',   resolved: false },
  { date: '2022-06', protocol: 'Harmony Bridge', chain: 'ETH', lossUsd: 100_000_000, type: 'Private Key',   resolved: false },
  { date: '2022-03', protocol: 'Ronin Bridge',   chain: 'ETH', lossUsd: 620_000_000, type: 'Private Key',   resolved: false },
  { date: '2021-08', protocol: 'Poly Network',   chain: 'ETH', lossUsd: 611_000_000, type: 'Logic Error',   resolved: true  },
] as const);

const TABS = Object.freeze(['Overview', 'Audit Scores', 'Exploit History', 'Rug Pull Risk'] as const);
type Tab = typeof TABS[number];

// ─── Audit Score Bar ──────────────────────────────────────────────────────────

const AuditBar = memo(({ score, color }: { score: number; color: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ flex: 1, height: 6, borderRadius: 50, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 50, background: color, width: score + '%', transition: 'width 0.6s ease', willChange: 'width' }} />
    </div>
    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color, minWidth: 28 }}>{score}</span>
  </div>
));
AuditBar.displayName = 'AuditBar';

// ─── Risk Badge ───────────────────────────────────────────────────────────────

const RiskBadge = memo(({ level }: { level: RiskLevel }) => {
  const cfg = RISK_CONFIG[level];
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 9, padding: '2px 8px', borderRadius: 4, background: cfg.bg, color: cfg.color, border: '1px solid ' + cfg.border, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
});
RiskBadge.displayName = 'RiskBadge';

// ─── Project Row ──────────────────────────────────────────────────────────────

interface ProjectRowProps {
  project: ProjectSecurity;
  onClick: (id: string) => void;
  active: boolean;
  isMobile: boolean;
}

const ProjectRow = memo(({ project: p, onClick, active, isMobile }: ProjectRowProps) => {
  const riskCfg = RISK_CONFIG[p.riskLevel];
  const scoreColor = p.auditScore >= 90 ? 'rgba(52,211,153,1)' : p.auditScore >= 75 ? 'rgba(96,165,250,1)' : p.auditScore >= 60 ? 'rgba(251,191,36,1)' : 'rgba(251,113,133,1)';
  const handleClick = useCallback(() => onClick(p.id), [p.id, onClick]);

  return (
    <div
      onClick={handleClick}
      role="row"
      aria-label={p.name + ' security row'}
      style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 60px 70px' : '1fr 80px 60px 70px 60px 60px', gap: 12, alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: active ? 'rgba(96,165,250,0.04)' : 'transparent', borderBottom: '1px solid rgba(148,163,184,0.06)', transition: 'background 0.15s', willChange: 'transform' }}
    >
      {/* Protocol info */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{p.name}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(148,163,184,0.1)', color: 'var(--zm-text-faint)' }}>{p.chain}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(96,165,250,0.08)', color: 'rgba(96,165,250,0.7)' }}>{p.category}</span>
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)' }}>Auditor: {p.auditFirm}</span>
      </div>

      {/* Audit score */}
      {!isMobile && <AuditBar score={p.auditScore} color={scoreColor} />}

      {/* Risk */}
      <RiskBadge level={p.riskLevel} />

      {/* TVL Lock */}
      {!isMobile && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {p.tvlLocked
              ? <Lock size={11} style={{ color: 'rgba(52,211,153,1)' }} />
              : <XCircle size={11} style={{ color: 'rgba(251,113,133,0.6)' }} />
            }
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: p.tvlLocked ? 'rgba(52,211,153,0.9)' : 'rgba(251,113,133,0.7)' }}>
              {p.tvlLocked ? p.tvlLockDays + 'd' : 'No'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {p.teamDoxxed
              ? <CheckCircle2 size={11} style={{ color: 'rgba(52,211,153,1)' }} />
              : <Eye size={11} style={{ color: 'rgba(251,191,36,0.8)' }} />
            }
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: p.teamDoxxed ? 'rgba(52,211,153,0.9)' : 'rgba(251,191,36,0.7)' }}>
              {p.teamDoxxed ? 'Doxxed' : 'Anon'}
            </span>
          </div>
        </>
      )}

      {/* Exploit count */}
      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: p.exploitHistory === 0 ? 'rgba(52,211,153,0.8)' : 'rgba(251,113,133,1)', textAlign: 'center' }}>
        {p.exploitHistory === 0 ? '✓' : p.exploitHistory + 'x'}
      </span>
    </div>
  );
});
ProjectRow.displayName = 'ProjectRow';

// ─── Exploit Entry ────────────────────────────────────────────────────────────

const ExploitEntry = memo(({ entry }: { entry: typeof EXPLOIT_LOG[number] }) => {
  const lossM = entry.lossUsd / 1_000_000;
  const color = entry.lossUsd > 300_000_000 ? 'rgba(239,68,68,1)' : entry.lossUsd > 100_000_000 ? 'rgba(251,113,133,1)' : 'rgba(251,191,36,1)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 100px 70px', gap: 12, alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(148,163,184,0.06)', willChange: 'transform' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)' }}>{entry.date}</span>
      <div>
        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{entry.protocol}</span>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', marginTop: 2 }}>{entry.chain} · {entry.type}</div>
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color, textAlign: 'right' }}>-${lossM.toFixed(0)}M</span>
      <span style={{ fontFamily: 'monospace', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'var(--zm-divider)', color: 'var(--zm-text-faint)', textAlign: 'center' }}>{entry.type}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: entry.resolved ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,0.7)', textAlign: 'center' }}>
        {entry.resolved ? '✓ Resolved' : '✗ Unresolved'}
      </span>
    </div>
  );
});
ExploitEntry.displayName = 'ExploitEntry';

// ─── Rug Pull Risk Bar ────────────────────────────────────────────────────────

const RugRiskBar = memo(({ project }: { project: ProjectSecurity }) => {
  const riskPct = project.rugPullRisk;
  const color = riskPct > 30 ? 'rgba(239,68,68,1)' : riskPct > 15 ? 'rgba(251,113,133,1)' : riskPct > 8 ? 'rgba(251,191,36,1)' : 'rgba(52,211,153,1)';
  return (
    <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{project.name}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', marginLeft: 8 }}>{project.symbol}</span>
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color }}>{riskPct}% risk</span>
      </div>
      <div style={{ height: 8, borderRadius: 50, background: 'var(--zm-divider)', overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ height: '100%', borderRadius: 50, background: color, width: riskPct + '%', transition: 'width 0.6s ease', willChange: 'width' }} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {!project.teamDoxxed && <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(251,191,36,0.8)' }}>⚠ Anon Team</span>}
        {!project.tvlLocked && <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(251,113,133,0.8)' }}>⚠ No TVL Lock</span>}
        {project.exploitHistory > 0 && <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(251,113,133,0.8)' }}>⚠ {project.exploitHistory} prior exploit(s)</span>}
        {project.rugPullRisk <= 5 && <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(52,211,153,0.8)' }}>✓ Low rug risk</span>}
      </div>
    </div>
  );
});
RugRiskBar.displayName = 'RugRiskBar';

// ─── Main Page ────────────────────────────────────────────────────────────────

const Security = memo(() => {
  const { isMobile } = useBreakpoint();
  const mountedRef = useRef(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [selectedId, setSelectedId] = useState('uniswap');
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleTab    = useCallback((t: Tab) => setActiveTab(t), []);
  const handleSelect = useCallback((id: string) => { if (!mountedRef.current) return; setSelectedId(id); }, []);
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQ(e.target.value), []);

  const filtered = useMemo(() => {
    if (!searchQ) return PROJECTS;
    const q = searchQ.toLowerCase();
    return PROJECTS.filter(p => p.name.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q) || p.chain.toLowerCase().includes(q));
  }, [searchQ]);

  const selected = useMemo(() => PROJECTS.find(p => p.id === selectedId) ?? PROJECTS[0], [selectedId]);

  const safeCount     = useMemo(() => PROJECTS.filter(p => p.riskLevel === 'SAFE').length, []);
  const mediumCount   = useMemo(() => PROJECTS.filter(p => p.riskLevel === 'MEDIUM' || p.riskLevel === 'HIGH').length, []);
  const totalExploits = useMemo(() => EXPLOIT_LOG.reduce((sum, e) => sum + e.lossUsd, 0), []);
  const avgAudit      = useMemo(() => Math.round(PROJECTS.reduce((s, p) => s + p.auditScore, 0) / PROJECTS.length), []);

  const sortedByRisk = useMemo(() => [...PROJECTS].sort((a, b) => b.rugPullRisk - a.rugPullRisk), []);

  const selRiskCfg = RISK_CONFIG[selected.riskLevel];
  const selScoreColor = selected.auditScore >= 90 ? 'rgba(52,211,153,1)' : selected.auditScore >= 75 ? 'rgba(96,165,250,1)' : 'rgba(251,191,36,1)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 16, minHeight: '100vh', background: 'var(--zm-bg-deep)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.25)' }}>
          <Shield size={18} style={{ color: 'rgba(251,113,133,1)' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'monospace', fontSize: isMobile ? 18 : 22, fontWeight: 700, margin: 0, background: 'linear-gradient(90deg,rgba(251,113,133,1) 0%,rgba(167,139,250,1) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Security Center
          </h1>
          <p style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)', margin: 0 }}>
            Smart contract audits · exploit history · rug pull risk
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Safe Protocols', value: String(safeCount), color: 'rgba(52,211,153,1)', Icon: CheckCircle2 },
          { label: 'Medium/High Risk', value: String(mediumCount), color: 'rgba(251,191,36,1)', Icon: AlertTriangle },
          { label: 'Total Hacked (DB)', value: '$' + (totalExploits / 1e9).toFixed(1) + 'B', color: 'rgba(251,113,133,1)', Icon: TrendingDown },
          { label: 'Avg Audit Score', value: String(avgAudit) + '/100', color: 'rgba(96,165,250,1)', Icon: FileText },
        ].map(s => {
          const Icon = s.Icon;
          return (
            <div key={s.label} style={{ padding: 14, borderRadius: 10, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', willChange: 'transform' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                <Icon size={12} style={{ color: s.color }} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Selected Protocol Detail */}
      {selected && (
        <div style={{ padding: 16, borderRadius: 12, background: 'var(--zm-glass-bg)', border: '1px solid ' + selRiskCfg.border }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{selected.name}</span>
            <RiskBadge level={selected.riskLevel} />
            <span style={{ fontFamily: 'monospace', fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(96,165,250,0.08)', color: 'rgba(96,165,250,0.7)' }}>{selected.chain}</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)' }}>{selected.category}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--zm-surface-1)', border: '1px solid var(--zm-glass-border)' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', textTransform: 'uppercase', marginBottom: 6 }}>Audit Score</div>
              <AuditBar score={selected.auditScore} color={selScoreColor} />
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', marginTop: 4 }}>by {selected.auditFirm}</div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--zm-surface-1)', border: '1px solid var(--zm-glass-border)' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', textTransform: 'uppercase', marginBottom: 6 }}>Security Factors</div>
              {[
                { label: 'Code Verified', ok: selected.codeVerified, Icon: CheckCircle2 },
                { label: 'TVL Locked ' + (selected.tvlLocked ? selected.tvlLockDays + 'd' : ''), ok: selected.tvlLocked, Icon: Lock },
                { label: 'Team Doxxed', ok: selected.teamDoxxed, Icon: Users },
              ].map(f => {
                const Icon = f.Icon;
                return (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon size={10} style={{ color: f.ok ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,0.7)' }} />
                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: f.ok ? 'var(--zm-text-primary)' : 'var(--zm-text-faint)' }}>{f.label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--zm-surface-1)', border: '1px solid var(--zm-glass-border)' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', textTransform: 'uppercase', marginBottom: 6 }}>Risk Indicators</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Zap size={10} style={{ color: selected.exploitHistory > 0 ? 'rgba(251,113,133,1)' : 'rgba(52,211,153,1)' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-primary)' }}>
                  {selected.exploitHistory === 0 ? 'No exploits' : selected.exploitHistory + ' exploit(s)'}
                </span>
              </div>
              {selected.lastExploit && (
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', marginBottom: 4 }}>
                  <Clock size={8} style={{ display: 'inline', marginRight: 4 }} />
                  Last: {selected.lastExploit}
                </div>
              )}
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)', marginTop: 4 }}>{selected.notes}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="tablist" aria-label="Security tabs">
        {TABS.map(t => (
          <button key={t} type="button" role="tab" aria-selected={activeTab === t} aria-label={'Switch to ' + t + ' tab'} onClick={() => handleTab(t)} style={{ padding: '6px 14px', borderRadius: 8, fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.15s', background: activeTab === t ? 'rgba(251,113,133,0.12)' : 'transparent', color: activeTab === t ? 'rgba(251,113,133,1)' : 'var(--zm-text-faint)', border: '1px solid ' + (activeTab === t ? 'rgba(251,113,133,0.3)' : 'transparent'), willChange: 'transform' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ borderRadius: 12, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', overflow: 'hidden', willChange: 'transform, opacity' }}>

          {activeTab === 'Overview' && (
            <>
              {/* Search */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--zm-text-faint)' }} />
                  <input
                    value={searchQ}
                    onChange={handleSearch}
                    placeholder="Search protocols…"
                    aria-label="Search security protocols"
                    style={{ width: '100%', paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7, borderRadius: 8, fontFamily: 'monospace', fontSize: 12, outline: 'none', boxSizing: 'border-box', background: 'var(--zm-surface-2)', border: '1px solid rgba(148,163,184,0.1)', color: 'var(--zm-text-primary)' }}
                  />
                </div>
              </div>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 60px 70px' : '1fr 80px 60px 70px 60px 60px', gap: 12, padding: '8px 16px', borderBottom: '1px solid rgba(148,163,184,0.1)', background: 'var(--zm-surface-1)' }}>
                {(isMobile ? ['Protocol', 'Audit', 'Risk'] : ['Protocol / Auditor', 'Audit Score', 'Risk', 'TVL Lock', 'Team', 'Exploits']).map(h => (
                  <span key={h} style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
                ))}
              </div>
              {filtered.map(p => <ProjectRow key={p.id} project={p} onClick={handleSelect} active={selectedId === p.id} isMobile={isMobile} />)}
            </>
          )}

          {activeTab === 'Audit Scores' && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Audit Scores — sorted descending
              </div>
              {[...PROJECTS].sort((a, b) => b.auditScore - a.auditScore).map(p => {
                const sc = p.auditScore >= 90 ? 'rgba(52,211,153,1)' : p.auditScore >= 75 ? 'rgba(96,165,250,1)' : 'rgba(251,191,36,1)';
                return (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '80px 1fr 36px' : '120px 1fr 36px 80px', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{p.symbol}</span>
                    <AuditBar score={p.auditScore} color={sc} />
                    {!isMobile && <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)' }}>{p.auditFirm}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'Exploit History' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 100px 70px', gap: 12, padding: '8px 16px', borderBottom: '1px solid rgba(148,163,184,0.1)', background: 'var(--zm-surface-1)' }}>
                {['Date', 'Protocol', 'Loss', 'Type', 'Status'].map(h => (
                  <span key={h} style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--zm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
                ))}
              </div>
              {EXPLOIT_LOG.map((e, i) => <ExploitEntry key={e.date + i} entry={e} />)}
              <div style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)' }}>
                Total: ${(totalExploits / 1e9).toFixed(2)}B · Source: DeFiHacks aggregated data
              </div>
            </>
          )}

          {activeTab === 'Rug Pull Risk' && (
            <>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(148,163,184,0.06)', fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Rug Pull Risk Score — Higher = more risk
              </div>
              {sortedByRisk.map(p => <RugRiskBar key={p.id} project={p} />)}
            </>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
});
Security.displayName = 'Security';

export default Security;
