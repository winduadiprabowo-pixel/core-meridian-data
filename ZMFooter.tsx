/**
 * ZMFooter.tsx — ZERØ MERIDIAN push62
 * Footer: copyright + links + BUILD badge
 * - React.memo + displayName ✓
 * - var(--zm-*) ✓
 * - Zero attribution/watermark ✓
 */

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const BUILD = 'push62';
const YEAR  = new Date().getFullYear();

const LINKS = Object.freeze([
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Markets',   href: '/markets'   },
  { label: 'Terminal',  href: '/charts'    },
  { label: 'DeFi',      href: '/defi'      },
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
            boxShadow: 'var(--zm-accent-glow)',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '10px', fontWeight: 900,
              color: 'var(--zm-bg-base)', letterSpacing: '-0.5px',
            }}>ZM</span>
          </div>
          <div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '13px', fontWeight: 700,
              background: 'linear-gradient(135deg, var(--zm-accent) 0%, var(--zm-positive) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}>ZERØ MERIDIAN</div>
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
                color: 'var(--zm-accent)',
                borderColor: 'var(--zm-accent-border)',
                backgroundColor: 'var(--zm-accent-bg)',
              }}
            >
              {link.label}
            </motion.a>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'var(--zm-card-border)' }} />

      {/* ── Bottom row: copyright + build badge ── */}
      <div style={bottomRowStyle}>

        {/* Copyright */}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px', color: 'var(--zm-text-faint)',
          letterSpacing: '0.04em',
        }}>
          © {YEAR} ZERØ MERIDIAN — Crypto Intelligence Terminal. All rights reserved.
        </span>

        {/* BUILD badge */}
        <motion.div
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '20px',
            background: 'var(--zm-positive-bg)',
            border: '1px solid var(--zm-positive-border)',
          }}
          animate={prefersReducedMotion ? {} : {
            boxShadow: [
              'var(--zm-positive-glow)',
              '0 0 20px rgba(34,255,170,0.30)',
              'var(--zm-positive-glow)',
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: 'var(--zm-positive)',
              boxShadow: '0 0 5px rgba(34,255,170,0.8)',
              flexShrink: 0,
            }}
            animate={prefersReducedMotion ? {} : { opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            aria-hidden="true"
          />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px', fontWeight: 700,
            color: 'var(--zm-positive)',
            letterSpacing: '0.10em',
          }}>
            BUILD: {BUILD} • GREEN
          </span>
        </motion.div>

      </div>

    </footer>
  );
};

ZMFooter.displayName = 'ZMFooter';
export default React.memo(ZMFooter);
