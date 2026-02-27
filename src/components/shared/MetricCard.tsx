/**
 * MetricCard.tsx — ZERØ MERIDIAN 2026 push88
 * Price flash green/red via CSS class zm-flash-up / zm-flash-down
 * - Zero className (kecuali flash CSS di index.css)
 * - rgba() only
 * - React.memo + displayName
 * - useCallback + useMemo + mountedRef
 */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface MetricCardProps {
  label:       string;
  value:       string | number;
  change?:     number;
  changeLabel?: string;
  sub?:        string;
  icon?:       React.ReactNode;
  color?:      'blue' | 'green' | 'red' | 'yellow' | 'violet' | 'auto';
  size?:       'sm' | 'md' | 'lg';
  loading?:    boolean;
  onClick?:    () => void;
  highlight?:  boolean;
  prefix?:     string;
  suffix?:     string;
  sparkline?:  number[];
}

const ACCENT_COLORS = Object.freeze({
  blue:   { color:'rgba(79,127,255,1)',  bg:'rgba(79,127,255,0.07)',  border:'rgba(79,127,255,0.15)'  },
  green:  { color:'rgba(61,214,140,1)',  bg:'rgba(61,214,140,0.07)',  border:'rgba(61,214,140,0.15)'  },
  red:    { color:'rgba(255,102,102,1)', bg:'rgba(255,102,102,0.07)', border:'rgba(255,102,102,0.15)' },
  yellow: { color:'rgba(255,180,50,1)',  bg:'rgba(255,180,50,0.07)',  border:'rgba(255,180,50,0.15)'  },
  violet: { color:'rgba(150,120,255,1)', bg:'rgba(150,120,255,0.07)', border:'rgba(150,120,255,0.15)' },
  auto:   { color:'rgba(185,190,220,1)', bg:'transparent',            border:'transparent'            },
});

const SIZE_MAP = Object.freeze({
  sm: { valueFSize:16, labelFSize:9,  subFSize:9,  pad:'12px 14px' },
  md: { valueFSize:22, labelFSize:10, subFSize:10, pad:'16px 18px' },
  lg: { valueFSize:28, labelFSize:11, subFSize:10, pad:'20px 22px' },
});

const Sparkline = memo(({ data }: { data: number[] }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64, h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = data[data.length - 1];
  const first = data[0];
  const isPos = last >= first;
  const color = isPos ? 'rgba(61,214,140,1)' : 'rgba(255,102,102,1)';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
    </svg>
  );
});
Sparkline.displayName = 'Sparkline';

