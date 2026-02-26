/**
 * BottomNavBar.tsx — ZERØ MERIDIAN 2026 push26
 * Mobile 5-tab bottom navigation bar
 * - React.memo + displayName ✓
 * - 100% inline style, zero className ✓
 * - rgba() only, zero hsl() ✓
 * - var(--zm-*) for theme-aware colors ✓
 * - Zero template literals in JSX ✓
 * - Object.freeze() static data ✓
 * - useCallback + useMemo ✓
 * - will-change: transform on animated elements ✓
 * - aria-label + role for all interactive elements ✓
 * - Touch targets >= 48px ✓ (WCAG)
 * - Zero named export ✓
 */

import { memo, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Bell, Bookmark, MoreHorizontal,
} from 'lucide-react';

// ─── Nav tab config ───────────────────────────────────────────────────────────

interface NavTab {
  readonly label:  string;
  readonly path:   string;
  readonly icon:   typeof LayoutDashboard;
  readonly ariaLabel: string;
}

const NAV_TABS: readonly NavTab[] = Object.freeze([
  { label: 'Dash',    path: '/dashboard', icon: LayoutDashboard, ariaLabel: 'Navigate to Dashboard' },
  { label: 'Markets', path: '/markets',   icon: TrendingUp,      ariaLabel: 'Navigate to Markets'   },
  { label: 'Alerts',  path: '/alerts',    icon: Bell,            ariaLabel: 'Navigate to Alerts'    },
  { label: 'Watch',   path: '/watchlist', icon: Bookmark,        ariaLabel: 'Navigate to Watchlist' },
  { label: 'More',    path: '/defi',      icon: MoreHorizontal,  ariaLabel: 'Navigate to More pages'},
] as const);

// ─── Sub-component: single nav tab ───────────────────────────────────────────

interface TabButtonProps {
  readonly tab:       NavTab;
  readonly isActive:  boolean;
  readonly onPress:   (path: string) => void;
}

const TabButton = memo(({ tab, isActive, onPress }: TabButtonProps) => {
  const Icon = tab.icon;

  const handlePress = useCallback(() => {
    onPress(tab.path);
  }, [onPress, tab.path]);

  const iconColor = useMemo(() => (
    isActive ? 'rgba(96,165,250,1)' : 'rgba(148,163,184,0.5)'
  ), [isActive]);

  const labelColor = useMemo(() => (
    isActive ? 'rgba(96,165,250,1)' : 'rgba(148,163,184,0.4)'
  ), [isActive]);

  const dotStyle = useMemo(() => ({
    width:        '3px',
    height:       '3px',
    borderRadius: '50%',
    background:   'rgba(96,165,250,1)',
    margin:       '2px auto 0',
    opacity:      isActive ? 1 : 0,
    transition:   'opacity 0.15s',
    willChange:   'transform' as const,
  }), [isActive]);

  return (
    <button
      type="button"
      onClick={handlePress}
      aria-label={tab.ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      style={{
        flex:            1,
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        minHeight:       '48px',
        padding:         '6px 4px',
        background:      'transparent',
        border:          'none',
        cursor:          'pointer',
        outline:         'none',
        willChange:      'transform',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Icon
        size={20}
        style={{
          color:      iconColor,
          transition: 'color 0.15s',
          willChange: 'transform',
        }}
      />
      <span
        style={{
          fontFamily:    "'Space Mono', monospace",
          fontSize:      '9px',
          letterSpacing: '0.06em',
          color:         labelColor,
          marginTop:     '3px',
          transition:    'color 0.15s',
          lineHeight:    1,
        }}
      >
        {tab.label}
      </span>
      <div style={dotStyle} />
    </button>
  );
});
TabButton.displayName = 'TabButton';

// ─── Main BottomNavBar ────────────────────────────────────────────────────────

const BottomNavBar = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const handlePress = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const containerStyle = useMemo(() => ({
    position:        'fixed'          as const,
    bottom:          0,
    left:            0,
    right:           0,
    zIndex:          100,
    display:         'flex',
    alignItems:      'stretch',
    background:      'var(--zm-sidebar-bg)',
    borderTop:       '1px solid var(--zm-glass-border)',
    backdropFilter:  'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    paddingBottom:   'env(safe-area-inset-bottom, 0px)',
    willChange:      'transform' as const,
  }), []);

  return (
    <nav
      role="navigation"
      aria-label="Bottom navigation"
      style={containerStyle}
    >
      {NAV_TABS.map(tab => (
        <TabButton
          key={tab.path}
          tab={tab}
          isActive={currentPath === tab.path || currentPath.startsWith(tab.path + '/')}
          onPress={handlePress}
        />
      ))}
    </nav>
  );
});
BottomNavBar.displayName = 'BottomNavBar';

export default BottomNavBar;
