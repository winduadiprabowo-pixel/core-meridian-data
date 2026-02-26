/**
 * Portfolio.tsx — ZERØ MERIDIAN 2026 push24
 * push24: var(--zm-*) migration, willChange: transform
 * - React.memo + displayName ✓
 * - rgba() only ✓  var(--zm-*) ✓
 * - Zero template literals in JSX ✓
 * - Object.freeze() all static data ✓
 * - useCallback + useMemo ✓
 * - mountedRef ✓
 * - aria-label + role ✓
 * - will-change: transform ✓
 */

import React, {
  memo, useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import MetricCard from '@/components/shared/MetricCard';
import { useBreakpoint } from '@/hooks/useBreakpoint';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Holding {
  symbol:  string;
  name:    string;
  qty:     number;
  avgCost: number;
  price:   number;
  color:   string;
}

interface Trade {
  id:     string;
  date:   string;
  symbol: string;
  side:   'BUY' | 'SELL';
  qty:    number;
  price:  number;
  pnl:    number | null;
  notes:  string;
}

interface PerfPoint {
  date:  string;
  value: number;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const HOLDINGS: readonly Holding[] = Object.freeze([
  { symbol: 'BTC',  name: 'Bitcoin',      qty: 0.42,  avgCost: 58200, price: 97350,  color: 'rgba(251,191,36,1)'   },
  { symbol: 'ETH',  name: 'Ethereum',     qty: 3.8,   avgCost: 2850,  price: 3420,   color: 'rgba(96,165,250,1)'   },
  { symbol: 'SOL',  name: 'Solana',       qty: 28.5,  avgCost: 145,   price: 198,    color: 'rgba(167,139,250,1)'  },
  { symbol: 'BNB',  name: 'BNB',          qty: 5.2,   avgCost: 290,   price: 412,    color: 'rgba(251,146,60,1)'   },
  { symbol: 'ARB',  name: 'Arbitrum',     qty: 850,   avgCost: 1.12,  price: 1.48,   color: 'rgba(52,211,153,1)'   },
  { symbol: 'LINK', name: 'Chainlink',    qty: 120,   avgCost: 12.4,  price: 18.7,   color: 'rgba(248,113,113,1)'  },
  { symbol: 'AVAX', name: 'Avalanche',    qty: 45,    avgCost: 28,    price: 42.3,   color: 'rgba(45,212,191,1)'   },
  { symbol: 'USDC', name: 'USD Coin',     qty: 2400,  avgCost: 1,     price: 1,      color: 'rgba(148,163,184,0.5)' },
]);

const TRADES: readonly Trade[] = Object.freeze([
  { id: 't001', date: '2026-02-21', symbol: 'BTC',  side: 'BUY',  qty: 0.05, price: 95800, pnl: null, notes: 'DCA accumulation zone' },
  { id: 't002', date: '2026-02-18', symbol: 'SOL',  side: 'SELL', qty: 10,   price: 210,   pnl: 650,  notes: 'Take profit partial' },
  { id: 't003', date: '2026-02-14', symbol: 'ETH',  side: 'BUY',  qty: 0.5,  price: 3280,  pnl: null, notes: 'Support retest' },
  { id: 't004', date: '2026-02-10', symbol: 'ARB',  side: 'BUY',  qty: 500,  price: 1.08,  pnl: null, notes: 'Breakout confirmation' },
  { id: 't005', date: '2026-02-05', symbol: 'LINK', side: 'SELL', qty: 50,   price: 20.1,  pnl: 385,  notes: 'TP1 hit' },
  { id: 't006', date: '2026-01-28', symbol: 'BNB',  side: 'BUY',  qty: 2,    price: 380,   pnl: null, notes: 'Bull flag breakout' },
  { id: 't007', date: '2026-01-22', symbol: 'AVAX', side: 'BUY',  qty: 20,   price: 36.5,  pnl: null, notes: 'Oversold bounce' },
  { id: 't008', date: '2026-01-15', symbol: 'SOL',  side: 'SELL', qty: 15,   price: 188,   pnl: 645,  notes: 'Resistance rejection' },
]);

const TABS = Object.freeze(['Overview', 'Holdings', 'Journal', 'Risk']);

// ─── xoshiro128++ PRNG (zero Math.random) ─────────────────────────────────────

function xoshiro(a: number, b: number, c: number, d: number): () => number {
  let _a = a, _b = b, _c = c, _d = d;
  return function(): number {
    const t = _b << 9;
    let r = _a * 5;
    r = ((r << 7) | (r >>> 25)) * 9;
    _c ^= _a; _d ^= _b; _b ^= _c; _a ^= _d; _c ^= t;
    _d = (_d << 11) | (_d >>> 21);
    return (r >>> 0) / 4294967296;
  };
}
const _perfRng = xoshiro(1234567891, 987654321, 192837465, 1122334455);

function genPerfData(): PerfPoint[] {
  const pts: PerfPoint[] = [];
  let v = 45000;
  const now = Date.now();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now - i * 864e5);
    v = v * (1 + (_perfRng() - 0.44) * 0.032);
    pts.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: Math.round(v) });
  }
  return pts;
}

