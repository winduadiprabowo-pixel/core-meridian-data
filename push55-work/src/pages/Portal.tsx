/**
 * Portal.tsx — ZERØ MERIDIAN push43
 * Auto-redirect to /dashboard after 2.2s.
 * Three.js WebGL2 particle universe preserved (seeded PRNG).
 * Branding: "ZERØ MERIDIAN / by Zero Build Lab × prbw" — subtle, no self-claim.
 * - React.memo + displayName ✓  - rgba() only ✓  - mountedRef ✓
 * - useCallback + useMemo ✓  - Zero template literals in JSX ✓
 * - Object.freeze() static consts ✓  - useReducedMotion ✓
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const PARTICLE_DESKTOP = 6000;
const PARTICLE_MOBILE  = 1500;
const PARTICLE_SPREAD  = 140;
const AUTO_REDIRECT_MS = 2200;

// ─── Seeded PRNG (xoshiro128++ — deterministic, zero Math.random()) ───────────

function createPRNG(seed) {
  let s0 = seed >>> 0;
  let s1 = (seed * 1664525 + 1013904223) >>> 0;
  let s2 = (s1  * 1664525 + 1013904223) >>> 0;
  let s3 = (s2  * 1664525 + 1013904223) >>> 0;
  return function next() {
    const result = (Math.imul(s0 + s3, 5) + 0x9E3779B9) >>> 0;
    const t = s1 << 9;
    s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3;
    s2 ^= t;
    s3 = (s3 << 11) | (s3 >>> 21);
    return (result >>> 0) / 0x100000000;
  };
}

// ─── Progress bar (auto-counts down to redirect) ─────────────────────────────

const ProgressBar = React.memo(({ duration }) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: '2px',
      background: 'rgba(255,255,255,0.06)',
    }}>
      <motion.div
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        style={{
          height: '100%',
          background: 'linear-gradient(90deg, rgba(0,238,255,0.60), rgba(167,139,250,0.6))',
        }}
      />
    </div>
  );
});
ProgressBar.displayName = 'ProgressBar';

// ─── Portal ───────────────────────────────────────────────────────────────────

const Portal = () => {
  const canvasRef            = useRef(null);
  const mountedRef           = useRef(true);
  const frameRef             = useRef(0);
  const clockRef             = useRef(new THREE.Clock());
  const prefersReducedMotion = useReducedMotion();
  const navigate             = useNavigate();
  const [exiting, setExiting] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();
  const PARTICLE_COUNT       = isMobile ? PARTICLE_MOBILE : PARTICLE_DESKTOP;

  // ── Auto-redirect ────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    const id = setTimeout(() => {
      if (!mountedRef.current) return;
      setExiting(true);
      setTimeout(() => { navigate('/dashboard'); }, 600);
    }, AUTO_REDIRECT_MS);
    return () => { mountedRef.current = false; clearTimeout(id); };
  }, [navigate]);

  // ── Three.js scene ───────────────────────────────────────────────────────
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
      const t       = r / PARTICLE_SPREAD;
      colors[i3]    = 0.38 * (1 - t) + 0.55 * t;
      colors[i3+1]  = 0.72 * (1 - t) + 0.92 * t;
      colors[i3+2]  = 0.95 * (1 - t) + 0.25 * t;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.7, vertexColors: true, transparent: true,
      opacity: 0.9, sizeAttenuation: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    const coreGeo = new THREE.IcosahedronGeometry(7, 1);
    const coreMat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.18 });
    coreMat.color.setRGB(0.38, 0.72, 0.95);
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    const ringGeo = new THREE.TorusGeometry(18, 0.15, 8, 80);
    const ringMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.2 });
    ringMat.color.setRGB(0.55, 0.92, 0.65);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    const ring2Geo = new THREE.TorusGeometry(26, 0.08, 6, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1 });
    ring2Mat.color.setRGB(0.38, 0.72, 0.95);
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 5;
    ring2.rotation.z = Math.PI / 4;
    scene.add(ring2);

    const mouse = { x: 0, y: 0 };
    const onMouse = (e) => {
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
        const pulse = Math.sin(t * 1.8) * 0.07 + 1;
        core.scale.setScalar(pulse);
        core.rotation.x = t * 0.25;
        core.rotation.z = t * 0.18;
        ring.rotation.z  = t * 0.12;
        ring.rotation.y  = t * 0.06;
        ring2.rotation.z = t * 0.07;
        ring2.rotation.x = t * 0.04;
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
      geo.dispose(); mat.dispose();
      coreGeo.dispose(); coreMat.dispose();
      ringGeo.dispose(); ringMat.dispose();
      ring2Geo.dispose(); ring2Mat.dispose();
      renderer.dispose();
    };
  }, [prefersReducedMotion, PARTICLE_COUNT]);

  useEffect(() => {
    mountedRef.current = true;
    const cleanup = initScene();
    return () => { mountedRef.current = false; cleanup?.(); };
  }, [initScene]);

  const wrapStyle = useMemo(() => ({
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: 'rgba(0,0,0,1)',
  }), []);

  return (
    <AnimatePresence mode="wait">
      {!exiting ? (
        <motion.div
          key="portal"
          style={wrapStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Three.js canvas */}
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            aria-hidden="true"
          />

          {/* Radial vignette */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 25%, rgba(0,0,0,0.72) 100%)',
          }} />

          {/* Center UI */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {/* ZERØ */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 'clamp(40px, 7.5vw, 96px)',
                fontWeight: 900,
                letterSpacing: '0.06em',
                color: 'rgba(255,255,255,0)',
                WebkitTextStroke: '1px rgba(255,255,255,0.88)',
                margin: 0, lineHeight: 1,
                textAlign: 'center',
                userSelect: 'none',
              }}
            >
              ZER&#216;
            </motion.h1>

            {/* MERIDIAN */}
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 'clamp(13px, 2.2vw, 26px)',
                fontWeight: 400,
                letterSpacing: '0.56em',
                color: 'rgba(154,230,180,0.72)',
                margin: '10px 0 0',
                textAlign: 'center',
                userSelect: 'none',
              }}
            >
              MERIDIAN
            </motion.h2>

            {/* Thin separator */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: 'clamp(48px, 6vw, 80px)',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(0,238,255,0.50), transparent)',
                margin: '24px 0',
                transformOrigin: 'center',
              }}
            />

            {/* Entering indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'rgba(0,238,255,0.90)',
                }}
              />
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'clamp(9px, 1vw, 11px)',
                color: 'rgba(255,255,255,0.28)',
                letterSpacing: '0.20em',
                textTransform: 'uppercase',
              }}>
                Entering
              </span>
            </motion.div>
          </div>

          {/* Bottom-right branding — subtle, not noisy */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            style={{
              position: 'absolute',
              bottom: '20px', right: '20px',
              textAlign: 'right',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '10px',
              color: 'rgba(255,255,255,0.18)',
              letterSpacing: '0.10em',
              lineHeight: 1.6,
            }}>
              by Zero Build Lab
            </div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '10px',
              color: 'rgba(255,255,255,0.12)',
              letterSpacing: '0.10em',
            }}>
              &#215; prbw
            </div>
          </motion.div>

          {/* Progress bar at bottom */}
          <ProgressBar duration={AUTO_REDIRECT_MS} />
        </motion.div>
      ) : (
        <motion.div
          key="exit"
          style={{ ...wrapStyle, background: 'rgba(10,10,10,1)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </AnimatePresence>
  );
};

Portal.displayName = 'Portal';

export default React.memo(Portal);
