/**
 * PWAInstallPrompt.tsx — ZERØ MERIDIAN 2026 push27
 * PWA install prompt:
 * - Android: beforeinstallprompt event
 * - iOS: manual instructions (no native API)
 * - React.memo + displayName ✓
 * - Zero className ✓ (100% inline style)
 * - rgba() / var(--zm-*) only ✓
 * - Zero template literals in JSX ✓
 * - mountedRef ✓
 * - useCallback + useMemo ✓
 * - aria-label + role ✓
 * - Touch targets 48px ✓
 * - Object.freeze static data ✓
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// ─── iOS Instructions content (static) ───────────────────────────────────────

const IOS_STEPS = Object.freeze([
  { icon: '⬆️', text: 'Tap the Share button at the bottom of your browser' },
  { icon: '➕', text: 'Scroll down and tap "Add to Home Screen"' },
  { icon: '✅', text: 'Tap "Add" to confirm' },
]);

// ─── iOS Instruction Sheet ────────────────────────────────────────────────────

const IOSInstructions = memo(({ onClose }: { onClose: () => void }) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
    }}
    role="dialog"
    aria-modal="true"
    aria-label="Install ZERØ MERIDIAN on iOS"
    onClick={onClose}
  >
    <div
      style={{
        width: '100%', maxWidth: 480,
        background: 'var(--zm-bg-base)', border: '1px solid var(--zm-glass-border)',
        borderRadius: '20px 20px 0 0',
        padding: '24px 24px 40px',
        willChange: 'transform',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Handle */}
      <div style={{ width: 40, height: 4, background: 'var(--zm-surface-3)', borderRadius: 2, margin: '0 auto 20px' }} />

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📲</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: 'var(--zm-text-primary)', marginBottom: 4 }}>
          Install ZERØ MERIDIAN
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'var(--zm-text-faint)' }}>
          Add to Home Screen for the best experience
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {IOS_STEPS.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 16px', borderRadius: 10,
            background: 'var(--zm-surface-1)', border: '1px solid var(--zm-glass-border)',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{step.icon}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
                color: 'var(--zm-accent)', background: 'var(--zm-accent-bg)',
                border: '1px solid var(--zm-accent-border)',
                borderRadius: '50%', width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: 'var(--zm-text-primary)' }}>
                {step.text}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close install instructions"
        style={{
          width: '100%', minHeight: 48,
          background: 'var(--zm-surface-2)', border: '1px solid var(--zm-glass-border)',
          borderRadius: 10, cursor: 'pointer',
          fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 600,
          color: 'var(--zm-text-secondary)',
          willChange: 'transform',
        }}
      >
        Got it
      </button>
    </div>
  </div>
));
IOSInstructions.displayName = 'IOSInstructions';

// ─── PWA Install Banner ────────────────────────────────────────────────────────

const PWAInstallPrompt = memo(() => {
  const mountedRef = useRef(true);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  const [showBanner, setShowBanner] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
  }, []);

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone: boolean }).standalone === true;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (isStandalone) return; // Already installed

    // Check if user previously dismissed
    try {
      if (localStorage.getItem('zm-pwa-dismissed') === '1') return;
    } catch { /* storage unavailable */ }

    // iOS: show after a delay
    if (isIOS) {
      const t = setTimeout(() => {
        if (mountedRef.current) setShowBanner(true);
      }, 3000);
      return () => {
        mountedRef.current = false;
        clearTimeout(t);
      };
    }

    // Android/Chrome: wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      if (mountedRef.current) setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      if (mountedRef.current) setInstalled(true);
      setShowBanner(false);
    });

    return () => {
      mountedRef.current = false;
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isIOS, isStandalone]);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSSheet(true);
      return;
    }
    if (!deferredRef.current) return;
    try {
      await deferredRef.current.prompt();
      const choice = await deferredRef.current.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
      }
      setShowBanner(false);
      deferredRef.current = null;
    } catch { /* user cancelled */ }
  }, [isIOS]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setDismissed(true);
    try { localStorage.setItem('zm-pwa-dismissed', '1'); } catch { /* storage unavailable */ }
  }, []);

  const handleCloseIOS = useCallback(() => {
    setShowIOSSheet(false);
    setShowBanner(false);
  }, []);

  if (!showBanner || installed || dismissed || isStandalone) return null;

  return (
    <>
      {/* Banner */}
      <div
        role="banner"
        aria-label="Install ZERØ MERIDIAN app"
        style={{
          position: 'fixed',
          bottom: 80, // above BottomNavBar
          left: 12, right: 12,
          zIndex: 500,
          background: 'var(--zm-bg-base)',
          border: '1px solid var(--zm-accent-border)',
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(96,165,250,0.15)',
          willChange: 'transform',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: 'var(--zm-accent-bg)', border: '1px solid var(--zm-accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          Ø
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: 'var(--zm-text-primary)', marginBottom: 2 }}>
            Install ZERØ MERIDIAN
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--zm-text-faint)' }}>
            {isIOS ? 'Add to Home Screen for offline access' : 'Install for faster access & offline mode'}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            style={{
              minHeight: 48, minWidth: 48, padding: '0 12px',
              background: 'var(--zm-surface-2)', border: '1px solid var(--zm-glass-border)',
              borderRadius: 8, cursor: 'pointer',
              fontFamily: "'Space Mono', monospace", fontSize: 11,
              color: 'var(--zm-text-faint)',
              willChange: 'transform',
            }}
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            aria-label={isIOS ? 'Show iOS install instructions' : 'Install app'}
            style={{
              minHeight: 48, padding: '0 16px',
              background: 'var(--zm-accent-bg)', border: '1px solid var(--zm-accent-border)',
              borderRadius: 8, cursor: 'pointer',
              fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
              color: 'var(--zm-accent)',
              willChange: 'transform',
            }}
          >
            {isIOS ? 'How to' : 'Install'}
          </button>
        </div>
      </div>

      {/* iOS instruction sheet */}
      {showIOSSheet && <IOSInstructions onClose={handleCloseIOS} />}
    </>
  );
});
PWAInstallPrompt.displayName = 'PWAInstallPrompt';

export default PWAInstallPrompt;
