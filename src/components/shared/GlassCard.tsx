/**
 * GlassCard.tsx — ZERØ MERIDIAN push103
 * push103: useDevicePerf → fallback tanpa blur di low/mid device
 * - React.memo + displayName ✓  rgba() only ✓  Zero className ✓
 * - useMemo style objects ✓  backdropFilter reduced for mobile perf ✓
 */

import { memo, type ReactNode, type CSSProperties, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HOVER, TAP, TRANSITION } from '@/lib/motion';
import { useDevicePerf } from '@/hooks/useDevicePerf';

interface GlassCardProps {
  children:      ReactNode;
  style?:        CSSProperties;
  onClick?:      () => void;
  hoverable?:    boolean;
  pressable?:    boolean;
  accentColor?:  string;
  padding?:      string | number;
  role?:         string;
  'aria-label'?: string;
}

const GlassCard = memo(({
  children, style, onClick, hoverable = true, pressable = false,
  accentColor, padding = '1rem', role, 'aria-label': ariaLabel,
}: GlassCardProps) => {

  const { heavyBlur } = useDevicePerf();

  const baseStyle = useMemo((): CSSProperties => ({
    background:           'var(--zm-glass-bg)',
    ...(heavyBlur
      ? {
          backdropFilter:       'blur(12px) saturate(160%)',
          WebkitBackdropFilter: 'blur(12px) saturate(160%)',
        }
      : {
          // Fallback: slightly richer background instead of blur
          background: 'rgba(18,22,38,0.97)',
        }
    ),
    border:        '1px solid ' + (accentColor
      ? accentColor.replace(/[\d.]+\)$/, '0.22)')
      : 'var(--zm-glass-border)'),
    borderRadius:  12,
    padding,
    position:      'relative',
    willChange:    'transform',
    ...style,
  }), [accentColor, padding, style, heavyBlur]);

  const topLineStyle = useMemo((): CSSProperties | null => {
    if (!accentColor) return null;
    return {
      position:      'absolute',
      top:           0, left: 0, right: 0,
      height:        1,
      background:    'linear-gradient(90deg, transparent, ' + accentColor + ', transparent)',
      borderRadius:  '12px 12px 0 0',
      opacity:       0.55,
      pointerEvents: 'none',
    };
  }, [accentColor]);

  return (
    <motion.div
      style={baseStyle}
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
      whileHover={hoverable ? HOVER.lift : undefined}
      whileTap={pressable ? TAP.press : undefined}
      transition={TRANSITION.spring}
    >
      {topLineStyle && <div style={topLineStyle} />}
      {children}
    </motion.div>
  );
});
GlassCard.displayName = 'GlassCard';
export default GlassCard;