const PERF_DATA: readonly PerfPoint[] = Object.freeze(genPerfData());

function fmtUSD(n: number): string {
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}
function fmtPct(n: number): string { return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'; }

// ─── EquityCurve Canvas ───────────────────────────────────────────────────────

const EquityCurve = memo<{ data: readonly PerfPoint[]; height: number }>(({ data, height }) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    if (data.length < 2) return;
    const vals = data.map(p => p.value);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const range = maxV - minV || 1;
    const PAD = { t: 16, b: 16, l: 8, r: 8 };
    const cW = w - PAD.l - PAD.r;
    const cH = h - PAD.t - PAD.b;

    const sx = (i: number) => PAD.l + (i / (data.length - 1)) * cW;
    const sy = (v: number) => PAD.t + cH - ((v - minV) / range) * cH;

    const grad = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + cH);
    grad.addColorStop(0, 'rgba(96,165,250,0.25)');
    grad.addColorStop(1, 'rgba(96,165,250,0)');

    ctx.beginPath();
    ctx.moveTo(sx(0), sy(data[0].value));
    data.forEach((p, i) => { if (i > 0) ctx.lineTo(sx(i), sy(p.value)); });
    ctx.lineTo(sx(data.length - 1), PAD.t + cH);
    ctx.lineTo(sx(0), PAD.t + cH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sx(0), sy(data[0].value));
    data.forEach((p, i) => { if (i > 0) ctx.lineTo(sx(i), sy(p.value)); });
    ctx.strokeStyle = 'rgba(96,165,250,0.9)';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [data, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: height + 'px', willChange: 'transform' }}
      aria-label="Portfolio equity curve"
    />
  );
});
EquityCurve.displayName = 'EquityCurve';

// ─── Allocation Donut ─────────────────────────────────────────────────────────

const AllocationDonut = memo<{ holdings: readonly Holding[] }>(({ holdings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const total = useMemo(() => holdings.reduce((s, h) => s + h.qty * h.price, 0), [holdings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || total === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = 120;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2; const cy = size / 2; const R = 44; const r = 26;
    let angle = -Math.PI / 2;
    holdings.forEach(h => {
      const slice = ((h.qty * h.price) / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      ctx.arc(cx, cy, R, angle, angle + slice);
      ctx.arc(cx, cy, r, angle + slice, angle, true);
      ctx.closePath();
      ctx.fillStyle = h.color;
      ctx.fill();
      angle += slice;
    });
  }, [holdings, total]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '120px', height: '120px', flexShrink: 0, willChange: 'transform' }}
      aria-label="Portfolio allocation donut chart"
    />
  );
});
AllocationDonut.displayName = 'AllocationDonut';

// ─── Holdings Row ─────────────────────────────────────────────────────────────

const HoldingsRow = memo(({ h, total }: { h: Holding; total: number }) => {
  const val  = h.qty * h.price;
  const cost = h.qty * h.avgCost;
  const pnl  = val - cost;
  const roi  = ((h.price - h.avgCost) / h.avgCost) * 100;
  const pct  = (val / total) * 100;
  const pos  = pnl >= 0;

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '120px 80px 100px 100px 100px 80px', gap: '0 8px', padding: '8px 16px', borderBottom: '1px solid var(--zm-glass-border)', alignItems: 'center', willChange: 'transform' }}
      role="row"
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--zm-glass-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: h.color, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 600, color: 'var(--zm-text-primary)' }}>{h.symbol}</span>
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'var(--zm-text-secondary)', textAlign: 'right' }}>{h.qty}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'var(--zm-text-primary)', textAlign: 'right' }}>{fmtUSD(val)}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', textAlign: 'right', color: pos ? 'rgba(52,211,153,0.9)' : 'rgba(251,113,133,0.9)' }}>
        {(pos ? '+' : '') + fmtUSD(pnl)}
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', textAlign: 'right', color: pos ? 'rgba(52,211,153,0.9)' : 'rgba(251,113,133,0.9)' }}>
        {fmtPct(roi)}
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'var(--zm-text-faint)', textAlign: 'right' }}>{pct.toFixed(1) + '%'}</div>
    </div>
  );
});
HoldingsRow.displayName = 'HoldingsRow';

// ─── Trade Row ────────────────────────────────────────────────────────────────

