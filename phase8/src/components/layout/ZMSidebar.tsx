import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface ZMSidebarProps {
  expanded: boolean;
  onToggle: () => void;
  currentPath: string;
}

const NAV_ITEMS: readonly NavItem[] = Object.freeze([
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="7" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="7" y="4" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="13" y="1" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="3" cy="4" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="9" cy="2" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="15" cy="0.5" r="1.5" fill="currentColor" />
      </svg>
    ),
    badge: 'NEW',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    path: '/portfolio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 9 L9 2 A7 7 0 0 1 16 9 Z" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="10" width="4" height="7" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="7" y="6" width="4" height="11" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="13" y="2" width="4" height="15" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'portal',
    label: 'Portal',
    path: '/portal',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="9" y1="1" x2="9" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="9" y1="13" x2="9" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="1" y1="9" x2="5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.42 1.42M13.36 13.36l1.42 1.42M3.22 14.78l1.42-1.42M13.36 4.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]);

const sidebarVariants = Object.freeze({
  expanded: { width: 240 },
  collapsed: { width: 72 },
});

const ZMSidebar: React.FC<ZMSidebarProps> = ({ expanded, onToggle, currentPath }) => {
  const prefersReducedMotion = useReducedMotion();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const mountedRef = useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleHover = useCallback((id: string | null) => {
    if (mountedRef.current) setHoveredItem(id);
  }, []);

  const sidebarStyle = useMemo(() => ({
    position: 'fixed' as const,
    top: 0,
    left: 0,
    height: '100vh',
    background: 'rgba(10, 12, 22, 0.96)',
    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column' as const,
    zIndex: 60,
    overflow: 'hidden',
  }), []);

  const logoAreaStyle = useMemo(() => ({
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    flexShrink: 0,
  }), []);

  const getItemStyle = useCallback((isActive: boolean, isHovered: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 20px',
    borderRadius: '10px',
    margin: '2px 8px',
    cursor: 'pointer',
    textDecoration: 'none',
    color: isActive ? 'rgba(255,255,255,1)' : isHovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)',
    background: isActive
      ? 'rgba(99, 179, 237, 0.12)'
      : isHovered
        ? 'var(--zm-surface-2)'
        : 'transparent',
    borderLeft: isActive ? '2px solid rgba(99,179,237,0.8)' : '2px solid transparent',
    transition: prefersReducedMotion ? 'none' : 'all 0.15s ease',
    position: 'relative' as const,
    overflow: 'hidden',
  }), [prefersReducedMotion]);

  const labelStyle = useMemo(() => ({
    fontFamily: "'Space Mono', monospace",
    fontSize: '12px',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
  }), []);

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={expanded ? 'expanded' : 'collapsed'}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={sidebarStyle}
      role="navigation"
      aria-label="Sidebar navigation"
      aria-expanded={expanded}
    >
      {/* Logo area */}
      <div style={logoAreaStyle}>
        <motion.div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(99,179,237,0.4) 0%, rgba(154,230,180,0.4) 100%)',
            border: '1px solid rgba(99,179,237,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            color: 'rgba(255,255,255,0.9)',
            flexShrink: 0,
          }}
          whileHover={prefersReducedMotion ? {} : { rotate: 180, scale: 1.05 }}
          transition={{ duration: 0.4 }}
          aria-hidden="true"
        >
          Ø
        </motion.div>

        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              style={{
                marginLeft: '10px',
                fontFamily: "'Space Mono', monospace",
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.85)',
                whiteSpace: 'nowrap',
              }}
            >
              MERIDIAN
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path;
          const isHovered = hoveredItem === item.id;

          return (
            <motion.a
              key={item.id}
              href={item.path}
              style={getItemStyle(isActive, isHovered)}
              onHoverStart={() => handleHover(item.id)}
              onHoverEnd={() => handleHover(null)}
              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Hover shimmer */}
              {isHovered && !prefersReducedMotion && (
                <motion.div
                  layoutId="hoverShimmer"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(99,179,237,0.04)',
                    borderRadius: '8px',
                  }}
                  transition={{ duration: 0.15 }}
                />
              )}

              <span style={{ flexShrink: 0, position: 'relative' }}>
                {item.icon}
                {item.badge != null && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: 'rgba(252, 129, 74, 1)',
                    fontSize: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,1)',
                    fontWeight: 700,
                  }}>
                    {item.badge}
                  </span>
                )}
              </span>

              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.15 }}
                    style={labelStyle}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.a>
          );
        })}
      </nav>

      {/* Bottom items */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 0' }}>
        {BOTTOM_ITEMS.map((item) => {
          const isHovered = hoveredItem === item.id;
          return (
            <motion.a
              key={item.id}
              href={item.path}
              style={getItemStyle(false, isHovered)}
              onHoverStart={() => handleHover(item.id)}
              onHoverEnd={() => handleHover(null)}
              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
              aria-label={item.label}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.15 }}
                    style={labelStyle}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.a>
          );
        })}
      </div>
    </motion.aside>
  );
};

ZMSidebar.displayName = 'ZMSidebar';

export default React.memo(ZMSidebar);
export { ZMSidebar };
