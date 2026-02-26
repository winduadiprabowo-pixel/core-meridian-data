/**
 * StatTooltip.tsx — ZERØ MERIDIAN push35
 * Hover tooltip for stats cards
 */
import { memo, useState, useRef, useCallback } from 'react';

interface StatTooltipProps {
  children: React.ReactNode;
  tip: string;
}

const StatTooltip = memo(({ children, tip }: StatTooltipProps) => {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const onEnter = useCallback(() => setShow(true), []);
  const onLeave = useCallback(() => setShow(false), []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'block', width: '100%' }}
      onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {children}
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)', zIndex: 999,
          background: 'var(--zm-surface-2)', border: '1px solid var(--zm-divider)',
          borderRadius: 6, padding: '5px 10px', whiteSpace: 'nowrap',
          fontFamily: "'Space Mono', monospace", fontSize: 10,
          color: 'var(--zm-text-secondary)', pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          {tip}
          <div style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
            borderTop: '4px solid var(--zm-divider)',
          }} />
        </div>
      )}
    </div>
  );
});
StatTooltip.displayName = 'StatTooltip';
export default StatTooltip;
