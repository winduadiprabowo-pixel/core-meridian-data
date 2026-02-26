/**
 * ZMSidebar.tsx — ZERØ MERIDIAN push53
 * CYBER-NEON PRO OVERHAUL:
 *   - Deep Void bg rgba(8,8,11) + neon cyan active states
 *   - 72px icon-only collapsed, 240px expanded
 *   - Active item: cyan left border + glow bg
 *   - Hover: subtle neon glow
 *   - Neon green LIVE dot footer
 *   - Space Grotesk labels
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - var(--zm-*) ✓
 * - Object.freeze() static data ✓
 * - useCallback + useMemo ✓
 * - mountedRef ✓
 * - aria-label + role ✓
 */

import React, { memo, useCallback, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '@/hooks/useDeviceProfile';

interface NavItem  { id: string; label: string; path: string; icon: React.ReactNode; badge?: string; }
interface NavGroup { label: string; items: readonly NavItem[]; }
interface ZMSidebarProps { expanded: boolean; onToggle: () => void; currentPath: string; }

// ─── Icons ─────────────────────────────────────────────────────────────────────
const I = (d: string, extra?: string) => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...(extra ? { opacity: extra } : {})} />
  </svg>
);

const DashIcon      = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>;
const MarketsIcon   = () => I('M1,13 L5,8 L8,11 L12,5 L17,7');
const WatchlistIcon = () => I('M9 2l2.09 4.26L16 7.27l-3.5 3.41.83 4.82L9 13.2l-4.33 2.3.83-4.82L2 7.27l4.91-.71z');
const AlertIcon     = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 2C6.24 2 4 4.24 4 7v5l-1.5 2h13L14 12V7c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 15a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const PortfolioIcon = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="5" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 5V4a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const AIIcon        = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><polygon points="9,1 17,14 1,14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/><circle cx="9" cy="9" r="2" fill="currentColor" opacity="0.7"/></svg>;
const OnChainIcon   = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="1" y="7" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="7" y="4" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="13" y="1" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>;
const SmartMoneyIcon= () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M9 5v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const ChartsIcon    = () => I('M2,14 L5,8 L8,10 L11,5 L14,9 L17,4');
const DefiIcon      = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="4" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.5"/><line x1="6.5" y1="8" x2="11.5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="6.5" y1="10" x2="11.5" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const FundamentalsIcon = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><line x1="9" y1="5" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="9" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const DerivativesIcon  = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 14c2-4 4-8 7-8s5 4 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>;
const NetworksIcon     = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="3" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.5"/><line x1="4.5" y1="4.5" x2="7.5" y2="7.5" stroke="currentColor" strokeWidth="1" opacity="0.5"/><line x1="13.5" y1="4.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="1" opacity="0.5"/><line x1="4.5" y1="13.5" x2="7.5" y2="10.5" stroke="currentColor" strokeWidth="1" opacity="0.5"/><line x1="13.5" y1="13.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1" opacity="0.5"/></svg>;
const OrderBookIcon    = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="2" width="14" height="2" rx="1" fill="currentColor" opacity="0.7"/><rect x="2" y="6" width="10" height="2" rx="1" fill="currentColor" opacity="0.5"/><rect x="2" y="10" width="12" height="2" rx="1" fill="currentColor" opacity="0.4"/><rect x="2" y="14" width="7" height="2" rx="1" fill="currentColor" opacity="0.3"/></svg>;
const NFTIcon          = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 12l2.5-3.5 2 2.5 1.5-2L14 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7.5" cy="7" r="1.2" fill="currentColor" opacity="0.7"/></svg>;
const ConverterIcon    = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h12M12 6l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 9H3M6 12l-3-3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>;
const SettingsIcon     = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.42 1.42M13.36 13.36l1.42 1.42M3.22 14.78l1.42-1.42M13.36 4.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const StakingIcon      = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><polygon points="9,2 16,6 16,12 9,16 2,12 2,6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><line x1="9" y1="2" x2="9" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.4"/><line x1="2" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.4"/></svg>;
const BridgesIcon      = () => <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M1 13 Q1 7 5 7 Q9 7 9 11 Q9 7 13 7 Q17 7 17 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><line x1="1" y1="13" x2="17" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;

