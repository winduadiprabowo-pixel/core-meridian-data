/**
 * tokens.ts — ZERØ MERIDIAN Design Token System 2026
 * Single source of truth. Semua nilai derive dari sini.
 * Compatible: CSS vars, JS runtime, Style Dictionary export.
 * Zero hsl() — rgba() only sesuai ZM standard.
 */

// ─── Color Primitives ─────────────────────────────────────────────────────────

export const COLOR = Object.freeze({
  // Blues
  blue50:  'rgba(239,246,255,1)',
  blue100: 'rgba(219,234,254,1)',
  blue300: 'rgba(147,197,253,1)',
  blue400: 'rgba(96,165,250,1)',   // primary accent
  blue500: 'rgba(59,130,246,1)',
  blue600: 'rgba(37,99,235,1)',
  blue900: 'rgba(30,58,138,1)',

  // Emerald
  emerald300: 'rgba(110,231,183,1)',
  emerald400: 'rgba(52,211,153,1)', // positive
  emerald500: 'rgba(16,185,129,1)',
  emerald600: 'rgba(5,150,105,1)',

  // Rose
  rose300: 'rgba(253,164,175,1)',
  rose400: 'rgba(251,113,133,1)',   // negative
  rose500: 'rgba(244,63,94,1)',
  rose600: 'rgba(225,29,72,1)',

  // Amber
  amber300: 'rgba(252,211,77,1)',
  amber400: 'rgba(251,191,36,1)',   // warning / whale
  amber500: 'rgba(245,158,11,1)',

  // Violet
  violet300: 'rgba(196,181,253,1)',
  violet400: 'rgba(167,139,250,1)', // DeFi / OI
  violet500: 'rgba(139,92,246,1)',

  // Cyan
  cyan300: 'rgba(103,232,249,1)',
  cyan400: 'rgba(34,211,238,1)',    // tools / surge
  cyan500: 'rgba(6,182,212,1)',

  // Neutrals
  slate50:  'rgba(248,250,252,1)',
  slate100: 'rgba(241,245,249,1)',
  slate200: 'rgba(226,232,240,1)',
  slate400: 'rgba(148,163,184,1)',
  slate600: 'rgba(71,85,105,1)',
  slate800: 'rgba(30,41,59,1)',
  slate900: 'rgba(15,23,42,1)',
  slate950: 'rgba(5,5,14,1)',       // ZM base dark

  // Pure
  black: 'rgba(0,0,0,1)',
  white: 'rgba(255,255,255,1)',
  transparent: 'rgba(0,0,0,0)',
} as const);

// ─── Semantic Tokens ──────────────────────────────────────────────────────────

export const SEMANTIC = Object.freeze({
  dark: {
    bgBase:        'rgba(5,5,14,1)',
    bgElevated:    'rgba(10,10,24,1)',
    bgCard:        'rgba(255,255,255,0.024)',
    bgCardHover:   'rgba(255,255,255,0.042)',
    border:        'rgba(96,165,250,0.07)',
    borderHover:   'rgba(96,165,250,0.22)',
    textPrimary:   'rgba(226,232,240,0.92)',
    textSecondary: 'rgba(148,163,184,0.58)',
    textFaint:     'rgba(148,163,184,0.28)',
    sidebarBg:     'rgba(5,5,14,0.97)',
    topbarBg:      'rgba(5,5,14,0.85)',
  },
  light: {
    bgBase:        'rgba(235,240,252,1)',
    bgElevated:    'rgba(248,250,255,1)',
    bgCard:        'rgba(255,255,255,0.92)',
    bgCardHover:   'rgba(255,255,255,1)',
    border:        'rgba(30,64,175,0.10)',
    borderHover:   'rgba(30,64,175,0.28)',
    textPrimary:   'rgba(15,23,42,0.92)',
    textSecondary: 'rgba(30,58,138,0.55)',
    textFaint:     'rgba(30,58,138,0.35)',
    sidebarBg:     'rgba(241,245,252,1)',
    topbarBg:      'rgba(248,250,255,0.96)',
  },
} as const);

// ─── Section Accent Map ───────────────────────────────────────────────────────

