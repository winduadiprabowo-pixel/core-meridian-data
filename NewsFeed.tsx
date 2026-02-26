/**
 * NewsFeed.tsx — ZERØ MERIDIAN push62
 * Live crypto news feed — CryptoCompare API
 * Card grid 3 kolom + thumbnail gambar + sentiment badge
 * Clean — zero attribution/watermark
 * - React.memo + displayName ✓
 * - var(--zm-*) ✓
 * - mountedRef + AbortController ✓
 * - Smart cache 5 menit (hemat request) ✓
 * - Fallback mock jika API gagal ✓
 */

import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { useBreakpoint } from '@/hooks/useBreakpoint';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsArticle {
  id:          string;
  title:       string;
  body:        string;
  imageUrl:    string;
  url:         string;
  source:      string;
  publishedAt: number;
  tags:        string[];
  sentiment:   'positive' | 'negative' | 'neutral';
  categories:  string[];
}

interface RawArticle {
  id:           string | number;
  title:        string;
  body?:        string;
  imageurl?:    string;
  url:          string;
  source_info?: { name?: string };
  source?:      string;
  published_on: number;
  tags?:        string;
  categories?:  string;
  sentiment?:   string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_KEY = 'zm_news_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

const TAG_COLORS: Record<string, string> = Object.freeze({
  BTC:        'var(--zm-warning)',
  ETH:        'var(--zm-cyan)',
  SOL:        'var(--zm-violet)',
  BNB:        'var(--zm-orange)',
  XRP:        'rgba(100,200,255,1)',
  DEFI:       'var(--zm-positive)',
  NFT:        'var(--zm-violet)',
  REGULATION: 'rgba(255,140,0,1)',
  MACRO:      'var(--zm-text-secondary)',
  ETF:        'var(--zm-cyan)',
  L2:         'var(--zm-accent)',
  WEB3:       'var(--zm-positive)',
  default:    'var(--zm-text-secondary)',
});

function tagColor(tag: string): string {
  return TAG_COLORS[tag.toUpperCase()] ?? TAG_COLORS.default;
}

const MOCK_NEWS: NewsArticle[] = Object.freeze([
  {
    id: 'm1', title: 'Bitcoin ETF inflows reach record $2.4B as institutional demand surges globally',
    body: 'Institutional investors continue to pour capital into spot Bitcoin ETFs following regulatory clarity.',
    imageUrl: '', url: '#', source: 'Intelligence Feed', publishedAt: Date.now() - 120000,
    tags: ['BTC', 'ETF'], sentiment: 'positive', categories: ['BTC'],
  },
  {
    id: 'm2', title: 'Ethereum Layer-2 total value locked crosses $50B — Arbitrum leads market share',
    body: 'The combined TVL across Ethereum scaling solutions hit a new all-time high this week.',
    imageUrl: '', url: '#', source: 'Intelligence Feed', publishedAt: Date.now() - 300000,
    tags: ['ETH', 'L2', 'DEFI'], sentiment: 'positive', categories: ['ETH'],
  },
  {
    id: 'm3', title: 'Federal Reserve signals potential rate cut Q2 2026 — crypto markets respond with rally',
    body: 'Risk assets across the board moved higher following dovish signals from Fed officials.',
    imageUrl: '', url: '#', source: 'Intelligence Feed', publishedAt: Date.now() - 600000,
    tags: ['MACRO'], sentiment: 'positive', categories: ['MACRO'],
  },
  {
    id: 'm4', title: 'Solana network processes record 100k TPS in stress test — validator upgrades complete',
    body: 'The Solana mainnet demonstrated unprecedented throughput following the Firedancer client rollout.',
    imageUrl: '', url: '#', source: 'Intelligence Feed', publishedAt: Date.now() - 900000,
    tags: ['SOL'], sentiment: 'positive', categories: ['SOL'],
  },
  {
    id: 'm5', title: 'DeFi protocol exploit drains $18M via flash loan attack on Polygon bridge contract',
    body: 'Security researchers identified the vulnerability hours before the exploit was executed.',
    imageUrl: '', url: '#', source: 'Intelligence Feed', publishedAt: Date.now() - 1800000,
    tags: ['DEFI', 'REGULATION'], sentiment: 'negative', categories: ['DEFI'],
  },
  {
    id: 'm6', title: 'SEC approves spot Solana ETF applications from three major asset managers',
    body: 'The approval marks a milestone for altcoin ETF market development in the United States.',
    imageUrl: '', url: '#', source: 'Intelligence Feed', publishedAt: Date.now() - 3600000,
    tags: ['SOL', 'ETF', 'REGULATION'], sentiment: 'positive', categories: ['SOL'],
  },
] as NewsArticle[]);

// ─── Cache ────────────────────────────────────────────────────────────────────

function getCache(): NewsArticle[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: NewsArticle[]; ts: number };
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCache(data: NewsArticle[]): void {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* ignore */ }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useNewsData() {
  const cached = useMemo(() => getCache(), []);
  const [articles, setArticles] = useState<NewsArticle[]>(cached ?? MOCK_NEWS);
  const [loading,  setLoading]  = useState(!cached);
  const [lastFetch,setLastFetch]= useState(0);
  const mountedRef = useRef(true);

  const fetchNews = useCallback(async (signal: AbortSignal) => {
    const cached2 = getCache();
    if (cached2) { setArticles(cached2); setLoading(false); return; }

    try {
      const res  = await fetch(
        'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest&extraParams=ZeroMeridian',
        { signal }
      );
      if (!res.ok || !mountedRef.current) return;
      const json = await res.json() as { Data?: RawArticle[] };
      if (!json.Data || !mountedRef.current) return;

      const mapped: NewsArticle[] = json.Data.slice(0, 18).map((n) => ({
        id:          String(n.id),
        title:       n.title,
        body:        n.body?.slice(0, 120) ?? '',
        imageUrl:    n.imageurl ?? '',
        url:         n.url,
        source:      n.source_info?.name ?? n.source ?? 'Market Intelligence',
        publishedAt: n.published_on * 1000,
        tags:        (n.tags ?? '').split('|').filter(Boolean).slice(0, 3),
        categories:  (n.categories ?? '').split('|').filter(Boolean),
        sentiment:   n.sentiment === 'Positive' ? 'positive'
                   : n.sentiment === 'Negative' ? 'negative' : 'neutral',
      }));

      const final = mapped.length > 0 ? mapped : MOCK_NEWS;
      setCache(final);
      if (mountedRef.current) { setArticles(final); setLastFetch(Date.now()); }
    } catch {
      if (mountedRef.current) setArticles(MOCK_NEWS);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const ctrl = new AbortController();
    fetchNews(ctrl.signal);
    // Refresh tiap 5 menit
    const t = setInterval(() => {
      sessionStorage.removeItem(CACHE_KEY);
      fetchNews(ctrl.signal);
    }, CACHE_TTL);
    return () => { mountedRef.current = false; ctrl.abort(); clearInterval(t); };
  }, [fetchNews]);

  return { articles, loading, lastFetch };
}

// ─── Time helper ──────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60000)   return Math.floor(d / 1000) + 's ago';
  if (d < 3600000) return Math.floor(d / 60000) + 'm ago';
  if (d < 86400000)return Math.floor(d / 3600000) + 'h ago';
  return Math.floor(d / 86400000) + 'd ago';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SentimentDot = memo(({ s }: { s: NewsArticle['sentiment'] }) => (
  <span style={{
    display: 'inline-block', width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 2,
    background: s === 'positive' ? 'var(--zm-positive)' : s === 'negative' ? 'var(--zm-negative)' : 'var(--zm-text-secondary)',
    boxShadow:  s === 'positive' ? 'var(--zm-positive-glow)' : s === 'negative' ? 'var(--zm-negative-glow)' : 'none',
  }} />
));
SentimentDot.displayName = 'SentimentDot';

interface CardProps { article: NewsArticle; idx: number; }

const NewsCard = memo(({ article, idx }: CardProps) => {
  const hasBg = Boolean(article.imageUrl);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => article.url !== '#' && window.open(article.url, '_blank')}
      style={{
        background:    'var(--zm-card-bg)',
        border:        '1px solid var(--zm-card-border)',
        borderRadius:  'var(--zm-card-radius)',
        overflow:      'hidden',
        cursor:        'pointer',
        display:       'flex',
        flexDirection: 'column',
        transition:    'border-color 180ms, box-shadow 180ms, transform 180ms',
        willChange:    'transform',
      }}
      whileHover={{ scale: 1.015, borderColor: 'var(--zm-card-border-hover)', boxShadow: 'var(--zm-accent-glow)' } as object}
    >
      {/* Thumbnail */}
      <div style={{
        position: 'relative', height: 160, overflow: 'hidden',
        background: hasBg ? 'var(--zm-card-border)' : (
          article.sentiment === 'positive'
            ? 'linear-gradient(135deg, rgba(34,255,170,0.08) 0%, rgba(0,238,255,0.05) 100%)'
            : article.sentiment === 'negative'
            ? 'linear-gradient(135deg, rgba(255,68,136,0.08) 0%, rgba(255,68,68,0.05) 100%)'
            : 'linear-gradient(135deg, rgba(138,138,158,0.06) 0%, rgba(0,238,255,0.03) 100%)'
        ),
      }}>
        {hasBg ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36, opacity: 0.15 }}>
              {article.categories[0] === 'BTC' ? '₿'
               : article.categories[0] === 'ETH' ? 'Ξ'
               : article.categories[0] === 'SOL' ? '◎'
               : '📡'}
            </span>
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(to top, var(--zm-card-bg), transparent)',
        }} />
        {/* Sentiment strip top-left */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          width: 3, height: 36, borderRadius: 2,
          background: article.sentiment === 'positive' ? 'var(--zm-positive)'
                    : article.sentiment === 'negative' ? 'var(--zm-negative)'
                    : 'var(--zm-text-secondary)',
          boxShadow: article.sentiment === 'positive' ? 'var(--zm-positive-glow)'
                   : article.sentiment === 'negative' ? 'var(--zm-negative-glow)'
                   : 'none',
        }} />
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {/* Tags row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {article.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
              padding: '1px 6px', borderRadius: 4, letterSpacing: '0.06em',
              color: tagColor(tag),
              background: tagColor(tag).replace('1)', '0.10)').replace('var(--zm-', 'var(--zm-').replace(')', '-bg)').replace('-bg-bg)', '-bg)'),
              border: '1px solid ' + tagColor(tag).replace('1)', '0.20)'),
            }}>{tag}</span>
          ))}
          <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--zm-text-faint)' }}>
            {timeAgo(article.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 500,
          color: 'var(--zm-text-primary)', lineHeight: 1.45, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {article.title}
        </p>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 6 }}>
          <SentimentDot s={article.sentiment} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-accent)', letterSpacing: '0.04em' }}>
            {article.source}
          </span>
          <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)' }}>
            {article.sentiment === 'positive' ? '▲ BULLISH' : article.sentiment === 'negative' ? '▼ BEARISH' : '— NEUTRAL'}
          </span>
        </div>
      </div>
    </motion.article>
  );
});
NewsCard.displayName = 'NewsCard';

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const FILTERS = Object.freeze(['ALL', 'BTC', 'ETH', 'SOL', 'DEFI', 'MACRO', 'REGULATION']);

interface FilterBarProps { active: string; onChange: (f: string) => void; }

const FilterBar = memo(({ active, onChange }: FilterBarProps) => (
  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
    {FILTERS.map(f => (
      <button
        key={f}
        type="button"
        onClick={() => onChange(f)}
        style={{
          fontFamily:  "'JetBrains Mono', monospace",
          fontSize:    9, fontWeight: 700, letterSpacing: '0.08em',
          padding:     '4px 12px', borderRadius: 20, flexShrink: 0,
          border:      '1px solid ' + (active === f ? 'var(--zm-accent-border)' : 'var(--zm-card-border)'),
          background:  active === f ? 'var(--zm-accent-bg)' : 'var(--zm-card-bg)',
          color:       active === f ? 'var(--zm-accent)' : 'var(--zm-text-faint)',
          cursor:      'pointer',
          transition:  'all 150ms',
        }}
      >
        {f}
      </button>
    ))}
  </div>
));
FilterBar.displayName = 'FilterBar';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const CardSkeleton = memo(() => (
  <div style={{ background: 'var(--zm-card-bg)', border: '1px solid var(--zm-card-border)', borderRadius: 'var(--zm-card-radius)', overflow: 'hidden' }}>
    <div style={{ height: 160, background: 'var(--zm-surface-1)' }} />
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[40, 32, 36].map(w => (
          <div key={w} style={{ width: w, height: 14, borderRadius: 4, background: 'var(--zm-surface-2)' }} />
        ))}
      </div>
      {[100, 90, 70].map((w, i) => (
        <div key={i} style={{ width: w + '%', height: 12, borderRadius: 4, background: 'var(--zm-surface-2)' }} />
      ))}
    </div>
  </div>
));
CardSkeleton.displayName = 'CardSkeleton';

// ─── Main Page ────────────────────────────────────────────────────────────────

const NewsFeed = memo(() => {
  const { articles, loading } = useNewsData();
  const [filter, setFilter]   = useState('ALL');
  const device                = useDeviceProfile();
  const { isMobile, isTablet }= useBreakpoint();

  const filtered = useMemo(() => {
    if (filter === 'ALL') return articles;
    return articles.filter(a =>
      a.tags.some(t => t.toUpperCase() === filter) ||
      a.categories.some(c => c.toUpperCase().includes(filter))
    );
  }, [articles, filter]);

  const grid = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    gap:                 14,
    marginTop:           16,
  }), [isMobile, isTablet]);

  return (
    <div role="main" aria-label="Crypto News Feed">

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800,
              letterSpacing: '-0.03em', margin: 0,
              background: 'linear-gradient(135deg, var(--zm-accent) 0%, var(--zm-positive) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              INTELLIGENCE FEED
            </h1>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--zm-text-faint)', margin: '3px 0 0', letterSpacing: '0.06em' }}>
              REAL-TIME · CRYPTO MARKET INTELLIGENCE
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20,
            background: 'var(--zm-positive-bg)', border: '1px solid var(--zm-positive-border)',
            boxShadow: 'var(--zm-positive-glow)',
          }}>
            <motion.span
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--zm-positive)', flexShrink: 0, display: 'block' }}
              animate={device.isLowEnd ? {} : { opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--zm-positive)', fontWeight: 700, letterSpacing: '0.08em' }}>
              LIVE · {filtered.length} STORIES
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar active={filter} onChange={setFilter} />
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={grid}>
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--zm-text-faint)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          No stories found for {filter}
        </div>
      ) : (
        <div style={grid}>
          {filtered.map((a, i) => <NewsCard key={a.id} article={a} idx={i} />)}
        </div>
      )}
    </div>
  );
});
NewsFeed.displayName = 'NewsFeed';
export default NewsFeed;