const NAV_GROUPS: readonly NavGroup[] = Object.freeze([
  { label: 'CORE', items: Object.freeze([
    { id:'dashboard',  label:'Dashboard',  path:'/dashboard',  icon: <DashIcon /> },
    { id:'markets',    label:'Markets',    path:'/markets',    icon: <MarketsIcon /> },
    { id:'watchlist',  label:'Watchlist',  path:'/watchlist',  icon: <WatchlistIcon /> },
    { id:'alerts',     label:'Alerts',     path:'/alerts',     icon: <AlertIcon /> },
    { id:'portfolio',  label:'Portfolio',  path:'/portfolio',  icon: <PortfolioIcon /> },
  ])},
  { label: 'INTELLIGENCE', items: Object.freeze([
    { id:'intelligence', label:'AI Intel',    path:'/intelligence',  icon: <AIIcon /> },
    { id:'ai-signals',   label:'AI Signals',  path:'/ai-signals',    icon: <AIIcon /> },
    { id:'smart-money',  label:'Smart Money', path:'/smart-money',   icon: <SmartMoneyIcon /> },
    { id:'onchain',      label:'On-Chain',    path:'/onchain',       icon: <OnChainIcon />, badge:'NEW' },
    { id:'sentiment',    label:'Sentiment',   path:'/sentiment',     icon: <AlertIcon /> },
  ])},
  { label: 'ANALYTICS', items: Object.freeze([
    { id:'defi',         label:'DeFi',        path:'/defi',          icon: <DefiIcon /> },
    { id:'derivatives',  label:'Derivatives', path:'/derivatives',   icon: <DerivativesIcon /> },
    { id:'orderbook',    label:'Order Book',  path:'/order-book',    icon: <OrderBookIcon /> },
    { id:'charts',       label:'Charts',      path:'/charts',        icon: <ChartsIcon /> },
    { id:'fundamentals', label:'Fundamentals',path:'/fundamentals',  icon: <FundamentalsIcon /> },
    { id:'networks',     label:'Networks',    path:'/networks',      icon: <NetworksIcon /> },
  ])},
  { label: 'ASSETS', items: Object.freeze([
    { id:'nft',      label:'NFT',      path:'/nft',      icon: <NFTIcon /> },
    { id:'staking',  label:'Staking',  path:'/staking',  icon: <StakingIcon /> },
    { id:'bridges',  label:'Bridges',  path:'/bridges',  icon: <BridgesIcon /> },
    { id:'converter',label:'Converter',path:'/converter',icon: <ConverterIcon /> },
  ])},
  { label: 'SYSTEM', items: Object.freeze([
    { id:'settings', label:'Settings', path:'/settings', icon: <SettingsIcon /> },
  ])},
]);

// ─── NavItem ──────────────────────────────────────────────────────────────────

const NavItemBtn = memo(({ item, expanded, isActive, onNavigate }: {
  item: NavItem; expanded: boolean; isActive: boolean; onNavigate: (p: string) => void;
}) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.button
      onClick={() => onNavigate(item.path)}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '10px',
        width:          '100%',
        padding:        expanded ? '8px 10px' : '9px',
        borderRadius:   '10px',
        background:     isActive ? 'var(--zm-accent-bg)'    : 'transparent',
        border:         isActive ? '1px solid rgba(0,238,255,0.18)' : '1px solid transparent',
        borderLeft:     isActive ? '2px solid var(--zm-accent)'    : '2px solid transparent',
        color:          isActive ? 'var(--zm-accent)'        : 'var(--zm-text-secondary)',
        cursor:         'pointer',
        textAlign:      'left' as const,
        willChange:     'transform',
        transition:     'background 150ms, color 150ms, border-color 150ms',
        boxShadow:      isActive ? '0 0 12px var(--zm-accent-dim)' : 'none',
        justifyContent: expanded ? 'flex-start' : 'center',
        flexShrink:     0,
      }}
      whileHover={prefersReducedMotion ? {} : {
        background: isActive ? 'var(--zm-accent-dim)' : 'rgba(0,238,255,0.04)',
        color: isActive ? 'var(--zm-accent)' : 'var(--zm-text-primary)',
      }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      title={expanded ? undefined : item.label}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.icon}
      </span>
      {expanded && (
        <>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', fontWeight: isActive ? 600 : 400, letterSpacing: '-0.01em', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.label}
          </span>
          {item.badge && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '7px', letterSpacing: '0.08em', background: 'rgba(0,238,255,0.12)', border: '1px solid rgba(0,238,255,0.28)', color: 'var(--zm-accent)', borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>
              {item.badge}
            </span>
          )}
        </>
      )}
    </motion.button>
  );
});
NavItemBtn.displayName = 'NavItemBtn';

// ─── NavGroup ─────────────────────────────────────────────────────────────────

