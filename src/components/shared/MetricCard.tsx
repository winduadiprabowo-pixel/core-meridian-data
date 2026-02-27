/**
 * MetricCard.tsx — ZERØ MERIDIAN 2026 push75
 * push75: ZERO className — all inline styles. Skeleton state rebuilt.
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero className ✓
 * - Zero template literals ✓
 * - useCallback + useMemo ✓
 * - Object.freeze static styles ✓
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

const CARD_BASE = Object.freeze({
  position:  'relative'  as const,
  willChange: 'transform' as const,
  background: 'rgba(255,255,255,0.03)',
  borderRadius: 10,
  padding: 18,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 6,
  minHeight: 92,
});

const SKELETON_BASE = Object.freeze({
  background:   'rgba(255,255,255,0.05)',
  border:       '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
  padding:      16,
  display:      'flex',
  flexDirection: 'column' as const,
  gap:          8,
  minHeight:    88,
});

const SKELETON_ROW = Object.freeze({
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
});

// Animated number that flips when value changes
const AnimatedValue = memo(({ value }: { value: string }) => {
  const prevRef = useRef(value);
  const changed = prevRef.current !== value;

  useEffect(() => { prevRef.current = value; });

  const style = useMemo(() => ({
    display:    'inline-block',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize:   '1.35rem',
    fontWeight: 700,
    color:      'rgba(240,240,248,1)',
    willChange: 'transform, opacity',
  }), []);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={value}
        variants={VARIANTS.numberFlip}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={changed ? TRANSITION.springBouncy : TRANSITION.fast}
        style={style}
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

  const cardStyle = useMemo(() => ({
    ...CARD_BASE,
    border: '1px solid ' + (accentColor ? accentColor.replace('1)', '0.15)') : 'rgba(255,255,255,0.06)'),
  }), [accentColor]);

  const changeColor = useMemo(() => {
    if (change === undefined) return undefined;
    return change >= 0 ? 'rgba(61,214,140,1)' : 'rgba(255,102,102,1)';
  }, [change]);

  const changeStr = useMemo(() => {
    if (change === undefined) return undefined;
    return (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
  }, [change]);

  const topLineStyle = useMemo(() => ({
    position:   'absolute' as const,
    top: 0, left: 0, right: 0,
    height:     1,
    background: 'linear-gradient(90deg, transparent, ' + (accentColor ?? 'rgba(96,165,250,0.5)') + ', transparent)',
    borderRadius: '12px 12px 0 0',
    opacity:    0.5,
  }), [accentColor]);

  const labelStyle = useMemo(() => ({
    fontFamily:    "'IBM Plex Mono', monospace",
    fontSize:      9,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color:         'rgba(80,85,115,1)',
  }), []);

  const changeStyle = useMemo(() => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize:   11,
    color:      changeColor,
  }), [changeColor]);

  const subtitleStyle = useMemo(() => ({
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize:   10,
    color:      'rgba(80,80,100,1)',
  }), []);

  const headerRowStyle = useMemo(() => ({
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
  }), []);

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={SKELETON_BASE}>
        <div style={SKELETON_ROW}>
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
      style={cardStyle}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={TRANSITION.spring}
    >
      {/* Accent top line */}
      <div style={topLineStyle} />

      {/* Header row */}
      <div style={headerRowStyle}>
        <span style={labelStyle}>{label}</span>
        {Icon && (
          <Icon
            size={14}
            style={{ color: accentColor ?? 'rgba(80,80,100,1)', flexShrink: 0 }}
          />
        )}
      </div>

      {/* Value */}
      <AnimatedValue value={value} />

      {/* Change */}
      {changeStr !== undefined && (
        <span style={changeStyle}>{changeStr}</span>
      )}

      {/* Subtitle */}
      {subtitle && (
        <span style={subtitleStyle}>{subtitle}</span>
      )}
    </motion.div>
  );
});

MetricCard.displayName = 'MetricCard';
export default MetricCard;
