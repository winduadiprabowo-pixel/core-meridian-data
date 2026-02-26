/**
 * OnChain.tsx — ZERØ MERIDIAN 2026 Phase 8
 * On-Chain Analytics: Whale Tracker, DEX Analytics, Exchange Netflow,
 * Historical OHLCV, Gas Metrics, Trending On-Chain tokens.
 * Data: The Graph + Dune Analytics + CryptoCompare + CoinGecko On-Chain.
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX ✓
 * - Zero recharts — pure Canvas/SVG ✓
 * - useCallback + useMemo ✓
 * - will-change: transform on animated elements ✓
 * - aria-label + role ✓
 * - Zero TypeScript any ✓
 */

import {
  memo, useState, useCallback, useMemo, useRef, useEffect,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheGraph, type GraphPool, type GraphWhaleSwap } from '@/hooks/useTheGraph';
import { useDuneAnalytics, type DuneNetflow, type DuneGasMetric } from '@/hooks/useDuneAnalytics';
import { useCryptoCompare, CC_SYMBOLS, type OHLCVCandle } from '@/hooks/useCryptoCompare';
import { useCoinGeckoOnChain, type TrendingOnChain } from '@/hooks/useCoinGeckoOnChain';
import { formatCompact, formatCompactNum, formatPrice, formatChange, formatPct } from '@/lib/formatters';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  Activity, TrendingUp, TrendingDown, Zap, Search,
  RefreshCw, Loader2, AlertTriangle, ArrowUpRight,
  ArrowDownRight, Layers, BarChart3, Flame,
  Radio, Wallet, DollarSign, Globe,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = Object.freeze([
  { id: 'overview',  label: 'Overview',     icon: 'globe'   },
  { id: 'whales',    label: 'Whale Tracker', icon: 'whale'  },
  { id: 'dex',       label: 'DEX Pools',    icon: 'layers'  },
  { id: 'ohlcv',     label: 'OHLCV',        icon: 'chart'   },
  { id: 'netflow',   label: 'Netflow',      icon: 'flow'    },
] as const);

type TabId = typeof TABS[number]['id'];

const ACTION_COLORS = Object.freeze({
  transfer:   'rgba(148,163,184,1)',
  deposit:    'rgba(52,211,153,1)',
  withdrawal: 'rgba(251,113,133,1)',
  buy:        'rgba(52,211,153,1)',
  sell:       'rgba(251,113,133,1)',
});

const BAR_MAX_W = 200;

// ─── Util ─────────────────────────────────────────────────────────────────────

function truncateAddr(addr: string): string {
  if (addr.length < 12) return addr;
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000)  return Math.floor(diff / 1000) + 's ago';
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago';
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago';
  return Math.floor(diff / 86_400_000) + 'd ago';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatBadgeProps {
  label:  string;
  value:  string;
  accent: string;
  icon:   React.ReactNode;
}

