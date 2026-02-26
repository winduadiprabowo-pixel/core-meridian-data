/**
 * MetricCard.tsx — ZERØ MERIDIAN 2026
 * Upgraded: Framer Motion AnimatedValue, skeleton state, will-change.
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX attrs ✓
 * - useCallback + useMemo ✓
 */

import { memo, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { TRANSITION, VARIANTS } from '@/lib/motion';
import Skeleton from './Skeleton';

interface MetricCardProps {
  label:        string;
  value:        string;
  change?:      number;
  icon?:        LucideIcon;
  accentColor?: string;
  loading?:     boolean;
  subtitle?:    string;
}

// Animated number that flips when value changes
const AnimatedValue = memo(({ value }: { value: string }) => {
  const prevRef = useRef(value);
  const changed = prevRef.current !== value;

  useEffect(() => {
    prevRef.current = value;
  });

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={value}
        variants={VARIANTS.numberFlip}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={changed ? TRANSITION.springBouncy : TRANSITION.fast}
        style={{
          display:  'inline-block',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--zm-text-primary)',
          willChange: 'transform, opacity',
        }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
});
AnimatedValue.displayName = 'AnimatedValue';

const MetricCard = memo(({
  label,
  value,
  change,
  icon: Icon,
  accentColor,
  loading = false,
  subtitle,
}: MetricCardProps) => {
  const borderColor = useMemo(() =>
    accentColor ? accentColor.replace('1)', '0.25)') : 'var(--zm-glass-border)',
    [accentColor]
  );

  const changeColor = useMemo(() => {
    if (change === undefined) return undefined;
    return change >= 0 ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)';
  }, [change]);

  const changeStr = useMemo(() => {
    if (change === undefined) return undefined;
    return (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
  }, [change]);

  const topLineStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: 0, left: 0, right: 0,
    height: 1,
    background: 'linear-gradient(90deg, transparent, ' + (accentColor ?? 'rgba(96,165,250,0.5)') + ', transparent)',
    borderRadius: '12px 12px 0 0',
    opacity: 0.5,
  }), [accentColor]);

  if (loading) {
    return (
      <div
        className="zm-glass zm-corners p-4 flex flex-col gap-2"
        style={{ minHeight: 88 }}
      >
        <div className="flex items-center justify-between">
          <Skeleton width={70} height={10} />
          <Skeleton width={14} height={14} borderRadius={4} />
        </div>
        <Skeleton width="60%" height={28} borderRadius={6} />
        <Skeleton width={50} height={10} />
      </div>
    );
  }

  return (
    <motion.div
      className="zm-glass zm-corners p-4 flex flex-col gap-1"
      style={{
        borderColor,
        position: 'relative',
        willChange: 'transform',
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={TRANSITION.spring}
    >
      {/* Accent top line */}
      <div style={topLineStyle} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-mono-ui uppercase tracking-wider"
          style={{ color: 'var(--zm-text-faint)' }}
        >
          {label}
        </span>
        {Icon && (
          <Icon
            size={14}
            style={{ color: accentColor ?? 'var(--zm-text-faint)', flexShrink: 0 }}
          />
        )}
      </div>

      {/* Value */}
      <AnimatedValue value={value} />

      {/* Change */}
      {changeStr !== undefined && (
        <span
          className="text-xs font-mono"
          style={{ color: changeColor }}
        >
          {changeStr}
        </span>
      )}

      {/* Subtitle */}
      {subtitle && (
        <span
          className="text-[10px] font-mono-ui"
          style={{ color: 'var(--zm-text-faint)' }}
        >
          {subtitle}
        </span>
      )}
    </motion.div>
  );
});
MetricCard.displayName = 'MetricCard';

export default MetricCard;
