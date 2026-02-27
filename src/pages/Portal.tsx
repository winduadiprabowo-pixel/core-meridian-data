/**
 * Portal.tsx — ZERØ MERIDIAN 2026 push88
 * FIX: Skip otomatis kalau sudah pernah visit (localStorage flag)
 * FIX: No Three.js — ringan, progress bar CSS only
 * - Zero className → style={{}} only
 * - rgba() only
 * - React.memo + displayName
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const VISITED_KEY = 'zm_visited_v1';
const AUTO_SKIP_MS = 2000; // 2s untuk first-time, 0 untuk returning

const Portal: React.FC = () => {
  const mountedRef    = useRef(true);
  const rm            = useReducedMotion();
  const navigate      = useNavigate();
  const isReturning   = typeof window !== 'undefined' && !!localStorage.getItem(VISITED_KEY);
  const [progress,    setProgress]    = useState(0);
  const [visible,     setVisible]     = useState(true);
  const [scanLine,    setScanLine]    = useState(0);
  const [glitch,      setGlitch]      = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const goToDash = React.useCallback(() => {
    if (!mountedRef.current) return;
    localStorage.setItem(VISITED_KEY, '1');
    setVisible(false);
    setTimeout(() => { if (mountedRef.current) navigate('/dashboard'); }, rm ? 0 : 350);
  }, [navigate, rm]);

  // Skip instantly for returning users
  useEffect(() => {
    if (isReturning) { goToDash(); return; }

    // Progress bar
    const start = Date.now();
    const dur   = AUTO_SKIP_MS;
    const raf   = { id: 0 };
    const tick  = () => {
      if (!mountedRef.current) return;
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / dur, 1);
      setProgress(p);
      if (p < 1) raf.id = requestAnimationFrame(tick);
      else goToDash();
    };
    raf.id = requestAnimationFrame(tick);

    // Scan line animation
    const scanIv = setInterval(() => {
      if (mountedRef.current) setScanLine(p => (p + 1) % 100);
    }, 16);

    // Glitch pulse
    const glitchIv = setInterval(() => {
      if (!mountedRef.current) return;
      setGlitch(true);
      setTimeout(() => { if (mountedRef.current) setGlitch(false); }, 80);
    }, 1400);

    return () => {
      cancelAnimationFrame(raf.id);
      clearInterval(scanIv);
      clearInterval(glitchIv);
    };
  }, []); // eslint-disable-line

  const containerStyle = useMemo(() => ({
    position:   'fixed' as const,
    inset:      0,
    background: 'rgba(4,5,12,1)',
    display:    'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex:     9999,
    overflow:   'hidden',
    cursor:     'pointer',
  }), []);

  if (isReturning) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div key="portal"
          initial={{ opacity:1 }} exit={{ opacity:0, scale:1.04 }}
          transition={{ duration: rm ? 0 : 0.35, ease:[0.4,0,1,1] }}
          style={containerStyle}
          onClick={goToDash}
          aria-label="Click to enter"
        >
          {/* Background grid */}
          <div style={{
            position:'absolute',inset:0,
            backgroundImage: 'linear-gradient(rgba(79,127,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(79,127,255,0.04) 1px, transparent 1px)',
            backgroundSize:  '48px 48px',
            opacity: 0.6,
          }}/>

          {/* Scan line */}
          {!rm && (
            <div style={{
              position:'absolute',left:0,right:0,
              top: scanLine + '%',
              height: 2,
              background: 'linear-gradient(to right, transparent, rgba(79,127,255,0.18), transparent)',
              transition: 'top 0.016s linear',
              pointerEvents: 'none',
            }}/>
          )}

          {/* Radial glow */}
          <div style={{
            position:'absolute',inset:0,
            background:'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(79,127,255,0.08) 0%, transparent 65%)',
            pointerEvents:'none',
          }}/>

          {/* Logo */}
          <motion.div
            initial={{ opacity:0, scale:0.9 }}
            animate={{ opacity:1, scale:1 }}
            transition={{ duration: rm ? 0 : 0.5, ease:[0.22,1,0.36,1] }}
            style={{ display:'flex',flexDirection:'column' as const,alignItems:'center',gap:24,zIndex:1 }}
          >
            {/* Logo mark */}
            <motion.div
              animate={rm ? {} : { rotate:[0,1,-1,0], scale:[1,1.01,0.99,1] }}
              transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
            >
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                <circle cx="36" cy="36" r="30" stroke="rgba(79,127,255,0.15)" strokeWidth="1" fill="rgba(79,127,255,0.04)"/>
                <circle cx="36" cy="36" r="22" stroke="rgba(79,127,255,0.8)"  strokeWidth="1.6" fill="none"/>
                <circle cx="36" cy="36" r="12" stroke="rgba(79,127,255,0.3)"  strokeWidth="1" fill="none"/>
                <line x1="44" y1="22" x2="28" y2="50" stroke="rgba(79,127,255,1)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.div>

            {/* Wordmark */}
            <div style={{ textAlign:'center' as const }}>
              <div style={{
                fontFamily:"'JetBrains Mono',monospace",
                fontSize: glitch ? '38px' : '36px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: glitch ? 'rgba(255,255,255,0.95)' : 'rgba(210,215,240,0.92)',
                textShadow: glitch ? '0 0 20px rgba(79,127,255,0.6)' : 'none',
                transition: 'font-size 0.05s, text-shadow 0.05s',
                userSelect:'none' as const,
              }}>
                ZER&#216;
              </div>
              <div style={{
                fontFamily:"'JetBrains Mono',monospace",
                fontSize: '11px',
                letterSpacing: '0.45em',
                color: 'rgba(79,127,255,0.45)',
                marginTop: 4,
                fontWeight: 500,
                userSelect:'none' as const,
              }}>
                MERIDIAN
              </div>
            </div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ delay: rm ? 0 : 0.3, duration:0.4 }}
              style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:'10px',letterSpacing:'0.18em',color:'rgba(60,65,95,1)',userSelect:'none' as const }}
            >
              CRYPTO INTELLIGENCE TERMINAL
            </motion.div>
          </motion.div>

          {/* Progress bar */}
          <div style={{
            position:'absolute',bottom:56,left:'50%',transform:'translateX(-50%)',
            width:200,height:1,background:'rgba(255,255,255,0.06)',borderRadius:1,
            overflow:'hidden',
          }}>
            <motion.div style={{
              height:'100%',
              background:'linear-gradient(to right, rgba(79,127,255,0.6), rgba(79,127,255,1))',
              boxShadow:'0 0 8px rgba(79,127,255,0.5)',
              width: (progress * 100) + '%',
            }}/>
          </div>

          {/* Click hint */}
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            transition={{ delay: rm ? 0 : 0.6 }}
            style={{
              position:'absolute',bottom:24,
              fontFamily:"'JetBrains Mono',monospace",fontSize:'9px',
              letterSpacing:'0.18em',color:'rgba(50,55,80,1)',
              userSelect:'none' as const,
            }}
          >
            CLICK TO ENTER
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Portal.displayName = 'Portal';
export default React.memo(Portal);
