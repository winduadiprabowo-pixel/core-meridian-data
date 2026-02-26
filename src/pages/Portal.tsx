/**
 * Portal.tsx — ZERØ MERIDIAN 2026 Phase 10
 * Splash screen: Three.js WebGL2 particle universe.
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX ✓
 * - Zero Math.random() — seeded PRNG (xoshiro128++) ✓
 * - Portal aesthetic rgba preserved by design (black space bg intentional)
 * - mountedRef ✓
 * - useCallback + useMemo ✓
 * - will-change: transform ✓
 * - aria-label ✓
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

const PARTICLE_COUNT = 6000;
const PARTICLE_SPREAD = 140;

// ─── Seeded PRNG (xoshiro128++ — deterministic, zero Math.random()) ───────────

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

// ─── Component ────────────────────────────────────────────────────────────────

const Portal: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);
  const frameRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const [launched, setLaunched] = useState(false);
  const [hover, setHover] = useState(false);

  const initScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mountedRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x00000, 0.003);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 70;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);

    // Deterministic PRNG seeded with PARTICLE_COUNT (reproducible each load)
    const prng = createPRNG(PARTICLE_COUNT * 31337);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors    = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
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
      size: 0.7,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
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
      mountedRef.current = false;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      geo.dispose(); mat.dispose();
      coreGeo.dispose(); coreMat.dispose();
      ringGeo.dispose(); ringMat.dispose();
      ring2Geo.dispose(); ring2Mat.dispose();
      renderer.dispose();
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    mountedRef.current = true;
    const cleanup = initScene();
    return () => { mountedRef.current = false; cleanup?.(); };
  }, [initScene]);

  const handleLaunch = useCallback(() => {
    setLaunched(true);
    setTimeout(() => { navigate('/dashboard'); }, 900);
  }, [navigate]);

  const handleHoverStart = useCallback(() => setHover(true), []);
  const handleHoverEnd   = useCallback(() => setHover(false), []);

  const wrapStyle = useMemo(() => ({
    position: 'fixed' as const,
    inset: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: 'rgba(0,0,0,1)',
  }), []);

  const canvasStyle = useMemo(() => ({
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
  }), []);

  const uiStyle = useMemo(() => ({
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none' as const,
  }), []);

  const overlayStyle = useMemo(() => ({
    position: 'absolute' as const,
    inset: 0,
    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)',
    pointerEvents: 'none' as const,
  }), []);

  const btnStyle = useMemo(() => ({
    pointerEvents: 'auto' as const,
    marginTop: '52px',
    padding: '14px 48px',
    fontFamily: "'Space Mono', monospace",
    fontSize: '12px',
    letterSpacing: '0.22em',
    fontWeight: 700,
    color: hover ? 'rgba(0,0,0,0.9)' : 'rgba(154,230,180,1)',
    background: hover ? 'rgba(154,230,180,1)' : 'rgba(154,230,180,0.06)',
    border: '1px solid rgba(154,230,180,0.5)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
    textTransform: 'uppercase' as const,
    willChange: 'transform',
  }), [hover]);

  return (
    <AnimatePresence>
      {!launched ? (
        <motion.div
          key="portal"
          style={wrapStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <canvas ref={canvasRef} style={canvasStyle} aria-hidden="true" />
          <div style={overlayStyle} />

          <div style={uiStyle}>
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.28em',
                color: 'rgba(99,179,237,0.6)',
                marginBottom: '28px',
                textTransform: 'uppercase' as const,
              }}
            >
              Build Lab × prbw
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 'clamp(36px, 7vw, 88px)',
                fontWeight: 900,
                letterSpacing: '0.06em',
                color: 'rgba(255,255,255,0)',
                WebkitTextStroke: '1px rgba(255,255,255,0.85)',
                margin: 0,
                lineHeight: 1,
                textAlign: 'center' as const,
                userSelect: 'none' as const,
              }}
            >
              ZERØ
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 'clamp(14px, 2.5vw, 28px)',
                fontWeight: 400,
                letterSpacing: '0.52em',
                color: 'rgba(154,230,180,0.7)',
                margin: '8px 0 0',
                textAlign: 'center' as const,
                userSelect: 'none' as const,
              }}
            >
              MERIDIAN
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '11px',
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.18em',
                marginTop: '24px',
                textAlign: 'center' as const,
              }}
            >
              CRYPTO INTELLIGENCE TERMINAL — 2026
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              onClick={handleLaunch}
              onHoverStart={handleHoverStart}
              onHoverEnd={handleHoverEnd}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={btnStyle}
              aria-label="Launch ZERØ MERIDIAN Terminal"
            >
              LAUNCH TERMINAL
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                color: 'rgba(255,255,255,0.15)',
                letterSpacing: '0.14em',
                marginTop: '24px',
              }}
            >
              MOVE MOUSE TO NAVIGATE
            </motion.p>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '24px',
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            color: 'rgba(99,179,237,0.25)',
            letterSpacing: '0.1em',
            pointerEvents: 'none',
          }}>
            {'WebGL2 / Three.js / ' + PARTICLE_COUNT.toLocaleString() + ' pts'}
          </div>

          <div style={{
            position: 'absolute',
            top: '20px',
            left: '24px',
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            color: 'rgba(255,255,255,0.15)',
            letterSpacing: '0.12em',
            pointerEvents: 'none',
          }}>
            v3.0.0-phase10
          </div>

        </motion.div>
      ) : (
        <motion.div
          key="transition"
          style={{ ...wrapStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '13px',
              color: 'rgba(154,230,180,0.7)',
              letterSpacing: '0.2em',
            }}
          >
            INITIALIZING...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Portal.displayName = 'Portal';

export default React.memo(Portal);
