// ZERØ MERIDIAN — NotFound.tsx
// push52: fix old blue rgba(96,165,250) → cyan, add mountedRef guard
// React.memo + displayName ✓  rgba() only ✓  Zero className ✓

import { memo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const NotFound = memo(() => {
  const location   = useLocation();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (mountedRef.current) {
      console.error('404 Error: User attempted to access non-existent route:', location.pathname);
    }
    return () => { mountedRef.current = false; };
  }, [location.pathname]);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--zm-bg-base)',
      }}
      role="main"
      aria-label="Page not found"
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          marginBottom: '1rem',
          fontFamily: "'Space Mono', monospace",
          fontSize: '4rem',
          fontWeight: 700,
          color: 'var(--zm-text-primary)',
          letterSpacing: '0.1em',
        }}>
          404
        </h1>
        <p style={{
          marginBottom: '1.5rem',
          fontFamily: "'Space Mono', monospace",
          fontSize: '1rem',
          color: 'var(--zm-text-secondary)',
          letterSpacing: '0.06em',
        }}>
          PAGE NOT FOUND
        </p>
        <a
          href="/"
          aria-label="Return to home page"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--zm-cyan)',
            textDecoration: 'underline',
            letterSpacing: '0.06em',
          }}
        >
          RETURN TO HOME
        </a>
      </div>
    </div>
  );
});

NotFound.displayName = 'NotFound';
export default NotFound;
