/**
 * NewsTickerTile.tsx — ZERØ MERIDIAN 2026
 * Bloomberg-style scrolling news ticker — CSS animation, no Canvas.
 * Data: CryptoCompare News API (free, no key needed for basic)
 * Fallback: curated mock headlines if API fails
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - Zero template literals in JSX attrs ✓
 * - mountedRef + AbortController ✓
 * - useCallback + useMemo ✓
 */

import { memo, useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../shared/GlassCard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: number; // ms
  categories: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  tags: string[];
}

// ─── Raw API Type ─────────────────────────────────────────────────────────────

interface NewsRaw {
  id: string | number;
  title: string;
  source_info?: { name?: string };
  source?: string;
  url: string;
  published_on: number;
  categories?: string;
  sentiment?: string;
  tags?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_HEADLINES: NewsItem[] = Object.freeze([
  { id: '1', title: 'Bitcoin surges past $70,000 as institutional demand reaches record highs', source: 'CoinDesk', url: '#', publishedAt: Date.now() - 120000, categories: ['BTC'], sentiment: 'positive', tags: ['BTC', 'BULL'] },
  { id: '2', title: 'Ethereum Layer 2 total value locked exceeds $50 billion milestone', source: 'The Block', url: '#', publishedAt: Date.now() - 300000, categories: ['ETH'], sentiment: 'positive', tags: ['ETH', 'L2'] },
  { id: '3', title: 'SEC approves spot Ethereum ETF applications from major asset managers', source: 'Bloomberg', url: '#', publishedAt: Date.now() - 600000, categories: ['ETH', 'REGULATION'], sentiment: 'positive', tags: ['ETH', 'ETF'] },
  { id: '4', title: 'Solana network processes record 100,000 transactions per second in stress test', source: 'Decrypt', url: '#', publishedAt: Date.now() - 900000, categories: ['SOL'], sentiment: 'positive', tags: ['SOL', 'TPS'] },
  { id: '5', title: 'DeFi liquidations spike $800M as Bitcoin volatility increases across markets', source: 'CoinTelegraph', url: '#', publishedAt: Date.now() - 1200000, categories: ['DEFI'], sentiment: 'negative', tags: ['DEFI', 'LIQ'] },
  { id: '6', title: 'Binance reports record trading volume of $45 billion in 24-hour period', source: 'Reuters', url: '#', publishedAt: Date.now() - 1500000, categories: ['EXCHANGE'], sentiment: 'neutral', tags: ['BNB', 'VOLUME'] },
  { id: '7', title: 'MicroStrategy acquires additional 10,000 BTC bringing total holdings to 300,000', source: 'CNBC', url: '#', publishedAt: Date.now() - 1800000, categories: ['BTC', 'INSTITUTIONAL'], sentiment: 'positive', tags: ['BTC', 'MSTR'] },
  { id: '8', title: 'Crypto market cap recovers $2.8 trillion as altcoins lead weekly gains', source: 'Forbes', url: '#', publishedAt: Date.now() - 2100000, categories: ['MARKET'], sentiment: 'positive', tags: ['ALTCOIN', 'MCAP'] },
] as NewsItem[]);

const SENTIMENT_COLOR = Object.freeze({
  positive: 'rgba(34,255,170,0.90)',
  negative: 'rgba(255,68,136,0.90)',
  neutral:  'var(--zm-text-secondary)',
});

const TAG_COLOR = Object.freeze({
  BTC:     'rgba(255,187,0,0.80)',
  ETH:     'rgba(0,238,255,0.80)',
  SOL:     'rgba(180,130,255,0.80)',
  DEFI:    'rgba(34,255,170,0.70)',
  ETF:     'rgba(0,238,255,0.70)',
  L2:      'rgba(0,238,255,0.60)',
  LIQ:     'rgba(251,113,133,0.7)',
  BULL:    'rgba(34,255,170,0.80)',
  BEAR:    'rgba(255,68,136,0.80)',
  default: 'rgba(138,138,158,0.50)',
});

function getTagColor(tag: string): string {
  return (TAG_COLOR as Record<string, string>)[tag] ?? TAG_COLOR.default;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAge(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000)  return Math.floor(diff / 1000) + 's ago';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  return Math.floor(diff / 3600000) + 'h ago';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useNewsData() {
  const [items, setItems] = useState<NewsItem[]>(MOCK_HEADLINES);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const fetchNews = useCallback(async (signal: AbortSignal) => {
    try {
      // CryptoCompare news — free, no API key
      const url = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest';
      const res = await fetch(url, { signal });
      if (!res.ok || !mountedRef.current) return;
      const data = await res.json();
      if (!mountedRef.current || !data.Data) return;

      const mapped: NewsItem[] = data.Data.slice(0, 20).map((n: NewsRaw) => ({
        id: String(n.id),
        title: n.title,
        source: n.source_info?.name ?? n.source ?? 'Unknown',
        url: n.url,
        publishedAt: n.published_on * 1000,
        categories: (n.categories ?? '').split('|').filter(Boolean),
        sentiment: n.sentiment === 'Positive' ? 'positive' :
                   n.sentiment === 'Negative' ? 'negative' : 'neutral',
        tags: (n.tags ?? '').split('|').filter(Boolean).slice(0, 3),
      }));

      setItems(mapped.length > 0 ? mapped : MOCK_HEADLINES);
      setLoading(false);
    } catch {
      // Keep mock data on error
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const ctrl = new AbortController();
    setLoading(true);
    fetchNews(ctrl.signal);
    const t = setInterval(() => fetchNews(ctrl.signal), 120000); // refresh 2min
    return () => {
      mountedRef.current = false;
      ctrl.abort();
      clearInterval(t);
    };
  }, [fetchNews]);

  return { items, loading };
}

// ─── Ticker Item ──────────────────────────────────────────────────────────────

interface TickerItemProps {
  item: NewsItem;
  isActive: boolean;
}

const TickerNewsItem = memo(({ item, isActive }: TickerItemProps) => {
  const sentColor = item.sentiment ? SENTIMENT_COLOR[item.sentiment] : SENTIMENT_COLOR.neutral;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '0 20px',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
    }}
    onClick={() => item.url !== '#' && window.open(item.url, '_blank')}
    >
      {/* Sentiment dot */}
      <span style={{ fontSize: 8, color: sentColor, flexShrink: 0 }}>●</span>

      {/* Tags */}
      {item.tags.slice(0, 2).map(tag => (
        <span key={tag} style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8,
          padding: '1px 5px',
          borderRadius: 3,
          border: '1px solid ' + getTagColor(tag).replace('0.8', '0.3').replace('0.7', '0.3').replace('0.6', '0.3'),
          color: getTagColor(tag),
          flexShrink: 0,
        }}>
          {tag}
        </span>
      ))}