const StatBadge = memo(({ label, value, accent, icon }: StatBadgeProps) => (
  <div
    style={{ flex: 1, minWidth: 130, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', willChange: 'transform' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: accent }}>{icon}</span>
      <span
        style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--zm-text-faint)' }}
      >
        {label}
      </span>
    </div>
    <span
      style={{ fontSize: 20, fontFamily: 'monospace', fontWeight: 700, color: 'var(--zm-text-primary)' }}
    >
      {value}
    </span>
  </div>
));
StatBadge.displayName = 'StatBadge';

// ─── OHLCV Canvas Chart ───────────────────────────────────────────────────────

interface OHLCVChartProps {
  candles: OHLCVCandle[];
  symbol:  string;
}

const OHLCVChart = memo(({ candles, symbol }: OHLCVChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const dpr    = window.devicePixelRatio || 1;
    const rect   = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx || !mountedRef.current) return;

    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    const PAD = { top: 16, right: 16, bottom: 32, left: 56 };

    const highs  = candles.map(c => c.high);
    const lows   = candles.map(c => c.low);
    const maxP   = Math.max(...highs);
    const minP   = Math.min(...lows);
    const range  = maxP - minP || 1;

    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top  - PAD.bottom;
    const cw     = Math.max(1, chartW / candles.length);

    // Background
    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'var(--zm-divider)';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(W - PAD.right, y);
      ctx.stroke();
    }

    // Price labels
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font      = '10px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const pct   = 1 - i / 4;
      const price = minP + range * pct;
      const y     = PAD.top + (chartH / 4) * i;
      ctx.fillText(formatPrice(price), PAD.left - 4, y + 3);
    }

    // Candles
    candles.forEach((c, idx) => {
      const x     = PAD.left + idx * cw;
      const yHigh = PAD.top + chartH * (1 - (c.high - minP) / range);
      const yLow  = PAD.top + chartH * (1 - (c.low  - minP) / range);
      const yOpen = PAD.top + chartH * (1 - (c.open  - minP) / range);
      const yClose = PAD.top + chartH * (1 - (c.close - minP) / range);

      const bull   = c.close >= c.open;
      const color  = bull ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)';
      const body   = Math.max(1, Math.abs(yClose - yOpen));
      const bodyY  = Math.min(yOpen, yClose);
      const candleW = Math.max(1, cw * 0.7);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(x + cw / 2, yHigh);
      ctx.lineTo(x + cw / 2, yLow);
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      ctx.fillRect(x + (cw - candleW) / 2, bodyY, candleW, body);
    });

    // X-axis date labels (every 15 candles)
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.font      = '10px monospace';
    ctx.textAlign = 'center';
    candles.forEach((c, idx) => {
      if (idx % 15 !== 0) return;
      const x = PAD.left + idx * cw + cw / 2;
      const d = new Date(c.time);
      ctx.fillText(
        (d.getMonth() + 1) + '/' + d.getDate(),
        x,
        H - PAD.bottom + 14,
      );
    });

    // Symbol label
    ctx.fillStyle  = 'rgba(96,165,250,0.8)';
    ctx.font       = 'bold 12px monospace';
    ctx.textAlign  = 'left';
    ctx.fillText(symbol + '/USD  90D', PAD.left, PAD.top - 4);

  }, [candles, symbol]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="OHLCV candlestick chart"
      role="img"
      style={{ width: '100%', height: '260px', willChange: 'transform' }}
    />
  );
});
OHLCVChart.displayName = 'OHLCVChart';

// ─── Gas SVG Bar Chart ────────────────────────────────────────────────────────

interface GasChartProps {
  data: DuneGasMetric[];
}

const GasChart = memo(({ data }: GasChartProps) => {
  const maxGas = useMemo(
    () => Math.max(...data.map(d => d.avgGasGwei), 1),
    [data],
  );

  if (data.length === 0) {
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 96, fontSize: 14, color: 'var(--zm-text-faint)' }}
      >
        No gas data
      </div>
    );
  }

  return (
    <svg
      viewBox={'0 0 ' + (data.length * 28) + ' 80'}
      style={{ width: '100%', height: '80px' }}
      aria-label="Gas price bar chart"
      role="img"
    >
      {data.map((d, i) => {
        const barH = Math.max(2, (d.avgGasGwei / maxGas) * 64);
        const x    = i * 28 + 4;
        const y    = 70 - barH;
        const color = d.avgGasGwei > maxGas * 0.75
          ? 'rgba(251,113,133,0.8)'
          : d.avgGasGwei > maxGas * 0.4
          ? 'rgba(251,191,36,0.8)'
          : 'rgba(52,211,153,0.8)';
        return (
          <g key={d.date}>
            <rect
              x={x} y={y}
              width={20} height={barH}
              rx={2}
              fill={color}
            />
            <text
              x={x + 10} y={78}
              textAnchor="middle"
              fontSize={8}
              fill="rgba(148,163,184,0.5)"
            >
              {d.avgGasGwei.toFixed(0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
});
GasChart.displayName = 'GasChart';

// ─── Netflow Bar ──────────────────────────────────────────────────────────────

interface NetflowRowProps {
  item: DuneNetflow;
  maxAbs: number;
}

const NetflowRow = memo(({ item, maxAbs }: NetflowRowProps) => {
  const isOutflow = item.netflowUsd < 0;
  const barW      = maxAbs > 0 ? (Math.abs(item.netflowUsd) / maxAbs) * BAR_MAX_W : 0;
  const color     = isOutflow ? 'rgba(52,211,153,0.7)' : 'rgba(251,113,133,0.7)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 8, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 14, width: 112, color: 'var(--zm-text-primary)' }}>
        {item.exchange}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <div
          style={{ width: barW, height: 8, background: color, borderRadius: 2, transition: 'width 0.4s ease', willChange: 'width' }}
        />
        <span style={{ fontFamily: 'monospace', fontSize: 12 , color }}>
          {isOutflow ? '↓ ' : '↑ '}
          {formatCompact(Math.abs(item.netflowUsd))}
        </span>
      </div>
    </div>
  );
});
NetflowRow.displayName = 'NetflowRow';

// ─── Whale Row ────────────────────────────────────────────────────────────────

interface WhaleRowProps {
  swap: GraphWhaleSwap;
}

const WhaleRow = memo(({ swap }: WhaleRowProps) => {
  const color  = ACTION_COLORS[swap.type];
  const Icon   = swap.type === 'buy' ? ArrowUpRight : ArrowDownRight;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0,  display:'flex', alignItems:'center', gap:12, paddingTop:10, paddingBottom:10, borderBottom:'1px solid rgba(148,163,184,0.06)', willChange:'transform, opacity' }}
    >
      <Icon size={14} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--zm-text-secondary)' }}>
            {truncateAddr(swap.sender)}
          </span>
          <span
            style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', textTransform: 'uppercase', background: 'rgba(148,163,184,0.1)', color }}
          >
            {swap.type}
          </span>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--zm-text-faint)' }}>
          {swap.token0}/{swap.token1}  •  {timeAgo(swap.timestamp)}
        </div>
      </div>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color }}>
        {formatCompact(swap.amountUsd)}
      </span>
    </motion.div>
  );
});
WhaleRow.displayName = 'WhaleRow';

