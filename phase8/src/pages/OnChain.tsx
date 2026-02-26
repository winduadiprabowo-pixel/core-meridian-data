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
  transfer:   'var(--zm-text-secondary)',
  deposit:    'var(--zm-positive)',
  withdrawal: 'var(--zm-negative)',
  buy:        'var(--zm-positive)',
  sell:       'var(--zm-negative)',
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
    className="flex-1 min-w-[130px] rounded-xl p-4 flex flex-col gap-1.5"
    style={{
      background: 'var(--zm-glass-bg)',
      border:     '1px solid var(--zm-glass-border)',
      willChange: 'transform',
    }}
  >
    <div className="flex items-center gap-2">
      <span style={{ color: accent }}>{icon}</span>
      <span
        className="text-[10px] font-mono uppercase tracking-wider"
        style={{ color: 'var(--zm-text-faint)' }}
      >
        {label}
      </span>
    </div>
    <span
      className="text-xl font-mono font-bold"
      style={{ color: 'var(--zm-text-primary)' }}
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
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(W - PAD.right, y);
      ctx.stroke();
    }

    // Price labels
    ctx.fillStyle = 'var(--zm-text-secondary)';
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
      const color  = bull ? 'var(--zm-positive)' : 'var(--zm-negative)';
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
    ctx.fillStyle = 'rgba(138,138,158,0.50)';
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
        className="flex items-center justify-center h-24 text-sm"
        style={{ color: 'var(--zm-text-faint)' }}
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
          ? 'rgba(255,68,136,0.80)'
          : d.avgGasGwei > maxGas * 0.4
          ? 'rgba(255,187,0,0.80)'
          : 'rgba(34,255,170,0.80)';
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
              fill="rgba(138,138,158,0.50)"
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
  const color     = isOutflow ? 'rgba(34,255,170,0.70)' : 'rgba(251,113,133,0.7)';

  return (
    <div className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
      <span className="font-mono text-sm w-28" style={{ color: 'var(--zm-text-primary)' }}>
        {item.exchange}
      </span>
      <div className="flex items-center gap-2 flex-1">
        <div
          style={{
            width:        barW,
            height:       8,
            background:   color,
            borderRadius: 2,
            transition:   'width 0.4s ease',
            willChange:   'width',
          }}
        />
        <span className="font-mono text-xs" style={{ color }}>
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
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-2.5"
      style={{
        borderBottom: '1px solid var(--zm-grey-06)',
        willChange:   'transform, opacity',
      }}
    >
      <Icon size={14} style={{ color, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs" style={{ color: 'var(--zm-text-secondary)' }}>
            {truncateAddr(swap.sender)}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase"
            style={{ background: 'rgba(148,163,184,0.1)', color }}
          >
            {swap.type}
          </span>
        </div>
        <div className="font-mono text-[11px]" style={{ color: 'var(--zm-text-faint)' }}>
          {swap.token0}/{swap.token1}  •  {timeAgo(swap.timestamp)}
        </div>
      </div>
      <span className="font-mono font-bold text-sm" style={{ color }}>
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
    className="grid items-center gap-3 py-2.5"
    style={{
      gridTemplateColumns: '24px 1fr 90px 90px 70px 70px',
      borderBottom:        '1px solid var(--zm-grey-06)',
    }}
  >
    <span className="font-mono text-xs text-center" style={{ color: 'var(--zm-text-faint)' }}>
      {rank}
    </span>
    <div>
      <div className="font-mono text-sm font-bold" style={{ color: 'var(--zm-text-primary)' }}>
        {pool.token0Symbol}/{pool.token1Symbol}
      </div>
      <div className="font-mono text-[10px]" style={{ color: 'var(--zm-text-faint)' }}>
        {pool.feeTier.toFixed(2)}% fee
      </div>
    </div>
    <span className="font-mono text-sm text-right" style={{ color: 'var(--zm-text-secondary)' }}>
      {formatCompact(pool.tvlUsd)}
    </span>
    <span className="font-mono text-sm text-right" style={{ color: 'var(--zm-text-secondary)' }}>
      {formatCompact(pool.volumeUsd24h)}
    </span>
    <span className="font-mono text-sm text-right" style={{ color: 'var(--zm-positive)' }}>
      {formatPct(pool.apr)}
    </span>
    <span className="font-mono text-xs text-right" style={{ color: 'var(--zm-text-faint)' }}>
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
  const color = isUp ? 'var(--zm-positive)' : 'var(--zm-negative)';
  const Icon  = isUp ? TrendingUp : TrendingDown;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{
        background: 'var(--zm-glass-bg)',
        border:     '1px solid var(--zm-glass-border)',
        willChange: 'transform',
      }}
    >
      {token.thumb ? (
        <img
          src={token.thumb}
          alt={token.symbol}
          width={28}
          height={28}
          className="rounded-full"
          style={{ flexShrink: 0 }}
        />
      ) : (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
          style={{ background: 'rgba(96,165,250,0.15)', color: 'rgba(96,165,250,1)' }}
        >
          {token.symbol.slice(0, 2)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-mono text-sm font-bold truncate" style={{ color: 'var(--zm-text-primary)' }}>
          {token.symbol}
        </div>
        <div className="font-mono text-[10px] truncate capitalize" style={{ color: 'var(--zm-text-faint)' }}>
          {token.chain}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm font-bold" style={{ color: 'var(--zm-text-primary)' }}>
          {token.priceUsd > 0 ? formatPrice(token.priceUsd) : '—'}
        </div>
        <div className="flex items-center gap-0.5 justify-end">
          <Icon size={10} style={{ color }} />
          <span className="font-mono text-[11px]" style={{ color }}>
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
      className="relative px-4 py-2 font-mono text-xs uppercase tracking-wider rounded-lg transition-colors"
      style={{
        background:  active ? 'rgba(96,165,250,0.15)' : 'transparent',
        color:       active ? 'rgba(96,165,250,1)'    : 'var(--zm-text-faint)',
        border:      active ? '1px solid rgba(96,165,250,0.3)' : '1px solid transparent',
        willChange:  'transform',
      }}
    >
      {label}
    </button>
  );
});
TabButton.displayName = 'TabButton';

// ─── Loading Overlay ──────────────────────────────────────────────────────────

const LoadingRow = memo(() => (
  <div className="flex items-center gap-2 py-6 justify-center" style={{ color: 'var(--zm-text-faint)' }}>
    <Loader2 size={16} className="animate-spin" />
    <span className="font-mono text-xs">Fetching on-chain data…</span>
  </div>
));
LoadingRow.displayName = 'LoadingRow';

// ─── Symbol Selector ──────────────────────────────────────────────────────────

interface SymbolSelectorProps {
  active:   string;
  onChange: (sym: string) => void;
}

const SymbolSelector = memo(({ active, onChange }: SymbolSelectorProps) => (
  <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Asset selector">
    {CC_SYMBOLS.map(sym => {
      const isActive = sym === active;
      const handleClick = () => onChange(sym);
      return (
        <button
          key={sym}
          type="button"
          onClick={handleClick}
          aria-pressed={isActive}
          className="px-3 py-1 rounded font-mono text-xs uppercase"
          style={{
            background: isActive ? 'rgba(96,165,250,0.2)' : 'rgba(148,163,184,0.08)',
            color:      isActive ? 'rgba(96,165,250,1)'   : 'var(--zm-text-faint)',
            border:     isActive ? '1px solid rgba(96,165,250,0.4)' : '1px solid transparent',
            willChange: 'transform',
          }}
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
      { label: 'DEX TVL',        value: formatCompact(s.totalTvlUsd),    accent: 'var(--zm-positive)',  icon: <Layers size={14} />   },
      { label: 'Pool Count',     value: formatCompactNum(s.poolCount),   accent: 'var(--zm-violet)', icon: <Activity size={14} /> },
      { label: 'Tx Count',       value: formatCompactNum(s.txCount24h),  accent: 'var(--zm-warning)',  icon: <Zap size={14} />      },
    ];
  }, [graph.dexStats]);

  return (
    <div
      className="flex flex-col gap-5 p-4 lg:p-6 min-h-screen"
      style={{ background: 'var(--zm-bg-deep)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="font-mono text-2xl font-bold tracking-tight"
            style={{ color: 'var(--zm-text-primary)' }}
          >
            On-Chain Analytics
          </h1>
          <p className="font-mono text-xs mt-1" style={{ color: 'var(--zm-text-faint)' }}>
            The Graph  •  Dune Analytics  •  CryptoCompare  •  CoinGecko On-Chain
          </p>
        </div>
        <div className="flex items-center gap-2">
          {anyLoading && <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(96,165,250,1)' }} />}
          <button
            type="button"
            onClick={handleRefreshAll}
            aria-label="Refresh all on-chain data"
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', color: 'var(--zm-text-faint)', willChange: 'transform' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {anyError && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-mono"
          style={{ background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', color: 'var(--zm-negative)' }}
        >
          <AlertTriangle size={14} />
          {anyError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap" role="tablist" aria-label="On-chain sections">
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
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-5"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* DEX Stats Row */}
            {graph.loading ? (
              <LoadingRow />
            ) : (
              <div className="flex gap-3 flex-wrap">
                {dexStatsItems.map(s => (
                  <StatBadge key={s.label} label={s.label} value={s.value} accent={s.accent} icon={s.icon} />
                ))}
              </div>
            )}

            {/* Trending On-Chain */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Flame size={14} style={{ color: 'var(--zm-negative)' }} />
                <span className="font-mono text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--zm-text-primary)' }}>
                  Trending On-Chain
                </span>
              </div>
              {cgOnChain.loading ? <LoadingRow /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {cgOnChain.trending.slice(0, 9).map(t => (
                    <TrendingCard key={t.id} token={t} />
                  ))}
                </div>
              )}
            </div>

            {/* Gas Metrics */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} style={{ color: 'var(--zm-warning)' }} />
                <span className="font-mono text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--zm-text-primary)' }}>
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
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Uniswap V3 whale swaps from The Graph */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Wallet size={14} style={{ color: 'rgba(96,165,250,1)' }} />
                <span className="font-mono text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--zm-text-primary)' }}>
                  Uniswap V3 — Whale Swaps  ($100k+)
                </span>
                <span
                  className="ml-auto font-mono text-[10px] px-2 py-0.5 rounded"
                  style={{ background: 'rgba(96,165,250,0.1)', color: 'rgba(96,165,250,0.8)' }}
                >
                  The Graph
                </span>
              </div>
              {graph.loading ? <LoadingRow /> : (
                <div>
                  {graph.whaleSwaps.length === 0 ? (
                    <p className="font-mono text-xs py-4 text-center" style={{ color: 'var(--zm-text-faint)' }}>
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
              className="rounded-xl p-4"
              style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Radio size={14} style={{ color: 'var(--zm-violet)' }} />
                <span className="font-mono text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--zm-text-primary)' }}>
                  Large On-Chain Transfers
                </span>
                <span
                  className="ml-auto font-mono text-[10px] px-2 py-0.5 rounded"
                  style={{ background: 'var(--zm-violet-bg)', color: 'rgba(180,130,255,0.80)' }}
                >
                  Dune Analytics
                </span>
              </div>
              {dune.loading ? <LoadingRow /> : (
                <div>
                  {dune.whaleMoves.length === 0 ? (
                    <p className="font-mono text-xs py-4 text-center" style={{ color: 'var(--zm-text-faint)' }}>
                      No data available
                    </p>
                  ) : (
                    dune.whaleMoves.slice(0, 20).map((w, idx) => {
                      const actColor = ACTION_COLORS[w.action];
                      return (
                        <div
                          key={w.wallet + idx}
                          className="flex items-center gap-3 py-2"
                          style={{ borderBottom: '1px solid var(--zm-grey-06)' }}
                        >
                          <span
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded uppercase"
                            style={{ background: 'rgba(148,163,184,0.08)', color: actColor, flexShrink: 0 }}
                          >
                            {w.action}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs" style={{ color: 'var(--zm-text-secondary)' }}>
                              {truncateAddr(w.wallet)}
                            </div>
                            <div className="font-mono text-[10px]" style={{ color: 'var(--zm-text-faint)' }}>
                              {w.asset}  •  {w.protocol}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-sm" style={{ color: actColor }}>
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
            exit={{ opacity: 0, y: -8 }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Layers size={14} style={{ color: 'var(--zm-positive)' }} />
                <span className="font-mono text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--zm-text-primary)' }}>
                  Uniswap V3 — Top Pools by TVL
                </span>
                <span
                  className="ml-auto font-mono text-[10px] px-2 py-0.5 rounded"
                  style={{ background: 'var(--zm-positive-bg)', color: 'rgba(34,255,170,0.80)' }}
                >
                  The Graph
                </span>
              </div>

              {/* Header row */}
              <div
                className="grid gap-3 py-2 mb-1"
                style={{
                  gridTemplateColumns: '24px 1fr 90px 90px 70px 70px',
                  borderBottom:        '1px solid rgba(138,138,158,0.15)',
                }}
              >
                {['#', 'Pair', 'TVL', 'Vol 24h', 'APR', 'Txns'].map(h => (
                  <span key={h} className="font-mono text-[10px] uppercase tracking-wider text-right first:text-left" style={{ color: 'var(--zm-text-faint)' }}>
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
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4"
            style={{ willChange: 'transform, opacity' }}
          >
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <BarChart3 size={14} style={{ color: 'rgba(96,165,250,1)' }} />
                <span className="font-mono text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--zm-text-primary)' }}>
                  90-Day OHLCV  —  Daily Candles
                </span>
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded"
                  style={{ background: 'rgba(96,165,250,0.1)', color: 'rgba(96,165,250,0.8)' }}
                >
                  CryptoCompare
                </span>
              </div>

              <SymbolSelector active={ccSymbol} onChange={handleSymbol} />
              <div className="mt-4">
                {cc.loading ? <LoadingRow /> : <OHLCVChart candles={cc.candles} symbol={ccSymbol} />}
              </div>

              {/* Top Pairs Table */}
              {!cc.loading && cc.topPairs.length > 0 && (
                <div className="mt-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--zm-text-faint)' }}>
                    Top Exchanges — {ccSymbol}/USD
                  </div>
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
                  >
                    {cc.topPairs.slice(0, 8).map(p => (
                      <div
                        key={p.exchange}
                        className="p-2.5 rounded-lg"
                        style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.08)' }}
                      >
                        <div className="font-mono text-xs font-bold" style={{ color: 'var(--zm-text-primary)' }}>
                          {p.exchange}
                        </div>
                        <div className="font-mono text-[11px]" style={{ color: 'var(--zm-text-faint)' }}>
                          Vol: {formatCompact(p.volume24hUsd)}
                        </div>
                        <div className="font-mono text-sm font-bold mt-0.5" style={{ color: 'var(--zm-positive)' }}>
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
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4"
            style={{ willChange: 'transform, opacity' }}
          >
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Globe size={14} style={{ color: 'rgba(96,165,250,1)' }} />
                <span className="font-mono text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--zm-text-primary)' }}>
                  Exchange Netflow
                </span>
                <span
                  className="ml-auto font-mono text-[10px] px-2 py-0.5 rounded"
                  style={{ background: 'var(--zm-violet-bg)', color: 'rgba(180,130,255,0.80)' }}
                >
                  Dune Analytics
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: 'rgba(34,255,170,0.70)' }} />
                  <span className="font-mono text-[10px]" style={{ color: 'var(--zm-text-faint)' }}>Outflow (bullish)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: 'rgba(251,113,133,0.7)' }} />
                  <span className="font-mono text-[10px]" style={{ color: 'var(--zm-text-faint)' }}>Inflow (bearish)</span>
                </div>
              </div>

              {dune.loading ? <LoadingRow /> : (
                dune.netflows.length === 0 ? (
                  <p className="font-mono text-xs py-4 text-center" style={{ color: 'var(--zm-text-faint)' }}>
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
                className="rounded-xl p-4"
                style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} style={{ color: 'var(--zm-warning)' }} />
                  <span className="font-mono text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--zm-text-primary)' }}>
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
