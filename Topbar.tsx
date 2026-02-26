/**
 * Topbar.tsx — ZERØ MERIDIAN push54fix
 * FIX: ZMLogo kini punya useReducedMotion() sendiri (bukan closure dari parent)
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - var(--zm-*) ✓
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { usePerformance } from '@/hooks/usePerformance';

interface TopbarProps {
  onMenuToggle:    () => void;
  sidebarExpanded: boolean;
}

const IS_DEV = import.meta.env.DEV;

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="11.5" y1="11.5" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HamburgerIcon = ({ open }: { open: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <motion.rect x="2" y="4"    width="14" height="1.5" rx="0.75" fill="currentColor"
      animate={open ? { width: 14 } : { width: 10 }} transition={{ duration: 0.2 }}/>
    <rect           x="2" y="8.25" width="10" height="1.5" rx="0.75" fill="currentColor"/>
    <motion.rect x="2" y="12.5" width="14" height="1.5" rx="0.75" fill="currentColor"
      animate={open ? { width: 14 } : { width: 6 }} transition={{ duration: 0.2 }}/>
  </svg>
);

// ── ZMLogo — self-contained, punya hook sendiri ──────────────────────────────
const ZMLogo = () => {
  const prefersReduced = useReducedMotion(); // FIX: hook di dalam ZMLogo sendiri
  const [narrow, setNarrow] = React.useState(() => window.innerWidth < 480);

  React.useEffect(() => {
    const handler = () => setNarrow(window.innerWidth < 480);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
      <motion.div
        style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--zm-accent) 0%, var(--zm-positive) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 18px rgba(0,238,255,0.45), 0 0 6px var(--zm-accent-border) inset',
          willChange: 'transform',
        }}
        animate={prefersReduced ? {} : {
          boxShadow: [
            '0 0 18px rgba(0,238,255,0.45), 0 0 6px var(--zm-accent-border) inset',
            '0 0 28px rgba(0,238,255,0.70), 0 0 10px rgba(0,238,255,0.30) inset',
            '0 0 18px rgba(0,238,255,0.45), 0 0 6px var(--zm-accent-border) inset',
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '13px', fontWeight: 900,
          color: 'var(--zm-bg-base)', letterSpacing: '-1px',
        }}>ZM</span>
      </motion.div>

      {!narrow && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '15px', fontWeight: 700, letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, var(--zm-accent) 0%, var(--zm-positive) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 0 8px rgba(0,238,255,0.55))',
            lineHeight: 1,
          }}>ZER\u00d8 MERIDIAN</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '8px', letterSpacing: '0.12em',
            color: 'var(--zm-glass-border-hover)', textTransform: 'uppercase' as const,
          }}>Crypto Intelligence</span>
        </div>
      )}
    </div>
  );
};

ZMLogo.displayName = 'ZMLogo';

const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, sidebarExpanded }) => {
  const mountedRef           = useRef(true);
  const prefersReducedMotion = useReducedMotion();
  const [time, setTime]      = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
  const { theme, setTheme }  = useTheme();
  const { metrics }          = usePerformance(IS_DEV);
  const isDark               = theme !== 'light';

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    const interval   = setInterval(() => {
      if (mountedRef.current) setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => { mountedRef.current = false; controller.abort(); clearInterval(interval); };
  }, []);

  const handleToggle      = useCallback(() => { onMenuToggle(); }, [onMenuToggle]);
  const handleThemeToggle = useCallback(() => {
    if (mountedRef.current) setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const topbarStyle = useMemo(() => ({
    position:             'fixed' as const,
    top:                  '40px',
    right:                0,
    left:                 0,
    zIndex:               50,
    height:               '56px',
    background:           'var(--zm-topbar-bg)',
    backdropFilter:       'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderBottom:         '1px solid var(--zm-card-border)',
    display:              'flex',
    alignItems:           'center',
    padding:              '0 20px',
    gap:                  '14px',
    willChange:           'transform',
  }), []);

  return (
    <header role="banner" style={topbarStyle} aria-label="Application topbar">

      <motion.button
        onClick={handleToggle}
        style={{
          background: 'rgba(0,238,255,0.06)', border: '1px solid rgba(0,238,255,0.14)',
          borderRadius: '8px', padding: '7px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(0,238,255,0.70)', willChange: 'transform' as const, flexShrink: 0,
        }}
        whileHover={prefersReducedMotion ? {} : { scale: 1.05, borderColor: 'rgba(0,238,255,0.35)', color: 'var(--zm-accent)' }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
        aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={sidebarExpanded}
      >
        <HamburgerIcon open={sidebarExpanded} />
      </motion.button>

      <ZMLogo />

      <div style={{
        flex: 1, maxWidth: '320px', marginLeft: '16px',
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(10,16,32,1)', border: '1px solid var(--zm-accent-border)',
        borderRadius: '10px', padding: '7px 12px',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
      }}>
        <SearchIcon />
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px',
          color: 'var(--zm-text-faint)', userSelect: 'none',
        }}>
          Search assets, protocols...
        </span>
        <span style={{
          marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px', color: 'var(--zm-glass-border-hover)',
          padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(0,238,255,0.15)',
        }}>\u2318K</span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>

        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
          color: 'var(--zm-text-faint)', letterSpacing: '0.06em',
        }} aria-live="polite" aria-atomic="true">{time} UTC</span>

        {IS_DEV && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: metrics.isSmooth ? 'rgba(34,255,170,0.06)' : 'var(--zm-negative-bg)',
            border: '1px solid ' + (metrics.isSmooth ? 'rgba(34,255,170,0.20)' : 'rgba(255,68,136,0.30)'),
            borderRadius: '10px', padding: '2px 8px', fontSize: '9px',
            fontFamily: "'JetBrains Mono', monospace",
            color: metrics.isSmooth ? 'rgba(34,255,170,0.80)' : 'rgba(255,68,136,0.8)',
            willChange: 'transform' as const,
          }} role="status" aria-label={'FPS: ' + metrics.fps}>
            <span>{metrics.fps}</span>
            <span style={{ opacity: 0.5 }}>fps</span>
          </div>
        )}

        <motion.button
          onClick={handleThemeToggle}
          style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'rgba(0,238,255,0.06)', border: '1px solid rgba(0,238,255,0.12)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(0,238,255,0.65)', willChange: 'transform' as const,
          }}
          whileHover={prefersReducedMotion ? {} : { scale: 1.08, color: 'var(--zm-accent)', borderColor: 'rgba(0,238,255,0.35)', boxShadow: '0 0 10px var(--zm-accent-border)' }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </motion.button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--zm-positive-bg)', border: '1px solid var(--zm-positive-border)',
          borderRadius: '20px', padding: '5px 12px',
          fontSize: '11px', fontFamily: "'JetBrains Mono', monospace",
          color: 'var(--zm-positive)', letterSpacing: '0.08em', fontWeight: 700,
          boxShadow: '0 0 8px rgba(34,255,170,0.15)',
        }} role="status" aria-label="Network status: live">
          <motion.div
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--zm-positive)', boxShadow: '0 0 6px rgba(34,255,170,0.80)', flexShrink: 0 }}
            animate={prefersReducedMotion ? {} : { opacity: [1, 0.3, 1], boxShadow: ['0 0 6px rgba(34,255,170,0.80)', '0 0 2px rgba(34,255,170,0.3)', '0 0 6px rgba(34,255,170,0.80)'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            aria-hidden="true"
          />
          LIVE
        </div>

        <motion.button
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--zm-accent-border) 0%, rgba(34,255,170,0.25) 100%)',
            border: '1px solid var(--zm-accent-border)',
            cursor: 'pointer', fontSize: '12px', fontWeight: 700,
            color: 'var(--zm-accent)', fontFamily: "'Space Grotesk', sans-serif",
            willChange: 'transform' as const, boxShadow: '0 0 8px rgba(0,238,255,0.12)',
          }}
          whileHover={prefersReducedMotion ? {} : { scale: 1.08, boxShadow: '0 0 16px rgba(0,238,255,0.30)' }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
          aria-label="User profile"
        >
          W
        </motion.button>

      </div>
    </header>
  );
};

Topbar.displayName = 'Topbar';
export default React.memo(Topbar);