// ─── DEX Pool Row ─────────────────────────────────────────────────────────────

interface PoolRowProps {
  pool:  GraphPool;
  rank:  number;
}

const PoolRow = memo(({ pool, rank }: PoolRowProps) => (
  <div
    style={{ display: 'grid', alignItems: 'center', gap: 12, paddingTop: 10, paddingBottom: 10, gridTemplateColumns: '24px 1fr 90px 90px 70px 70px', borderBottom: '1px solid rgba(148,163,184,0.06)' }}
  >
    <span style={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'center', color: 'var(--zm-text-faint)' }}>
      {rank}
    </span>
    <div>
      <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--zm-text-primary)' }}>
        {pool.token0Symbol}/{pool.token1Symbol}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)' }}>
        {pool.feeTier.toFixed(2)}% fee
      </div>
    </div>
    <span style={{ fontFamily: 'monospace', fontSize: 14, textAlign: 'right', color: 'var(--zm-text-secondary)' }}>
      {formatCompact(pool.tvlUsd)}
    </span>
    <span style={{ fontFamily: 'monospace', fontSize: 14, textAlign: 'right', color: 'var(--zm-text-secondary)' }}>
      {formatCompact(pool.volumeUsd24h)}
    </span>
    <span style={{ fontFamily: 'monospace', fontSize: 14, textAlign: 'right', color: 'rgba(52,211,153,1)' }}>
      {formatPct(pool.apr)}
    </span>
    <span style={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'right', color: 'var(--zm-text-faint)' }}>
      {formatCompactNum(pool.txCount24h)}
    </span>
  </div>
));
PoolRow.displayName = 'PoolRow';

// ─── Trending Token Card ──────────────────────────────────────────────────────

interface TrendingCardProps {
  token: TrendingOnChain;
}

const TrendingCard = memo(({ token }: TrendingCardProps) => {
  const isUp  = token.change24h >= 0;
  const color = isUp ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)';
  const Icon  = isUp ? TrendingUp : TrendingDown;

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', willChange: 'transform' }}
    >
      {token.thumb ? (
        <img
          src={token.thumb}
          alt={token.symbol}
          width={28}
          height={28}
          style={{ borderRadius: '50%', flexShrink: 0 }}
        />
      ) : (
        <div
          style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, background: 'rgba(96,165,250,0.15)', color: 'rgba(96,165,250,1)' }}
        >
          {token.symbol.slice(0, 2)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--zm-text-primary)' }}>
          {token.symbol}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize', color: 'var(--zm-text-faint)' }}>
          {token.chain}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--zm-text-primary)' }}>
          {token.priceUsd > 0 ? formatPrice(token.priceUsd) : '—'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
          <Icon size={10} style={{ color }} />
          <span style={{ fontFamily: 'monospace', fontSize: 11, color }}>
            {formatChange(token.change24h)}
          </span>
        </div>
      </div>
    </div>
  );
});
TrendingCard.displayName = 'TrendingCard';

// ─── Tab Button ───────────────────────────────────────────────────────────────

interface TabButtonProps {
  id:       TabId;
  label:    string;
  active:   boolean;
  onClick:  (id: TabId) => void;
}

