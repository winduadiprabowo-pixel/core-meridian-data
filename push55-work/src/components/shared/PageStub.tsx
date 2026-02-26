/**
 * PageStub.tsx — ZERØ MERIDIAN push34
 * Upgraded: dummy data cards + AI Coming Soon badge
 */
import { memo } from 'react';
import { type LucideIcon } from 'lucide-react';

interface PageStubProps {
  title: string;
  description: string;
  icon: LucideIcon;
  metrics?: { label: string; value: string; sub?: string }[];
}

const DEFAULT_METRICS = [
  { label: 'TVL',        value: '$—',    sub: 'Loading...' },
  { label: 'Volume 24H', value: '$—',    sub: 'Loading...' },
  { label: 'Active',     value: '—',     sub: 'addresses' },
];

const PageStub = memo(({ title, description, icon: Icon, metrics }: PageStubProps) => {
  const cards = metrics ?? DEFAULT_METRICS;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--zm-accent-bg)', border: '1px solid var(--zm-accent-border)',
          }}>
            <Icon size={20} style={{ color: 'var(--zm-accent)' }} />
          </div>
          <div>
            <h1 style={{
              margin: 0, fontFamily: "'Space Mono', monospace", fontSize: 18,
              fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.04em',
            }}>{title.toUpperCase()}</h1>
            <p style={{
              margin: '3px 0 0', fontFamily: "'Space Mono', monospace",
              fontSize: 10, color: 'var(--zm-text-faint)', letterSpacing: '0.06em',
            }}>{description}</p>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 6,
          background: 'var(--zm-violet-bg)', border: '1px solid var(--zm-violet-border)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--zm-violet)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--zm-violet)', letterSpacing: '0.1em' }}>
            AI POWERED · COMING SOON
          </span>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {cards.map((m, i) => (
          <div key={i} style={{
            background: 'var(--zm-surface-1)', border: '1px solid var(--zm-divider)',
            borderRadius: 12, padding: '16px 20px',
          }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              {m.label}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: 'var(--zm-text-primary)', marginBottom: 2 }}>
              {m.value}
            </div>
            {m.sub && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)' }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Skeleton preview rows */}
      <div style={{ background: 'var(--zm-surface-1)', border: '1px solid var(--zm-divider)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', letterSpacing: '0.12em', marginBottom: 14 }}>
          DATA PREVIEW · LOADING WHEN LIVE
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--zm-divider)' : 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--zm-surface-2)', animation: 'pulse 1.5s infinite' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 10, width: '60%', borderRadius: 4, background: 'var(--zm-surface-2)', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 8, width: '40%', borderRadius: 4, background: 'var(--zm-surface-2)', animation: 'pulse 1.5s infinite', animationDelay: '0.2s' }} />
            </div>
            <div style={{ height: 12, width: 60, borderRadius: 4, background: 'var(--zm-surface-2)', animation: 'pulse 1.5s infinite' }} />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--zm-text-faint)', letterSpacing: '0.08em' }}>
          🤖 Data akan live otomatis ketika modul AI selesai ditraining
        </div>
      </div>
    </div>
  );
});
PageStub.displayName = 'PageStub';
export default PageStub;