      {/* Title */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: isActive ? 'var(--zm-text-primary)' : 'var(--zm-text-secondary)',
        letterSpacing: '0.01em',
      }}>
        {item.title}
      </span>

      {/* Source + time */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: 'rgba(0,238,255,0.50)',
        flexShrink: 0,
      }}>
        {item.source}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: 'rgba(138,138,158,0.25)',
        flexShrink: 0,
      }}>
        {formatAge(item.publishedAt)}
      </span>

      {/* Divider */}
      <span style={{ color: 'rgba(0,238,255,0.15)', flexShrink: 0, margin: '0 8px' }}>◆</span>
    </div>
  );
});
TickerNewsItem.displayName = 'TickerNewsItem';

// ─── Main Component ───────────────────────────────────────────────────────────

const NewsTickerTile = memo(() => {
  const { items, loading } = useNewsData();
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [expandedItem, setExpandedItem] = useState<NewsItem | null>(null);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Auto-advance active item
  useEffect(() => {
    if (paused || items.length === 0) return;
    const t = setInterval(() => {
      setActiveIdx(i => (i + 1) % items.length);
    }, 4000);
    return () => clearInterval(t);
  }, [paused, items.length]);

  const onMouseEnter = useCallback(() => setPaused(true), []);
  const onMouseLeave = useCallback(() => setPaused(false), []);

  // Duplicate items for seamless infinite scroll
  const doubledItems = useMemo(() => [...items, ...items], [items]);

  return (
    <GlassCard
      style={{ height: 'auto', padding: 0, overflow: 'hidden' }}
      accentColor="rgba(0,238,255,0.60)"
    >
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px',
        borderBottom: '1px solid rgba(0,238,255,0.08)',
        background: 'rgba(0,238,255,0.04)',
      }}>
        <span style={{ fontSize: 8, color: 'rgba(34,255,170,0.90)' }}>●</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          color: 'rgba(0,238,255,0.80)', fontWeight: 700, letterSpacing: '0.12em',
        }}>
          CRYPTO INTELLIGENCE FEED
        </span>
        <span style={{ flex: 1 }} />
        {loading && (
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(0,238,255,0.40)' }}
          >
            UPDATING...
          </motion.span>
        )}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
          color: 'rgba(138,138,158,0.30)',
        }}>
          {items.length} STORIES
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
          color: paused ? 'rgba(251,191,36,0.6)' : 'rgba(138,138,158,0.25)',
        }}>
          {paused ? '⏸ PAUSED' : '▶ LIVE'}
        </span>
      </div>

      {/* Scrolling ticker */}
      <div
        style={{ overflow: 'hidden', position: 'relative' }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Fade edges */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 60,
          background: 'linear-gradient(90deg, rgba(5,5,14,0.8), transparent)',
          zIndex: 2, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 60,
          background: 'linear-gradient(270deg, rgba(5,5,14,0.8), transparent)',
          zIndex: 2, pointerEvents: 'none',
        }} />

        <div
          ref={tickerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 36,
            animation: paused ? 'none' : 'zm-ticker-scroll 60s linear infinite',
            willChange: 'transform',
          }}
        >
          <style>{`
            @keyframes zm-ticker-scroll {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          {doubledItems.map((item, i) => (
            <TickerNewsItem
              key={item.id + '_' + i}
              item={item}
              isActive={i % items.length === activeIdx}
            />
          ))}
        </div>
      </div>

      {/* Active story detail */}
      <AnimatePresence>
        {items[activeIdx] && (
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              padding: '6px 12px 8px',
              borderTop: '1px solid rgba(0,238,255,0.06)',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}
          >
            {/* Sentiment indicator */}
            <div style={{
              width: 2, height: '100%', minHeight: 20,
              background: items[activeIdx].sentiment
                ? SENTIMENT_COLOR[items[activeIdx].sentiment!]
                : SENTIMENT_COLOR.neutral,
              borderRadius: 1, flexShrink: 0, marginTop: 2,
            }} />

            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: 'rgba(240,240,248,0.75)',
                lineHeight: 1.4,
              }}>
                {items[activeIdx].title}
              </div>
              <div style={{
                display: 'flex', gap: 8, marginTop: 4,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                color: 'rgba(138,138,158,0.35)',
              }}>
                <span style={{ color: 'rgba(0,238,255,0.50)' }}>{items[activeIdx].source}</span>
                <span>{formatAge(items[activeIdx].publishedAt)}</span>
                {items[activeIdx].tags.map(tag => (
                  <span key={tag} style={{ color: getTagColor(tag) }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* Story counter */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: 'rgba(138,138,158,0.25)',
              flexShrink: 0,
            }}>
              {activeIdx + 1}/{items.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
});

NewsTickerTile.displayName = 'NewsTickerTile';
export default NewsTickerTile;
