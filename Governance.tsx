/**
 * Governance.tsx — ZERØ MERIDIAN push48
 * Full Governance: Active Proposals, Voting Power, Treasury Balances, DAO Analytics.
 * - React.memo + displayName ✓  - rgba() only ✓
 * - Zero template literals in JSX ✓  - Zero className in JSX ✓
 * - useCallback + useMemo ✓  - mountedRef ✓
 * - Object.freeze() all static data ✓  - useBreakpoint ✓ (isMobile + isTablet)
 * - Arkham card style ✓  - var(--zm-card-bg) ✓  - cyan accent ✓
 */

import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Vote, TrendingUp, DollarSign, Users, Clock, CheckCircle, XCircle, Radio } from 'lucide-react';

type ProposalStatus = 'ACTIVE' | 'PASSED' | 'FAILED' | 'PENDING';
type ProposalCategory = 'PROTOCOL' | 'TREASURY' | 'PARAMETER' | 'GRANTS';

interface Proposal {
  id: string; protocol: string; title: string; summary: string;
  status: ProposalStatus; category: ProposalCategory;
  votesFor: number; votesAgainst: number; votesAbstain: number;
  quorum: number; quorumRequired: number;
  endTime: string; proposer: string; totalVoters: number;
}

interface TreasuryAsset {
  protocol: string; symbol: string; balance: number; usdValue: number;
  change30d: number; color: string; category: string;
}

interface VotingPower {
  protocol: string; symbol: string; totalSupply: number; circulatingVotable: number;
  topHoldersPct: number; participationRate: number; color: string;
}

const STATUS_CONFIG = Object.freeze({
  ACTIVE:  { color: 'var(--zm-accent)',    bg: 'var(--zm-accent-bg)',    border: 'rgba(34,211,238,0.25)',   label: '● ACTIVE',  icon: '◉' },
  PASSED:  { color: 'var(--zm-positive)',  bg: 'var(--zm-positive-bg)',  border: 'rgba(52,211,153,0.25)',   label: '✓ PASSED',  icon: '✓' },
  FAILED:  { color: 'var(--zm-negative)',  bg: 'var(--zm-negative-bg)',  border: 'rgba(251,113,133,0.25)',  label: '✗ FAILED',  icon: '✗' },
  PENDING: { color: 'var(--zm-warning)',   bg: 'var(--zm-warning-bg)',   border: 'rgba(251,191,36,0.25)',   label: '◌ PENDING', icon: '◌' },
} as const);

const CAT_CONFIG = Object.freeze({
  PROTOCOL:  { color: 'var(--zm-violet)',   label: 'Protocol' },
  TREASURY:  { color: 'var(--zm-warning)',  label: 'Treasury' },
  PARAMETER: { color: 'var(--zm-accent)',   label: 'Parameter' },
  GRANTS:    { color: 'var(--zm-positive)', label: 'Grants' },
} as const);

