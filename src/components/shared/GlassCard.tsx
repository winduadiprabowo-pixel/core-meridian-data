/**
 * GlassCard.tsx — ZERØ MERIDIAN 2026 push75
 * push75: Removed className prop — zero className constraint enforced.
 * Callers must pass style={{ ... }} for customization.
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero className ✓
 * - Zero template literals ✓
 */

import { memo, type ReactNode, type CSSProperties, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HOVER, TAP, TRANSITION } from '@/lib/motion';

interface GlassCardProps {
  children:     ReactNode;
  style?:       CSSProperties;
  onClick?:     () => void;
  hoverable?:   boolean;
  pressable?:   boolean;
  accentColor?: string;
  padding?:     string | number;
}

const GlassCard = memo(({
  children,
  style,
  onClick,
  hoverable = true,
  pressable = false,
  accentColor,
  padding = '1rem',
}: GlassCardProps) => {

  const baseStyle = useMemo((): CSSProperties => ({
    background:          'rgba(255,255,255,0.05)',
    backdropFilter:      'blur(20px) saturate(180%)',
    WebkitBackdropFilter:'blur(20px) saturate(180%)',
    border:              '1px solid ' + (accentColor ? accentColor.replace('1)', '0.25)') : 'rgba(32,42,68,1)'),
    borderRadius:        12,
    padding,
    position:            'relative',
    willChange:          'transform',
    ...style,
  }), [accentColor, padding, style]);

  const accentLineStyle = useMemo(() => ({
    position:     'absolute' as const,
    top: 0, left: 0, right: 0,
    height:       1,
    background:   'linear-gradient(90deg, transparent, ' + accentColor + ', transparent)',
    borderRadius: '12px 12px 0 0',
    opacity:      0.6,
  }), [accentColor]);

  return (
    <motion.div
      style={baseStyle}
      onClick={onClick}
      whileHover={hoverable ? HOVER.lift : undefined}
      whileTap={pressable ? TAP.press : undefined}
      transition={TRANSITION.spring}
    >
      {accentColor && <div style={accentLineStyle} />}
      {children}
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';
export default GlassCard;
