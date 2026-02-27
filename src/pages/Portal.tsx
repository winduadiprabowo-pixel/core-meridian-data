/**
 * Portal.tsx — ZERØ MERIDIAN 2026 push76
 * push76: Logo upgrade — crystal shuriken 4-spike + Ø neon 3D glow
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useCallback + useMemo + mountedRef ✓
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

const PARTICLE_COUNT  = 6000;
const PARTICLE_SPREAD = 140;
const AUTO_ENTER_MS   = 2500;

function createPRNG(seed: number) {
  let s0 = seed >>> 0;
  let s1 = (seed * 1664525 + 1013904223) >>> 0;
  let s2 = (s1  * 1664525 + 1013904223) >>> 0;
  let s3 = (s2  * 1664525 + 1013904223) >>> 0;
  return function next(): number {
    const result = (Math.imul(s0 + s3, 5) + 0x9E3779B9) >>> 0;
    const t = s1 << 9;
    s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3;
    s2 ^= t;
    s3 = (s3 << 11) | (s3 >>> 21);
    return (result >>> 0) / 0x100000000;
  };
}

// ─── Crystal Shuriken Logo — 4-spike + Ø neon 3D ─────────────────────────────
const CrystalLogo = React.memo(() => (
  <svg
    width="180"
    height="180"
    viewBox="0 0 180 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ display: 'block' }}
  >
    <defs>
      {/* Deep outer glow */}
      <filter id="deepGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="12" result="b1" />
        <feGaussianBlur stdDeviation="28" result="b2" />
        <feMerge>
          <feMergeNode in="b2" />
          <feMergeNode in="b1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Edge glow */}
      <filter id="edgeGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="3.5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Soft white */}
      <filter id="softWhite" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Crystal face gradient — dark glass */}
      <linearGradient id="crystalFaceTop" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%"   stopColor="rgba(140,200,255,0.18)" />
        <stop offset="50%"  stopColor="rgba(20,40,80,0.55)" />
        <stop offset="100%" stopColor="rgba(5,10,25,0.75)" />
      </linearGradient>
      <linearGradient id="crystalFaceRight" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%"   stopColor="rgba(5,10,25,0.75)" />
        <stop offset="50%"  stopColor="rgba(20,40,80,0.55)" />
        <stop offset="100%" stopColor="rgba(100,180,255,0.14)" />
      </linearGradient>
      <linearGradient id="crystalFaceBottom" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%"   stopColor="rgba(5,10,25,0.75)" />
        <stop offset="100%" stopColor="rgba(30,60,100,0.35)" />
      </linearGradient>
      <linearGradient id="crystalFaceLeft" x1="100%" y1="50%" x2="0%" y2="50%">
        <stop offset="0%"   stopColor="rgba(5,10,25,0.75)" />
        <stop offset="100%" stopColor="rgba(80,160,240,0.12)" />
      </linearGradient>
      {/* Ø circle gradient */}
      <linearGradient id="omegaCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.95)" />
        <stop offset="20%"  stopColor="rgba(180,245,255,1)" />
        <stop offset="60%"  stopColor="rgba(0,238,255,1)" />
        <stop offset="100%" stopColor="rgba(0,180,220,0.85)" />
      </linearGradient>
      {/* Ø slash gradient */}
      <linearGradient id="omegaSlashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.98)" />
        <stop offset="30%"  stopColor="rgba(160,245,255,1)" />
        <stop offset="70%"  stopColor="rgba(0,238,255,1)" />
        <stop offset="100%" stopColor="rgba(0,195,235,0.85)" />
      </linearGradient>
      {/* Ambient glow radial */}
      <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="rgba(0,238,255,0.08)" />
        <stop offset="100%" stopColor="rgba(0,238,255,0)" />
      </radialGradient>
      {/* Crystal edge stroke */}
      <linearGradient id="edgeStroke" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="rgba(120,210,255,0.55)" />
        <stop offset="50%"  stopColor="rgba(0,238,255,0.25)" />
        <stop offset="100%" stopColor="rgba(40,100,180,0.4)" />
      </linearGradient>
    </defs>

    {/* ── Ambient background glow ── */}
    <circle cx="90" cy="90" r="88" fill="url(#ambientGlow)" />

    {/* ── TOP spike ── */}
    {/* Shadow face left */}
    <polygon points="90,8 72,72 90,60" fill="rgba(5,10,25,0.8)" />
    {/* Light face right */}
    <polygon points="90,8 108,72 90,60" fill="rgba(100,170,240,0.18)" />
    {/* Inner face */}
    <polygon points="90,8 72,72 90,60 108,72" fill="url(#crystalFaceTop)" />
    {/* Edge highlights */}
    <line x1="90" y1="8" x2="72" y2="72" stroke="rgba(80,160,240,0.35)" strokeWidth="0.8" />
    <line x1="90" y1="8" x2="108" y2="72" stroke="rgba(180,230,255,0.55)" strokeWidth="0.8" />
    {/* Specular on right edge */}
    <line x1="90" y1="8" x2="104" y2="58" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />

    {/* ── RIGHT spike ── */}
    <polygon points="172,90 108,72 120,90" fill="rgba(140,200,255,0.15)" />
    <polygon points="172,90 108,108 120,90" fill="rgba(5,10,25,0.75)" />
    <polygon points="172,90 108,72 120,90 108,108" fill="url(#crystalFaceRight)" />
    <line x1="172" y1="90" x2="108" y2="72" stroke="rgba(180,230,255,0.5)" strokeWidth="0.8" />
    <line x1="172" y1="90" x2="108" y2="108" stroke="rgba(40,80,160,0.3)" strokeWidth="0.8" />

    {/* ── BOTTOM spike ── */}
    <polygon points="90,172 108,108 90,120" fill="rgba(5,10,25,0.85)" />
    <polygon points="90,172 72,108 90,120" fill="rgba(60,120,200,0.12)" />
    <polygon points="90,172 108,108 90,120 72,108" fill="url(#crystalFaceBottom)" />
    <line x1="90" y1="172" x2="108" y2="108" stroke="rgba(40,80,160,0.3)" strokeWidth="0.8" />
    <line x1="90" y1="172" x2="72" y2="108" stroke="rgba(80,140,220,0.25)" strokeWidth="0.8" />

    {/* ── LEFT spike ── */}
    <polygon points="8,90 72,108 60,90" fill="rgba(5,10,25,0.8)" />
    <polygon points="8,90 72,72 60,90" fill="rgba(80,150,230,0.14)" />
    <polygon points="8,90 72,108 60,90 72,72" fill="url(#crystalFaceLeft)" />
    <line x1="8" y1="90" x2="72" y2="72" stroke="rgba(120,190,255,0.35)" strokeWidth="0.8" />
    <line x1="8" y1="90" x2="72" y2="108" stroke="rgba(30,60,140,0.25)" strokeWidth="0.8" />

    {/* ── Center diamond face ── */}
    <polygon points="90,60 120,90 90,120 60,90"
      fill="rgba(8,16,35,0.88)"
      stroke="url(#edgeStroke)"
      strokeWidth="0.6"
    />
    {/* Center face inner facets */}
    <polygon points="90,60 120,90 90,90" fill="rgba(0,238,255,0.04)" />
    <polygon points="90,60 60,90 90,90" fill="rgba(0,0,0,0.15)" />
    <polygon points="90,120 120,90 90,90" fill="rgba(0,0,0,0.2)" />
    <polygon points="90,120 60,90 90,90" fill="rgba(0,238,255,0.02)" />

    {/* ── Ø Logo — neon 3D ── */}
    {/* Deep outer glow layer */}
    <circle cx="90" cy="90" r="32"
      stroke="rgba(0,238,255,0.15)"
      strokeWidth="18"
      fill="none"
      filter="url(#deepGlow)"
    />
    {/* Mid glow */}
    <circle cx="90" cy="90" r="32"
      stroke="rgba(0,238,255,0.45)"
      strokeWidth="10"
      fill="none"
      filter="url(#edgeGlow)"
    />
    {/* Main circle */}
    <circle cx="90" cy="90" r="32"
      stroke="url(#omegaCircleGrad)"
      strokeWidth="5.5"
      fill="none"
    />
    {/* White specular arc — top-left hotspot */}
    <circle cx="90" cy="90" r="32"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="2"
      fill="none"
      strokeDasharray="42 160"
      strokeDashoffset="18"
      filter="url(#softWhite)"
    />

    {/* Slash deep glow */}
    <line x1="114" y1="60" x2="66" y2="120"
      stroke="rgba(0,238,255,0.2)"
      strokeWidth="14"
      strokeLinecap="round"
      filter="url(#deepGlow)"
    />
    {/* Slash mid glow */}
    <line x1="114" y1="60" x2="66" y2="120"
      stroke="rgba(0,238,255,0.5)"
      strokeWidth="8"
      strokeLinecap="round"
      filter="url(#edgeGlow)"
    />
    {/* Slash main */}
    <line x1="114" y1="60" x2="66" y2="120"
      stroke="url(#omegaSlashGrad)"
      strokeWidth="5.5"
      strokeLinecap="round"
    />
    {/* Slash white core — top specular */}
    <line x1="112" y1="63" x2="88" y2="96"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="2"
      strokeLinecap="round"
      filter="url(#softWhite)"
    />

    {/* ── Outer edge glow on crystal spikes ── */}
    {/* Top spike glow edge */}
    <polyline points="72,72 90,8 108,72"
      stroke="rgba(0,238,255,0.12)"
      strokeWidth="1.5"
      fill="none"
      filter="url(#edgeGlow)"
    />
    {/* Right spike glow edge */}
    <polyline points="108,72 172,90 108,108"
      stroke="rgba(0,238,255,0.1)"
      strokeWidth="1.5"
      fill="none"
      filter="url(#edgeGlow)"
    />
    {/* Bottom spike glow edge */}
    <polyline points="108,108 90,172 72,108"
      stroke="rgba(0,238,255,0.08)"
      strokeWidth="1.5"
      fill="none"
      filter="url(#edgeGlow)"
    />
    {/* Left spike glow edge */}
    <polyline points="72,108 8,90 72,72"
      stroke="rgba(0,238,255,0.1)"
      strokeWidth="1.5"
      fill="none"
      filter="url(#edgeGlow)"
    />
  </svg>
));
CrystalLogo.displayName = 'CrystalLogo';

