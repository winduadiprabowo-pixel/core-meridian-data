/**
 * Topbar.tsx — ZERØ MERIDIAN 2026 push88
 * Bloomberg-grade topbar — left ikut sidebarWidth, slim & clean
 * - Zero className → style={{}} only
 * - rgba() only
 * - React.memo + displayName
 * - useCallback + useMemo + mountedRef
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface TopbarProps {
  onMenuToggle:    () => void;
  sidebarExpanded: boolean;
  topOffset:       number;
  height:          number;
  sidebarWidth:    number;
}

const SunIcon  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const MoonIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);

const PWAInstallButton = React.memo(() => {
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
  const [done, setDone] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  useEffect(() => {
    if (isInstalled && mountedRef.current) {
      setDone(true);
      const t = setTimeout(() => { if (mountedRef.current) setDone(false); }, 3000);
      return () => clearTimeout(t);
    }
  }, [isInstalled]);
  const click = useCallback(async () => { await triggerInstall(); }, [triggerInstall]);
  if (!canInstall && !done) return null;
  return (
    <motion.button type="button" onClick={done ? undefined : click}
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      style={{
        width:32,height:32,borderRadius:8,
        background: done ? 'rgba(61,214,140,0.08)' : 'rgba(255,255,255,0.05)',
        border: '1px solid ' + (done ? 'rgba(61,214,140,0.25)' : 'rgba(255,255,255,0.08)'),
        cursor: done ? 'default' : 'pointer',
        display:'flex',alignItems:'center',justifyContent:'center',
        color: done ? 'rgba(61,214,140,0.9)' : 'rgba(120,125,155,1)',flexShrink:0,
      }}>
      {done
        ? (<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>)
        : (<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2v6.5M4 6l2.5 3 2.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>)
      }
    </motion.button>
  );
});
PWAInstallButton.displayName = 'PWAInstallButton';

const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, sidebarExpanded, topOffset, height, sidebarWidth }) => {
  const mountedRef = useRef(true);
  const rm         = useReducedMotion();
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
  const { theme, setTheme } = useTheme();
  const { isMobile, isTablet } = useBreakpoint();
  const isDark  = theme !== 'light';
  const compact = isMobile || isTablet;

  useEffect(() => {
    mountedRef.current = true;
    const iv = setInterval(() => {
      if (mountedRef.current) setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => { mountedRef.current = false; clearInterval(iv); };
  }, []);

  const toggleTheme = useCallback(() => {
    if (mountedRef.current) setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const topbarStyle = useMemo(() => ({
    position:             'fixed' as const,
    top:                  topOffset,
    left:                 sidebarWidth,
    right:                0,
    zIndex:               190,
    height:               height,
    background:           'rgba(8,10,16,0.95)',
    backdropFilter:       'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom:         '1px solid rgba(255,255,255,0.06)',
    display:              'flex',
    alignItems:           'center',
    padding:              isMobile ? '0 14px' : '0 22px',
    gap:                  10,
    transition:           rm ? 'none' : 'left 0.25s cubic-bezier(0.22,1,0.36,1)',
  }), [topOffset, sidebarWidth, height, isMobile, rm]);

  const btnStyle = useMemo(() => ({
    width:32,height:32,borderRadius:8,
    background:'rgba(255,255,255,0.04)',
    border:'1px solid rgba(255,255,255,0.07)',
    cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
    color:'rgba(120,125,155,1)',flexShrink:0,transition:'all 0.13s',
  }), []);

  return (
    <header role="banner" style={topbarStyle}>

      {/* Hamburger */}
      <button type="button" onClick={onMenuToggle} style={btnStyle} aria-label="Toggle sidebar">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <rect x="1.5" y="3"    width={sidebarExpanded ? 12 : 8} height="1.4" rx="0.7" fill="currentColor" style={{ transition:'width 0.2s' }}/>
          <rect x="1.5" y="6.8" width="8"                         height="1.4" rx="0.7" fill="currentColor"/>
          <rect x="1.5" y="10.6" width={sidebarExpanded ? 12 : 4} height="1.4" rx="0.7" fill="currentColor" style={{ transition:'width 0.2s' }}/>
        </svg>
      </button>

      {/* Brand — desktop only */}
      {!compact && (
        <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'12px',fontWeight:700,letterSpacing:'0.13em',color:'rgba(210,215,240,0.85)',flexShrink:0 }}>
          ZER&#216; MERIDIAN
        </span>
      )}

      {/* Quick nav — desktop */}
      {!compact && (
        <nav style={{ display:'flex',gap:2,marginLeft:14 }}>
          {[['Dashboard','/dashboard'],['Markets','/markets'],['DeFi','/defi'],['AI Intel','/intelligence']].map(([l,p]) => (
            <a key={p} href={p} style={{ padding:'4px 10px',borderRadius:6,fontSize:'11px',fontFamily:"'JetBrains Mono',monospace",color:'rgba(95,100,130,1)',textDecoration:'none',letterSpacing:'0.03em',transition:'all 0.12s' }}
              onMouseEnter={e=>{ const t=e.target as HTMLElement; t.style.background='rgba(255,255,255,0.05)'; t.style.color='rgba(190,195,225,1)'; }}
              onMouseLeave={e=>{ const t=e.target as HTMLElement; t.style.background='transparent'; t.style.color='rgba(95,100,130,1)'; }}>
              {l}
            </a>
          ))}
        </nav>
      )}

      <div style={{ flex:1 }} />

      {/* Right cluster */}
      <div style={{ display:'flex',alignItems:'center',gap: isMobile ? 5 : 7,flexShrink:0 }}>

        {/* Clock */}
        {!isMobile && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'10px',color:'rgba(70,75,100,1)',letterSpacing:'0.08em',whiteSpace:'nowrap' as const,minWidth:68,textAlign:'right' as const }}>
            {time}
          </span>
        )}

        <PWAInstallButton />

        {/* Theme toggle */}
        <motion.button onClick={toggleTheme} style={btnStyle}
          whileHover={rm ? {} : { scale:1.05 }} whileTap={rm ? {} : { scale:0.95 }}
          aria-label={isDark ? 'Light mode' : 'Dark mode'}>
          {isDark ? <SunIcon /> : <MoonIcon />}
        </motion.button>

        {/* LIVE badge — desktop */}
        {!isMobile && (
          <div style={{ display:'flex',alignItems:'center',gap:5,background:'rgba(61,214,140,0.06)',border:'1px solid rgba(61,214,140,0.14)',borderRadius:14,padding:'3px 9px',fontSize:'9px',fontFamily:"'JetBrains Mono',monospace",color:'rgba(61,214,140,0.7)',letterSpacing:'0.09em',flexShrink:0 }}>
            <motion.div
              style={{ width:5,height:5,borderRadius:'50%',background:'rgba(61,214,140,0.85)',flexShrink:0 }}
              animate={rm ? {} : { opacity:[1,0.3,1] }} transition={{ duration:1.8,repeat:Infinity }}
            />
            LIVE
          </div>
        )}

        {/* Avatar */}
        <motion.button
          style={{ width:30,height:30,borderRadius:'50%',background:'rgba(79,127,255,0.10)',border:'1px solid rgba(79,127,255,0.18)',cursor:'pointer',fontSize:'11px',fontWeight:700,color:'rgba(79,127,255,0.9)',fontFamily:"'JetBrains Mono',monospace",flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}
          whileHover={rm ? {} : { scale:1.05 }} whileTap={rm ? {} : { scale:0.95 }} aria-label="Profile">
          W
        </motion.button>
      </div>
    </header>
  );
};

Topbar.displayName = 'Topbar';
export default React.memo(Topbar);