const TradeRow = memo(({ t }: { t: Trade }) => {
  const isBuy = t.side === 'BUY';
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '96px 60px 56px 80px 90px 90px 1fr', gap: '0 8px', padding: '8px 16px', borderBottom: '1px solid var(--zm-glass-border)', alignItems: 'center', willChange: 'transform' }}
      role="row"
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--zm-glass-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)' }}>{t.date}</span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 600, color: 'var(--zm-text-primary)' }}>{t.symbol}</span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', padding: '2px 6px', borderRadius: '4px', textAlign: 'center', background: isBuy ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)', color: isBuy ? 'rgba(52,211,153,0.9)' : 'rgba(251,113,133,0.9)', border: '1px solid ' + (isBuy ? 'rgba(52,211,153,0.25)' : 'rgba(251,113,133,0.25)') }}>
        {t.side}
      </span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', textAlign: 'right', color: 'var(--zm-text-secondary)' }}>{t.qty}</span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', textAlign: 'right', color: 'var(--zm-text-primary)' }}>{fmtUSD(t.price)}</span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', textAlign: 'right', color: t.pnl != null ? (t.pnl >= 0 ? 'rgba(52,211,153,0.9)' : 'rgba(251,113,133,0.9)') : 'var(--zm-text-faint)' }}>
        {t.pnl != null ? (t.pnl >= 0 ? '+' : '') + fmtUSD(t.pnl) : '—'}
      </span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes}</span>
    </div>
  );
});
TradeRow.displayName = 'TradeRow';

// ─── Risk Panel ───────────────────────────────────────────────────────────────

const RiskPanel = memo(() => {
  const RISK_METRICS = useMemo(() => Object.freeze([
    { label: 'Portfolio Beta',    value: '1.24',   color: 'rgba(251,191,36,1)',  note: 'vs BTC' },
    { label: 'Sharpe Ratio',      value: '1.82',   color: 'rgba(52,211,153,1)',  note: '90D' },
    { label: 'Max Drawdown',      value: '-18.4%', color: 'rgba(251,113,133,1)', note: '90D' },
    { label: 'Volatility (30D)',  value: '42.1%',  color: 'rgba(251,146,60,1)', note: 'Annualized' },
    { label: 'Correlation BTC',   value: '0.87',   color: 'rgba(96,165,250,1)',  note: 'High' },
    { label: 'VaR (95%)',         value: '-4.8%',  color: 'rgba(167,139,250,1)', note: '1D' },
  ]), []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px', willChange: 'transform' }}>
      {RISK_METRICS.map(m => (
        <div key={m.label} style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>{m.label}</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '20px', fontWeight: 700, color: m.color }}>{m.value}</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)', marginTop: '4px' }}>{m.note}</div>
        </div>
      ))}
    </div>
  );
});
RiskPanel.displayName = 'RiskPanel';

// ─── Portfolio Page ───────────────────────────────────────────────────────────

