/**
 * useHoudini.ts — ZERØ MERIDIAN 2026 Phase 9
 * CSS Houdini Paint Worklet registration + custom property definitions.
 * Registers: zm-aurora-grid, zm-price-bg, zm-noise-tile
 *
 * Also registers CSS Custom Properties with types so Houdini knows
 * what to pass to the worklet.
 *
 * Zero JSX ✓  mountedRef ✓  useMemo ✓
 */

import { useRef, useEffect, useState, useMemo } from 'react';

export type HoudiniStatus = 'idle' | 'loading' | 'ready' | 'unsupported';

export interface HoudiniAPI {
  status:       HoudiniStatus;
  isSupported:  boolean;
  /** Apply aurora-grid paint to an element via inline style */
  getAuroraBg:  (trend: number, intensity?: number, hue?: number) => React.CSSProperties;
  /** Apply price-bg paint to an element via inline style */
  getPriceBg:   (trend: number, intensity?: number) => React.CSSProperties;
  /** Apply noise-tile paint to an element via inline style */
  getNoiseBg:   (intensity?: number) => React.CSSProperties;
}

// Import React type only for return type annotation
import type React from 'react';

// ─── Custom property registrations ───────────────────────────────────────────

const CUSTOM_PROPS = Object.freeze([
  { name: '--zm-trend',     syntax: '<number>', inherits: false, initialValue: '0'   },
  { name: '--zm-intensity', syntax: '<number>', inherits: false, initialValue: '0.5' },
  { name: '--zm-hue',       syntax: '<number>', inherits: false, initialValue: '220' },
] as const);

function registerCustomProperties(): void {
  if (typeof CSS === 'undefined' || !('registerProperty' in CSS)) return;
  for (const prop of CUSTOM_PROPS) {
    try {
      (CSS as unknown as {
        registerProperty: (opts: {
          name: string;
          syntax: string;
          inherits: boolean;
          initialValue: string;
        }) => void;
      }).registerProperty(prop);
    } catch {
      // Already registered — ignore
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHoudini(): HoudiniAPI {
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<HoudiniStatus>('idle');

  const isSupported = useMemo(() =>
    typeof CSS !== 'undefined' &&
    'paintWorklet' in CSS,
  []);

  useEffect(() => {
    mountedRef.current = true;

    if (!isSupported) {
      setStatus('unsupported');
      return () => { mountedRef.current = false; };
    }

    setStatus('loading');

    // Register typed custom properties
    registerCustomProperties();

    // Add paint worklet
    const cssObj = CSS as unknown as { paintWorklet?: { addModule: (url: string) => Promise<void> } };
    if (cssObj.paintWorklet) {
      cssObj.paintWorklet.addModule('/houdini/zmPaint.js')
        .then(() => {
          if (mountedRef.current) setStatus('ready');
        })
        .catch(() => {
          // Worklet failed (e.g., not HTTPS, CSP) — degrade gracefully
          if (mountedRef.current) setStatus('unsupported');
        });
    } else {
      setStatus('unsupported');
    }

    return () => { mountedRef.current = false; };
  }, [isSupported]);

  // ─── Style builders ─────────────────────────────────────────────────────────
  // When Houdini is ready, use paint(). When not supported, provide CSS fallback.

  const getAuroraBg = useMemo(() => (trend: number, intensity = 0.6, hue = 220): React.CSSProperties => {
    if (status === 'ready') {
      return {
        '--zm-trend':     String(trend),
        '--zm-intensity': String(intensity),
        '--zm-hue':       String(hue),
        background:       'paint(zm-aurora-grid)',
        willChange:       'background',
      } as React.CSSProperties;
    }
    // Fallback: CSS gradient approximation
    const aurAlpha = 0.05 * intensity;
    const trendColor = trend >= 0
      ? `rgba(52,211,153,${aurAlpha})`
      : `rgba(251,113,133,${aurAlpha})`;
    return {
      background: `radial-gradient(ellipse at 15% 30%, ${trendColor} 0%, transparent 60%),
                   radial-gradient(ellipse at 85% 70%, rgba(96,165,250,${aurAlpha * 0.7}) 0%, transparent 60%),
                   rgba(5,5,14,0.98)`,
    };
  }, [status]);

  const getPriceBg = useMemo(() => (trend: number, intensity = 0.5): React.CSSProperties => {
    if (status === 'ready') {
      return {
        '--zm-trend':     String(trend),
        '--zm-intensity': String(intensity),
        background:       'paint(zm-price-bg)',
        willChange:       'background',
      } as React.CSSProperties;
    }
    const alpha = 0.06 * Math.abs(trend) * intensity;
    const color = trend >= 0
      ? `rgba(52,211,153,${alpha})`
      : `rgba(251,113,133,${alpha})`;
    return {
      background: `linear-gradient(to top, ${color}, transparent 50%), rgba(8,10,18,0.97)`,
    };
  }, [status]);

  const getNoiseBg = useMemo(() => (intensity = 0.3): React.CSSProperties => {
    if (status === 'ready') {
      return {
        '--zm-intensity': String(intensity),
        background:       'paint(zm-noise-tile)',
        willChange:       'background',
      } as React.CSSProperties;
    }
    return {
      background: 'rgba(8,10,18,1)',
    };
  }, [status]);

  return useMemo(() => ({
    status,
    isSupported,
    getAuroraBg,
    getPriceBg,
    getNoiseBg,
  }), [status, isSupported, getAuroraBg, getPriceBg, getNoiseBg]);
}
