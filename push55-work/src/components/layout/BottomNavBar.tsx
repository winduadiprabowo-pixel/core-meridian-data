/**
 * BottomNavBar.tsx — ZERØ MERIDIAN push40fix
 * VISUAL OVERHAUL: CoinGlass-style with pill active indicator, larger icons,
 * smooth transitions, proper light/dark mode support
 * - React.memo + displayName ✓
 * - 100% inline style, zero className ✓
 * - rgba() only ✓
 * - var(--zm-*) theme-aware ✓
 * - Zero template literals in JSX ✓
 * - Object.freeze() static data ✓
 * - useCallback + useMemo ✓
 * - Touch targets >= 48px ✓
 */

import { memo, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Bell, Bookmark, MoreHorizontal,
} from 'lucide-react';

interface NavTab {
  readonly label:     string;
  readonly path:      string;
  readonly icon:      typeof LayoutDashboard;
  readonly ariaLabel: string;
}

const NAV_TABS: readonly NavTab[] = Object.freeze([
  { label: 'Dash',    path: '/dashboard', icon: LayoutDashboard, ariaLabel: 'Navigate to Dashboard' },
  { label: 'Markets', path: '/markets',   icon: TrendingUp,      ariaLabel: 'Navigate to Markets'   },
  { label: 'Alerts',  path: '/alerts',    icon: Bell,            ariaLabel: 'Navigate to Alerts'    },
  { label: 'Watch',   path: '/watchlist', icon: Bookmark,        ariaLabel: 'Navigate to Watchlist' },
  { label: 'More',    path: '/defi',      icon: MoreHorizontal,  ariaLabel: 'Navigate to More pages'},
] as const);

interface TabButtonProps {
  readonly tab:      NavTab;
  readonly isActive: boolean;
  readonly onPress:  (path: string) => void;
}

const TabButton = memo(({ tab, isActive, onPress }: TabButtonProps) => {
  const Icon = tab.icon;

  const handlePress = useCallback(() => { onPress(tab.path); }, [onPress, tab.path]);

  const pillStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: '6px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: isActive ? '44px' : '0px',
    height: '32px',
    borderRadius: '10px',
    background: isActive ? 'var(--zm-accent-bg)' : 'transparent',
    border: isActive ? '1px solid var(--zm-accent-border)' : '1px solid transparent',
    transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
    willChange: 'transform' as const,
    pointerEvents: 'none' as const,
  }), [isActive]);

  const iconColor  = isActive ? 'var(--zm-accent)' : 'var(--zm-text-faint)';
  const labelColor = isActive ? 'var(--zm-accent)' : 'var(--zm-text-faint)';
  const labelWeight = isActive ? 600 : 400;

  return (
    <button
      type="button"
      onClick={handlePress}
      aria-label={tab.ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      style={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        minHeight:      '56px',
        padding:        '0 4px',
        background:     'transparent',
        border:         'none',
        cursor:         'pointer',
        outline:        'none',
        position:       'relative',
        willChange:     'transform',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={pillStyle} />
      <Icon
        size={22}
        style={{
          color:        iconColor,
          transition:   'color 0.18s ease, transform 0.18s ease',
          transform:    isActive ? 'scale(1.10)' : 'scale(1)',
          willChange:   'transform',
          position:     'relative',
          zIndex:       1,
          marginBottom: '3px',
        }}
      />
      <span
        style={{
          fontFamily:    "'IBM Plex Mono', monospace",
          fontSize:      '9px',
          letterSpacing: '0.04em',
          color:         labelColor,
          fontWeight:    labelWeight,
          transition:    'color 0.18s ease',
          lineHeight:    1,
          position:      'relative',
          zIndex:        1,
        }}
      >
        {tab.label}
      </span>
    </button>
  );
});
TabButton.displayName = 'TabButton';

const BottomNavBar = memo(() => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const currentPath = location.pathname;

  const handlePress = useCallback((path: string) => { navigate(path); }, [navigate]);

  const containerStyle = useMemo(() => ({
    position:             'fixed' as const,
    bottom:               0, left: 0, right: 0,
    zIndex:               100,
    display:              'flex',
    alignItems:           'stretch',
    background:           'var(--zm-sidebar-bg)',
    borderTop:            '1px solid var(--zm-glass-border)',
    backdropFilter:       'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    paddingBottom:        'env(safe-area-inset-bottom, 0px)',
    willChange:           'transform' as const,
    boxShadow:            '0 -4px 24px rgba(0,0,0,0.15)',
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
