/**
 * useDeviceProfile.ts — ZERØ MERIDIAN push59
 * Adaptive performance — detect RAM, CPU cores, network speed
 * Returns performance tier: 'low' | 'mid' | 'high'
 *
 * low  = RAM ≤2GB or CPU ≤2 cores or 3G → animasi minimal, data ringan
 * mid  = RAM 2-3GB / 3G               → ringan
 * high = RAM ≥4GB + 4G               → full blast (smooth total)
 */

import { useMemo } from 'react';

export type PerfTier = 'low' | 'mid' | 'high';

export interface DeviceProfile {
  tier:            PerfTier;
  ram:             number;       // GB estimate
  cpuCores:        number;
  connection:      string;       // '4g' | '3g' | 'wifi' | 'unknown'
  isLowEnd:        boolean;
  isMidRange:      boolean;
  isHighEnd:       boolean;
  // Adaptive values
  maxAnimations:   number;       // max concurrent animations
  maxBubbles:      number;       // liquidation bubbles
  fetchTimeout:    number;       // ms
  blurAmount:      number;       // px — 0 on low-end
  animDuration:    number;       // multiplier — 0 disables
  enableParticles: boolean;
  enableBlur:      boolean;
  enableGlow:      boolean;
  staggerDelay:    number;       // animation stagger ms
}

function getDeviceProfile(): DeviceProfile {
  // ── RAM detection ──────────────────────────────────────────────────────────
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: {
      effectiveType?: string;
      downlink?: number;
      saveData?: boolean;
    };
  };

  const ram        = nav.deviceMemory ?? 4; // fallback 4GB if unsupported
  const cpuCores   = navigator.hardwareConcurrency ?? 4;
  const conn       = nav.connection;
  const netType    = conn?.effectiveType ?? 'unknown';
  const saveData   = conn?.saveData ?? false;
  const downlink   = conn?.downlink ?? 10; // Mbps

  // ── Tier scoring ───────────────────────────────────────────────────────────
  let score = 0;

  // RAM score
  if (ram >= 8)       score += 3;
  else if (ram >= 4)  score += 2;
  else if (ram >= 3)  score += 1;
  else                score += 0; // 2GB or less

  // CPU score
  if (cpuCores >= 8)      score += 3;
  else if (cpuCores >= 6) score += 2;
  else if (cpuCores >= 4) score += 1;
  else                    score += 0;

  // Network score
  if (netType === 'wifi' || downlink >= 20)  score += 2;
  else if (netType === '4g' || downlink >= 5) score += 1;
  else                                        score += 0;

  // Save data mode → force low
  if (saveData) score = 0;

  // ── Determine tier ─────────────────────────────────────────────────────────
  let tier: PerfTier;
  if (score >= 4)      tier = 'high';  // RAM 4GB + 4G = HIGH
  else if (score >= 2) tier = 'mid';
  else                 tier = 'low';

  // ── Adaptive values per tier ───────────────────────────────────────────────
  const profiles: Record<PerfTier, Omit<DeviceProfile, 'tier' | 'ram' | 'cpuCores' | 'connection' | 'isLowEnd' | 'isMidRange' | 'isHighEnd'>> = {
    low: {
      maxAnimations:   2,
      maxBubbles:      15,
      fetchTimeout:    12000,
      blurAmount:      0,
      animDuration:    0,      // disable animations
      enableParticles: false,
      enableBlur:      false,
      enableGlow:      false,
      staggerDelay:    0,
    },
    mid: {
      maxAnimations:   5,
      maxBubbles:      30,
      fetchTimeout:    10000,
      blurAmount:      8,
      animDuration:    0.6,
      enableParticles: false,
      enableBlur:      true,
      enableGlow:      true,
      staggerDelay:    40,
    },
    high: {
      maxAnimations:   20,
      maxBubbles:      60,
      fetchTimeout:    8000,
      blurAmount:      20,
      animDuration:    1,
      enableParticles: true,
      enableBlur:      true,
      enableGlow:      true,
      staggerDelay:    50,
    },
  };

  return {
    tier,
    ram,
    cpuCores,
    connection: netType,
    isLowEnd:   tier === 'low',
    isMidRange: tier === 'mid',
    isHighEnd:  tier === 'high',
    ...profiles[tier],
  };
}

// Singleton — computed once, stable reference
let _cachedProfile: DeviceProfile | null = null;

export function useDeviceProfile(): DeviceProfile {
  return useMemo(() => {
    if (!_cachedProfile) {
      _cachedProfile = getDeviceProfile();
    }
    return _cachedProfile;
  }, []);
}

// Non-hook version for use outside React
export function getProfile(): DeviceProfile {
  if (!_cachedProfile) {
    _cachedProfile = getDeviceProfile();
  }
  return _cachedProfile;
}
