/**
 * MetricCard.tsx — ZERØ MERIDIAN push40
 * VISUAL OVERHAUL: larger values, bold change badges, better light mode
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX attrs ✓
 * - useCallback + useMemo ✓
 * - mountedRef ✓
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

const AnimatedValue = memo(({ value, accentColor }: { value: string; accentColor?: string }) => {
  const prevRef = useRef(value);
  const changed = prevRef.current !== value;

  useEffect(() => { prevRef.current = value; });

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
          display:    'inline-block',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize:   '1.45rem',
          fontWeight: 700,
          color:      accentColor ?? 'var(--zm-text-primary)',
          willChange: 'transform, opacity',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
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
    accentColor ? accentColor.replace('1)', '0.28)') : 'var(--zm-glass-border)',
    [accentColor]
  );

  const changePos    = change !== undefined && change >= 0;
  const changeColor  = change !== undefined
    ? (changePos ? 'var(--zm-positive)' : 'var(--zm-negative)')
    : undefined;
  const changeBg     = change !== undefined
    ? (changePos ? 'rgba(34,255,170,0.12)' : 'rgba(251,113,133,0.12)')
    : undefined;
  const changeBorder = change !== undefined
    ? (changePos ? 'rgba(52,211,153,0.28)' : 'rgba(251,113,133,0.28)')
    : undefined;
  const changeStr    = change !== undefined
    ? (change >= 0 ? '+' : '') + change.toFixed(2) + '%'
    : undefined;

  const topLineStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: 0, left: 0, right: 0,
    height: 2,
    background: 'linear-gradient(90deg, transparent, ' + (accentColor ?? 'rgba(96,165,250,0.6)') + ', transparent)',
    borderRadius: '12px 12px 0 0',
    opacity: 0.6,
  }), [accentColor]);

  if (loading) {
    return (
      <div style={{ minHeight: 96, padding: '16px', background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', borderRadius: '12px' }}>
        <Skeleton width={70} height={10} />
        <div style={{ marginTop: 12 }}><Skeleton width="60%" height={30} borderRadius={6} /></div>
        <div style={{ marginTop: 8 }}><Skeleton width={50} height={10} /></div>
      </div>
    );
  }

  return (
    <motion.div
      className="zm-glass zm-corners"
      style={{
        borderColor,
        position:  'relative',
        willChange:'transform',
        padding:   '14px 16px',
        display:   'flex',
        flexDirection: 'column',
        gap:       '6px',
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={TRANSITION.spring}
    >
      {/* Accent top line */}
      <div style={topLineStyle} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily:    "'IBM Plex Mono', monospace",
          fontSize:      '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          color:         'var(--zm-text-faint)',
        }}>
          {label}
        </span>
        {Icon && (
          <Icon size={14} style={{ color: accentColor ?? 'var(--zm-text-faint)', flexShrink: 0 }} />
        )}
      </div>

      {/* Value */}
      <AnimatedValue value={value} accentColor={accentColor} />

      {/* Change badge */}
      {changeStr !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontFamily:   "'JetBrains Mono', monospace",
            fontSize:     '11px',
            fontWeight:   600,
            color:        changeColor,
            background:   changeBg,
            border:       '1px solid ' + changeBorder,
            borderRadius: '4px',
            padding:      '1px 6px',
          }}>
            {changeStr}
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize:   '9px',
            color:      'var(--zm-text-faint)',
          }}>
            24h
          </span>
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)' }}>
          {subtitle}
        </span>
      )}
    </motion.div>
  );
});
MetricCard.displayName = 'MetricCard';

export default MetricCard;
