/**
 * ZMSidebar.tsx — ZERØ MERIDIAN 2026 push23
 * push23: Hardcoded dark rgba(10,12,22) → var(--zm-sidebar-bg)
 * push25: wrap with React.memo() per ZM rules
 * Phase 12: Intelligence page added.
 * Phase 11: CSS Subgrid layout for nav items.
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX ✓
 * - Object.freeze() all static data ✓
 * - useCallback + useMemo ✓
 * - mountedRef ✓
 * - aria-label + role ✓
 * - var(--zm-*) theme-aware ✓ ← push23
 */

import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  id:     string;
  label:  string;
  path:   string;
  icon:   React.ReactNode;
  badge?: number | string;
}

interface ZMSidebarProps {
  expanded:    boolean;
  onToggle:    () => void;
  currentPath: string;
}

const NAV_ITEMS: readonly NavItem[] = Object.freeze([
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'markets',
    label: 'Markets',
    path: '/markets',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <polyline points="1,13 5,8 8,11 12,5 17,7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    badge: 3,
  },
  {
    id: 'defi',
    label: 'DeFi',
    path: '/defi',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="4" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="14" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="6.5" y1="8" x2="11.5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6.5" y1="10" x2="11.5" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'onchain',
    label: 'On-Chain',
    path: '/onchain',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="1" y="7" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="7" y="4" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="13" y="1" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="3" cy="4" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="9" cy="2" r="1.5" fill="currentColor" opacity="0.6" />
      </svg>
    ),
    badge: 'NEW',
  },
  {
    id: 'intelligence',
    label: 'AI Intel',
    path: '/intelligence',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <polygon points="9,1 17,14 1,14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
        <circle cx="9" cy="9" r="2" fill="currentColor" opacity="0.7" />
        <line x1="9" y1="7" x2="9" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="11" y1="10.5" x2="13.5" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="7" y1="10.5" x2="4.5" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
    badge: '10',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    path: '/alerts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 2C6.24 2 4 4.24 4 7v5l-1.5 2h13L14 12V7c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 15a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    path: '/portfolio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 9 L9 2 A7 7 0 0 1 16 9 Z" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'watchlist',
    label: 'Watchlist',
    path: '/watchlist',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 2L11.09 6.26L16 7.27L12.5 10.64L13.18 15.59L9 13.35L4.82 15.59L5.5 10.64L2 7.27L6.91 6.26L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'converter',
    label: 'Converter',
    path: '/converter',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 6h12M11 3l4 3-4 3M15 12H3M7 9l-4 3 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'charts',
    label: 'Charts',
    path: '/charts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    badge: 'NEW',
  },
  {
    id: 'fundamentals',
    label: 'Fundamentals',
    path: '/fundamentals',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M2 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="2" y="10" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.5" />
        <rect x="7" y="6" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.7" />
        <rect x="12" y="2" width="3" height="14" rx="0.5" fill="currentColor" opacity="0.9" />
      </svg>
    ),
  },
  {
    id: 'derivatives',
    label: 'Derivatives',
    path: '/derivatives',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M1 14 L5 6 L9 10 L13 3 L17 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="5" cy="6" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="13" cy="3" r="1.5" fill="currentColor" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'orderbook',
    label: 'Order Book',
    path: '/orderbook',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <line x1="2" y1="4" x2="10" y2="4" stroke="rgba(52,211,153,0.8)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="7" x2="8"  y2="7" stroke="rgba(52,211,153,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="13" x2="14" y2="13" stroke="rgba(252,129,74,0.8)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="16" x2="11" y2="16" stroke="rgba(252,129,74,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]);

const BOTTOM_ITEMS: readonly NavItem[] = Object.freeze([
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.42 1.42M13.36 13.36l1.42 1.42M3.22 14.78l1.42-1.42M13.36 4.64l1.42-1.42"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]);

const sidebarVariants = Object.freeze({
  expanded:  { width: 240 },
  collapsed: { width: 72 },
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
    position: 'fixed' as const,
    top: 0,
    left: 0,
    height: '100vh',
    background: 'var(--zm-sidebar-bg)',
    borderRight: '1px solid var(--zm-glass-border)',
    display: 'flex',
    flexDirection: 'column' as const,
    zIndex: 60,
    overflow: 'hidden',
  }), []);

  const logoAreaStyle = useMemo(() => ({
    height: '64px',
    paddingTop: '32px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    borderBottom: '1px solid var(--zm-glass-border)',
    flexShrink: 0,
  }), []);

  const navGridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: expanded ? '36px 1fr' : '36px',
    gridTemplateRows: 'auto',
    gap: '2px',
    padding: '8px 10px',
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
  }), [expanded]);

  const getItemStyle = useCallback((id: string, path: string) => {
    const isActive  = currentPath === path || (path !== '/dashboard' && currentPath.startsWith(path));
    const isHovered = hoveredItem === id;
    return {
      display: 'grid',
      gridColumn: '1 / -1',
      gridTemplateColumns: 'subgrid',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 10px',
      borderRadius: '8px',
      background:   isActive  ? 'var(--zm-accent-dim)' : isHovered ? 'var(--zm-glass-hover)' : 'transparent',
      border:       isActive  ? '1px solid var(--zm-accent-border)' : '1px solid transparent',
      color:        isActive  ? 'var(--zm-accent)' : 'var(--zm-text-secondary)',
      cursor:       'pointer',
      transition:   'background 0.15s, border-color 0.15s, color 0.15s',
      willChange:   'transform',
      textDecoration: 'none',
      userSelect:   'none' as const,
    };
  }, [currentPath, hoveredItem]);

  const labelStyle = useMemo(() => ({
    fontFamily:     "'Space Mono', monospace",
    fontSize:       '11px',
    letterSpacing:  '0.06em',
    whiteSpace:     'nowrap' as const,
    overflow:       'hidden',
    textOverflow:   'ellipsis',
  }), []);

  return (
    <motion.nav
      variants={sidebarVariants}
      animate={expanded ? 'expanded' : 'collapsed'}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={sidebarStyle}
      aria-label="Main navigation"
      role="navigation"
    >
      {/* Logo */}
      <div style={logoAreaStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="10" stroke="rgba(96,165,250,0.7)" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="4" fill="rgba(96,165,250,0.7)" />
            <line x1="14" y1="2" x2="14" y2="6"  stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="22" x2="14" y2="26" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2"  y1="14" x2="6"  y2="14" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="22" y1="14" x2="26" y2="14" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--zm-text-primary)' }}>
                  ZERØ
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', letterSpacing: '0.24em', color: 'rgba(96,165,250,0.6)' }}>
                  MERIDIAN
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={expanded}
        style={{
          position: 'absolute' as const,
          top: '20px',
          right: expanded ? '12px' : '50%',
          transform: expanded ? 'none' : 'translateX(50%)',
          width: '22px', height: '22px',
          background: 'var(--zm-glass-bg)',
          border: '1px solid var(--zm-glass-border)',
          borderRadius: '6px',
          color: 'var(--zm-text-faint)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          willChange: 'transform',
        }}
      >
        {expanded ? '←' : '→'}
      </button>

      {/* Nav items */}
      <div style={navGridStyle} role="list">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
          return (
            <button
              key={item.id}
              type="button"
              role="listitem"
              onClick={() => handleNav(item.path)}
              onMouseEnter={() => handleHover(item.id)}
              onMouseLeave={() => handleHover(null)}
              aria-label={item.label + (item.badge ? ' (' + item.badge + ' notifications)' : '')}
              aria-current={isActive ? 'page' : undefined}
              style={getItemStyle(item.id, item.path)}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36 }}>
                {item.icon}
              </span>
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.14 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }}
                  >
                    <span style={labelStyle}>{item.label}</span>
                    {item.badge != null && (
                      <span style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '8px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: typeof item.badge === 'string' ? 'var(--zm-violet-bg)' : 'var(--zm-warning-bg)',
                        border: '1px solid ' + (typeof item.badge === 'string' ? 'var(--zm-violet-border)' : 'var(--zm-warning-border)'),
                        color: typeof item.badge === 'string' ? 'var(--zm-violet)' : 'var(--zm-warning)',
                        letterSpacing: '0.04em',
                        flexShrink: 0,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Bottom items */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--zm-glass-border)' }}>
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
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36 }}>
              {item.icon}
            </span>
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