export const SECTION_ACCENT = Object.freeze({
  market:     { accent: COLOR.blue400,   accentBg: 'rgba(96,165,250,0.10)',  accentBorder: 'rgba(96,165,250,0.25)'  },
  onchain:    { accent: COLOR.emerald400,accentBg: 'rgba(52,211,153,0.10)',  accentBorder: 'rgba(52,211,153,0.25)'  },
  defi:       { accent: COLOR.violet400, accentBg: 'rgba(167,139,250,0.10)', accentBorder: 'rgba(167,139,250,0.25)' },
  intel:      { accent: COLOR.amber400,  accentBg: 'rgba(251,191,36,0.10)',  accentBorder: 'rgba(251,191,36,0.25)'  },
  ecosystem:  { accent: COLOR.rose400,   accentBg: 'rgba(251,113,133,0.10)', accentBorder: 'rgba(251,113,133,0.25)' },
  tools:      { accent: COLOR.cyan400,   accentBg: 'rgba(34,211,238,0.10)',  accentBorder: 'rgba(34,211,238,0.25)'  },
} as const);

// ─── Motion Tokens ────────────────────────────────────────────────────────────

export const MOTION = Object.freeze({
  // Durations (ms)
  instant:  50,
  fast:     150,
  normal:   250,
  slow:     400,
  verySlow: 700,

  // Easing (cubic-bezier strings)
  easeOut:    'cubic-bezier(0.16, 1, 0.3, 1)',   // snappy out — nav, modals
  easeInOut:  'cubic-bezier(0.4, 0, 0.2, 1)',    // smooth — cards
  spring:     'cubic-bezier(0.34, 1.56, 0.64, 1)', // spring — badges, prices
  linear:     'linear',

  // Spring config for Framer Motion
  springStiff:  { type: 'spring', stiffness: 400, damping: 30 } as const,
  springBouncy: { type: 'spring', stiffness: 600, damping: 20 } as const,
  springSmooth: { type: 'spring', stiffness: 200, damping: 40 } as const,
} as const);

// ─── Typography Scale ─────────────────────────────────────────────────────────

export const TYPE = Object.freeze({
  // Fluid clamp values (min, preferred, max)
  xs:   'clamp(0.65rem, 0.6rem + 0.25vw, 0.75rem)',
  sm:   'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
  base: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
  lg:   'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
  xl:   'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
  '2xl':'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
  '3xl':'clamp(1.5rem, 1.2rem + 1.5vw, 2rem)',
  '4xl':'clamp(2rem, 1.5rem + 2.5vw, 3rem)',
  '5xl':'clamp(2.5rem, 1.8rem + 3.5vw, 4rem)',

  // Font stacks
  sans:    "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  mono:    "'JetBrains Mono', 'Fira Code', monospace",
  monoUi:  "'IBM Plex Mono', 'Courier New', monospace",
} as const);

// ─── Spacing Scale ────────────────────────────────────────────────────────────

export const SPACE = Object.freeze({
  px:  '1px',
  0.5: '0.125rem',
  1:   '0.25rem',
  2:   '0.5rem',
  3:   '0.75rem',
  4:   '1rem',
  5:   '1.25rem',
  6:   '1.5rem',
  8:   '2rem',
  10:  '2.5rem',
  12:  '3rem',
  16:  '4rem',
  20:  '5rem',
  24:  '6rem',
} as const);

// ─── Shadow Scale ─────────────────────────────────────────────────────────────

export const SHADOW = Object.freeze({
  // Dark mode
  sm:    '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)',
  md:    '0 4px 12px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)',
  lg:    '0 12px 32px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)',
  glow:  (color: string) => '0 0 20px ' + color + ', 0 0 60px ' + color.replace('1)', '0.3)'),
  glowSm:(color: string) => '0 0 8px ' + color + ', 0 0 20px ' + color.replace('1)', '0.2)'),
} as const);

// ─── Border Radius ────────────────────────────────────────────────────────────

export const RADIUS = Object.freeze({
  sm:   '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  '2xl':'20px',
  full: '9999px',
} as const);

// ─── Z-Index Scale ────────────────────────────────────────────────────────────

export const Z = Object.freeze({
  base:    0,
  raised:  10,
  sticky:  20,
  sidebar: 40,
  flyout:  50,
  topbar:  50,
  modal:   60,
  toast:   70,
  tooltip: 80,
} as const);

// ─── Breakpoints (Container Query aware) ─────────────────────────────────────

export const BREAKPOINT = Object.freeze({
  sm:  '480px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl':'1536px',
  '3xl':'1760px',
} as const);