const TabButton = memo(({ id, label, active, onClick }: TabButtonProps) => {
  const handleClick = useCallback(() => onClick(id), [id, onClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-selected={active}
      role="tab"
      style={{ position: 'relative', padding: '8px 16px', fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 8, transition: 'color 0.15s,background 0.15s', cursor: 'pointer', background: active?'rgba(96,165,250,0.15)':'transparent', color: active?'rgba(96,165,250,1)':'var(--zm-text-faint)', border: active?'1px solid rgba(96,165,250,0.3)':'1px solid transparent', willChange: 'transform' }}
    >
      {label}
    </button>
  );
});
TabButton.displayName = 'TabButton';

// ─── Loading Overlay ──────────────────────────────────────────────────────────

const LoadingRow = memo(() => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 24, paddingBottom: 24, color: 'var(--zm-text-faint)' }}>
    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--zm-accent)' }} />
    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>Fetching on-chain data…</span>
  </div>
));
LoadingRow.displayName = 'LoadingRow';

// ─── Symbol Selector ──────────────────────────────────────────────────────────

interface SymbolSelectorProps {
  active:   string;
  onChange: (sym: string) => void;
}

const SymbolSelector = memo(({ active, onChange }: SymbolSelectorProps) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="group" aria-label="Asset selector">
    {CC_SYMBOLS.map(sym => {
      const isActive = sym === active;
      const handleClick = () => onChange(sym);
      return (
        <button
          key={sym}
          type="button"
          onClick={handleClick}
          aria-pressed={isActive}
          style={{ padding: '4px 12px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', cursor: 'pointer', background: isActive?'rgba(96,165,250,0.2)':'var(--zm-divider)', color: isActive?'rgba(96,165,250,1)':'var(--zm-text-faint)', border: isActive?'1px solid rgba(96,165,250,0.4)':'1px solid transparent', willChange: 'transform' }}
        >
          {sym}
        </button>
      );
    })}
  </div>
));
SymbolSelector.displayName = 'SymbolSelector';

// ─── Main Page ────────────────────────────────────────────────────────────────

