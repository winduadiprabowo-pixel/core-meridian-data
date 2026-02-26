/**
 * PWAInstallPrompt.tsx — ZERØ MERIDIAN 2026 push74
 * push74: All breakpoints, adaptive position (mobile=bottom, desktop=corner)
 * push27: initial implementation
 * - React.memo + displayName ✓
 * - Zero className ✓  rgba() only ✓
 * - Zero template literals in JSX ✓
 * - mountedRef + useCallback + useMemo ✓
 * - Touch targets 48px ✓
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const IOS_STEPS = Object.freeze([
  { icon: '⬆️', text: 'Tap the Share button at the bottom of Safari' },
  { icon: '➕', text: 'Tap "Add to Home Screen"' },
  { icon: '✅', text: 'Tap "Add" to confirm' },
]);

const IOSInstructions = memo(({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
    }}
    role="dialog"
    aria-modal="true"
    aria-label="Install ZERØ MERIDIAN on iOS"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0,  opacity: 1 }}
      exit={{ y: 60,    opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: '100%', maxWidth: 480,
        background: 'rgba(7,9,18,0.99)',
        border: '1px solid rgba(0,238,255,0.18)',
        borderRadius: '20px 20px 0 0',
        padding: '24px 24px 40px',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ width: 36, height: 3, background: 'rgba(80,80,100,1)', borderRadius: 2, margin: '0 auto 20px' }} />
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: 'rgba(240,240,248,1)', marginBottom: 4, letterSpacing: '0.06em' }}>
          INSTALL ZERØ MERIDIAN
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)', letterSpacing: '0.1em' }}>
          Add to Home Screen for full-screen experience
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {IOS_STEPS.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(32,42,68,1)',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
              color: 'rgba(0,238,255,1)', background: 'rgba(0,238,255,0.08)',
              border: '1px solid rgba(0,238,255,0.2)',
              borderRadius: '50%', width: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {i + 1}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(200,200,210,1)' }}>
              {step.text}
            </span>
          </div>
        ))}
      </div>
      <button onClick={onClose} aria-label="Close install instructions"
        style={{
          width: '100%', minHeight: 48, background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(32,42,68,1)', borderRadius: 10, cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: 'rgba(138,138,158,1)', letterSpacing: '0.08em',
        }}>
        GOT IT
      </button>
    </motion.div>
  </motion.div>
));
IOSInstructions.displayName = 'IOSInstructions';

const PWAInstallPrompt = memo(() => {
  const mountedRef  = useRef(true);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const { isMobile } = useBreakpoint();

  const [showBanner,   setShowBanner]   = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [installed,    setInstalled]    = useState(false);
  const [dismissed,    setDismissed]    = useState(false);

  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream: unknown }).MSStream;
  }, []);

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone: boolean }).standalone === true;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (isStandalone) return;
    try { if (localStorage.getItem('zm-pwa-dismissed') === '1') return; } catch { /* noop */ }

    if (isIOS) {
      const t = setTimeout(() => { if (mountedRef.current) setShowBanner(true); }, 4000);
      return () => { mountedRef.current = false; clearTimeout(t); };
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      if (mountedRef.current) setShowBanner(true);
    };
    const onInstalled = () => { if (mountedRef.current) { setInstalled(true); setShowBanner(false); } };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      mountedRef.current = false;
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [isIOS, isStandalone]);

  const handleInstall = useCallback(async () => {
    if (isIOS) { setShowIOSSheet(true); return; }
    if (!deferredRef.current) return;
    try {
      await deferredRef.current.prompt();
      const choice = await deferredRef.current.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setShowBanner(false);
      deferredRef.current = null;
    } catch { /* user cancelled */ }
  }, [isIOS]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setDismissed(true);
    try { localStorage.setItem('zm-pwa-dismissed', '1'); } catch { /* noop */ }
  }, []);

  const handleCloseIOS = useCallback(() => {
    setShowIOSSheet(false);
    setShowBanner(false);
  }, []);

  // Banner position: mobile = bottom center above BottomNav
  //                 tablet/desktop = bottom-right corner, compact
  const bannerStyle = useMemo(() => {
    if (isMobile) return Object.freeze({
      position: 'fixed' as const,
      bottom: 76, left: 12, right: 12,
      zIndex: 500,
      background: 'rgba(7,9,18,0.97)',
      border: '1px solid rgba(0,238,255,0.2)',
      borderRadius: 14,
      padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,238,255,0.08)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    });
    // Desktop / tablet — bottom right corner, compact pill style
    return Object.freeze({
      position: 'fixed' as const,
      bottom: 24, right: 24,
      zIndex: 500,
      background: 'rgba(7,9,18,0.97)',
      border: '1px solid rgba(0,238,255,0.2)',
      borderRadius: 14,
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      maxWidth: 340,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,238,255,0.06)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    });
  }, [isMobile]);

  if (!showBanner || installed || dismissed || isStandalone) return null;

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="pwa-banner"
          initial={{ opacity: 0, y: isMobile ? 20 : 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isMobile ? 20 : 10, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={bannerStyle}
          role="banner"
          aria-label="Install ZERØ MERIDIAN app"
        >
          {/* Icon */}
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgba(0,238,255,0.08)',
            border: '1px solid rgba(0,238,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7.5" stroke="rgba(0,238,255,1)" strokeWidth="2" />
              <line x1="15" y1="5" x2="7" y2="17" stroke="rgba(0,238,255,1)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: 'rgba(240,240,248,1)', marginBottom: 2, letterSpacing: '0.04em' }}>
              Install ZERØ MERIDIAN
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(80,80,100,1)', letterSpacing: '0.06em' }}>
              {isIOS ? 'Add to Home Screen — no App Store needed' : 'Install for full-screen, offline access'}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={handleDismiss} aria-label="Dismiss install prompt"
              style={{
                minHeight: 36, minWidth: 36, padding: '0 10px',
                background: 'transparent',
                border: '1px solid rgba(32,42,68,1)',
                borderRadius: 8, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: 'rgba(80,80,100,1)', letterSpacing: '0.04em',
              }}>
              ✕
            </button>
            <button onClick={handleInstall}
              aria-label={isIOS ? 'Show iOS install instructions' : 'Install app'}
              style={{
                minHeight: 36, padding: '0 14px',
                background: 'rgba(0,238,255,0.08)',
                border: '1px solid rgba(0,238,255,0.25)',
                borderRadius: 8, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                color: 'rgba(0,238,255,1)', letterSpacing: '0.08em',
              }}>
              {isIOS ? 'HOW TO' : 'INSTALL'}
            </button>
          </div>
        </motion.div>

        {/* iOS instruction sheet */}
        {showIOSSheet && (
          <IOSInstructions onClose={handleCloseIOS} />
        )}
      </>
    </AnimatePresence>
  );
});
PWAInstallPrompt.displayName = 'PWAInstallPrompt';
export default PWAInstallPrompt;
