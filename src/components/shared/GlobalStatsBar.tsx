/**
 * GlobalStatsBar.tsx — ZERØ MERIDIAN 2026 push88
 * Sticky top bar: BTC/ETH prices, Fear&Greed, WS status
 * - Zero className → style={{}} only
 * - rgba() only
 * - React.memo + displayName
 * - useCallback + useMemo + mountedRef
 */

import React, { memo, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useCryptoContext } from '@/contexts/CryptoContext';

const GlobalStatsBar = memo(() => {
  const mountedRef = useRef(true);
  const rm         = useReducedMotion();
  const { state }  = useCryptoContext();
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [flashMap,   setFlashMap]   = useState<Record<string, 'up'|'down'|null>>({});

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // Price flash detection
  useEffect(() => {
    if (!state.prices || !mountedRef.current) return;
    const newFlash: Record<string, 'up'|'down'|null> = {};
    let hasFlash = false;
    Object.entries(state.prices).forEach(([sym, data]: [string, any]) => {
      const prev = prevPrices[sym];
      if (prev !== undefined && prev !== data.price) {
        newFlash[sym] = data.price > prev ? 'up' : 'down';
        hasFlash = true;
      }
    });
    if (hasFlash) {
      setFlashMap(newFlash);
      const t = setTimeout(() => { if (mountedRef.current) setFlashMap({}); }, 650);
      return () => clearTimeout(t);
    }
    const prices: Record<string, number> = {};
    Object.entries(state.prices).forEach(([sym, data]: [string, any]) => { prices[sym] = data.price; });
    setPrevPrices(prices);
  }, [state.prices]); // eslint-disable-line

  const fmtPrice = useCallback((n: number, sym: string) => {
    if (!n) return '—';
    if (sym === 'BTC' || n > 10000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (n > 100)  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (n > 0.01) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 4 });
    return '$' + n.toExponential(3);
  }, []);

  const fmtChange = useCallback((c: number) =>
    (c >= 0 ? '+' : '') + c.toFixed(2) + '%'
  , []);

  const wsStatus = state.wsStatus ?? 'disconnected';
  const wsLabel  = wsStatus === 'connected'    ? 'LIVE'
                 : wsStatus === 'reconnecting' ? 'RECONNECTING'
                 : 'OFFLINE';
  const wsColor  = wsStatus === 'connected'    ? 'rgba(61,214,140,1)'
                 : wsStatus === 'reconnecting' ? 'rgba(255,180,50,1)'
                 : 'rgba(255,102,102,1)';
  const wsBg     = wsStatus === 'connected'    ? 'rgba(61,214,140,0.06)'
                 : wsStatus === 'reconnecting' ? 'rgba(255,180,50,0.06)'
                 : 'rgba(255,102,102,0.06)';
  const wsBorder = wsStatus === 'connected'    ? 'rgba(61,214,140,0.15)'
                 : wsStatus === 'reconnecting' ? 'rgba(255,180,50,0.15)'
                 : 'rgba(255,102,102,0.15)';

  const DISPLAY_SYMS = Object.freeze(['BTC','ETH','SOL','BNB']);

  const prices = state.prices ?? {};
  const fg     = state.fearGreed;

  const barStyle = useMemo(() => ({
    position:             'fixed' as const,
    top: 0, left: 0, right: 0,
    zIndex:               200,
    height:               28,
    background:           'rgba(6,7,13,0.98)',
    borderBottom:         '1px solid rgba(255,255,255,0.05)',
    display:              'flex',
    alignItems:           'center',
    padding:              '0 14px',
    gap:                  14,
    overflowX:            'auto' as const,
    overflowY:            'hidden',
    scrollbarWidth:       'none' as const,
  }), []);

  const priceItemStyle = useCallback((sym: string) => {
    const flash = flashMap[sym];
    return {
      display:    'flex',
      alignItems: 'center',
      gap:        5,
      flexShrink: 0,
      background: flash === 'up'   ? 'rgba(61,214,140,0.10)'
                : flash === 'down' ? 'rgba(255,102,102,0.10)'
                : 'transparent',
      borderRadius: 4,
      padding:    '0 4px',
      transition: 'background 0.1s',
    };
  }, [flashMap]);

  return (
    <div style={barStyle} role="complementary" aria-label="Market stats">

      {/* WS Status */}
      <div style={{ display:'flex',alignItems:'center',gap:5,background:wsBg,border:'1px solid '+wsBorder,borderRadius:10,padding:'1px 7px',flexShrink:0 }}>
        <motion.div
          style={{ width:4,height:4,borderRadius:'50%',background:wsColor,flexShrink:0 }}
          animate={rm ? {} : wsStatus === 'connected' ? { opacity:[1,0.3,1] } : wsStatus === 'reconnecting' ? { opacity:[1,0.1,1] } : { opacity:0.4 }}
          transition={{ duration: wsStatus === 'reconnecting' ? 0.7 : 2, repeat:Infinity }}
        />
        <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'8px',color:wsColor,letterSpacing:'0.09em',fontWeight:600 }}>
          {wsLabel}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width:1,height:14,background:'rgba(255,255,255,0.08)',flexShrink:0 }}/>

      {/* Prices */}
      {DISPLAY_SYMS.map(sym => {
        const d: any = prices[sym] ?? prices[sym + 'USDT'];
        if (!d) return null;
        const isPos  = (d.change24h ?? 0) >= 0;
        const chColor = isPos ? 'rgba(61,214,140,1)' : 'rgba(255,102,102,1)';
        return (
          <div key={sym} style={priceItemStyle(sym)}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'9px',color:'rgba(100,105,135,1)',letterSpacing:'0.05em',fontWeight:600 }}>
              {sym}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'10px',color:'rgba(210,215,240,1)',fontWeight:500,letterSpacing:'0.02em' }}>
              {fmtPrice(d.price, sym)}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'9px',color:chColor,letterSpacing:'0.02em' }}>
              {fmtChange(d.change24h ?? 0)}
            </span>
          </div>
        );
      })}

      {/* Divider */}
      <div style={{ width:1,height:14,background:'rgba(255,255,255,0.08)',flexShrink:0 }}/>

      {/* Fear & Greed */}
      {fg && (
        <div style={{ display:'flex',alignItems:'center',gap:5,flexShrink:0 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'8px',color:'rgba(75,80,105,1)',letterSpacing:'0.09em' }}>F&G</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'10px',fontWeight:600,color:
            fg.value >= 70 ? 'rgba(61,214,140,1)' :
            fg.value >= 45 ? 'rgba(255,180,50,1)' :
            'rgba(255,102,102,1)',
          }}>
            {fg.value} <span style={{ fontWeight:400,fontSize:'8px',color:'rgba(100,105,135,1)' }}>{fg.label}</span>
          </span>
        </div>
      )}

      {/* BTC Dom */}
      {state.global?.btcDominance && (
        <>
          <div style={{ width:1,height:14,background:'rgba(255,255,255,0.08)',flexShrink:0 }}/>
          <div style={{ display:'flex',alignItems:'center',gap:5,flexShrink:0 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'8px',color:'rgba(75,80,105,1)',letterSpacing:'0.09em' }}>BTC.D</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'10px',color:'rgba(255,180,50,0.9)',fontWeight:500 }}>
              {state.global.btcDominance.toFixed(1)}%
            </span>
          </div>
        </>
      )}

      {/* Global Mcap */}
      {state.global?.totalMarketCap && (
        <>
          <div style={{ width:1,height:14,background:'rgba(255,255,255,0.08)',flexShrink:0 }}/>
          <div style={{ display:'flex',alignItems:'center',gap:5,flexShrink:0 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'8px',color:'rgba(75,80,105,1)',letterSpacing:'0.09em' }}>MCAP</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'10px',color:'rgba(185,190,220,1)',fontWeight:500 }}>
              {'$' + (state.global.totalMarketCap / 1e12).toFixed(2) + 'T'}
            </span>
          </div>
        </>
      )}
    </div>
  );
});

GlobalStatsBar.displayName = 'GlobalStatsBar';
export default GlobalStatsBar;