const PROPOSALS: readonly Proposal[] = Object.freeze([
  {
    id: 'UNI-047', protocol: 'Uniswap', title: 'Activate Uniswap v4 Fee Switch on ETH Mainnet',
    summary: 'Proposal to enable protocol fee collection of 0.05% on top liquidity pools, directing revenue to UNI token holders via buyback mechanism.',
    status: 'ACTIVE', category: 'PROTOCOL',
    votesFor: 42_800_000, votesAgainst: 8_200_000, votesAbstain: 1_100_000,
    quorum: 52_100_000, quorumRequired: 40_000_000,
    endTime: '2d 14h', proposer: '0x4B4C...3f2A', totalVoters: 2841,
  },
  {
    id: 'AAVE-312', protocol: 'Aave', title: 'Add weETH as Collateral on Aave v3 Ethereum',
    summary: 'Add wrapped eETH (weETH) from EtherFi as borrowable collateral with LTV of 72.5% and liquidation threshold of 75%.',
    status: 'ACTIVE', category: 'PARAMETER',
    votesFor: 698_000, votesAgainst: 12_000, votesAbstain: 4_200,
    quorum: 714_200, quorumRequired: 320_000,
    endTime: '1d 6h', proposer: '0xE3cB...91aA', totalVoters: 418,
  },
  {
    id: 'ARB-102', protocol: 'Arbitrum', title: 'Allocate 75M ARB to Gaming Catalyst Program',
    summary: 'Fund a dedicated gaming ecosystem grant program to attract top Web3 gaming studios to Arbitrum Orbit chains.',
    status: 'ACTIVE', category: 'GRANTS',
    votesFor: 1_240_000_000, votesAgainst: 380_000_000, votesAbstain: 92_000_000,
    quorum: 1_712_000_000, quorumRequired: 1_000_000_000,
    endTime: '4d 2h', proposer: 'Arbitrum Foundation', totalVoters: 6_209,
  },
  {
    id: 'COMP-183', protocol: 'Compound', title: 'Set COMP Distribution Rate to 0',
    summary: 'Pause COMP liquidity mining rewards to reduce sell pressure and extend treasury runway. Can be re-enabled by governance.',
    status: 'PASSED', category: 'PARAMETER',
    votesFor: 820_000, votesAgainst: 91_000, votesAbstain: 18_000,
    quorum: 929_000, quorumRequired: 400_000,
    endTime: 'Ended', proposer: '0x7A9f...12bC', totalVoters: 312,
  },
  {
    id: 'MKR-188', protocol: 'MakerDAO', title: 'Increase DAI Savings Rate to 8.5%',
    summary: 'Raise the DSR from 7% to 8.5% to increase DAI demand and protocol revenue. Funded by RWA yields.',
    status: 'PASSED', category: 'PARAMETER',
    votesFor: 112_400, votesAgainst: 8_100, votesAbstain: 2_300,
    quorum: 122_800, quorumRequired: 80_000,
    endTime: 'Ended', proposer: 'Risk Team', totalVoters: 188,
  },
  {
    id: 'OP-089', protocol: 'Optimism', title: 'Season 5 Grants Council Budget: 10M OP',
    summary: 'Approve 10M OP for Season 5 grants council to fund public goods, tooling, and protocol growth on Optimism Superchain.',
    status: 'PENDING', category: 'GRANTS',
    votesFor: 0, votesAgainst: 0, votesAbstain: 0,
    quorum: 0, quorumRequired: 30_000_000,
    endTime: 'Starts in 18h', proposer: 'Optimism Foundation', totalVoters: 0,
  },
]);

const TREASURY: readonly TreasuryAsset[] = Object.freeze([
  { protocol: 'Uniswap',   symbol: 'UNI',  balance: 430_000_000, usdValue: 2_800_000_000, change30d: 12.4,  color: 'rgba(252,129,74,1)',   category: 'Native' },
  { protocol: 'Aave',      symbol: 'AAVE', balance: 2_800_000,   usdValue: 420_000_000,   change30d: 8.1,   color: 'rgba(177,122,162,1)',  category: 'Native' },
  { protocol: 'Arbitrum',  symbol: 'ARB',  balance: 3_500_000_000, usdValue: 3_850_000_000, change30d: -4.2, color: 'rgba(18,101,242,1)',  category: 'Native' },
  { protocol: 'Compound',  symbol: 'USDC', balance: 24_000_000,  usdValue: 24_000_000,    change30d: 0.0,   color: 'rgba(39,117,202,1)',   category: 'Stablecoin' },
  { protocol: 'MakerDAO',  symbol: 'DAI',  balance: 180_000_000, usdValue: 180_000_000,   change30d: 0.1,   color: 'rgba(250,185,28,1)',   category: 'Stablecoin' },
  { protocol: 'Optimism',  symbol: 'OP',   balance: 850_000_000, usdValue: 1_700_000_000, change30d: 6.8,   color: 'rgba(255,4,32,1)',     category: 'Native' },
]);

