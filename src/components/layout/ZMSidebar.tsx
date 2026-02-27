/**
 * ZMSidebar.tsx — ZERØ MERIDIAN 2026 push77
 * push77: Logo crystal Ø di pojok, nav items bersih (hapus coming soon),
 *         layout lebih professional & clean
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useCallback + useMemo + mountedRef ✓
 */

import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  id:     string;
  label:  string;
  path:   string;
  icon:   React.ReactNode;
  badge?: string;
}

interface ZMSidebarProps {
  expanded:    boolean;
  onToggle:    () => void;
  currentPath: string;
}

const NAV_ITEMS: readonly NavItem[] = Object.freeze([
  {
    id: 'dashboard', label: 'Dashboard', path: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: 'markets', label: 'Markets', path: '/markets',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <polyline points="1,12 4,7 7,10 11,4 15,6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'orderbook', label: 'Order Book', path: '/orderbook',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <line x1="1" y1="3"  x2="9"  y2="3"  stroke="rgba(34,255,170,0.8)"  strokeWidth="1.4" strokeLinecap="round" />
        <line x1="1" y1="6"  x2="7"  y2="6"  stroke="rgba(34,255,170,0.5)"  strokeWidth="1.4" strokeLinecap="round" />
        <line x1="1" y1="10" x2="11" y2="10" stroke="rgba(255,68,136,0.8)"  strokeWidth="1.4" strokeLinecap="round" />
        <line x1="1" y1="13" x2="8"  y2="13" stroke="rgba(255,68,136,0.5)"  strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'derivatives', label: 'Derivatives', path: '/derivatives',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M1 13 L4 6 L8 9 L12 3 L15 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4"  cy="6" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="12" cy="3" r="1.5" fill="currentColor" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'defi', label: 'DeFi', path: '/defi',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="3"  cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="13" cy="3" r="2.2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="13" cy="13" r="2.2" stroke="currentColor" strokeWidth="1.4" />
        <line x1="5.2" y1="7"  x2="10.8" y2="4"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="5.2" y1="9"  x2="10.8" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'onchain', label: 'On-Chain', path: '/onchain', badge: 'NEW',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1"  y="7" width="3.5" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="6"  y="4" width="3.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11" y="1" width="3.5" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: 'intelligence', label: 'AI Intel', path: '/intelligence',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.7" />
        <line x1="8" y1="2"  x2="8" y2="6"  stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="8" y1="10" x2="8" y2="14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="2"  y1="8" x2="6"  y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="10" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: 'watchlist', label: 'Watchlist', path: '/watchlist',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.5L9.8 5.3L14 5.9L11 8.8L11.7 13L8 11L4.3 13L5 8.8L2 5.9L6.2 5.3L8 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'alerts', label: 'Alerts', path: '/alerts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2C5.8 2 4 3.8 4 6v4L2.5 12.5h11L12 10V6c0-2.2-1.8-4-4-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'portfolio', label: 'Portfolio', path: '/portfolio',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 8 L8 1.5 A6.5 6.5 0 0 1 14.5 8 Z" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'converter', label: 'Converter', path: '/converter',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 5h12M10 2l4 3-4 3M14 11H2M6 8l-4 3 4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'charts', label: 'Charts', path: '/charts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <polyline points="1,14 4,9 7,11 11,5 15,7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="1" y="13" width="14" height="1" rx="0.5" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
]);

const BOTTOM_ITEMS: readonly NavItem[] = Object.freeze([
  {
    id: 'settings', label: 'Settings', path: '/settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.93 2.93l1.07 1.07M12 12l1.07 1.07M2.93 13.07l1.07-1.07M12 4l1.07-1.07"
          stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
]);

// ─── Crystal Ø logo (mini version for sidebar) ───────────────────────────────
const SidebarLogo = memo(() => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <defs>
      <filter id="sbGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2.5" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <linearGradient id="sbCircle" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.9)" />
        <stop offset="40%"  stopColor="rgba(0,238,255,1)" />
        <stop offset="100%" stopColor="rgba(0,180,220,0.8)" />
      </linearGradient>
      <linearGradient id="sbSlash" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.95)" />
        <stop offset="100%" stopColor="rgba(0,238,255,1)" />
      </linearGradient>
    </defs>
    {/* Top spike */}
    <polygon points="14,2 12,11 14,10 16,11" fill="rgba(0,238,255,0.08)" stroke="rgba(0,238,255,0.3)" strokeWidth="0.5" />
    {/* Right spike */}
    <polygon points="26,14 17,12 18,14 17,16" fill="rgba(0,238,255,0.06)" stroke="rgba(0,238,255,0.2)" strokeWidth="0.5" />
    {/* Bottom spike */}
    <polygon points="14,26 16,17 14,18 12,17" fill="rgba(0,238,255,0.05)" stroke="rgba(0,238,255,0.2)" strokeWidth="0.5" />
    {/* Left spike */}
    <polygon points="2,14 11,16 10,14 11,12" fill="rgba(0,238,255,0.06)" stroke="rgba(0,238,255,0.25)" strokeWidth="0.5" />
    {/* Center diamond */}
    <polygon points="14,10 18,14 14,18 10,14" fill="rgba(5,10,25,0.9)" stroke="rgba(0,238,255,0.2)" strokeWidth="0.5" />
    {/* Ø circle */}
    <circle cx="14" cy="14" r="5"
      stroke="url(#sbCircle)" strokeWidth="1.8" fill="none"
      filter="url(#sbGlow)"
    />
    {/* Ø slash */}
    <line x1="17.5" y1="9.5" x2="10.5" y2="18.5"
      stroke="url(#sbSlash)" strokeWidth="1.8" strokeLinecap="round"
      filter="url(#sbGlow)"
    />
    {/* Specular */}
    <circle cx="14" cy="14" r="5"
      stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" fill="none"
      strokeDasharray="8 24" strokeDashoffset="4"
    />
  </svg>
));
SidebarLogo.displayName = 'SidebarLogo';

