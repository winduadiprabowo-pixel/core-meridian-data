/**
 * PageTransition.tsx — ZERØ MERIDIAN
 * AnimatePresence wrapper for route-level page transitions.
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX attrs ✓
 */

import { memo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { VARIANTS, TRANSITION } from '@/lib/motion';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = memo(({ children }: PageTransitionProps) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={VARIANTS.pageSlideUp}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={TRANSITION.normal}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
});
PageTransition.displayName = 'PageTransition';

export default PageTransition;