const VOTING_POWER: readonly VotingPower[] = Object.freeze([
  { protocol: 'Uniswap',  symbol: 'UNI',  totalSupply: 1_000_000_000, circulatingVotable: 330_000_000, topHoldersPct: 41.2, participationRate: 6.8,  color: 'rgba(252,129,74,1)' },
  { protocol: 'Aave',     symbol: 'AAVE', totalSupply: 16_000_000,    circulatingVotable: 12_400_000,  topHoldersPct: 38.7, participationRate: 9.4,  color: 'rgba(177,122,162,1)' },
  { protocol: 'Arbitrum', symbol: 'ARB',  totalSupply: 10_000_000_000, circulatingVotable: 4_100_000_000, topHoldersPct: 55.1, participationRate: 4.2, color: 'rgba(18,101,242,1)' },
  { protocol: 'Compound', symbol: 'COMP', totalSupply: 10_000_000,    circulatingVotable: 7_200_000,   topHoldersPct: 44.0, participationRate: 11.2, color: 'rgba(0,210,120,1)' },
  { protocol: 'Optimism', symbol: 'OP',   totalSupply: 4_294_967_296, circulatingVotable: 1_200_000_000, topHoldersPct: 33.5, participationRate: 7.1, color: 'rgba(255,4,32,1)' },
]);

const TABS = Object.freeze(['Proposals', 'Treasury', 'Voting Power'] as const);
type Tab = typeof TABS[number];

const formatCompact = (n: number): string => {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
};

// ─── Vote Bar ─────────────────────────────────────────────────────────────────
const VoteBar = memo(({ votesFor, votesAgainst, votesAbstain }: { votesFor: number; votesAgainst: number; votesAbstain: number }) => {
  const total = votesFor + votesAgainst + votesAbstain || 1;
  const forPct = (votesFor / total) * 100;
  const againstPct = (votesAgainst / total) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', height: 6, borderRadius: 50, overflow: 'hidden', background: 'var(--zm-divider)' }}>
        <div style={{ width: forPct + '%', background: 'var(--zm-positive)', transition: 'width 0.6s ease' }} />
        <div style={{ width: againstPct + '%', background: 'var(--zm-negative)', transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-positive)' }}>FOR {forPct.toFixed(1)}%</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-negative)' }}>AGAINST {againstPct.toFixed(1)}%</span>
        {votesAbstain > 0 && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)' }}>ABSTAIN {(100 - forPct - againstPct).toFixed(1)}%</span>}
      </div>
    </div>
  );
});
VoteBar.displayName = 'VoteBar';

// ─── Quorum Bar ───────────────────────────────────────────────────────────────
const QuorumBar = memo(({ quorum, required }: { quorum: number; required: number }) => {
  const pct = Math.min((quorum / required) * 100, 100);
  const met = quorum >= required;
  const color = met ? 'var(--zm-positive)' : 'var(--zm-accent)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quorum</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color }}>{met ? '✓ Met' : pct.toFixed(0) + '%'}</span>
      </div>
      <div style={{ height: 4, borderRadius: 50, background: 'var(--zm-divider)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
});
QuorumBar.displayName = 'QuorumBar';

// ─── Proposal Card ────────────────────────────────────────────────────────────
const ProposalCard = memo(({ p, isMobile }: { p: Proposal; isMobile: boolean }) => {
  const s = STATUS_CONFIG[p.status];
  const c = CAT_CONFIG[p.category];
  const isActive = p.status === 'ACTIVE';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: 16, borderRadius: 'var(--zm-card-radius)', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', display: 'flex', flexDirection: 'column', gap: 12, willChange: 'transform' }}
      whileHover={{ borderColor: 'rgba(34,211,238,0.3)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '1px 6px', borderRadius: 3, background: s.bg, color: s.color, border: '1px solid ' + s.border, fontWeight: 700 }}>{s.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', color: c.color }}>{c.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)' }}>{p.protocol} · {p.id}</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 12 : 14, fontWeight: 700, color: 'var(--zm-text-primary)', lineHeight: 1.4 }}>{p.title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <Clock size={10} style={{ color: 'var(--zm-text-faint)' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: isActive ? 'var(--zm-warning)' : 'var(--zm-text-faint)' }}>{p.endTime}</span>
        </div>
      </div>

      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--zm-text-secondary)', margin: 0, lineHeight: 1.6 }}>{p.summary}</p>

      {p.status !== 'PENDING' && (
        <>
          <VoteBar votesFor={p.votesFor} votesAgainst={p.votesAgainst} votesAbstain={p.votesAbstain} />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Votes For', value: formatCompact(p.votesFor), color: 'var(--zm-positive)' },
              { label: 'Votes Against', value: formatCompact(p.votesAgainst), color: 'var(--zm-negative)' },
              { label: 'Voters', value: p.totalVoters.toLocaleString(), color: 'var(--zm-accent)' },
              { label: 'Proposer', value: p.proposer.length > 12 ? p.proposer.slice(0, 10) + '…' : p.proposer, color: 'var(--zm-text-secondary)' },
            ].map(m => (
              <div key={m.label} style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--zm-grey-06)' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--zm-text-faint)', textTransform: 'uppercase', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
          <QuorumBar quorum={p.quorum} required={p.quorumRequired} />
        </>
      )}
    </motion.div>
  );
});
ProposalCard.displayName = 'ProposalCard';