const OnChain = memo(() => {
  const mountedRef = useRef(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [ccSymbol,  setCCSymbol]  = useState('BTC');

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const { isMobile } = useBreakpoint();
  const graph    = useTheGraph();
  const dune     = useDuneAnalytics();
  const cc       = useCryptoCompare(ccSymbol);
  const cgOnChain = useCoinGeckoOnChain();

  const handleTab    = useCallback((id: TabId) => setActiveTab(id), []);
  const handleSymbol = useCallback((sym: string) => {
    if (!mountedRef.current) return;
    setCCSymbol(sym);
    cc.setSymbol(sym);
  }, [cc]);

  const handleRefreshAll = useCallback(() => {
    graph.refetch();
    dune.refetch();
    cc.refetch();
    cgOnChain.refetch();
  }, [graph, dune, cc, cgOnChain]);

  const netflowMaxAbs = useMemo(
    () => Math.max(...dune.netflows.map(n => Math.abs(n.netflowUsd)), 1),
    [dune.netflows],
  );

  const anyLoading = graph.loading || dune.loading || cc.loading || cgOnChain.loading;
  const anyError   = graph.error || dune.error || cc.error || cgOnChain.error;

  const dexStatsItems = useMemo(() => {
    if (!graph.dexStats) return [];
    const s = graph.dexStats;
    return [
      { label: 'DEX Volume 24h', value: formatCompact(s.totalVolumeUsd), accent: 'rgba(96,165,250,1)',  icon: <BarChart3 size={14} /> },
      { label: 'DEX TVL',        value: formatCompact(s.totalTvlUsd),    accent: 'rgba(52,211,153,1)',  icon: <Layers size={14} />   },
      { label: 'Pool Count',     value: formatCompactNum(s.poolCount),   accent: 'rgba(167,139,250,1)', icon: <Activity size={14} /> },
      { label: 'Tx Count',       value: formatCompactNum(s.txCount24h),  accent: 'rgba(251,191,36,1)',  icon: <Zap size={14} />      },
    ];
  }, [graph.dexStats]);

  return (
    <div
            style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px', minHeight: '100vh', background: 'var(--zm-bg-deep)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1
                        style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--zm-text-primary)' }}
          >
            On-Chain Analytics
          </h1>
          <p style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 4, color: 'var(--zm-text-faint)' }}>
            The Graph  •  Dune Analytics  •  CryptoCompare  •  CoinGecko On-Chain
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {anyLoading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--zm-accent)' }} />}
          <button
            type="button"
            onClick={handleRefreshAll}
            aria-label="Refresh all on-chain data"
                        style={{ padding: 8, borderRadius: 8, transition: 'color 0.15s,background 0.15s', cursor: 'pointer', background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', color: 'var(--zm-text-faint)', willChange: 'transform' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {anyError && (
        <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, fontSize: 14, fontFamily: 'monospace', background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', color: 'rgba(251,113,133,1)' }}
        >
          <AlertTriangle size={14} />
          {anyError}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="tablist" aria-label="On-chain sections">
        {TABS.map(t => (
          <TabButton key={t.id} id={t.id} label={t.label} active={activeTab === t.id} onClick={handleTab} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Overview Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8,  display:'flex', flexDirection:'column', gap:20 }}
            style={{ willChange: 'transform, opacity' }}
          >
            {/* DEX Stats Row */}
            {graph.loading ? (
              <LoadingRow />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {dexStatsItems.map(s => (
                  <StatBadge key={s.label} label={s.label} value={s.value} accent={s.accent} icon={s.icon} />
                ))}
              </div>
            )}

            {/* Trending On-Chain */}
            <div
                            style={{ borderRadius: 12, padding: 16, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Flame size={14} style={{ color: 'rgba(251,113,133,1)' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                  Trending On-Chain
                </span>
              </div>
              {cgOnChain.loading ? <LoadingRow /> : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 8 }}>
                  {cgOnChain.trending.slice(0, 9).map(t => (
                    <TrendingCard key={t.id} token={t} />
                  ))}
                </div>
              )}
            </div>

            {/* Gas Metrics */}
            <div
                            style={{ borderRadius: 12, padding: 16, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Zap size={14} style={{ color: 'rgba(251,191,36,1)' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                  ETH Gas History  (Gwei)
                </span>
              </div>
              {dune.loading ? <LoadingRow /> : <GasChart data={dune.gasMetrics} />}
            </div>
          </motion.div>
        )}

        {/* ── Whale Tracker Tab ─────────────────────────────────────────────── */}
        {activeTab === 'whales' && (
          <motion.div
            key="whales"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8,  display:'flex', flexDirection:'column', gap:16 }}
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Uniswap V3 whale swaps from The Graph */}
            <div
                            style={{ borderRadius: 12, padding: 16, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Wallet size={14} style={{ color: 'rgba(96,165,250,1)' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                  Uniswap V3 — Whale Swaps  ($100k+)
                </span>
                <span
                                    style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(96,165,250,0.1)', color: 'rgba(96,165,250,0.8)' }}
                >
                  The Graph
                </span>
              </div>
              {graph.loading ? <LoadingRow /> : (
                <div>
                  {graph.whaleSwaps.length === 0 ? (
                    <p style={{ fontFamily: 'monospace', fontSize: 12, paddingTop: 16, paddingBottom: 16, textAlign: 'center', color: 'var(--zm-text-faint)' }}>
                      No whale swaps found
                    </p>
                  ) : (
                    graph.whaleSwaps.slice(0, 25).map(s => (
                      <WhaleRow key={s.id} swap={s} />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Dune whale moves */}
            <div
                            style={{ borderRadius: 12, padding: 16, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Radio size={14} style={{ color: 'rgba(167,139,250,1)' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                  Large On-Chain Transfers
                </span>
                <span
                                    style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(167,139,250,0.1)', color: 'rgba(167,139,250,0.8)' }}
                >
                  Dune Analytics
                </span>
              </div>
              {dune.loading ? <LoadingRow /> : (
                <div>
                  {dune.whaleMoves.length === 0 ? (
                    <p style={{ fontFamily: 'monospace', fontSize: 12, paddingTop: 16, paddingBottom: 16, textAlign: 'center', color: 'var(--zm-text-faint)' }}>
                      No data available
                    </p>
                  ) : (
                    dune.whaleMoves.slice(0, 20).map((w, idx) => {
                      const actColor = ACTION_COLORS[w.action];
                      return (
                        <div
                          key={w.wallet + idx}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 8, borderBottom: '1px solid rgba(148,163,184,0.06)' }}
                        >
                          <span
                                                        style={{ fontFamily: 'monospace', fontSize: 10, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', background: 'var(--zm-divider)', color: actColor, flexShrink: 0 }}
                          >
                            {w.action}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--zm-text-secondary)' }}>
                              {truncateAddr(w.wallet)}
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)' }}>
                              {w.asset}  •  {w.protocol}
                            </div>
                          </div>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: actColor }}>
                            {formatCompact(w.amountUsd)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── DEX Pools Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'dex' && (
          <motion.div
            key="dex"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8,  willChange: 'transform, opacity' }}
          >
            <div
                            style={{ borderRadius: 12, padding: 16, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Layers size={14} style={{ color: 'rgba(52,211,153,1)' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                  Uniswap V3 — Top Pools by TVL
                </span>
                <span
                                    style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(52,211,153,0.1)', color: 'rgba(52,211,153,0.8)' }}
                >
                  The Graph
                </span>
              </div>

              {/* Header row */}
              <div
                style={{ display: 'grid', gap: 12, paddingTop: 8, paddingBottom: 8, marginBottom: 4, gridTemplateColumns: '24px 1fr 90px 90px 70px 70px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}
              >
                {['#', 'Pair', 'TVL', 'Vol 24h', 'APR', 'Txns'].map(h => (
                  <span key={h} style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right', color: 'var(--zm-text-faint)' }}>
                    {h}
                  </span>
                ))}
              </div>

              {graph.loading ? <LoadingRow /> : (
                graph.pools.slice(0, 30).map((p, i) => (
                  <PoolRow key={p.id} pool={p} rank={i + 1} />
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ── OHLCV Tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'ohlcv' && (
          <motion.div
            key="ohlcv"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8,  display:'flex', flexDirection:'column', gap:16 }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div
                            style={{ borderRadius: 12, padding: 16, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BarChart3 size={14} style={{ color: 'rgba(96,165,250,1)' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                  90-Day OHLCV  —  Daily Candles
                </span>
                <span
                                    style={{ fontFamily: 'monospace', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(96,165,250,0.1)', color: 'rgba(96,165,250,0.8)' }}
                >
                  CryptoCompare
                </span>
              </div>

              <SymbolSelector active={ccSymbol} onChange={handleSymbol} />
              <div style={{ marginTop: 16 }}>
                {cc.loading ? <LoadingRow /> : <OHLCVChart candles={cc.candles} symbol={ccSymbol} />}
              </div>

              {/* Top Pairs Table */}
              {!cc.loading && cc.topPairs.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, color: 'var(--zm-text-faint)' }}>
                    Top Exchanges — {ccSymbol}/USD
                  </div>
                  <div
                                        style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
                  >
                    {cc.topPairs.slice(0, 8).map(p => (
                      <div
                        key={p.exchange}
                                                style={{ padding: 10, borderRadius: 8, background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.08)' }}
                      >
                        <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                          {p.exchange}
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--zm-text-faint)' }}>
                          Vol: {formatCompact(p.volume24hUsd)}
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, marginTop: 2, color: 'rgba(52,211,153,1)' }}>
                          {formatPrice(p.lastPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Netflow Tab ────────────────────────────────────────────────────── */}
        {activeTab === 'netflow' && (
          <motion.div
            key="netflow"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8,  display:'flex', flexDirection:'column', gap:16 }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div
                            style={{ borderRadius: 12, padding: 16, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Globe size={14} style={{ color: 'rgba(96,165,250,1)' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                  Exchange Netflow
                </span>
                <span
                                    style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(167,139,250,0.1)', color: 'rgba(167,139,250,0.8)' }}
                >
                  Dune Analytics
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 4, background: 'rgba(52,211,153,0.7)' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)' }}>Outflow (bullish)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 4, background: 'rgba(251,113,133,0.7)' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--zm-text-faint)' }}>Inflow (bearish)</span>
                </div>
              </div>

              {dune.loading ? <LoadingRow /> : (
                dune.netflows.length === 0 ? (
                  <p style={{ fontFamily: 'monospace', fontSize: 12, paddingTop: 16, paddingBottom: 16, textAlign: 'center', color: 'var(--zm-text-faint)' }}>
                    No netflow data available
                  </p>
                ) : (
                  dune.netflows.map((n, i) => (
                    <NetflowRow key={n.exchange + i} item={n} maxAbs={netflowMaxAbs} />
                  ))
                )
              )}
            </div>

            {/* Gas metrics cards */}
            {!dune.loading && dune.gasMetrics.length > 0 && (
              <div
                                style={{ borderRadius: 12, padding: 16, background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Zap size={14} style={{ color: 'rgba(251,191,36,1)' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--zm-text-primary)' }}>
                    Gas Price History
                  </span>
                </div>
                <GasChart data={dune.gasMetrics} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

OnChain.displayName = 'OnChain';
export default OnChain;