const Portfolio = memo(() => {
  const { isMobile, isTablet } = useBreakpoint();
  const [tab, setTab] = useState(0);
  const mountedRef    = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleTab = useCallback((i: number) => setTab(i), []);

  const totalValue = useMemo(() => HOLDINGS.reduce((s, h) => s + h.qty * h.price, 0), []);
  const totalCost  = useMemo(() => HOLDINGS.reduce((s, h) => s + h.qty * h.avgCost, 0), []);
  const totalPnL   = useMemo(() => totalValue - totalCost, [totalValue, totalCost]);
  const roi        = useMemo(() => ((totalValue - totalCost) / totalCost) * 100, [totalValue, totalCost]);
  const perf90d    = useMemo(() => ((PERF_DATA[PERF_DATA.length - 1].value - PERF_DATA[0].value) / PERF_DATA[0].value) * 100, []);

  const winTrades    = TRADES.filter(t => t.pnl !== null && t.pnl > 0).length;
  const closedTrades = TRADES.filter(t => t.pnl !== null).length;
  const winRate      = closedTrades > 0 ? (winTrades / closedTrades) * 100 : 0;

  const cardData = useMemo(() => Object.freeze([
    { label: 'Total Value', value: fmtUSD(totalValue), subValue: fmtPct(perf90d) + ' (90D)', positive: perf90d >= 0 },
    { label: 'Total P&L',  value: fmtUSD(totalPnL),   subValue: fmtPct(roi) + ' ROI',        positive: totalPnL >= 0 },
    { label: 'ROI',        value: fmtPct(roi),         subValue: fmtUSD(totalCost) + ' cost', positive: roi >= 0 },
    { label: 'Win Rate',   value: winRate.toFixed(0) + '%', subValue: closedTrades + ' closed trades', positive: winRate >= 50 },
  ]), [totalValue, totalPnL, roi, totalCost, perf90d, winRate, closedTrades]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--zm-bg-base)', fontFamily: "'Space Mono', monospace" }} aria-label="Portfolio tracker" role="main">

      {/* Header */}
      <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--zm-glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.04em', willChange: 'transform' }}>
              PORTFOLIO TRACKER
            </h1>
            <p style={{ margin: '4px 0 0', fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)', letterSpacing: '0.06em' }}>
              {'ULTRA · ' + HOLDINGS.length + ' ASSETS · LIVE'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['1D', '7D', '30D', '90D'] as const).map(r => (
              <button key={r} type="button" aria-label={'Range ' + r} style={{
                fontFamily: "'Space Mono', monospace", fontSize: '10px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', willChange: 'transform',
                border:     r === '90D' ? '1px solid rgba(96,165,250,0.35)' : '1px solid var(--zm-glass-border)',
                background: r === '90D' ? 'rgba(96,165,250,0.1)' : 'transparent',
                color:      r === '90D' ? 'rgba(96,165,250,0.9)' : 'var(--zm-text-faint)',
              }}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: '12px', padding: '16px 28px' }}>
        {cardData.map(c => <MetricCard key={c.label} label={c.label} value={c.value} subValue={c.subValue} positive={c.positive} />)}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', padding: '12px 28px', borderBottom: '1px solid var(--zm-glass-border)' }} role="tablist" aria-label="Portfolio sections">
        {TABS.map((t, i) => (
          <button key={t} type="button" role="tab" aria-selected={tab === i} onClick={() => handleTab(i)} style={{
            fontFamily: "'Space Mono', monospace", fontSize: '10px', letterSpacing: '0.06em', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', willChange: 'transform',
            border:     tab === i ? '1px solid rgba(96,165,250,0.3)' : '1px solid transparent',
            background: tab === i ? 'rgba(96,165,250,0.1)' : 'transparent',
            color:      tab === i ? 'rgba(96,165,250,0.95)' : 'var(--zm-text-faint)',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '20px 28px' }}>
        {tab === 0 && (
          <div>
            <div style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)', letterSpacing: '0.08em', marginBottom: '12px' }}>EQUITY CURVE — 90 DAYS</div>
              <EquityCurve data={PERF_DATA} height={180} />
            </div>
            <div style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)', letterSpacing: '0.08em', marginBottom: '16px' }}>ALLOCATION</div>
              <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
                <AllocationDonut holdings={HOLDINGS} />
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  {HOLDINGS.map(h => {
                    const val = h.qty * h.price;
                    const pct = (val / totalValue) * 100;
                    return (
                      <div key={h.symbol} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-primary)', minWidth: '36px' }}>{h.symbol}</span>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)' }}>{pct.toFixed(1) + '%'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 100px 100px 100px 80px', gap: '0 8px', padding: '10px 16px', borderBottom: '1px solid var(--zm-glass-border)', background: 'var(--zm-topbar-bg)' }} role="rowheader">
              {(['Asset', 'Qty', 'Value', 'P&L', 'ROI', 'Alloc'] as const).map(h => (
                <div key={h} style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)', letterSpacing: '0.08em', textAlign: h === 'Asset' ? 'left' : 'right', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            <div role="list" aria-label="Holdings">
              {HOLDINGS.map(h => <HoldingsRow key={h.symbol} h={h} total={totalValue} />)}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: 'var(--zm-glass-bg)', border: '1px solid var(--zm-glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '96px 60px 56px 80px 90px 90px 1fr', gap: '0 8px', padding: '10px 16px', borderBottom: '1px solid var(--zm-glass-border)', background: 'var(--zm-topbar-bg)' }} role="rowheader">
              {(['Date', 'Asset', 'Side', 'Qty', 'Price', 'Realized', 'Notes'] as const).map(h => (
                <div key={h} style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            <div role="list" aria-label="Trade journal">
              {TRADES.map(t => <TradeRow key={t.id} t={t} />)}
            </div>
            <div style={{ display: 'flex', gap: '20px', padding: '12px 16px', borderTop: '1px solid var(--zm-glass-border)', background: 'var(--zm-glass-bg)' }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)' }}>
                {'Total realized: '}
                <span style={{ color: 'rgba(52,211,153,0.9)' }}>
                  {fmtUSD(TRADES.filter(t => t.pnl !== null).reduce((s, t) => s + (t.pnl || 0), 0))}
                </span>
              </span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)' }}>
                {'Wins: '}
                <span style={{ color: 'rgba(52,211,153,0.9)' }}>{winTrades}</span>
                {' / '}
                <span>{closedTrades}</span>
                {' closed'}
              </span>
            </div>
          </div>
        )}

        {tab === 3 && <RiskPanel />}
      </div>
    </div>
  );
});
Portfolio.displayName = 'Portfolio';

export default Portfolio;