// ─── Treasury Tab ─────────────────────────────────────────────────────────────
const TreasuryTab = memo(({ isMobile, isTablet }: { isMobile: boolean; isTablet: boolean }) => {
  const totalUsd = useMemo(() => TREASURY.reduce((s, a) => s + a.usdValue, 0), []);
  const cols = useMemo(() => isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)', [isMobile, isTablet]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: 16, borderRadius: 'var(--zm-card-radius)', background: 'linear-gradient(135deg, rgba(0,238,255,0.08), rgba(167,139,250,0.06))', border: '1px solid rgba(34,211,238,0.2)' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--zm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>Total DAO Treasury Value</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 700, color: 'var(--zm-accent)' }}>${formatCompact(totalUsd)}</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--zm-text-secondary)', marginTop: 4 }}>Across {TREASURY.length} major DAOs tracked</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12 }}>
        {TREASURY.map(a => {
          const isUp = a.change30d >= 0;
          return (
            <div key={a.protocol} style={{ padding: 14, borderRadius: 'var(--zm-card-radius)', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', willChange: 'transform' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{a.protocol}</span>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', color: 'var(--zm-text-faint)' }}>{a.category}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: 'var(--zm-text-primary)', marginBottom: 2 }}>${formatCompact(a.usdValue)}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)' }}>{formatCompact(a.balance)} {a.symbol}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: isUp ? 'var(--zm-positive)' : 'var(--zm-negative)' }}>{isUp ? '+' : ''}{a.change30d.toFixed(1)}% 30d</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
TreasuryTab.displayName = 'TreasuryTab';

// ─── Voting Power Tab ─────────────────────────────────────────────────────────
const VotingPowerTab = memo(({ isMobile, isTablet }: { isMobile: boolean; isTablet: boolean }) => {
  const cols = useMemo(() => isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)', [isMobile, isTablet]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--zm-text-secondary)', padding: '8px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid var(--zm-warning-bg)' }}>
        ⚠ Voting power concentration above 50% in top holders indicates governance centralization risk.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12 }}>
        {VOTING_POWER.map(v => {
          const concentration = v.topHoldersPct;
          const concentrationColor = concentration > 50 ? 'var(--zm-negative)' : concentration > 35 ? 'var(--zm-warning)' : 'var(--zm-positive)';
          return (
            <div key={v.protocol} style={{ padding: 14, borderRadius: 'var(--zm-card-radius)', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: 'var(--zm-text-primary)' }}>{v.protocol}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)' }}>{v.symbol}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  { label: 'Votable Supply', value: formatCompact(v.circulatingVotable), color: 'var(--zm-text-primary)' },
                  { label: 'Participation', value: v.participationRate.toFixed(1) + '%', color: v.participationRate > 8 ? 'var(--zm-positive)' : 'var(--zm-warning)' },
                ].map(m => (
                  <div key={m.label} style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--zm-grey-06)' }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--zm-text-faint)', textTransform: 'uppercase', marginBottom: 2 }}>{m.label}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)' }}>Top holder concentration</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: concentrationColor }}>{concentration.toFixed(1)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 50, background: 'var(--zm-divider)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: concentration + '%', background: concentrationColor, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
VotingPowerTab.displayName = 'VotingPowerTab';