const MetricCard: React.FC<MetricCardProps> = ({
  label, value, change, changeLabel, sub, icon,
  color = 'blue', size = 'md', loading = false,
  onClick, highlight = false, prefix, suffix, sparkline,
}) => {
  const mountedRef  = useRef(true);
  const rm          = useReducedMotion();
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevValRef  = useRef(value);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const autoColor = useMemo(() => {
    if (color !== 'auto' || change === undefined) return color;
    if (change > 0) return 'green';
    if (change < 0) return 'red';
    return 'blue';
  }, [color, change]);

  const ac    = ACCENT_COLORS[autoColor as keyof typeof ACCENT_COLORS] ?? ACCENT_COLORS.blue;
  const sizes = SIZE_MAP[size];

  // Flash on value change
  useEffect(() => {
    if (prevValRef.current === value) return;
    if (typeof value === 'number' && typeof prevValRef.current === 'number') {
      const direction = value > prevValRef.current ? 'up' : 'down';
      if (!rm && mountedRef.current) {
        setFlash(direction);
        const t = setTimeout(() => { if (mountedRef.current) setFlash(null); }, 650);
        return () => clearTimeout(t);
      }
    }
    prevValRef.current = value;
  }, [value, rm]);

  const isPos = (change ?? 0) >= 0;
  const chColor = isPos ? 'rgba(61,214,140,1)' : 'rgba(255,102,102,1)';

  const cardStyle = useMemo(() => ({
    background:   flash === 'up'   ? 'rgba(61,214,140,0.06)'
                : flash === 'down' ? 'rgba(255,102,102,0.06)'
                : (highlight ? ac.bg : 'rgba(255,255,255,0.03)'),
    border:       '1px solid ' + (highlight ? ac.border : 'rgba(255,255,255,0.07)'),
    borderRadius: 10,
    padding:      sizes.pad,
    cursor:       onClick ? 'pointer' : 'default',
    position:     'relative' as const,
    overflow:     'hidden',
    transition:   rm ? 'none' : 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
  }), [flash, highlight, ac, sizes.pad, onClick, rm]);

  const fmtValue = useCallback((v: string | number) => {
    if (typeof v === 'string') return v;
    if (v === 0) return '0';
    if (Math.abs(v) >= 1e12) return (v / 1e12).toFixed(2) + 'T';
    if (Math.abs(v) >= 1e9)  return (v / 1e9).toFixed(2)  + 'B';
    if (Math.abs(v) >= 1e6)  return (v / 1e6).toFixed(2)  + 'M';
    if (Math.abs(v) >= 1000) return v.toLocaleString('en-US');
    if (Math.abs(v) < 0.01)  return v.toFixed(6);
    return v.toFixed(2);
  }, []);

  if (loading) {
    return (
      <div style={{ ...cardStyle, display:'flex',flexDirection:'column' as const,gap:8 }}>
        <div style={{ height:10, width:'60%', borderRadius:4, background:'rgba(255,255,255,0.06)',
          backgroundImage:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
          backgroundSize:'200% 100%', animation:'zm-shimmer 1.6s infinite' }}/>
        <div style={{ height:22, width:'40%', borderRadius:4, background:'rgba(255,255,255,0.06)',
          backgroundImage:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
          backgroundSize:'200% 100%', animation:'zm-shimmer 1.6s infinite' }}/>
      </div>
    );
  }

  return (
    <motion.div style={cardStyle} onClick={onClick}
      whileHover={rm || !onClick ? {} : { borderColor:ac.border, boxShadow:'0 0 16px ' + ac.bg }}
      transition={{ duration:0.15 }}>

      {highlight && (
        <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(to right, '+ac.color+', transparent)',borderRadius:'10px 10px 0 0' }}/>
      )}

      {/* Header row */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom: size === 'lg' ? 12 : 8 }}>
        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
          {icon && (
            <span style={{ color:ac.color,opacity:0.7,display:'flex',alignItems:'center',justifyContent:'center',width:14,height:14,flexShrink:0 }}>
              {icon}
            </span>
          )}
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:sizes.labelFSize,color:'rgba(90,95,125,1)',letterSpacing:'0.10em',textTransform:'uppercase' as const,fontWeight:600 }}>
            {label}
          </span>
        </div>
        {change !== undefined && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:chColor,background: isPos ? 'rgba(61,214,140,0.08)' : 'rgba(255,102,102,0.08)',border:'1px solid '+(isPos ? 'rgba(61,214,140,0.18)' : 'rgba(255,102,102,0.18)'),padding:'1px 5px',borderRadius:4,fontWeight:600,letterSpacing:'0.03em',flexShrink:0 }}>
            {changeLabel ?? ((change >= 0 ? '+' : '') + change.toFixed(2) + '%')}
          </span>
        )}
      </div>

      {/* Value */}
      <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:8 }}>
        <div style={{ display:'flex',alignItems:'baseline',gap:3 }}>
          {prefix && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize: sizes.valueFSize * 0.55,color:'rgba(130,135,165,1)',marginBottom:2 }}>{prefix}</span>}
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:sizes.valueFSize,fontWeight:600,color:'rgba(215,220,240,1)',lineHeight:1,letterSpacing:'-0.01em' }}>
            {fmtValue(value)}
          </span>
          {suffix && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize: sizes.valueFSize * 0.50,color:'rgba(130,135,165,1)',marginBottom:2 }}>{suffix}</span>}
        </div>
        {sparkline && <Sparkline data={sparkline}/>}
      </div>

      {sub && (
        <div style={{ marginTop:5,fontFamily:"'Space Grotesk',sans-serif",fontSize:sizes.subFSize,color:'rgba(75,80,110,1)' }}>
          {sub}
        </div>
      )}
    </motion.div>
  );
};

MetricCard.displayName = 'MetricCard';
export default memo(MetricCard);
