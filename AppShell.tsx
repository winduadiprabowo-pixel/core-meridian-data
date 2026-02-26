/**
 * AppShell.tsx — ZERØ MERIDIAN 2026
 * Layout shell: Sidebar + Topbar + GlobalStatsBar + content area.
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - useCallback + useMemo ✓
 * - mountedRef ✓
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ZMSidebar } from './ZMSidebar';
import { Topbar } from './Topbar';
import PageTransition from '../shared/PageTransition';
import GlobalStatsBar from '../layout/GlobalStatsBar';

interface AppShellProps {
  children: React.ReactNode;
  currentPath?: string;
}

const shellVariants = Object.freeze({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
});

const mainVariants = Object.freeze({
  collapsed: { marginLeft: 72 },
  expanded:  { marginLeft: 240 },
});

const AppShell: React.FC<AppShellProps> = ({ children, currentPath: propPath }) => {
  const mountedRef           = useRef(true);
  const [sidebarExpanded, setSidebarExpanded] = React.useState(true);
  const prefersReducedMotion = useReducedMotion();
  const location             = useLocation();

  const currentPath = propPath ?? location.pathname;

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const toggleSidebar = useCallback(() => {
    if (mountedRef.current) setSidebarExpanded(prev => !prev);
  }, []);

  const mainStyle = useMemo(() => ({
    minHeight:  '100vh',
    background: 'rgba(8, 10, 18, 1)',
    transition: prefersReducedMotion ? 'none' : 'margin-left 0.3s cubic-bezier(0.22,1,0.36,1)',
  }), [prefersReducedMotion]);

  const contentStyle = useMemo(() => ({
    padding:    '0 24px 24px',
    paddingTop: '80px',
  }), []);

  return (
    <motion.div
      variants={shellVariants}
      initial="initial"
      animate="animate"
      style={{ display: 'flex', minHeight: '100vh', background: 'rgba(8,10,18,1)' }}
    >
      <ZMSidebar expanded={sidebarExpanded} onToggle={toggleSidebar} currentPath={currentPath} />

      <motion.main
        animate={sidebarExpanded ? 'expanded' : 'collapsed'}
        variants={mainVariants}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={mainStyle}
        className="flex-1"
      >
        {/* Global stats bar — always on top */}
        <GlobalStatsBar />

        <Topbar onMenuToggle={toggleSidebar} sidebarExpanded={sidebarExpanded} />

        <div style={contentStyle}>
          <AnimatePresence mode="wait">
            <PageTransition key={currentPath}>
              {children}
            </PageTransition>
          </AnimatePresence>
        </div>
      </motion.main>
    </motion.div>
  );
};

AppShell.displayName = 'AppShell';

export default React.memo(AppShell);
export { AppShell };