// ─── Thin progress bar ────────────────────────────────────────────────────────
const EnterProgress = React.memo(({ duration }: { duration: number }) => {
  const trackStyle = useMemo(() => Object.freeze({
    width: '100px',
    height: '1px',
    background: 'rgba(32,42,68,1)',
    borderRadius: '1px',
    overflow: 'hidden' as const,
    marginTop: '28px',
  }), []);
  const fillStyle = useMemo(() => Object.freeze({
    height: '100%',
    background: 'rgba(0,238,255,1)',
    borderRadius: '1px',
    transformOrigin: 'left' as const,
  }), []);
  return (
    <div style={trackStyle}>
      <motion.div
        style={fillStyle}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </div>
  );
});
EnterProgress.displayName = 'EnterProgress';

// ─── Portal ───────────────────────────────────────────────────────────────────
const Portal: React.FC = () => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);
  const frameRef   = useRef<number>(0);
  const clockRef   = useRef(new THREE.Clock());
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const navigate   = useNavigate();
  const [launched,    setLaunched]    = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);

  const doEnter = useCallback(() => {
    if (!mountedRef.current) return;
    setLaunched(true);
    setTimeout(() => navigate('/dashboard'), 600);
  }, [navigate]);

  useEffect(() => {
    mountedRef.current = true;
    const showTimer = setTimeout(() => { if (mountedRef.current) setLogoVisible(true); }, 250);
    timerRef.current  = setTimeout(() => { if (mountedRef.current) doEnter(); }, AUTO_ENTER_MS + 250);
    return () => {
      mountedRef.current = false;
      clearTimeout(showTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [doEnter]);

  const initScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mountedRef.current) return;

    const scene    = new THREE.Scene();
    scene.fog      = new THREE.FogExp2(0x000000, 0.003);
    const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 70;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);

    const prng      = createPRNG(PARTICLE_COUNT * 31337);
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors    = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3    = i * 3;
      const theta = prng() * Math.PI * 2;
      const phi   = Math.acos(2 * prng() - 1);
      const r     = Math.cbrt(prng()) * PARTICLE_SPREAD;
      positions[i3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      const t = r / PARTICLE_SPREAD;
      colors[i3]     = 0.38 * (1 - t) + 0.55 * t;
      colors[i3 + 1] = 0.72 * (1 - t) + 0.92 * t;
      colors[i3 + 2] = 0.95 * (1 - t) + 0.25 * t;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.7, vertexColors: true, transparent: true, opacity: 0.9,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    const mouse = { x: 0, y: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 0.4;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener('mousemove', onMouse);
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      if (!mountedRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      const t = clockRef.current.getElapsedTime();
      if (!prefersReducedMotion) {
        particles.rotation.y = t * 0.035;
        particles.rotation.x = t * 0.015;
        camera.position.x += (mouse.x * 18 - camera.position.x) * 0.03;
        camera.position.y += (-mouse.y * 18 - camera.position.y) * 0.03;
        camera.lookAt(scene.position);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      geo.dispose(); mat.dispose(); renderer.dispose();
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const cleanup = initScene();
    return () => { cleanup?.(); };
  }, [initScene]);

  const handleClick = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doEnter();
  }, [doEnter]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  }, [handleClick]);

  const wrapStyle = useMemo(() => Object.freeze({
    position: 'fixed' as const,
    inset: 0, width: '100vw', height: '100vh',
    overflow: 'hidden', background: 'rgba(0,0,0,1)', cursor: 'pointer',
  }), []);

  const canvasStyle = useMemo(() => Object.freeze({
    position: 'absolute' as const, inset: 0, width: '100%', height: '100%',
  }), []);

  const overlayStyle = useMemo(() => Object.freeze({
    position: 'absolute' as const, inset: 0, pointerEvents: 'none' as const,
    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 25%, rgba(0,0,0,0.7) 100%)',
  }), []);

  const uiStyle = useMemo(() => Object.freeze({
    position: 'absolute' as const, inset: 0,
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none' as const,
  }), []);

  const logoWrapStyle = useMemo(() => Object.freeze({
    position: 'relative' as const,
    width: '200px', height: '200px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }), []);

  const logoAmbientStyle = useMemo(() => Object.freeze({
    position: 'absolute' as const, inset: '-32px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,238,255,0.12) 0%, rgba(0,238,255,0.04) 50%, transparent 75%)',
    filter: 'blur(14px)', pointerEvents: 'none' as const,
  }), []);

  // Slow rotation on the logo
  const logoMotionStyle = useMemo(() => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }), []);

  const titleStyle = useMemo(() => Object.freeze({
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800,
    fontSize: 'clamp(26px, 5.5vw, 50px)',
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0)',
    WebkitTextStroke: '1px rgba(240,240,248,0.88)',
    margin: '20px 0 0',
    lineHeight: 1,
    textAlign: 'center' as const,
    userSelect: 'none' as const,
  }), []);

  const subtitleStyle = useMemo(() => Object.freeze({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 'clamp(9px, 1.8vw, 13px)',
    letterSpacing: '0.52em',
    color: 'rgba(0,238,255,0.6)',
    margin: '5px 0 0',
    textAlign: 'center' as const,
    userSelect: 'none' as const,
  }), []);

  const versionStyle = useMemo(() => Object.freeze({
    position: 'absolute' as const,
    bottom: '18px', right: '20px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '9px', color: 'rgba(80,80,100,1)',
    letterSpacing: '0.1em', pointerEvents: 'none' as const,
  }), []);

  return (
    <AnimatePresence>
      {!launched ? (
        <motion.div
          key="portal"
          style={wrapStyle}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          role="button"
          tabIndex={0}
          aria-label="ZERØ MERIDIAN — tap to enter"
        >
          <canvas ref={canvasRef} style={canvasStyle} aria-hidden="true" />
          <div style={overlayStyle} />

          <div style={uiStyle}>
            <AnimatePresence>
              {logoVisible && (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0, scale: 0.7, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.15 }}
                  transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                  style={logoWrapStyle}
                >
                  <div style={logoAmbientStyle} />
                  <motion.div
                    style={logoMotionStyle}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
                  >
                    <CrystalLogo />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {logoVisible && (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.32, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', pointerEvents: 'none' as const }}
                >
                  <div style={titleStyle}>ZERØ</div>
                  <div style={subtitleStyle}>MERIDIAN</div>
                  <EnterProgress duration={AUTO_ENTER_MS} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={versionStyle}>
            {'v3.0 / ' + PARTICLE_COUNT.toLocaleString() + ' pts'}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="exit"
          style={{ position: 'fixed' as const, inset: 0, background: 'rgba(5,5,7,1)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </AnimatePresence>
  );
};

Portal.displayName = 'Portal';
export default React.memo(Portal);
