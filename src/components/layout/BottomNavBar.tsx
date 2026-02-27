/**
 * BottomNavBar.tsx — ZERØ MERIDIAN 2026 push88
 * FIX: "More" tab buka bottom sheet (bukan redirect ke /defi)
 * 5 tabs: Dash | Markets | Alerts | Watchlist | More
 * - Zero className → style={{}} only
 * - rgba() only
 * - React.memo + displayName
 * - useCallback + useMemo + mountedRef
 */

import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

interface Tab {
  id:    string;
  label: string;
  path?: string;
  icon:  React.ReactNode;
  more?: boolean;
}

interface SheetItem {
  id:    string;
  label: string;
  path:  string;
  icon:  React.ReactNode;
  badge?: string;
}

const TABS: readonly Tab[] = Object.freeze([
  {
    id:'dashboard', label:'Dash', path:'/dashboard',
    icon:(<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>),
  },
  {
    id:'markets', label:'Markets', path:'/markets',
    icon:(<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M1 12 L4.5 7 L7.5 9.5 L11 4 L15 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  },
  {
    id:'alerts', label:'Alerts', path:'/alerts',
    icon:(<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 2C5.8 2 4 3.8 4 6v4L2.5 12.5h11L12 10V6c0-2.2-1.8-4-4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
  },
  {
    id:'watchlist', label:'Watch', path:'/watchlist',
    icon:(<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L9.9 5.4L14 6L11 8.9L11.8 13L8 11L4.2 13L5 8.9L2 6L6.1 5.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>),
  },
  {
    id:'more', label:'More', more: true,
    icon:(<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="13" cy="8" r="1.2" fill="currentColor"/></svg>),
  },
]);

const SHEET_ITEMS: readonly SheetItem[] = Object.freeze([
  { id:'charts',        label:'Charts',        path:'/charts',        icon:(<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 13 L4.5 8 L7.5 10.5 L11.5 5 L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>) },
  { id:'defi',          label:'DeFi',          path:'/defi',          icon:(<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="12.5" r="2" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="7" x2="11" y2="4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="5" y1="9" x2="11" y2="11.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>) },
  { id:'derivatives',   label:'Derivatives',   path:'/derivatives',   icon:(<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 13 L4 6 L8 9.5 L12 3 L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>) },
  { id:'intelligence',  label:'AI Intel',       path:'/intelligence',  icon:(<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.4"/></svg>) },
  { id:'aisignals',     label:'AI Signals',     path:'/aisignals',     badge:'AI', icon:(<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 10 Q5 3 8 7 Q11 11 14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>) },
  { id:'portfolio',     label:'Portfolio',      path:'/portfolio',     icon:(<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 8 L8 2.5 A5.5 5.5 0 0 1 13.5 8 Z" fill="currentColor" opacity="0.2"/></svg>) },
  { id:'onchain',       label:'On-Chain',       path:'/onchain',       badge:'NEW', icon:(<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="7.5" width="3" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="6.5" y="4.5" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="11.5" y="1.5" width="3" height="13" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>) },
  { id:'smartmoney',    label:'Smart Money',    path:'/smartmoney',    icon:(<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v6M6 6.5h3.5a1.5 1.5 0 0 1 0 3H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>) },
  { id:'fundamentals',  label:'Fundamentals',   path:'/fundamentals',  icon:(<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 14 L2 6 L5.5 3 L9 6 L9 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="9" y1="10" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>) },
  { id:'heatmap',       label:'Heatmap',        path:'/heatmap',       icon:(<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="5.5" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="1.5" width="5.5" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="1.5" y="7.5" width="3" height="7" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="6.5" y="7.5" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>) },
  { id:'converter',     label:'Converter',      path:'/converter',     icon:(<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5h12M10 2l4 3-4 3M14 11H2M6 8l-4 3 4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { id:'settings',      label:'Settings',       path:'/settings',      icon:(<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>) },
]);

const BottomNavBar = memo(() => {
  const mountedRef = useRef(true);
  const rm         = useReducedMotion();
  const [sheet, setSheet] = useState(false);
  const navigate    = useNavigate();
  const loc         = useLocation();

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const closeSheet = useCallback(() => { if (mountedRef.current) setSheet(false); }, []);
  const openSheet  = useCallback(() => { if (mountedRef.current) setSheet(true);  }, []);

  const handleTab = useCallback((tab: Tab) => {
    if (tab.more) { openSheet(); return; }
    if (tab.path) navigate(tab.path);
  }, [navigate, openSheet]);

  const handleSheetItem = useCallback((path: string) => {
    navigate(path);
    closeSheet();
  }, [navigate, closeSheet]);

  const isActive = useCallback((path?: string) => {
    if (!path) return false;
    return loc.pathname === path || (path !== '/dashboard' && loc.pathname.startsWith(path));
  }, [loc.pathname]);

  const navStyle = useMemo(() => ({
    position:   'fixed' as const,
    bottom:     0, left: 0, right: 0,
    zIndex:     200,
    background: 'rgba(6,7,13,0.97)',
    backdropFilter:       'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop:  '1px solid rgba(255,255,255,0.07)',
    display:    'flex',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  }), []);

  return (
    <>
      <nav style={navStyle} role="navigation" aria-label="Mobile navigation">
        {TABS.map(tab => {
          const active = !tab.more && isActive(tab.path);
          const isMore = tab.more;
          const isMoreOpen = isMore && sheet;
          return (
            <button key={tab.id} type="button" onClick={() => handleTab(tab)}
              style={{
                flex:1, display:'flex', flexDirection:'column' as const,
                alignItems:'center', justifyContent:'center', gap:4,
                padding:'10px 4px 12px',
                background:'transparent', border:'none', cursor:'pointer',
                color: (active || isMoreOpen) ? 'rgba(79,127,255,1)' : 'rgba(80,85,110,1)',
                position:'relative' as const, WebkitTapHighlightColor:'transparent',
                transition:'color 0.15s',
              }}>
              {(active || isMoreOpen) && (
                <motion.div
                  layoutId="bottom-indicator"
                  style={{ position:'absolute',top:0,left:'20%',right:'20%',height:2,background:'rgba(79,127,255,1)',borderRadius:'0 0 3px 3px' }}
                  transition={rm ? { duration:0 } : { type:'spring', stiffness:400, damping:30 }}
                />
              )}
              {tab.icon}
              <span style={{ fontSize:'9px', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.05em', fontWeight: active ? 600 : 400 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom sheet — "More" */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div key="sheet-overlay"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration: rm ? 0 : 0.18 }}
              onClick={closeSheet}
              style={{ position:'fixed' as const,inset:0,zIndex:210,background:'rgba(4,5,12,0.75)',backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)' }}
            />
            <motion.div key="sheet-panel"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={rm ? { duration:0 } : { type:'spring', stiffness:380, damping:34 }}
              style={{
                position:'fixed' as const, bottom:0, left:0, right:0, zIndex:220,
                background:'rgba(10,12,20,1)',
                borderTop:'1px solid rgba(255,255,255,0.08)',
                borderRadius:'16px 16px 0 0',
                paddingBottom:'env(safe-area-inset-bottom, 16px)',
                maxHeight:'75vh', overflowY:'auto' as const,
              }}>
              {/* Handle */}
              <div style={{ display:'flex',justifyContent:'center',padding:'12px 0 6px' }}>
                <div style={{ width:36,height:4,borderRadius:2,background:'rgba(255,255,255,0.12)' }}/>
              </div>
              {/* Title */}
              <div style={{ padding:'4px 20px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'10px',letterSpacing:'0.14em',color:'rgba(75,80,105,1)',textTransform:'uppercase' as const }}>
                ALL FEATURES
              </div>
              {/* Grid */}
              <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2,padding:'0 12px 20px' }}>
                {SHEET_ITEMS.map(item => (
                  <button key={item.id} type="button" onClick={() => handleSheetItem(item.path)}
                    style={{
                      display:'flex',flexDirection:'column' as const,alignItems:'center',gap:8,
                      padding:'14px 8px',borderRadius:10,
                      background: isActive(item.path) ? 'rgba(79,127,255,0.08)' : 'rgba(255,255,255,0.03)',
                      border:'1px solid ' + (isActive(item.path) ? 'rgba(79,127,255,0.18)' : 'rgba(255,255,255,0.05)'),
                      cursor:'pointer',
                      color: isActive(item.path) ? 'rgba(79,127,255,1)' : 'rgba(140,145,175,1)',
                      WebkitTapHighlightColor:'transparent',
                      position:'relative' as const,
                    }}>
                    {item.badge && (
                      <span style={{ position:'absolute',top:6,right:6,fontSize:'7px',fontFamily:"'JetBrains Mono',monospace",padding:'1px 3px',borderRadius:3,background:'rgba(79,127,255,0.1)',border:'1px solid rgba(79,127,255,0.2)',color:'rgba(79,127,255,0.8)',letterSpacing:'0.05em' }}>
                        {item.badge}
                      </span>
                    )}
                    {item.icon}
                    <span style={{ fontSize:'10px',fontFamily:"'JetBrains Mono',monospace",textAlign:'center' as const,lineHeight:1.3,fontWeight:500 }}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

BottomNavBar.displayName = 'BottomNavBar';
export default BottomNavBar;