// ─── Main ─────────────────────────────────────────────────────────────────────
const Governance = memo(() => {
  const { isMobile, isTablet } = useBreakpoint();
  const mountedRef = useRef(true);
  const [activeTab, setActiveTab] = useState<Tab>('Proposals');
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'ALL'>('ALL');

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleTab    = useCallback((t: Tab) => { if (mountedRef.current) setActiveTab(t); }, []);
  const handleFilter = useCallback((s: ProposalStatus | 'ALL') => { if (mountedRef.current) setFilterStatus(s); }, []);

  const filteredProposals = useMemo(() =>
    filterStatus === 'ALL' ? PROPOSALS : PROPOSALS.filter(p => p.status === filterStatus),
    [filterStatus]
  );

  const activeCount  = useMemo(() => PROPOSALS.filter(p => p.status === 'ACTIVE').length, []);
  const passedCount  = useMemo(() => PROPOSALS.filter(p => p.status === 'PASSED').length, []);
  const totalVoters  = useMemo(() => PROPOSALS.filter(p => p.status !== 'PENDING').reduce((s, p) => s + p.totalVoters, 0), []);
  const totalTreasury = useMemo(() => TREASURY.reduce((s, a) => s + a.usdValue, 0), []);
  const gridCols = useMemo(() => isMobile ? '1fr 1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)', [isMobile, isTablet]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: isMobile ? '16px' : isTablet ? '20px' : '28px', minHeight: '100vh', background: 'var(--zm-bg-base)' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--zm-violet-bg)', border: '1px solid rgba(167,139,250,0.25)' }}>
            <Vote size={18} style={{ color: 'var(--zm-violet)' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 18 : 22, fontWeight: 700, margin: 0, background: 'linear-gradient(90deg,var(--zm-violet) 0%,var(--zm-cyan) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Governance</h1>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--zm-text-faint)', margin: 0 }}>DAO proposals · voting power · treasury analytics</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <Radio size={10} style={{ color: 'var(--zm-violet)' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-violet)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live · 6 DAOs tracked</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12 }}>
        {([
          { label: 'Active Proposals', value: String(activeCount), color: 'var(--zm-accent)', Icon: Vote },
          { label: 'Passed (recent)', value: String(passedCount), color: 'var(--zm-positive)', Icon: CheckCircle },
          { label: 'Total Voters', value: totalVoters.toLocaleString(), color: 'var(--zm-violet)', Icon: Users },
          { label: 'Treasury AUM', value: '$' + formatCompact(totalTreasury), color: 'var(--zm-warning)', Icon: DollarSign },
        ] as const).map(s => {
          const Icon = s.Icon;
          return (
            <div key={s.label} style={{ padding: 14, borderRadius: 'var(--zm-card-radius)', background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', willChange: 'transform' }}>
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
            style={{ padding: '6px 14px', borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.15s', background: activeTab === t ? 'rgba(167,139,250,0.12)' : 'transparent', color: activeTab === t ? 'var(--zm-violet)' : 'var(--zm-text-faint)', border: '1px solid ' + (activeTab === t ? 'rgba(167,139,250,0.3)' : 'transparent') }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ willChange: 'transform, opacity' }}>
          {activeTab === 'Proposals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['ALL', 'ACTIVE', 'PASSED', 'FAILED', 'PENDING'] as const).map(s => (
                  <button key={s} type="button" onClick={() => handleFilter(s)}
                    style={{ padding: '3px 10px', borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, cursor: 'pointer', transition: 'all 0.15s', background: filterStatus === s ? 'rgba(34,211,238,0.12)' : 'transparent', color: filterStatus === s ? 'var(--zm-accent)' : 'var(--zm-text-faint)', border: '1px solid ' + (filterStatus === s ? 'rgba(34,211,238,0.3)' : 'transparent') }}>
                    {s === 'ALL' ? 'ALL' : STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
              {filteredProposals.map(p => <ProposalCard key={p.id} p={p} isMobile={isMobile} />)}
            </div>
          )}
          {activeTab === 'Treasury' && <TreasuryTab isMobile={isMobile} isTablet={isTablet} />}
          {activeTab === 'Voting Power' && <VotingPowerTab isMobile={isMobile} isTablet={isTablet} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
Governance.displayName = 'Governance';
export default Governance;
