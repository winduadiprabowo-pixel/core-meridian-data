/**
 * GlassCard.tsx — ZERØ MERIDIAN 2026 push88
 * Unified card component — semua via CSS variables
 * - Zero className → style={{}} only
 * - rgba() only
 * - React.memo + displayName
 */

import React, { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface GlassCardProps {
  children:    React.ReactNode;
  title?:      string;
  subtitle?:   string;
  badge?:      string;
  badgeColor?: 'blue' | 'green' | 'red' | 'yellow' | 'violet';
  action?:     React.ReactNode;
  hover?:      boolean;
  padding?:    number | string;
  style?:      React.CSSProperties;
  onClick?:    () => void;
  noBorder?:   boolean;
  compact?:    boolean;
  glow?:       'blue' | 'green' | 'red' | 'none';
}

const BADGE_COLORS: Record<string, { bg: string; border: string; color: string }> = Object.freeze({
  blue:   { bg:'rgba(79,127,255,0.10)',  border:'rgba(79,127,255,0.22)',  color:'rgba(99,147,255,1)'  },
  green:  { bg:'rgba(61,214,140,0.10)',  border:'rgba(61,214,140,0.22)',  color:'rgba(61,214,140,1)'  },
  red:    { bg:'rgba(255,102,102,0.10)', border:'rgba(255,102,102,0.22)', color:'rgba(255,102,102,1)' },
  yellow: { bg:'rgba(255,180,50,0.10)',  border:'rgba(255,180,50,0.22)',  color:'rgba(255,180,50,1)'  },
  violet: { bg:'rgba(150,120,255,0.10)', border:'rgba(150,120,255,0.22)', color:'rgba(150,120,255,1)' },
});

const GLOW: Record<string, string> = Object.freeze({
  blue:  '0 0 20px rgba(79,127,255,0.10)',
  green: '0 0 20px rgba(61,214,140,0.10)',
  red:   '0 0 20px rgba(255,102,102,0.10)',
  none:  'none',
});

const GlassCard: React.FC<GlassCardProps> = ({
  children, title, subtitle, badge, badgeColor = 'blue',
  action, hover = true, padding, style: extraStyle,
  onClick, noBorder = false, compact = false, glow = 'none',
}) => {
  const rm = useReducedMotion();
  const bc = BADGE_COLORS[badgeColor] ?? BADGE_COLORS.blue;
  const p  = padding ?? (compact ? '14px 16px' : '20px');

  const cardStyle = useMemo(() => ({
    background:    'rgba(255,255,255,0.03)',
    border:        noBorder ? 'none' : '1px solid rgba(255,255,255,0.07)',
    borderRadius:  10,
    overflow:      'hidden',
    cursor:        onClick ? 'pointer' : 'default',
    boxShadow:     GLOW[glow] ?? 'none',
    transition:    rm ? 'none' : 'border-color 0.15s ease, box-shadow 0.15s ease',
    ...extraStyle,
  }), [noBorder, onClick, glow, rm, extraStyle]);

  const inner = (
    <>
      {(title || action) && (
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: action ? 'space-between' : 'flex-start',
          padding:        `${compact ? '12px 16px' : '16px 20px'} 0`,
          paddingLeft:    typeof p === 'number' ? p : '20px',
          paddingRight:   typeof p === 'number' ? p : '20px',
          paddingTop:     compact ? 12 : 16,
          borderBottom:   title ? '1px solid rgba(255,255,255,0.05)' : 'none',
          gap:            10,
        }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0 }}>
            {title && (
              <span style={{
                fontFamily:"'JetBrains Mono',monospace",
                fontSize: compact ? '10px' : '11px',
                fontWeight: 600,
                letterSpacing: '0.07em',
                color: 'rgba(185,190,220,0.9)',
                whiteSpace: 'nowrap' as const,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {title}
              </span>
            )}
            {subtitle && (
              <span style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:'11px',color:'rgba(90,95,125,1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const }}>
                {subtitle}
              </span>
            )}
            {badge && (
              <span style={{ padding:'2px 7px',borderRadius:4,background:bc.bg,border:'1px solid '+bc.border,color:bc.color,fontFamily:"'JetBrains Mono',monospace",fontSize:'8px',letterSpacing:'0.09em',fontWeight:600,flexShrink:0 }}>
                {badge}
              </span>
            )}
          </div>
          {action && <div style={{ flexShrink:0 }}>{action}</div>}
        </div>
      )}
      <div style={{ padding: p }}>{children}</div>
    </>
  );

  if (!hover || !onClick) {
    return <div style={cardStyle}>{inner}</div>;
  }

  return (
    <motion.div style={cardStyle} onClick={onClick}
      whileHover={rm ? {} : { borderColor:'rgba(79,127,255,0.28)', boxShadow:'0 0 20px rgba(79,127,255,0.08)' }}
      transition={{ duration:0.15 }}>
      {inner}
    </motion.div>
  );
};

GlassCard.displayName = 'GlassCard';
export default memo(GlassCard);
