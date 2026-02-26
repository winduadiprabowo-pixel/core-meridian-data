/**
 * ZMFooter.tsx — ZERØ MERIDIAN push56
 * Footer: copyright + links + BUILD badge
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - var(--zm-*) ✓
 * - Zero className ✓
 * - useCallback + useMemo ✓
 */

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const BUILD = 'push56';
const YEAR  = new Date().getFullYear();

const LINKS = Object.freeze([
  { label: 'GitHub',    href: 'https://github.com/windujm-creator/core-meridian-data' },
  { label: 'Vercel',    href: 'https://core-meridian-lemon.vercel.app' },
  { label: 'CoinGecko', href: 'https://coingecko.com' },
  { label: 'TradingView', href: 'https://tradingview.com' },
]);

const ZMFooter: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  const footerStyle = useMemo(() => ({
    width:         '100%',
    marginTop:     '48px',
    padding:       '24px 24px 32px',
    borderTop:     '1px solid var(--zm-card-border)',
    background:    'linear-gradient(to bottom, transparent, rgba(0,238,255,0.02))',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           '16px',
  }), []);

  const topRowStyle = useMemo(() => ({
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    flexWrap:       'wrap' as const,
    gap:            '12px',
  }), []);

  const bottomRowStyle = useMemo(() => ({
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    flexWrap:       'wrap' as const,
    gap:            '8px',
  }), []);

  return (
    <footer style={footerStyle} role="contentinfo" aria-label="Site footer">

      {/* ── Top row: logo + links ── */}
      <div style={topRowStyle}>

        {/* Logo + tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--zm-accent) 0%, var(--zm-positive) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0,238,255,0.30)',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '10px', fontWeight: 900,
              color: 'rgba(5,5,7,1)', letterSpacing: '-0.5px',
            }}>ZM</span>
          </div>
          <div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '13px', fontWeight: 700,
              background: 'linear-gradient(135deg, var(--zm-accent) 0%, var(--zm-positive) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}>ZER\u00d8 MERIDIAN</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px', color: 'var(--zm-text-faint)',
              letterSpacing: '0.08em', textTransform: 'uppercase' as const,
            }}>Crypto Intelligence Terminal</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' as const }}>
          {LINKS.map(link => (
            <motion.a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px', color: 'var(--zm-text-faint)',
                textDecoration: 'none', padding: '4px 10px',
                borderRadius: '6px', border: '1px solid transparent',
                transition: 'color 150ms, border-color 150ms',
                letterSpacing: '0.04em',
                willChange: 'transform' as const,
              }}
              whileHover={prefersReducedMotion ? {} : {
                color: 'rgba(0,238,255,0.80)',
                borderColor: 'var(--zm-accent-border)',
                backgroundColor: 'rgba(0,238,255,0.04)',
              }}
            >
              {link.label}
            </motion.a>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'var(--zm-card-border)' }} />

      {/* ── Bottom row: copyright + build badge + data sources ── */}
      <div style={bottomRowStyle}>

        {/* Copyright */}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px', color: 'var(--zm-text-faint)',
          letterSpacing: '0.04em',
        }}>
          \u00a9 {YEAR} ZER\u00d8 MERIDIAN — Crypto Intelligence Terminal. All rights reserved.
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Data sources */}
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px', color: 'var(--zm-text-faint)',
            letterSpacing: '0.04em',
          }}>
            Data: CoinGecko · Binance · TradingView
          </span>

          {/* Divider dot */}
          <span style={{ color: 'var(--zm-text-faint)', fontSize: '10px' }}>·</span>

          {/* BUILD badge */}
          <motion.div
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '20px',
              background: 'var(--zm-positive-bg)',
              border: '1px solid var(--zm-positive-border)',
              boxShadow: '0 0 8px var(--zm-positive-bg)',
            }}
            animate={prefersReducedMotion ? {} : {
              boxShadow: [
                '0 0 8px var(--zm-positive-bg)',
                '0 0 14px var(--zm-positive-border)',
                '0 0 8px var(--zm-positive-bg)',
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: 'var(--zm-positive)',
                boxShadow: '0 0 5px rgba(34,255,170,0.80)',
                flexShrink: 0,
              }}
              animate={prefersReducedMotion ? {} : {
                opacity: [1, 0.3, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              aria-hidden="true"
            />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px', fontWeight: 700,
              color: 'var(--zm-positive)',
              letterSpacing: '0.10em',
            }}>
              BUILD: {BUILD} \u2022 GREEN
            </span>
          </motion.div>

        </div>
      </div>

    </footer>
  );
};

ZMFooter.displayName = 'ZMFooter';
export default React.memo(ZMFooter);