const sidebarVariants = Object.freeze({
  expanded:  { width: 220 },
  collapsed: { width: 64 },
});

const ZMSidebar = memo(({ expanded, onToggle, currentPath }: ZMSidebarProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const navigate   = useNavigate();

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleHover = useCallback((id: string | null) => {
    if (mountedRef.current) setHoveredItem(id);
  }, []);

  const handleNav = useCallback((path: string) => {
    if (mountedRef.current) navigate(path);
  }, [navigate]);

  const sidebarStyle = useMemo(() => ({
    position:      'fixed' as const,
    top:           0, left: 0,
    height:        '100vh',
    background:    'var(--zm-sidebar-bg)',
    borderRight:   '1px solid var(--zm-glass-border)',
    display:       'flex',
    flexDirection: 'column' as const,
    zIndex:        60,
    overflow:      'hidden',
  }), []);

  const logoAreaStyle = useMemo(() => ({
    height:       '96px',
    display:      'flex',
    alignItems:   'center',
    padding:      '0 18px',
    borderBottom: '1px solid var(--zm-glass-border)',
    flexShrink:   0,
    gap:          '10px',
  }), []);

  const navStyle = useMemo(() => ({
    flex:       1,
    overflowY:  'auto' as const,
    overflowX:  'hidden' as const,
    padding:    '8px 8px',
    display:    'flex',
    flexDirection: 'column' as const,
    gap:        '2px',
  }), []);

  const getItemStyle = useCallback((id: string, path: string) => {
    const isActive  = currentPath === path || (path !== '/dashboard' && currentPath.startsWith(path));
    const isHovered = hoveredItem === id;
    return {
      display:        'flex',
      alignItems:     'center',
      gap:            '10px',
      padding:        expanded ? '8px 10px' : '8px',
      justifyContent: expanded ? 'flex-start' as const : 'center' as const,
      borderRadius:   '8px',
      background:     isActive  ? 'rgba(0,238,255,0.08)' : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
      border:         '1px solid ' + (isActive ? 'rgba(0,238,255,0.2)' : 'transparent'),
      color:          isActive  ? 'rgba(0,238,255,1)' : 'rgba(138,138,158,1)',
      cursor:         'pointer',
      transition:     'all 0.15s ease',
      willChange:     'transform',
      userSelect:     'none' as const,
      width:          '100%',
      textAlign:      'left' as const,
    };
  }, [currentPath, hoveredItem, expanded]);

  const labelStyle = useMemo(() => ({
    fontFamily:    "'Space Mono', monospace",
    fontSize:      '11px',
    letterSpacing: '0.05em',
    whiteSpace:    'nowrap' as const,
    overflow:      'hidden',
    textOverflow:  'ellipsis',
    fontWeight:    500,
  }), []);

  const iconWrapStyle = useMemo(() => ({
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    width:          '18px',
    height:         '18px',
    flexShrink:     0,
  }), []);

  return (
    <motion.nav
      variants={sidebarVariants}
      animate={expanded ? 'expanded' : 'collapsed'}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={sidebarStyle}
      aria-label="Main navigation"
      role="navigation"
    >
      {/* Logo area */}
      <div style={logoAreaStyle}>
        <SidebarLogo />
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.16 }}
            >
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(240,240,248,1)' }}>
                ZERØ
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', letterSpacing: '0.28em', color: 'rgba(0,238,255,0.55)', marginTop: '2px' }}>
                MERIDIAN
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle btn */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            marginLeft:     expanded ? 'auto' : undefined,
            width:          '20px', height: '20px',
            background:     'transparent',
            border:         '1px solid rgba(0,238,255,0.15)',
            borderRadius:   '5px',
            color:          'rgba(80,80,100,1)',
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '9px',
            flexShrink:     0,
          }}
        >
          {expanded ? '←' : '→'}
        </button>
      </div>

      {/* Nav items */}
      <div style={navStyle} role="list">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="listitem"
            onClick={() => handleNav(item.path)}
            onMouseEnter={() => handleHover(item.id)}
            onMouseLeave={() => handleHover(null)}
            aria-label={item.label}
            aria-current={currentPath === item.path ? 'page' : undefined}
            style={getItemStyle(item.id, item.path)}
          >
            <span style={iconWrapStyle}>{item.icon}</span>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.14 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, overflow: 'hidden' }}
                >
                  <span style={labelStyle}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      fontFamily:    "'Space Mono', monospace",
                      fontSize:      '8px',
                      padding:       '1px 5px',
                      borderRadius:  '3px',
                      background:    'rgba(0,238,255,0.08)',
                      border:        '1px solid rgba(0,238,255,0.2)',
                      color:         'rgba(0,238,255,0.8)',
                      letterSpacing: '0.04em',
                      flexShrink:    0,
                      marginLeft:    '6px',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>

      {/* Bottom */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--zm-glass-border)' }}>
        {BOTTOM_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNav(item.path)}
            onMouseEnter={() => handleHover(item.id)}
            onMouseLeave={() => handleHover(null)}
            aria-label={item.label}
            style={getItemStyle(item.id, item.path)}
          >
            <span style={iconWrapStyle}>{item.icon}</span>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                  style={labelStyle}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>
    </motion.nav>
  );
});

ZMSidebar.displayName = 'ZMSidebar';
export default ZMSidebar;
