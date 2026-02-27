/**
 * Intelligence.tsx — ZERØ MERIDIAN 2026 push85
 * push85: REAL DATA — News/Sentiment/Narratives/Funding live feeds.
 * - React.memo + displayName ✓
 * - rgba() only ✓  Zero className ✓  Zero template literals in JSX ✓
 * - useCallback + useMemo ✓  mountedRef in hooks ✓
 * - Object.freeze() all static data ✓
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCryptoNews, type NewsItem, type NewsFilter } from '@/hooks/useCryptoNews';
import { useSocialSentiment, type FundingData } from '@/hooks/useSocialSentiment';
import { useCrypto } from '@/contexts/CryptoContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const C = Object.freeze({
  bg:          'rgba(6,8,14,1)',
  card:        'rgba(14,17,28,1)',
  border:      'rgba(32,42,68,1)',
  accent:      'rgba(0,238,255,1)',
  positive:    'rgba(34,255,170,1)',
  posDim:      'rgba(34,255,170,0.12)',
  negative:    'rgba(255,68,136,1)',
  negDim:      'rgba(255,68,136,0.12)',
  textPrimary: 'rgba(240,240,248,1)',
  textSec:     'rgba(138,138,158,1)',
  violet:      'rgba(176,130,255,1)',
});

const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_UI   = "'Space Grotesk', sans-serif";

const TABS = Object.freeze(['News Feed', 'Market Sentiment', 'Narratives', 'Funding & OI'] as const);
type Tab = typeof TABS[number];

const NEWS_FILTERS = Object.freeze(['ALL', 'IMPORTANT', 'BTC', 'ETH', 'ALTCOIN'] as const);

const NARRATIVES = Object.freeze([
  { id: 'defi',   label: 'DeFi',       icon: '⚗️', color: 'rgba(34,255,170,1)',   colorDim: 'rgba(34,255,170,0.1)',   coins: ['UNI','AAVE','CRV','MKR','COMP','SNX','YFI','LDO'],          keywords: ['defi','liquidity','yield','amm','dex','lending','protocol','vault','staking'] },
  { id: 'l2',     label: 'Layer 2',    icon: '⚡', color: 'rgba(0,238,255,1)',    colorDim: 'rgba(0,238,255,0.1)',    coins: ['MATIC','ARB','OP','IMX','LRC','METIS','ZK'],                 keywords: ['layer2','l2','rollup','arbitrum','optimism','polygon','zksync','scaling','base'] },
  { id: 'ai',     label: 'AI × Crypto',icon: '🤖', color: 'rgba(176,130,255,1)', colorDim: 'rgba(176,130,255,0.1)', coins: ['FET','AGIX','OCEAN','RNDR','WLD','TAO','AKT'],               keywords: ['ai','artificial intelligence','machine learning','neural','bittensor','render','worldcoin'] },
  { id: 'rwa',    label: 'RWA',        icon: '🏦', color: 'rgba(255,170,0,1)',   colorDim: 'rgba(255,170,0,0.1)',   coins: ['ONDO','CFG','PENDLE','RIO','MPL','TRU'],                     keywords: ['rwa','real world asset','tokenized','treasury','bond','real estate','ondo'] },
  { id: 'meme',   label: 'Meme',       icon: '🐸', color: 'rgba(255,220,50,1)',  colorDim: 'rgba(255,220,50,0.1)',  coins: ['DOGE','SHIB','PEPE','WIF','BONK','FLOKI','MEW'],             keywords: ['meme','doge','shib','pepe','wif','bonk','memecoin','dog','cat'] },
  { id: 'gamefi', label: 'GameFi',     icon: '🎮', color: 'rgba(255,100,200,1)', colorDim: 'rgba(255,100,200,0.1)', coins: ['AXS','SAND','MANA','ILV','GALA','RON','IMX'],                keywords: ['gamefi','gaming','play-to-earn','metaverse','nft game','axie','sandbox','immutable'] },
]);

function timeAgo(ms: number): string {
  const d = Math.floor((Date.now() - ms) / 1000);
  if (d < 60)    return d + 's ago';
  if (d < 3600)  return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}

function fmtOI(n: number): string {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  if (n === 0)  return '—';
  return '$' + n.toFixed(0);
}

function fgColor(value: number): string {
  if (value >= 75) return 'rgba(34,255,170,1)';
  if (value >= 55) return 'rgba(140,220,100,1)';
  if (value >= 45) return 'rgba(255,220,50,1)';
  if (value >= 25) return 'rgba(255,140,60,1)';
  return 'rgba(255,68,136,1)';
}

function fgLabel(value: number): string {
  if (value >= 75) return 'Extreme Greed';
  if (value >= 55) return 'Greed';
  if (value >= 45) return 'Neutral';
  if (value >= 25) return 'Fear';
  return 'Extreme Fear';
}

// ─── TabBar ───────────────────────────────────────────────────────────────────
const TabBtn = memo(({ label, active, onClick }: { label: Tab; active: boolean; onClick: (t: Tab) => void }) => {
  const style = useMemo(() => Object.freeze({
    padding: '8px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer',
    fontFamily: FONT_UI, fontSize: '12px', fontWeight: 600 as const,
    whiteSpace: 'nowrap' as const, transition: 'all 0.18s',
    background: active ? 'rgba(0,238,255,0.15)' : 'transparent',
    color: active ? C.accent : C.textSec,
    outline: active ? '1px solid rgba(0,238,255,0.3)' : 'none',
  }), [active]);
  const handle = useCallback(() => onClick(label), [label, onClick]);
  return <button style={style} onClick={handle}>{label}</button>;
});
TabBtn.displayName = 'TabBtn';

const TabBar = memo(({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) => (
  <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', overflowX: 'auto' as const, flexShrink: 0 }}>
    {TABS.map(tab => <TabBtn key={tab} label={tab} active={active === tab} onClick={onChange} />)}
  </div>
));
TabBar.displayName = 'TabBar';

// ─── News Feed ────────────────────────────────────────────────────────────────
const NewsFBtn = memo(({ label, active, onClick }: { label: NewsFilter; active: boolean; onClick: (f: NewsFilter) => void }) => {
  const style = useMemo(() => Object.freeze({
    padding: '5px 12px', borderRadius: '20px',
    border: active ? '1px solid rgba(0,238,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
    background: active ? 'rgba(0,238,255,0.1)' : 'transparent',
    color: active ? C.accent : C.textSec,
    fontFamily: FONT_MONO, fontSize: '11px', cursor: 'pointer',
    transition: 'all 0.15s', fontWeight: active ? 700 as const : 400 as const,
  }), [active]);
  const handle = useCallback(() => onClick(label), [label, onClick]);
  return <button style={style} onClick={handle}>{label}</button>;
});
NewsFBtn.displayName = 'NewsFBtn';

const CurrencyTag = memo(({ tag }: { tag: string }) => (
  <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: FONT_MONO, fontSize: '9px', color: C.textSec, fontWeight: 700 }}>{tag}</span>
));
CurrencyTag.displayName = 'CurrencyTag';

const NewsCard = memo(({ item }: { item: NewsItem }) => {
  const borderColor = item.sentiment === 'bullish' ? 'rgba(34,255,170,0.3)' : item.sentiment === 'bearish' ? 'rgba(255,68,136,0.25)' : C.border;
  const glowColor   = item.sentiment === 'bullish' ? 'rgba(34,255,170,0.15)' : item.sentiment === 'bearish' ? 'rgba(255,68,136,0.15)' : 'none';
  const dotColor    = item.sentiment === 'bullish' ? 'rgba(34,255,170,1)' : item.sentiment === 'bearish' ? 'rgba(255,68,136,1)' : 'rgba(255,255,255,0.2)';

  const cardStyle = useMemo(() => Object.freeze({
    background: C.card, border: '1px solid ' + borderColor, borderRadius: '12px',
    padding: '14px 16px', display: 'flex', flexDirection: 'column' as const,
    gap: '10px', cursor: 'pointer', transition: 'transform 0.15s',
    boxShadow: item.sentiment !== 'neutral' ? '0 0 18px ' + glowColor : 'none',
  }), [borderColor, glowColor, item.sentiment]);

  const handleClick = useCallback(() => { window.open(item.url, '_blank', 'noopener,noreferrer'); }, [item.url]);

  return (
    <motion.div style={cardStyle} onClick={handleClick} whileHover={{ scale: 1.01 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: '10px', color: C.accent, letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontWeight: 700 }}>{item.source}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: '10px', color: C.textSec, marginLeft: 'auto' }}>{timeAgo(item.publishedAt)}</span>
      </div>
      <p style={{ fontFamily: FONT_UI, fontSize: '14px', color: C.textPrimary, lineHeight: '1.5', fontWeight: 500, margin: 0 }}>{item.title}</p>
      {item.currencies.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
          {item.currencies.slice(0, 5).map(c => <CurrencyTag key={c} tag={c} />)}
        </div>
      )}
    </motion.div>
  );
});
NewsCard.displayName = 'NewsCard';

const NewsFeed = memo(() => {
  const { filteredNews, loading, error, filter, setFilter } = useCryptoNews();
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
        {NEWS_FILTERS.map(f => <NewsFBtn key={f} label={f} active={filter === f} onClick={setFilter} />)}
      </div>
      {error && <div style={{ fontFamily: FONT_MONO, fontSize: '12px', color: C.negative }}>⚠ {error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
        {loading
          ? Array.from({ length: 9 }, (_, i) => (
              <motion.div key={i} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column' as const, gap: '10px' }} animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.06 }}>
                <div style={{ height: '10px', width: '80px', borderRadius: '4px', background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ height: '13px', width: '100%', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ height: '13px', width: '70%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} />
              </motion.div>
            ))
          : filteredNews.map(item => <NewsCard key={item.id} item={item} />)
        }
      </div>
    </div>
  );
});
NewsFeed.displayName = 'NewsFeed';

// ─── Market Sentiment ─────────────────────────────────────────────────────────
const FearGreedGauge = memo(({ value }: { value: number }) => {
  const color = fgColor(value);
  const angle = (value / 100) * 180 - 180;
  const rad = (angle * Math.PI) / 180;
  const cx = 110, cy = 90, r = 70;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);
  const SEGS = Object.freeze([
    { from: 0,  to: 25,  color: 'rgba(255,68,136,0.5)' },
    { from: 25, to: 45,  color: 'rgba(255,140,60,0.5)' },
    { from: 45, to: 55,  color: 'rgba(255,220,50,0.5)' },
    { from: 55, to: 75,  color: 'rgba(140,220,100,0.5)' },
    { from: 75, to: 100, color: 'rgba(34,255,170,0.5)' },
  ]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '8px' }}>
      <svg width="220" height="100" style={{ overflow: 'visible' }}>
        <path d="M 40 90 A 70 70 0 0 1 180 90" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="16" strokeLinecap="round" />
        {SEGS.map(seg => {
          const a1 = ((seg.from / 100) * 180 - 180) * Math.PI / 180;
          const a2 = ((seg.to   / 100) * 180 - 180) * Math.PI / 180;
          const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
          const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
          const la = (seg.to - seg.from) > 50 ? 1 : 0;
          return <path key={seg.from} d={'M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + la + ' 1 ' + x2 + ' ' + y2} fill="none" stroke={seg.color} strokeWidth="16" strokeLinecap="round" />;
        })}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill={color} />
        <text x="32" y="108" fill="rgba(255,68,136,0.6)" fontSize="9" fontFamily={FONT_MONO}>FEAR</text>
        <text x="170" y="108" fill="rgba(34,255,170,0.6)" fontSize="9" fontFamily={FONT_MONO}>GREED</text>
      </svg>
      <div style={{ fontFamily: FONT_MONO, fontSize: '42px', fontWeight: 700, color, lineHeight: '1' }}>{value}</div>
      <div style={{ fontFamily: FONT_UI, fontSize: '14px', color, fontWeight: 600 }}>{fgLabel(value)}</div>
    </div>
  );
});
FearGreedGauge.displayName = 'FearGreedGauge';

const FGHistoryBar = memo(({ history }: { history: { value: number; timestamp: number }[] }) => {
  const days = [...history].reverse();
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '60px', padding: '0 4px' }}>
      {days.map((d, i) => {
        const h = Math.max(6, (d.value / 100) * 54);
        const col = fgColor(d.value);
        const isLatest = i === days.length - 1;
        return (
          <div key={d.timestamp} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: '9px', color: isLatest ? col : C.textSec }}>{d.value}</div>
            <motion.div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: isLatest ? col : col.replace('1)', '0.4)') }} initial={{ height: 0 }} animate={{ height: h }} transition={{ duration: 0.6, delay: i * 0.05 }} />
            <div style={{ fontFamily: FONT_MONO, fontSize: '8px', color: C.textSec }}>{new Date(d.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}</div>
          </div>
        );
      })}
    </div>
  );
});
FGHistoryBar.displayName = 'FGHistoryBar';

const MarketSentiment = memo(() => {
  const { fearGreed, current, loadingFG, errorFG } = useSocialSentiment();
  const { global: globalData } = useCrypto();
  const btcDom = globalData.btcDominance ?? 0;
  const ethDom = globalData.ethDominance ?? 0;
  const altDom = Math.max(0, 100 - btcDom - ethDom);
  const cardSt = useMemo(() => Object.freeze({ background: C.card, border: '1px solid ' + C.border, borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column' as const, gap: '16px' }), []);
  const secLbl = useMemo(() => Object.freeze({ fontFamily: FONT_MONO, fontSize: '10px', color: C.textSec, letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }), []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={cardSt}>
          <div style={secLbl}>Fear {'&'} Greed Index</div>
          {loadingFG
            ? <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSec, fontFamily: FONT_MONO, fontSize: '12px' }}>Loading...</div>
            : errorFG
            ? <div style={{ fontFamily: FONT_MONO, fontSize: '12px', color: C.negative }}>{errorFG}</div>
            : current ? <FearGreedGauge value={current.value} /> : null
          }
        </div>
        <div style={cardSt}>
          <div style={secLbl}>7-Day History</div>
          {fearGreed.length > 0 ? <FGHistoryBar history={fearGreed} /> : <div style={{ height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }} />}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', marginTop: '8px' }}>
            {Object.freeze([
              { label: 'Extreme Fear', range: '0–24',   color: 'rgba(255,68,136,1)' },
              { label: 'Fear',         range: '25–44',  color: 'rgba(255,140,60,1)' },
              { label: 'Neutral',      range: '45–54',  color: 'rgba(255,220,50,1)' },
              { label: 'Greed',        range: '55–74',  color: 'rgba(140,220,100,1)' },
              { label: 'Extreme Greed',range: '75–100', color: 'rgba(34,255,170,1)' },
            ]).map(leg => (
              <div key={leg.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: leg.color, flexShrink: 0 }} />
                <span style={{ fontFamily: FONT_UI, fontSize: '12px', color: C.textPrimary, flex: 1 }}>{leg.label}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: '11px', color: C.textSec }}>{leg.range}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={cardSt}>
          <div style={secLbl}>Market Dominance</div>
          {Object.freeze([
            { label: 'BTC Dominance', value: btcDom, color: 'rgba(247,147,26,1)' },
            { label: 'ETH Dominance', value: ethDom, color: 'rgba(98,126,234,1)' },
            { label: 'Altcoin Market', value: altDom, color: C.violet },
          ]).map(item => (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONT_UI, fontSize: '13px', color: C.textPrimary }}>{item.label}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: '13px', color: item.color, fontWeight: 700 }}>{item.value.toFixed(1)}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', borderRadius: '3px', background: item.color }} initial={{ width: 0 }} animate={{ width: item.value + '%' }} transition={{ duration: 0.8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
MarketSentiment.displayName = 'MarketSentiment';

// ─── Narratives ───────────────────────────────────────────────────────────────
const NarrativeCard = memo(({ narrative, articleCount, sentimentScore }: { narrative: typeof NARRATIVES[number]; articleCount: number; sentimentScore: number }) => {
  const sentColor = sentimentScore > 0 ? C.positive : sentimentScore < 0 ? C.negative : C.textSec;
  const sentLabel = sentimentScore > 0 ? '▲ Bullish' : sentimentScore < 0 ? '▼ Bearish' : '— Neutral';
  return (
    <motion.div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column' as const, gap: '14px', position: 'relative' as const, overflow: 'hidden' as const }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}>
      <div style={{ position: 'absolute' as const, top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: narrative.color.replace('1)', '0.06)'), filter: 'blur(20px)', pointerEvents: 'none' as const }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '22px', lineHeight: '1' }}>{narrative.icon}</span>
        <span style={{ fontFamily: FONT_UI, fontSize: '15px', fontWeight: 700, color: C.textPrimary }}>{narrative.label}</span>
        <span style={{ marginLeft: 'auto', fontFamily: FONT_MONO, fontSize: '11px', color: articleCount > 0 ? narrative.color : C.textSec, background: articleCount > 0 ? narrative.color.replace('1)', '0.1)') : 'transparent', padding: '3px 8px', borderRadius: '20px', border: '1px solid ' + (articleCount > 0 ? narrative.color.replace('1)', '0.3)') : 'transparent') }}>
          {articleCount} articles
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px' }}>
        {narrative.coins.map(coin => (
          <span key={coin} style={{ fontFamily: FONT_MONO, fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: narrative.color.replace('1)', '0.08)'), border: '1px solid ' + narrative.color.replace('1)', '0.2)'), color: narrative.color }}>{coin}</span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
        <span style={{ fontFamily: FONT_UI, fontSize: '12px', color: sentColor, fontWeight: 600 }}>{sentLabel}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: '10px', color: C.textSec }}>sentiment</span>
          <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: Math.abs(sentimentScore) + '%', background: sentColor, borderRadius: '2px' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
});
NarrativeCard.displayName = 'NarrativeCard';

const Narratives = memo(() => {
  const { news } = useCryptoNews();
  const narrativeStats = useMemo(() => NARRATIVES.map(narr => {
    let count = 0, bullish = 0, bearish = 0;
    for (const item of news) {
      const t = item.title.toLowerCase();
      const match = narr.coins.some(c => item.currencies.includes(c) || t.includes(c.toLowerCase())) || narr.keywords.some(kw => t.includes(kw));
      if (match) { count++; if (item.sentiment === 'bullish') bullish++; if (item.sentiment === 'bearish') bearish++; }
    }
    const total = bullish + bearish;
    return { id: narr.id, articleCount: count, sentimentScore: total > 0 ? Math.round(((bullish - bearish) / total) * 100) : 0 };
  }), [news]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
      <p style={{ fontFamily: FONT_UI, fontSize: '13px', color: C.textSec, lineHeight: '1.6', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', margin: 0 }}>
        Narrative tracking analyzes recent news headlines to identify trending themes. Article count and sentiment are computed from live news feed.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {NARRATIVES.map((narr, i) => <NarrativeCard key={narr.id} narrative={narr} articleCount={narrativeStats[i].articleCount} sentimentScore={narrativeStats[i].sentimentScore} />)}
      </div>
    </div>
  );
});
Narratives.displayName = 'Narratives';

// ─── Funding & OI ─────────────────────────────────────────────────────────────
const FundingRow = memo(({ item, isMobile }: { item: FundingData; isMobile: boolean }) => {
  const rateColor  = item.rate > 0.0001 ? C.positive : item.rate < -0.0001 ? C.negative : C.textSec;
  const signalColor = item.signal === 'LONG' ? C.positive : item.signal === 'SHORT' ? C.negative : C.textSec;
  const signalBg   = item.signal === 'LONG' ? C.posDim : item.signal === 'SHORT' ? C.negDim : 'rgba(255,255,255,0.04)';
  const cols = isMobile ? '60px 1fr 1fr' : '80px 100px 120px 1fr 80px';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: '12px', padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontFamily: FONT_MONO, fontSize: '13px', fontWeight: 700, color: C.textPrimary }}>{item.symbol}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: '13px', fontWeight: 700, color: rateColor, textAlign: 'right' as const }}>{item.ratePct >= 0 ? '+' : ''}{item.ratePct.toFixed(4)}%</span>
      {!isMobile && <span style={{ fontFamily: FONT_MONO, fontSize: '11px', color: rateColor, textAlign: 'right' as const }}>{item.annualized >= 0 ? '+' : ''}{item.annualized.toFixed(1)}% pa</span>}
      {!isMobile && <span style={{ fontFamily: FONT_MONO, fontSize: '12px', color: C.textSec, textAlign: 'right' as const }}>{fmtOI(item.oiUsd)}</span>}
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 10px', borderRadius: '20px', fontFamily: FONT_MONO, fontSize: '10px', fontWeight: 700, color: signalColor, background: signalBg, border: '1px solid ' + signalColor.replace('1)', '0.3)') }}>{item.signal}</span>
    </div>
  );
});
FundingRow.displayName = 'FundingRow';

const FundingOI = memo(({ isMobile }: { isMobile: boolean }) => {
  const { funding, loadingFunding, errorFunding, refreshFunding, lastUpdatedFunding } = useSocialSentiment();
  const cols = isMobile ? '60px 1fr 1fr' : '80px 100px 120px 1fr 80px';
  const hdrSt = useMemo(() => Object.freeze({ fontFamily: FONT_MONO, fontSize: '10px', color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontWeight: 700, textAlign: 'right' as const }), []);
  const lastStr = lastUpdatedFunding ? new Date(lastUpdatedFunding).toLocaleTimeString() : '—';
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
      <div style={{ padding: '12px 16px', background: 'rgba(0,238,255,0.04)', border: '1px solid rgba(0,238,255,0.1)', borderRadius: '10px', fontFamily: FONT_UI, fontSize: '13px', color: C.textSec, lineHeight: '1.6' }}>
        <strong style={{ color: C.accent }}>Funding Rate</strong> — Positive = longs pay shorts (crowded long → bearish signal). Negative = shorts pay longs (crowded short → bullish signal). Data: Binance Futures.
      </div>
      <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: '14px', overflow: 'hidden' as const }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '12px', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ ...hdrSt, textAlign: 'left' as const }}>Symbol</span>
          <span style={hdrSt}>Rate %</span>
          {!isMobile && <span style={hdrSt}>Annualized</span>}
          {!isMobile && <span style={hdrSt}>OI USD</span>}
          <span style={hdrSt}>Signal</span>
        </div>
        {loadingFunding
          ? Array.from({ length: 10 }, (_, i) => (
              <motion.div key={i} style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '12px' }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.06 }}>
                <div style={{ width: '60px', height: '13px', borderRadius: '3px', background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ flex: 1, height: '13px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)' }} />
              </motion.div>
            ))
          : errorFunding
          ? <div style={{ padding: '20px 16px', fontFamily: FONT_MONO, fontSize: '12px', color: C.negative }}>⚠ {errorFunding}</div>
          : funding.map(item => <FundingRow key={item.symbol} item={item} isMobile={isMobile} />)
        }
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: '10px', color: C.textSec }}>Auto-refresh 60s · Last: {lastStr}</span>
          <button onClick={refreshFunding} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(0,238,255,0.2)', background: 'rgba(0,238,255,0.06)', color: C.accent, fontFamily: FONT_MONO, fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}>↻ REFRESH</button>
        </div>
      </div>
    </div>
  );
});
FundingOI.displayName = 'FundingOI';

// ─── Main Page ────────────────────────────────────────────────────────────────
const Intelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('News Feed');
  const { isMobile } = useBreakpoint();

  const pageStyle = useMemo(() => Object.freeze({
    display: 'flex', flexDirection: 'column' as const, gap: '20px',
    padding: isMobile ? '16px' : '24px', minHeight: '100vh', background: C.bg, fontFamily: FONT_UI,
  }), [isMobile]);

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
          <h1 style={{ fontFamily: FONT_MONO, fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: C.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>MARKET INTELLIGENCE</h1>
          <p style={{ fontFamily: FONT_UI, fontSize: '13px', color: C.textSec, margin: 0 }}>News feed · Sentiment analysis · Narrative tracking · Funding rates</p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(34,255,170,0.08)', border: '1px solid rgba(34,255,170,0.25)', fontFamily: FONT_MONO, fontSize: '10px', color: C.positive, fontWeight: 700 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.positive, boxShadow: '0 0 6px rgba(34,255,170,0.8)', flexShrink: 0 }} />
          LIVE
        </span>
      </div>
      <TabBar active={activeTab} onChange={setActiveTab} />
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          {activeTab === 'News Feed'        && <NewsFeed />}
          {activeTab === 'Market Sentiment' && <MarketSentiment />}
          {activeTab === 'Narratives'       && <Narratives />}
          {activeTab === 'Funding & OI'     && <FundingOI isMobile={isMobile} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

Intelligence.displayName = 'Intelligence';
export default React.memo(Intelligence);
