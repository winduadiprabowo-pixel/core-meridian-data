/**
 * ZMSidebar.tsx — ZERØ MERIDIAN 2026 push87
 * TOTAL ROMBAK — sidebar bersih kayak Coinbase
 * - Logo area full tinggi, ga kepotong
 * - Nav items spacing lega
 * - Warna blue bukan cyan
 * Props baru: headerHeight, expandedWidth, collapsedWidth
 */

import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  id:     string;
  label:  string;
  path:   string;
  icon:   React.ReactNode;
  badge?: string;
  group?: string;
}

interface ZMSidebarProps {
  expanded:       boolean;
  onToggle:       () => void;
  currentPath:    string;
  headerHeight:   number;
  expandedWidth:  number;
  collapsedWidth: number;
}

const mkIcon = (d: string, extra?: React.ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    {extra}
  </svg>
);

const NAV_ITEMS: readonly NavItem[] = Object.freeze([
  {
    id:'dashboard', label:'Dashboard', path:'/dashboard', group:'OVERVIEW',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>),
  },
  {
    id:'markets', label:'Markets', path:'/markets', group:'OVERVIEW',
    icon: mkIcon('M1 12 L4.5 7 L7.5 9.5 L11 4 L15 6'),
  },
  {
    id:'watchlist', label:'Watchlist', path:'/watchlist', group:'OVERVIEW',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L9.9 5.4L14 6L11 8.9L11.8 13L8 11L4.2 13L5 8.9L2 6L6.1 5.4L8 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>),
  },
  {
    id:'charts', label:'Charts', path:'/charts', group:'TRADING',
    icon: mkIcon('M1 13 L4.5 8 L7.5 10.5 L11.5 5 L15 7'),
  },
  {
    id:'orderbook', label:'Order Book', path:'/orderbook', group:'TRADING',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="3" x2="9" y2="3" stroke="rgba(79,127,255,0.85)" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="6" x2="6.5" y2="6" stroke="rgba(79,127,255,0.45)" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="10" x2="11" y2="10" stroke="rgba(255,102,102,0.85)" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="13" x2="7.5" y2="13" stroke="rgba(255,102,102,0.45)" strokeWidth="1.5" strokeLinecap="round"/></svg>),
  },
  {
    id:'derivatives', label:'Derivatives', path:'/derivatives', group:'TRADING',
    icon: mkIcon('M1 13 L4 6 L8 9.5 L12 3 L15 7'),
  },
  {
    id:'defi', label:'DeFi', path:'/defi', group:'ANALYTICS',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="3.5" r="2.2" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="12.5" r="2.2" stroke="currentColor" strokeWidth="1.5"/><line x1="5.2" y1="7" x2="10.8" y2="4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="5.2" y1="9" x2="10.8" y2="11.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>),
  },
  {
    id:'onchain', label:'On-Chain', path:'/onchain', badge:'NEW', group:'ANALYTICS',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="7.5" width="3" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="6.5" y="4.5" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="11.5" y="1.5" width="3" height="13" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>),
  },
  {
    id:'intelligence', label:'AI Intel', path:'/intelligence', group:'ANALYTICS',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.5"/></svg>),
  },
  {
    id:'portfolio', label:'Portfolio', path:'/portfolio', group:'PERSONAL',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 8 L8 1.5 A6.5 6.5 0 0 1 14.5 8 Z" fill="currentColor" opacity="0.2"/></svg>),
  },
  {
    id:'alerts', label:'Alerts', path:'/alerts', group:'PERSONAL',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C5.8 2 4 3.8 4 6v4L2.5 12.5h11L12 10V6c0-2.2-1.8-4-4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
  },
  {
    id:'converter', label:'Converter', path:'/converter', group:'PERSONAL',
    icon: mkIcon('M2 5h12M10 2l4 3-4 3M14 11H2M6 8l-4 3 4 3'),
  },
]);

const BOTTOM_ITEMS: readonly NavItem[] = Object.freeze([
  {
    id:'settings', label:'Settings', path:'/settings',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.93 2.93l1.07 1.07M12 12l1.07 1.07M2.93 13.07l1.07-1.07M12 4l1.07-1.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
  },
]);

const GROUP_ORDER = Object.freeze(['OVERVIEW','TRADING','ANALYTICS','PERSONAL']);

