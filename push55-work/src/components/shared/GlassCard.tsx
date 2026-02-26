/**
 * GlassCard.tsx — ZERØ MERIDIAN
 * Base glass morphism card dengan Framer Motion hover/tap.
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX attrs ✓
 */

import { memo, type ReactNode, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { HOVER, TAP, TRANSITION } from '@/lib/motion';

interface GlassCardProps {
  children:     ReactNode;
  className?:   string;
  style?:       CSSProperties;
  onClick?:     () => void;
  hoverable?:   boolean;
  pressable?:   boolean;
  accentColor?: string;
  padding?:     string | number;
  as?:          'div' | 'article' | 'section';
}

// push34: hover glow effect
const GlassCard = memo(({
  children,
  className,
  style,
  onClick,
  hoverable = true,
  pressable = false,
  accentColor,
  padding = '1rem',
  as: _as = 'div',
}: GlassCardProps) => {
  const baseStyle: CSSProperties = {
    background: 'var(--zm-glass-bg)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid ' + (accentColor ? accentColor.replace('1)', '0.25)') : 'var(--zm-glass-border)'),
    borderRadius: 12,
    padding,
    position: 'relative',
    willChange: 'transform',
    ...style,
  };

  return (
    <motion.div
      className={'zm-corners ' + (className ?? '')}
      style={baseStyle}
      onClick={onClick}
      whileHover={hoverable ? HOVER.lift : undefined}
      whileTap={pressable ? TAP.press : undefined}
      transition={TRANSITION.spring}
    >
      {accentColor && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent, ' + accentColor + ', transparent)',
            borderRadius: '12px 12px 0 0',
            opacity: 0.6,
          }}
        />
      )}
      {children}
    </motion.div>
  );
});
GlassCard.displayName = 'GlassCard';

export default GlassCard;