const NavGroupSection = memo(({ group, expanded, currentPath, onNavigate }: {
  group: NavGroup; expanded: boolean; currentPath: string; onNavigate: (p: string) => void;
}) => (
  <div style={{ marginBottom: '4px' }}>
    {expanded && (
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.14em', color: 'var(--zm-text-faint)', padding: '10px 10px 4px', textTransform: 'uppercase', fontWeight: 600 }}>
        {group.label}
      </div>
    )}
    {!expanded && <div style={{ height: '8px' }} />}
    {group.items.map(item => (
      <NavItemBtn
        key={item.id}
        item={item}
        expanded={expanded}
        isActive={currentPath === item.path || currentPath.startsWith(item.path + '/')}
        onNavigate={onNavigate}
      />
    ))}
  </div>
));
NavGroupSection.displayName = 'NavGroupSection';

// ─── ZMSidebar ────────────────────────────────────────────────────────────────

const ZMSidebar = memo(({ expanded, onToggle, currentPath }: ZMSidebarProps) => {
  const mountedRef           = useRef(true);
  const prefersReducedMotion = useReducedMotion();
  const navigate             = useNavigate();

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleNavigate = useCallback((path: string) => {
    if (!mountedRef.current) return;
    navigate(path);
  }, [navigate]);

  const sidebarStyle = useMemo((): React.CSSProperties => ({
    position:     'fixed',
    top:          0, left: 0, bottom: 0,
    zIndex:       100,
    width:        expanded ? '240px' : '72px',
    display:      'flex',
    flexDirection:'column',
    background:   'var(--zm-sidebar-bg)',
    borderRight:  '1px solid rgba(0,238,255,0.12)',
    transition:   prefersReducedMotion ? 'none' : 'width 0.28s cubic-bezier(0.22,1,0.36,1)',
    willChange:   'width',
    overflowX:    'hidden',
  }), [expanded, prefersReducedMotion]);

  return (
    <aside style={sidebarStyle} aria-label="Main navigation sidebar" role="navigation">

      {/* ── Logo header ── */}
      <div style={{
        padding:        expanded ? '16px 14px 12px' : '12px 8px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: expanded ? 'space-between' : 'center',
        borderBottom:   '1px solid var(--zm-card-border)',
        flexShrink:     0,
        minHeight:      '64px',
      }}>
        {/* ZM Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <motion.div
            style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--zm-accent), var(--zm-positive))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 18px rgba(0,238,255,0.45), 0 0 6px var(--zm-accent-border) inset', cursor: 'pointer', willChange: 'transform' }}
            animate={prefersReducedMotion ? {} : { boxShadow: ['0 0 18px rgba(0,238,255,0.45), 0 0 6px var(--zm-accent-border) inset', '0 0 28px rgba(0,238,255,0.70), 0 0 10px rgba(0,238,255,0.30) inset', '0 0 18px rgba(0,238,255,0.45), 0 0 6px var(--zm-accent-border) inset'] }}
            transition={getProfile().isLowEnd ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={prefersReducedMotion ? {} : { boxShadow: '0 0 36px rgba(0,238,255,0.80)' }}
            onClick={onToggle}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', fontWeight: 900, color: 'var(--zm-bg-base)', letterSpacing: '-1px', filter: 'drop-shadow(0 0 2px rgba(5,5,7,0.5))' }}>ZM</span>
          </motion.div>
          {expanded && (
            <div style={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>ZERØ MERIDIAN</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)', marginTop: '1px', letterSpacing: '0.04em' }}>Crypto Intelligence</div>
            </div>
          )}
        </div>
        {expanded && (
          <button
            onClick={onToggle}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '7px', border: '1px solid rgba(0,238,255,0.12)', background: 'rgba(0,238,255,0.05)', color: 'var(--zm-text-faint)', cursor: 'pointer' }}
            aria-label="Collapse sidebar"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: expanded ? '6px 8px' : '6px 6px', scrollbarWidth: 'none' }}>
        {NAV_GROUPS.map(group => (
          <NavGroupSection key={group.label} group={group} expanded={expanded} currentPath={currentPath} onNavigate={handleNavigate} />
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: expanded ? '10px 14px' : '10px 8px', borderTop: '1px solid rgba(0,238,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: expanded ? 'flex-start' : 'center' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--zm-positive)', boxShadow: '0 0 8px rgba(34,255,170,0.70)', flexShrink: 0, animation: 'pulse-ring 2s ease-out infinite' }} />
        {expanded && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'rgba(34,255,170,0.85)', letterSpacing: '0.06em', fontWeight: 600 }}>BUILD v53 · GREEN</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '9px', color: 'var(--zm-text-faint)', marginTop: '1px', whiteSpace: 'nowrap' }}>© 2026 Zero Build Lab</div>
          </div>
        )}
      </div>
    </aside>
  );
});
ZMSidebar.displayName = 'ZMSidebar';
export default ZMSidebar;
