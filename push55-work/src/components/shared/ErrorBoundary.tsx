/**
 * ErrorBoundary.tsx — ZERØ MERIDIAN push34
 * Friendly error UI with retry
 */
import React from 'react';

interface State { hasError: boolean; error?: Error; }

const MESSAGES = [
  '🐋 Whale ambil semua data, coba lagi ya...',
  '😭 API down bro, sabar bentar...',
  '🔥 Server lagi ngopi, tunggu sebentar...',
  '💀 Data kabur, kita kejar dulu...',
  '🛸 Alien hack data kita, reconnecting...',
];

function randMsg() { return MESSAGES[Math.floor(Math.random() * MESSAGES.length)]; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, State> {
  state: State = { hasError: false };
  private msg = randMsg();

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ZM ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '40vh', gap: 16, padding: 32,
      }}>
        <div style={{
          background: 'var(--zm-surface-1)', border: '1px solid var(--zm-negative-border)',
          borderRadius: 16, padding: '32px 40px', textAlign: 'center', maxWidth: 420,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💥</div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700,
            color: 'var(--zm-text-primary)', marginBottom: 8,
          }}>
            {this.msg}
          </div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            color: 'var(--zm-text-faint)', marginBottom: 20, opacity: 0.6,
          }}>
            {this.state.error?.message?.slice(0, 80)}
          </div>
          <button
            onClick={() => { this.msg = randMsg(); this.setState({ hasError: false }); }}
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 11,
              padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--zm-accent-bg)', border: '1px solid var(--zm-accent-border)',
              color: 'var(--zm-accent)',
            }}
          >
            🔄 Coba Lagi
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
