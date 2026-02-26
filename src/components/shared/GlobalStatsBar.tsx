/**
 * GlobalStatsBar.tsx — ZERØ MERIDIAN 2026 push70
 * push70:
 *   - position: fixed top:0 zIndex:100 (was sticky)
 *   - ZERO className — all inline styles
 *   - Binance WebSocket mini-ticker added to right side
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX ✓
 * - useCallback + useMemo ✓
 */

import { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { formatCompact } from '@/lib/formatters';

// ─── FearGreed Badge ──────────────────────────────────────────────────────────

interface FearGreedProps {
  value: number;
  label: string;
}

const FG_COLORS = Object.freeze([
  { max: 25,  color: 'rgba(255,68,136,1)',   bg: 'rgba(255,68,136,0.12)'  },
  { max: 45,  color: 'rgba(255,187,0,1)',    bg: 'rgba(255,187,0,0.12)'   },
  { max: 55,  color: 'rgba(138,138,158,1)',  bg: 'rgba(138,138,158,0.10)' },
  { max: 75,  color: 'rgba(34,255,170,1)',   bg: 'rgba(34,255,170,0.10)'  },
  { max: 100, color: 'rgba(0,238,255,1)',    bg: 'rgba(0,238,255,0.10)'   },
]);

const FearGreedBadge = memo(({ value, label }: FearGreedProps) => {
  const cfg = useMemo(() => FG_COLORS.find(c => value <= c.max) ?? FG_COLORS[FG_COLORS.length - 1], [value]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)' }}>F&G</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '1px 6px', borderRadius: 4, background: cfg.bg }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: cfg.color }}>{value}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: cfg.color }}>{label}</span>
      </div>
    </div>
  );
});
FearGreedBadge.displayName = 'FearGreedBadge';

// ─── Divider ─────────────────────────────────────────────────────────────────

const Div = memo(() => (
  <div style={{ width: 1, height: 14, background: 'rgba(0,238,255,0.12)', flexShrink: 0 }} />
));
Div.displayName = 'Div';

// ─── Stat Item ────────────────────────────────────────────────────────────────

interface StatItemProps {
  label:   string;
  value:   string;
  change?: number;
  accent?: string;
}

const StatItem = memo(({ label, value, change, accent }: StatItemProps) => {
  const changeColor = change != null
    ? change >= 0 ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)'
    : undefined;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(80,80,100,1)' }}>
        {label}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: accent ?? 'rgba(240,240,248,1)' }}>
        {value}
      </span>
      {change != null && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: changeColor }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      )}
    </div>
  );
});
StatItem.displayName = 'StatItem';

// ─── Binance WS Live Ticker ───────────────────────────────────────────────────

interface TickerItem { symbol: string; price: string; change: number; }

const WS_SYMBOLS = Object.freeze(['btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'xrpusdt']);

const LiveTicker = memo(() => {
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const wsRef   = useRef<WebSocket | null>(null);
  const mountRef = useRef(true);

  useEffect(() => {
    mountRef.current = true;
    const streams = WS_SYMBOLS.map(s => s + '@miniTicker').join('/');
    const url = 'wss://stream.binance.com:9443/stream?streams=' + streams;

    function connect() {
      if (!mountRef.current) return;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        if (!mountRef.current) return;
        try {
          const msg = JSON.parse(e.data);
          const d = msg.data;
          if (!d || !d.s) return;
          const sym = d.s.replace('USDT', '');
          const price = parseFloat(d.c);
          const open  = parseFloat(d.o);
          const change = open > 0 ? ((price - open) / open) * 100 : 0;
          const fmt = price >= 1000
            ? '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 })
            : price >= 1 ? '$' + price.toFixed(2)
            : '$' + price.toFixed(4);

          setTickers(prev => {
            const next = prev.filter(t => t.symbol !== sym);
            next.push({ symbol: sym, price: fmt, change });
            return next.sort((a, b) =>
              WS_SYMBOLS.indexOf(a.symbol.toLowerCase() + 'usdt') -
              WS_SYMBOLS.indexOf(b.symbol.toLowerCase() + 'usdt')
            );
          });
        } catch { /* ignore */ }
      };

      ws.onerror = () => {};
      ws.onclose = () => {
        if (mountRef.current) setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      mountRef.current = false;
      wsRef.current?.close();
    };
  }, []);

  if (tickers.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
      {tickers.map(t => {
        const pos = t.change >= 0;
        return (
          <div key={t.symbol} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(138,138,158,1)', letterSpacing: '0.05em' }}>
              {t.symbol}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,1)' }}>
              {t.price}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: pos ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)' }}>
              {pos ? '+' : ''}{t.change.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
});
LiveTicker.displayName = 'LiveTicker';

// ─── GlobalStatsBar ───────────────────────────────────────────────────────────

const GlobalStatsBar = memo(() => {
  const stats = useGlobalStats();

  const mcapStr   = useMemo(() => formatCompact(stats.totalMarketCap),  [stats.totalMarketCap]);
  const volStr    = useMemo(() => formatCompact(stats.totalVolume24h),   [stats.totalVolume24h]);

  const barStyle = useMemo(() => ({
    position:    'fixed' as const,
    top:         0,
    left:        0,
    right:       0,
    zIndex:      100,
    height:      32,
    background:  'rgba(4,5,10,0.97)',
    borderBottom:'1px solid rgba(0,238,255,0.08)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    display:     'flex',
    alignItems:  'center',
    padding:     '0 16px',
    gap:         12,
    overflow:    'hidden',
  }), []);

  const loadingBarStyle = useMemo(() => ({
    ...barStyle,
  }), [barStyle]);

  if (stats.loading && stats.lastUpdate === 0) {
    return (
      <div style={loadingBarStyle} aria-label="Global market stats bar">
        <div style={{ width: 160, height: 8, borderRadius: 4, background: 'rgba(0,238,255,0.08)', animation: 'pulse 2s infinite' }} />
      </div>
    );
  }

  return (
    <div style={barStyle} aria-label="Global market stats bar">
      {/* Left: ZM brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(0,238,255,0.8)', boxShadow: '0 0 6px rgba(0,238,255,0.6)' }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(0,238,255,0.7)' }}>
          ZERØ
        </span>
      </div>

      <Div />

      {/* Global stats */}
      <StatItem label="MCAP" value={mcapStr} change={stats.marketCapChange24h} />
      <Div />
      <StatItem label="VOL" value={volStr} />
      <Div />
      <StatItem label="BTC.D" value={stats.btcDominance.toFixed(1) + '%'} accent="rgba(255,187,0,1)" />
      <Div />
      <StatItem label="ETH.D" value={stats.ethDominance.toFixed(1) + '%'} accent="rgba(176,130,255,1)" />
      <Div />
      <FearGreedBadge value={stats.fearGreedValue} label={stats.fearGreedLabel} />

      {/* Right: live Binance tickers */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Div />
        <LiveTicker />
        <Div />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'rgba(34,255,170,1)',
            boxShadow: '0 0 5px rgba(34,255,170,0.8)',
            animation: 'pulse 1.5s infinite',
          }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.12em', color: 'rgba(34,255,170,0.85)', fontWeight: 700 }}>
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
});
GlobalStatsBar.displayName = 'GlobalStatsBar';

export default GlobalStatsBar;