const LogoMark = memo(() => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <circle cx="14" cy="14" r="11" stroke="rgba(79,127,255,0.15)" strokeWidth="1" fill="rgba(79,127,255,0.05)"/>
    <circle cx="14" cy="14" r="7.5" stroke="rgba(79,127,255,0.9)" strokeWidth="1.6" fill="none"/>
    <line x1="17" y1="9" x2="11" y2="19" stroke="rgba(79,127,255,1)" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
));
LogoMark.displayName = 'LogoMark';

const ZMSidebar = memo(({ expanded, onToggle, currentPath, headerHeight, expandedWidth, collapsedWidth }: ZMSidebarProps) => {
  const rm = useReducedMotion();
  const [hovered, setHovered] = useState<string|null>(null);
  const mountedRef = useRef(true);
  const navigate   = useNavigate();

  React.useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const hover  = useCallback((id: string|null) => { if (mountedRef.current) setHovered(id); }, []);
  const nav    = useCallback((path: string) => { if (mountedRef.current) navigate(path); }, [navigate]);
  const toggle = useCallback(() => onToggle(), [onToggle]);

  const isActive = useCallback((path: string) =>
    currentPath === path || (path !== '/dashboard' && currentPath.startsWith(path))
  , [currentPath]);

  const groups = useMemo(() => {
    const map: Record<string, NavItem[]> = {};
    NAV_ITEMS.forEach(item => { const g = item.group ?? 'OTHER'; if (!map[g]) map[g]=[]; map[g].push(item); });
    return map;
  }, []);

  const sidebarStyle = useMemo(() => ({
    position:      'fixed' as const,
    top:           0, left: 0,
    height:        '100vh',
    width:         expanded ? expandedWidth : collapsedWidth,
    background:    'rgba(6,7,13,1)',
    borderRight:   '1px solid rgba(255,255,255,0.05)',
    display:       'flex',
    flexDirection: 'column' as const,
    zIndex:        180,
    overflow:      'hidden',
    transition:    rm ? 'none' : 'width 0.22s cubic-bezier(0.22,1,0.36,1)',
  }), [expanded, expandedWidth, collapsedWidth, rm]);

  const getItemStyle = useCallback((id: string, path: string) => {
    const active  = isActive(path);
    const isHov   = hovered === id && !active;
    return {
      display:        'flex',
      alignItems:     'center',
      gap:            12,
      padding:        expanded ? '8px 10px 8px 14px' : '8px',
      justifyContent: expanded ? 'flex-start' as const : 'center' as const,
      borderRadius:   8,
      background:     active ? 'rgba(79,127,255,0.08)' : isHov ? 'rgba(255,255,255,0.04)' : 'transparent',
      border:         '1px solid ' + (active ? 'rgba(79,127,255,0.18)' : 'transparent'),
      color:          active ? 'rgba(99,147,255,1)' : isHov ? 'rgba(195,200,225,1)' : 'rgba(95,100,130,1)',
      cursor:         'pointer',
      transition:     'all 0.12s ease',
      userSelect:     'none' as const,
      width:          '100%',
      textAlign:      'left' as const,
      position:       'relative' as const,
      marginBottom:   1,
    };
  }, [currentPath, hovered, expanded, isActive]);

  const renderItem = useCallback((item: NavItem) => {
    const active = isActive(item.path);
    return (
      <button key={item.id} type="button"
        onClick={() => nav(item.path)}
        onMouseEnter={() => hover(item.id)}
        onMouseLeave={() => hover(null)}
        aria-label={item.label}
        style={getItemStyle(item.id, item.path)}
      >
        {active && (
          <div style={{
            position:'absolute', left:0, top:'20%', bottom:'20%',
            width:3, borderRadius:'0 3px 3px 0',
            background:'rgba(79,127,255,1)',
          }} />
        )}
        <span style={{ display:'flex',alignItems:'center',justifyContent:'center',width:17,height:17,flexShrink:0 }}>
          {item.icon}
        </span>
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-4 }} transition={{ duration:0.12 }}
              style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flex:1,overflow:'hidden' }}
            >
              <span style={{ fontFamily:"'Space Mono',monospace",fontSize:'11px',letterSpacing:'0.01em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontWeight:500 }}>
                {item.label}
              </span>
              {item.badge && (
                <span style={{
                  fontFamily:"'Space Mono',monospace",fontSize:'7px',padding:'1px 4px',borderRadius:3,
                  background:'rgba(79,127,255,0.08)',border:'1px solid rgba(79,127,255,0.18)',
                  color:'rgba(79,127,255,0.8)',letterSpacing:'0.06em',flexShrink:0,marginLeft:6,
                }}>
                  {item.badge}
                </span>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    );
  }, [expanded, currentPath, getItemStyle, nav, hover, isActive]);

  return (
    <nav style={sidebarStyle} aria-label="Main navigation" role="navigation">

      {/* Logo area — full headerHeight */}
      <div style={{
        height:       headerHeight,
        display:      'flex',
        alignItems:   'center',
        padding:      expanded ? '0 16px' : '0',
        justifyContent: expanded ? 'flex-start' as const : 'center' as const,
        flexShrink:   0,
        gap:          10,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <LogoMark />
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity:0,x:-6 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-6 }} transition={{ duration:0.14 }} style={{ flex:1 }}>
              <div style={{ fontFamily:"'Space Mono',monospace",fontSize:'12.5px',fontWeight:700,letterSpacing:'0.14em',color:'rgba(225,230,255,0.9)' }}>
                ZERØ
              </div>
              <div style={{ fontFamily:"'Space Mono',monospace",fontSize:'7px',letterSpacing:'0.30em',color:'rgba(79,127,255,0.4)',marginTop:2 }}>
                MERIDIAN
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {expanded && (
          <button type="button" onClick={toggle} aria-label="Collapse sidebar"
            style={{
              width:20,height:20,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:6,color:'rgba(85,90,115,1)',cursor:'pointer',display:'flex',
              alignItems:'center',justifyContent:'center',flexShrink:0,
            }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M5.5 1.5L3 4.5L5.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {!expanded && (
          <button type="button" onClick={toggle} aria-label="Expand sidebar"
            style={{
              position:'absolute',bottom:12,left:'50%',transform:'translateX(-50%)',
              width:22,height:22,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:6,color:'rgba(85,90,115,1)',cursor:'pointer',display:'flex',
              alignItems:'center',justifyContent:'center',
            }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M3.5 1.5L6 4.5L3.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav scroll area */}
      <div style={{ flex:1,overflowY:'auto' as const,overflowX:'hidden',padding:'6px 7px',display:'flex',flexDirection:'column' as const }} role="list">
        {GROUP_ORDER.map(g => {
          const items = groups[g];
          if (!items) return null;
          return (
            <div key={g} style={{ marginBottom:4 }}>
              {expanded && (
                <div style={{ padding:'8px 8px 4px',fontFamily:"'Space Mono',monospace",fontSize:'8px',letterSpacing:'0.2em',color:'rgba(255,255,255,0.13)',textTransform:'uppercase' as const,fontWeight:700 }}>
                  {g}
                </div>
              )}
              {!expanded && g !== 'OVERVIEW' && (
                <div style={{ height:1,background:'rgba(255,255,255,0.05)',margin:'6px 8px' }} />
              )}
              {items.map(renderItem)}
            </div>
          );
        })}
      </div>

      {/* Bottom */}
      <div style={{ padding:'7px 7px 10px',borderTop:'1px solid rgba(255,255,255,0.05)',flexShrink:0 }}>
        {BOTTOM_ITEMS.map(item => (
          <button key={item.id} type="button"
            onClick={() => nav(item.path)}
            onMouseEnter={() => hover(item.id)}
            onMouseLeave={() => hover(null)}
            aria-label={item.label}
            style={getItemStyle(item.id, item.path)}
          >
            <span style={{ display:'flex',alignItems:'center',justifyContent:'center',width:17,height:17,flexShrink:0 }}>
              {item.icon}
            </span>
            <AnimatePresence>
              {expanded && (
                <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.12 }}
                  style={{ fontFamily:"'Space Mono',monospace",fontSize:'11px',letterSpacing:'0.01em',fontWeight:500 }}>
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>
    </nav>
  );
});

ZMSidebar.displayName = 'ZMSidebar';
export default ZMSidebar;
