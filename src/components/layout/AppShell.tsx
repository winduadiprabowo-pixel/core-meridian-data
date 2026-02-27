/**
 * AppShell.tsx — ZERØ MERIDIAN 2026 push87
 * TOTAL ROMBAK — layout system bener
 *   - GlobalStatsBar: fixed top:0, height:28px, zIndex:200
 *   - Topbar: fixed top:28px, height:52px, zIndex:190  
 *   - Sidebar: fixed, full height, zIndex:180
 *   - Content: paddingTop=96px, marginLeft sesuai sidebar
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import ZMSidebar from './ZMSidebar';
import Topbar from './Topbar';
import BottomNavBar from './BottomNavBar';
import PageTransition from '../shared/PageTransition';
import GlobalStatsBar from '../shared/GlobalStatsBar';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import PWAInstallPrompt from '@/components/shared/PWAInstallPrompt';

interface AppShellProps {
  children:     React.ReactNode;
  currentPath?: string;
}

const STATS_H   = 28;
const TOPBAR_H  = 52;
const HEADER_H  = STATS_H + TOPBAR_H;
const SIDEBAR_E = 252;
const SIDEBAR_C = 68;

const overlayV = Object.freeze({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
});
const drawerV = Object.freeze({
  hidden:  { x: '-100%' },
  visible: { x: '0%', transition: { duration: 0.26, ease: [0.22,1,0.36,1] } },
  exit:    { x: '-100%', transition: { duration: 0.2, ease: [0.36,0,0.66,0] } },
});

const AppShell: React.FC<AppShellProps> = ({ children, currentPath: propPath }) => {
  const mountedRef  = useRef(true);
  const [expanded,  setExpanded]  = React.useState(true);
  const [drawerOpen,setDrawerOpen]= React.useState(false);
  const rm   = useReducedMotion();
  const loc  = useLocation();
  const { isMobile, isTablet } = useBreakpoint();

  const path    = propPath ?? loc.pathname;
  const mobile  = isMobile;
  const tablet  = isTablet;
  const drawer  = mobile || tablet;
  const bottomN = mobile;

  React.useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  React.useEffect(() => { if (drawer && drawerOpen) setDrawerOpen(false); }, [path]); // eslint-disable-line

  const toggle = useCallback(() => {
    if (!mountedRef.current) return;
    if (drawer) setDrawerOpen(p => !p);
    else setExpanded(p => !p);
  }, [drawer]);

  const closeDrawer = useCallback(() => { if (mountedRef.current) setDrawerOpen(false); }, []);

  const sw = useMemo(() => drawer ? 0 : expanded ? SIDEBAR_E : SIDEBAR_C, [drawer, expanded]);

  const contentStyle = useMemo(() => ({
    marginLeft:    sw,
    paddingTop:    HEADER_H + 24,
    paddingLeft:   mobile ? 14 : 26,
    paddingRight:  mobile ? 14 : 26,
    paddingBottom: bottomN ? 88 : 40,
    minHeight:     '100vh',
    background:    'rgba(8,10,16,1)',
    boxSizing:     'border-box' as const,
    transition:    rm ? 'none' : 'margin-left 0.25s cubic-bezier(0.22,1,0.36,1)',
  }), [sw, mobile, bottomN, rm]);

  return (
    <div style={{ minHeight: '100vh', background: 'rgba(8,10,16,1)' }}>

      <GlobalStatsBar />

      <Topbar
        onMenuToggle={toggle}
        sidebarExpanded={expanded}
        topOffset={STATS_H}
        height={TOPBAR_H}
        sidebarWidth={sw}
      />

      {!drawer && (
        <ZMSidebar
          expanded={expanded}
          onToggle={toggle}
          currentPath={path}
          headerHeight={HEADER_H}
          expandedWidth={SIDEBAR_E}
          collapsedWidth={SIDEBAR_C}
        />
      )}

      <AnimatePresence>
        {drawer && drawerOpen && (
          <>
            <motion.div key="ov" variants={overlayV} initial="hidden" animate="visible" exit="exit"
              style={{ position:'fixed' as const,inset:0,zIndex:170,background:'rgba(4,5,12,0.8)',backdropFilter:'blur(3px)',WebkitBackdropFilter:'blur(3px)' }}
              onClick={closeDrawer}
            />
            <motion.div key="dr" variants={rm?{}:drawerV} initial="hidden" animate="visible" exit="exit"
              style={{ position:'fixed' as const,top:0,left:0,bottom:0,zIndex:180,width:SIDEBAR_E }}>
              <ZMSidebar expanded={true} onToggle={closeDrawer} currentPath={path}
                headerHeight={HEADER_H} expandedWidth={SIDEBAR_E} collapsedWidth={SIDEBAR_C} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div style={contentStyle}>
        <div style={{ maxWidth: 1720, margin: '0 auto', width: '100%' }}>
          <AnimatePresence mode="wait">
            <PageTransition key={path}>{children}</PageTransition>
          </AnimatePresence>
        </div>
      </div>

      {bottomN && <BottomNavBar />}
      <PWAInstallPrompt />
    </div>
  );
};

AppShell.displayName = 'AppShell';
export default React.memo(AppShell);
