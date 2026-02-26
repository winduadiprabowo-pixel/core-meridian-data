/**
 * Intelligence.tsx — ZERØ MERIDIAN 2026 Phase 10
 * AI Intelligence Hub:
 *   - TensorFlow.js AI Signal (anomaly, prediction, RSI, MACD, Bollinger)
 *   - Messari Fundamental Data (free tier)
 *   - Santiment Social Volume + Trending Topics (free tier)
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX ✓
 * - Object.freeze() all static data ✓
 * - useCallback + useMemo ✓
 * - mountedRef ✓
 * - aria-label + role ✓
 * - will-change: transform ✓
 * - var(--zm-*) theme-aware ✓ ← push25
 */

import { memo, useCallback, useMemo, useRef, useEffect, useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';
import Skeleton from '@/components/shared/Skeleton';
import { useMessari }   from '@/hooks/useMessari';
import { useSantiment } from '@/hooks/useSantiment';
import { useCrypto }    from '@/contexts/CryptoContext';
import { formatCompact, formatChange, formatPrice } from '@/lib/formatters';

const AISignalTile = lazy(() => import('@/components/tiles/AISignalTile'));

// ─── Static data ──────────────────────────────────────────────────────────────

const SYMBOLS = Object.freeze(['BTC', 'ETH', 'SOL'] as const);
type Symbol = typeof SYMBOLS[number];

const SLUG_MAP = Object.freeze({
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
} as const);

const containerVariants = Object.freeze({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
});

const itemVariants = Object.freeze({
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
});

// ─── Sub components ───────────────────────────────────────────────────────────

const SectionHeader = memo(({ label, color = 'var(--zm-violet)' }: { label: string; color?: string }) => (
  <p style={{
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    letterSpacing: '0.16em',
    color,
    marginBottom: '14px',
    textTransform: 'uppercase' as const,
    opacity: 0.6,
  }}>
    {label}
  </p>
));
SectionHeader.displayName = 'SectionHeader';

interface MessariCardProps {
  asset: string;
  data: {
    symbol: string;
    percentChangeLast24h: number;
    percentChangeLast7d:  number;
    percentChangeLast30d: number;
    realVolumeLast24h:    number;
    athUsd:               number;
    circulatingSupply:    number;
  } | undefined;
  isLoading: boolean;
}

const MessariCard = memo(({ asset, data, isLoading }: MessariCardProps) => {
  const cardStyle = useMemo(() => ({
    padding: '14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  }), []);

  if (isLoading || !data) {
    return (
      <GlassCard style={cardStyle}>
        <Skeleton.Card />
      </GlassCard>
    );
  }

  return (
    <GlassCard style={cardStyle} aria-label={'Messari fundamental data for ' + asset}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--zm-text-primary)',
          letterSpacing: '0.06em',
        }}>
          {asset.toUpperCase()}
        </span>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '8px',
          color: 'var(--zm-accent)',
          letterSpacing: '0.1em',
          opacity: 0.6,
        }}>MESSARI</span>
      </div>

      {/* Change grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {[
          { label: '24H', value: data.percentChangeLast24h },
          { label: '7D',  value: data.percentChangeLast7d },
          { label: '30D', value: data.percentChangeLast30d },
        ].map(row => (
          <div key={row.label} style={{
            background: 'var(--zm-surface-1)',
            borderRadius: '6px',
            padding: '6px 8px',
            textAlign: 'center' as const,
          }}>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '8px',
              color: 'var(--zm-text-faint)',
              letterSpacing: '0.08em',
              marginBottom: '2px',
            }}>{row.label}</div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '11px',
              fontWeight: 700,
              color: row.value >= 0 ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)',
            }}>
              {formatChange(row.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)' }}>Real Vol 24H</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-primary)', opacity: 0.7 }}>{formatCompact(data.realVolumeLast24h)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)' }}>ATH</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-primary)', opacity: 0.7 }}>{formatPrice(data.athUsd)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-faint)' }}>Circ. Supply</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--zm-text-primary)', opacity: 0.7 }}>{formatCompact(data.circulatingSupply).replace('$', '')}</span>
        </div>
      </div>
    </GlassCard>
  );
});
MessariCard.displayName = 'MessariCard';

interface TrendingTagsProps {
  words: { word: string; score: number }[];
  isLoading: boolean;
}

const TrendingTags = memo(({ words, isLoading }: TrendingTagsProps) => {
  if (isLoading) {
    return <GlassCard style={{ padding: '14px', minHeight: '80px' }}><Skeleton.Card /></GlassCard>;
  }
  const maxScore = Math.max(...words.map(w => w.score), 1);
  return (
    <GlassCard style={{ padding: '14px' }} aria-label="Santiment trending crypto topics">
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '9px',
        color: 'var(--zm-text-faint)',
        letterSpacing: '0.1em',
        marginBottom: '10px',
      }}>
        TRENDING TOPICS · SANTIMENT
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
        {words.length === 0 ? (
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)' }}>
            No trending data available — rate limited or no free quota remaining.
          </span>
        ) : words.map(w => {
          const intensity = w.score / maxScore;
          const alpha = 0.3 + intensity * 0.7;
          return (
            <span key={w.word} style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(34,211,238,' + (alpha * 0.12).toFixed(2) + ')',
              border: '1px solid rgba(34,211,238,' + (alpha * 0.3).toFixed(2) + ')',
              color: 'rgba(34,211,238,' + alpha.toFixed(2) + ')',
              letterSpacing: '0.04em',
              willChange: 'transform',
            }}>
              {w.word}
            </span>
          );
        })}
      </div>
    </GlassCard>
  );
});
TrendingTags.displayName = 'TrendingTags';

interface SocialVolumeChartProps {
  data: { datetime: string; value: number }[];
  isLoading: boolean;
}

const SocialVolumeChart = memo(({ data, isLoading }: SocialVolumeChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isLoading || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.offsetWidth * devicePixelRatio;
    const h = canvas.offsetHeight * devicePixelRatio;
    canvas.width  = w;
    canvas.height = h;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;
    const pad = { t: 8, r: 8, b: 20, l: 32 };
    const chartW = cw - pad.l - pad.r;
    const chartH = ch - pad.t - pad.b;

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const xStep  = chartW / Math.max(data.length - 1, 1);

    ctx.clearRect(0, 0, cw, ch);

    // Fill
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad.l + i * xStep;
      const y = pad.t + chartH * (1 - d.value / maxVal);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.l + (data.length - 1) * xStep, pad.t + chartH);
    ctx.lineTo(pad.l, pad.t + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH);
    grad.addColorStop(0, 'rgba(34,211,238,0.22)');
    grad.addColorStop(1, 'rgba(34,211,238,0.01)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad.l + i * xStep;
      const y = pad.t + chartH * (1 - d.value / maxVal);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = 'rgba(34,211,238,0.8)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }, [data, isLoading]);

  return (
    <GlassCard style={{ padding: '14px' }}>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '9px',
        color: 'var(--zm-text-faint)',
        letterSpacing: '0.1em',
        marginBottom: '8px',
      }}>
        SOCIAL VOLUME · 24H
      </div>
      {isLoading ? (
        <Skeleton.Card />
      ) : data.length === 0 ? (
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--zm-text-faint)', padding: '12px 0' }}>
          No social volume data — Santiment may be rate limited.
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '80px', display: 'block' }}
          aria-label="Social volume chart over 24 hours"
          role="img"
        />
      )}
    </GlassCard>
  );
});
SocialVolumeChart.displayName = 'SocialVolumeChart';

// ─── Main Page ────────────────────────────────────────────────────────────────

const Intelligence = memo(() => {
  const mountedRef = useRef(true);
  const { assets } = useCrypto();
  const [activeSymbol, setActiveSymbol] = useState<Symbol>('BTC');

  const messari  = useMessari();
  const santiment = useSantiment(SLUG_MAP[activeSymbol]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleSymbolChange = useCallback((sym: Symbol) => {
    if (!mountedRef.current) return;
    setActiveSymbol(sym);
  }, []);

  const currentAsset = useMemo(() =>
    assets.find(a => a.symbol.toLowerCase() === activeSymbol.toLowerCase()),
    [assets, activeSymbol]
  );

  const aiGridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '14px',
    marginBottom: '20px',
  }), []);

  const fundamentalGridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '14px',
    marginBottom: '20px',
  }), []);

  const socialGridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '14px',
  }), []);

  const symbolBarStyle = useMemo(() => ({
    display: 'flex',
    gap: '6px',
    marginBottom: '20px',
  }), []);

  const headerStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  }), []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">

      {/* Header */}
      <motion.div variants={itemVariants} style={headerStyle}>
        <div>
          <h1 style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--zm-text-primary)',
            letterSpacing: '0.04em',
          }}>
            AI Intelligence
          </h1>
          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            color: 'var(--zm-text-faint)',
            letterSpacing: '0.08em',
            marginTop: '3px',
          }}>
            TensorFlow.js · Messari · Santiment
          </p>
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '10px',
          color: 'var(--zm-violet)',
          background: 'var(--zm-violet-bg)',
          border: '1px solid var(--zm-violet-border)',
          borderRadius: '6px',
          padding: '5px 12px',
        }}>
          PHASE 10 · AI LAYER
        </div>
      </motion.div>

      {/* Symbol Selector */}
      <motion.div variants={itemVariants} style={symbolBarStyle} role="group" aria-label="Select asset for analysis">
        {SYMBOLS.map(sym => (
          <button
            key={sym}
            type="button"
            onClick={() => handleSymbolChange(sym)}
            aria-pressed={activeSymbol === sym}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.08em',
              padding: '6px 16px',
              borderRadius: '6px',
              background: activeSymbol === sym ? 'var(--zm-violet-bg)' : 'var(--zm-surface-1)',
              border: '1px solid ' + (activeSymbol === sym ? 'var(--zm-violet-border)' : 'var(--zm-divider)'),
              color: activeSymbol === sym ? 'var(--zm-violet)' : 'var(--zm-text-secondary)',
              cursor: 'pointer',
              willChange: 'transform',
            }}
            aria-label={'Analyze ' + sym}
          >
            {sym}
          </button>
        ))}
        {currentAsset && (
          <div style={{
            marginLeft: 'auto',
            fontFamily: "'Space Mono', monospace",
            fontSize: '12px',
            color: 'var(--zm-text-secondary)',
            alignSelf: 'center',
          }}>
            {formatPrice(currentAsset.price)}
            <span style={{ color: currentAsset.change24h >= 0 ? 'rgba(52,211,153,1)' : 'rgba(251,113,133,1)', marginLeft: '6px' }}>
              {formatChange(currentAsset.change24h)}
            </span>
          </div>
        )}
      </motion.div>

      {/* AI Signal Tiles */}
      <motion.div variants={itemVariants}>
        <SectionHeader label="⬡ AI Signal Layer · TensorFlow.js" color="var(--zm-violet)" />
        <div style={aiGridStyle}>
          {SYMBOLS.map(sym => (
            <Suspense key={sym} fallback={<GlassCard style={{ height: 340 }}><Skeleton.Card /></GlassCard>}>
              <AISignalTile symbol={sym} />
            </Suspense>
          ))}
        </div>
      </motion.div>

      {/* Messari Fundamentals */}
      <motion.div variants={itemVariants}>
        <SectionHeader label="◈ Fundamental Data · Messari" color="var(--zm-accent)" />
        <div style={fundamentalGridStyle}>
          <MessariCard
            asset="BTC"
            data={messari.metrics['bitcoin']}
            isLoading={messari.isLoading}
          />
          <MessariCard
            asset="ETH"
            data={messari.metrics['ethereum']}
            isLoading={messari.isLoading}
          />
          <MessariCard
            asset="SOL"
            data={messari.metrics['solana']}
            isLoading={messari.isLoading}
          />
        </div>
      </motion.div>

      {/* Santiment Social */}
      <motion.div variants={itemVariants}>
        <SectionHeader label="◎ Social Intelligence · Santiment" color="var(--zm-cyan)" />
        <div style={socialGridStyle}>
          <SocialVolumeChart data={santiment.socialVolume} isLoading={santiment.isLoading} />
          <TrendingTags words={santiment.trendingTopics} isLoading={santiment.isLoading} />
        </div>
      </motion.div>

    </motion.div>
  );
});
Intelligence.displayName = 'Intelligence';

export default Intelligence;
