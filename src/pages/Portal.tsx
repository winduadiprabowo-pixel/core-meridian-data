/**
 * Portal.tsx — ZERØ MERIDIAN push113
 * ══════════════════════════════════════════════════
 * Animasi MATERIALIZE — Bloomberg terminal boot feel
 *
 * Sequence:
 *   0ms   → mount, background grid visible
 *   80ms  → X logo scale-in dari 0.6 + fade in
 *   300ms → scan line cyan sweep top→bottom
 *   800ms → typewriter "ZERØ MERIDIAN" 70ms/char
 *   1800ms→ tagline + corner decorations fade in
 *   2800ms→ auto-navigate ke /dashboard
 *
 * Rules:
 *   ✅ Zero className ✅ rgba() only ✅ memo+displayName
 *   ✅ useCallback ✅ useMemo ✅ mountedRef
 * ══════════════════════════════════════════════════
 */

import React, { useEffect, useRef, useCallback, useMemo, useState, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import XLogo from '@/components/shared/XLogo';

const AUTO_MS    = 1400;
const VISITED_KEY = 'zm_visited';
const TITLE      = 'ZERØ MERIDIAN';

// ─── Corner decoration ────────────────────────────────────────────────────────

const Corner = memo(({ pos }: { pos: 'tl'|'tr'|'bl'|'br' }) => {
  const style = useMemo(() => {
    const base = {
      position: 'absolute' as const,
      width: 20, height: 20,
      borderColor: 'rgba(0,238,255,0.35)',
      borderStyle: 'solid' as const,
    };
    if (pos === 'tl') return { ...base, top: 24, left: 24, borderWidth: '1px 0 0 1px' };
    if (pos === 'tr') return { ...base, top: 24, right: 24, borderWidth: '1px 1px 0 0' };
    if (pos === 'bl') return { ...base, bottom: 24, left: 24, borderWidth: '0 0 1px 1px' };
    return { ...base, bottom: 24, right: 24, borderWidth: '0 1px 1px 0' };
  }, [pos]);
  return <div style={style} />;
});
Corner.displayName = 'Corner';

// ─── Portal ───────────────────────────────────────────────────────────────────

const Portal: React.FC = () => {
  const navigate   = useNavigate();
  const mountedRef = useRef(true);
  const rm         = useReducedMotion();

  const [phase,    setPhase]    = useState(0);
  const [typeIdx,  setTypeIdx]  = useState(0);
  const [progress, setProgress] = useState(0);
  const [scanDone, setScanDone] = useState(false);

  const doEnter = useCallback(() => {
    if (!mountedRef.current) return;
    sessionStorage.setItem(VISITED_KEY, '1');
    navigate('/dashboard');
  }, [navigate]);

  useEffect(() => {
    mountedRef.current = true;

    if (sessionStorage.getItem(VISITED_KEY)) {
      navigate('/dashboard');
      return;
    }

    // Phase sequence timers
    const t1 = setTimeout(() => { if (mountedRef.current) setPhase(1); }, 80);
    const t2 = setTimeout(() => { if (mountedRef.current) setPhase(2); }, 200);
    const t3 = setTimeout(() => { if (mountedRef.current) setPhase(3); }, 450);
    const t4 = setTimeout(() => { if (mountedRef.current) setPhase(4); }, 950);
    const ts = setTimeout(() => { if (mountedRef.current) setScanDone(true); }, 650);

    // Typewriter
    let idx = 0;
    const typeTimer = setInterval(() => {
      if (!mountedRef.current) return;
      idx++;
      setTypeIdx(idx);
      if (idx >= TITLE.length) clearInterval(typeTimer);
    }, 45);

    // Progress
    const start = Date.now();
    const progTimer = setInterval(() => {
      if (!mountedRef.current) return;
      const pct = Math.min((Date.now() - start) / AUTO_MS * 100, 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(progTimer); doEnter(); }
    }, 30);

    return () => {
      mountedRef.current = false;
      clearTimeout(t1); clearTimeout(t2);
      clearTimeout(t3); clearTimeout(t4);
      clearTimeout(ts);
      clearInterval(typeTimer);
      clearInterval(progTimer);
    };
  }, [doEnter, navigate]);

  const containerStyle = useMemo(() => ({
    position:       'fixed' as const,
    inset:          0,
    background:     'rgba(5,7,13,1)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexDirection:  'column' as const,
    gap:            28,
    zIndex:         9999,
    cursor:         'pointer',
    overflow:       'hidden' as const,
  }), []);

  const gridStyle = useMemo(() => ({
    position:   'absolute' as const,
    inset:      0,
    backgroundImage:
      'linear-gradient(rgba(0,238,255,0.028) 1px, transparent 1px),' +
      'linear-gradient(90deg, rgba(0,238,255,0.028) 1px, transparent 1px)',
    backgroundSize:    '60px 60px',
    pointerEvents:     'none' as const,
  }), []);

  const radialStyle = useMemo(() => ({
    position:   'absolute' as const,
    inset:      0,
    background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(0,238,255,0.06) 0%, transparent 65%)',
    pointerEvents: 'none' as const,
  }), []);

  const logoWrapStyle = useMemo(() => ({
    position: 'relative' as const,
    width: 180, height: 180,
  }), []);

  const titleStyle = useMemo(() => ({
    fontFamily:    "'JetBrains Mono', monospace",
    fontSize:      30,
    fontWeight:    700,
    color:         'rgba(228,232,244,1)',
    letterSpacing: '-0.02em',
    lineHeight:    1,
    minHeight:     36,
    minWidth:      260,
    textAlign:     'center' as const,
  }), []);

  const taglineStyle = useMemo(() => ({
    fontFamily:    "'JetBrains Mono', monospace",
    fontSize:      10,
    color:         'rgba(0,238,255,0.5)',
    letterSpacing: '0.22em',
    marginTop:     8,
    textTransform: 'uppercase' as const,
  }), []);

  const progTrackStyle = useMemo(() => ({
    width:        150,
    height:       1,
    background:   'rgba(255,255,255,0.06)',
    borderRadius: 1,
    overflow:     'hidden' as const,
  }), []);

  const hintStyle = useMemo(() => ({
    fontFamily:    "'JetBrains Mono', monospace",
    fontSize:      9,
    color:         'rgba(78,84,110,0.8)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  }), []);

  const displayText  = TITLE.slice(0, typeIdx);
  const cursorActive = phase >= 3 && typeIdx < TITLE.length;

  return (
    <div
      style={containerStyle}
      onClick={doEnter}
      role="button"
      tabIndex={0}
      aria-label="Enter ZERØ MERIDIAN terminal"
      onKeyDown={useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') doEnter();
      }, [doEnter])}
    >
      {/* Subtle grid */}
      <div style={gridStyle} />
      {/* Center radial glow */}
      <div style={radialStyle} />

      {/* Corner decorations */}
      <AnimatePresence>
        {phase >= 4 && !rm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute' as const, inset: 0, pointerEvents: 'none' as const }}
          >
            <Corner pos="tl" />
            <Corner pos="tr" />
            <Corner pos="bl" />
            <Corner pos="br" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            initial={rm ? {} : { opacity: 0 }}
            animate={rm ? {} : { opacity: 1 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 24 }}
          >

            {/* ── X Logo ── */}
            <div style={logoWrapStyle}>
              {/* Scale-in logo */}
              <motion.div
                initial={rm ? {} : { opacity: 0, scale: 0.65 }}
                animate={rm ? {} : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <XLogo size={180} />
              </motion.div>

              {/* Scan line — cyan sweep top to bottom */}
              {phase >= 2 && !scanDone && !rm && (
                <motion.div
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ y: 185, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeIn' }}
                  style={{
                    position:     'absolute' as const,
                    top:          0,
                    left:         -16,
                    right:        -16,
                    height:       2,
                    background:   'linear-gradient(90deg, transparent 0%, rgba(0,238,255,0.95) 40%, rgba(0,238,255,0.95) 60%, transparent 100%)',
                    boxShadow:    '0 0 14px rgba(0,238,255,0.9), 0 0 30px rgba(0,238,255,0.4)',
                    pointerEvents:'none' as const,
                    willChange:   'transform',
                  }}
                />
              )}

              {/* Single glow pulse after scan */}
              {scanDone && !rm && (
                <motion.div
                  initial={{ opacity: 0.7, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.4 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    position:      'absolute' as const,
                    inset:         -20,
                    borderRadius:  '50%',
                    background:    'radial-gradient(circle, rgba(0,238,255,0.18) 0%, transparent 70%)',
                    pointerEvents: 'none' as const,
                    willChange:    'transform, opacity',
                  }}
                />
              )}
            </div>

            {/* ── Title typewriter ── */}
            <div style={{ textAlign: 'center' as const }}>
              <div style={titleStyle}>
                {phase >= 3 ? displayText : ''}
                {cursorActive && (
                  <motion.span
                    animate={rm ? {} : { opacity: [1, 0, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                    style={{ color: 'rgba(0,238,255,1)', marginLeft: 1 }}
                  >
                    |
                  </motion.span>
                )}
              </div>

              {/* Tagline */}
              <AnimatePresence>
                {phase >= 4 && (
                  <motion.div
                    initial={rm ? {} : { opacity: 0, y: 5 }}
                    animate={rm ? {} : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={taglineStyle}
                  >
                    Crypto Intelligence Terminal
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Progress + hint ── */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 10 }}>
              <div style={progTrackStyle}>
                <motion.div
                  style={{
                    height:          '100%',
                    background:      'rgba(0,238,255,1)',
                    transformOrigin: 'left',
                    boxShadow:       '0 0 6px rgba(0,238,255,0.9)',
                  }}
                  animate={{ scaleX: progress / 100 }}
                  transition={{ duration: 0 }}
                />
              </div>
              <div style={hintStyle}>Click to enter</div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

Portal.displayName = 'Portal';
export default memo(Portal);
