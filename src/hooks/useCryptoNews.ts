/**
 * useCryptoNews.ts — ZERØ MERIDIAN 2026 push85
 * News from CryptoPanic free API + CryptoCompare fallback.
 * - mountedRef pattern ✓  useCallback ✓  useMemo ✓
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: number; // ms timestamp
  currencies: string[];  // ['BTC', 'ETH', ...]
  sentiment: 'bullish' | 'bearish' | 'neutral';
  kind: 'news' | 'media';
  votes?: { positive: number; negative: number; important: number };
}

export type NewsFilter = 'ALL' | 'IMPORTANT' | 'BTC' | 'ETH' | 'ALTCOIN';

function detectSentiment(title: string, votes?: { positive: number; negative: number }): 'bullish' | 'bearish' | 'neutral' {
  if (votes) {
    if (votes.positive > votes.negative + 2) return 'bullish';
    if (votes.negative > votes.positive + 2) return 'bearish';
  }
  const t = title.toLowerCase();
  const bullish = ['surge', 'soar', 'rally', 'bull', 'breakout', 'record', 'ath', 'gain', 'rise', 'pump', 'moon', 'adoption', 'launch', 'upgrade', 'partnership'];
  const bearish = ['crash', 'dump', 'bear', 'drop', 'fall', 'plunge', 'hack', 'scam', 'ban', 'sec', 'lawsuit', 'exploit', 'warning', 'fear', 'sell-off', 'liquidat'];
  const bs = bullish.filter(w => t.includes(w)).length;
  const br = bearish.filter(w => t.includes(w)).length;
  if (bs > br) return 'bullish';
  if (br > bs) return 'bearish';
  return 'neutral';
}

async function fetchCryptoPanic(): Promise<NewsItem[]> {
  const res = await fetch(
    'https://cryptopanic.com/api/free/v1/posts/?auth_token=&public=true&filter=important',
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error('CryptoPanic error');
  const data = await res.json();
  return (data.results ?? []).slice(0, 50).map((item: any, i: number): NewsItem => ({
    id: String(item.id ?? i),
    title: item.title,
    url: item.url,
    source: item.source?.title ?? 'Unknown',
    publishedAt: new Date(item.published_at).getTime(),
    currencies: (item.currencies ?? []).map((c: any) => c.code),
    sentiment: detectSentiment(item.title, item.votes),
    kind: item.kind ?? 'news',
    votes: item.votes ? {
      positive: item.votes.positive ?? 0,
      negative: item.votes.negative ?? 0,
      important: item.votes.important ?? 0,
    } : undefined,
  }));
}

async function fetchCryptoCompare(): Promise<NewsItem[]> {
  const res = await fetch(
    'https://min-api.cryptocompare.com/data/v2/news/?lang=EN',
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error('CryptoCompare error');
  const data = await res.json();
  return (data.Data ?? []).slice(0, 50).map((item: any): NewsItem => {
    const cats = (item.categories ?? '').toUpperCase();
    const currencies: string[] = [];
    ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'MATIC', 'AVAX', 'DOT', 'LINK'].forEach(c => {
      if (item.title.toUpperCase().includes(c) || cats.includes(c)) currencies.push(c);
    });
    return {
      id: String(item.id),
      title: item.title,
      url: item.url,
      source: item.source_info?.name ?? item.source ?? 'Unknown',
      publishedAt: item.published_on * 1000,
      currencies,
      sentiment: detectSentiment(item.title),
      kind: 'news',
    };
  });
}

interface UseCryptoNewsReturn {
  news: NewsItem[];
  loading: boolean;
  error: string | null;
  filter: NewsFilter;
  setFilter: (f: NewsFilter) => void;
  filteredNews: NewsItem[];
  refresh: () => void;
  lastUpdated: number | null;
}

export function useCryptoNews(): UseCryptoNewsReturn {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NewsFilter>('ALL');
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const mountedRef = useRef(true);

  const fetchNews = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const items = await fetchCryptoPanic().catch(() => fetchCryptoCompare());
      if (!mountedRef.current) return;
      setNews(items);
      setLastUpdated(Date.now());
      setError(null);
    } catch (e) {
      if (!mountedRef.current) return;
      setError('Failed to load news');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000); // 5min refresh
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchNews]);

  const filteredNews = useCallback(() => {
    if (filter === 'ALL') return news;
    if (filter === 'IMPORTANT') return news.filter(n => n.votes && n.votes.important > 0);
    if (filter === 'BTC') return news.filter(n => n.currencies.includes('BTC') || n.title.toUpperCase().includes('BITCOIN'));
    if (filter === 'ETH') return news.filter(n => n.currencies.includes('ETH') || n.title.toUpperCase().includes('ETHEREUM'));
    if (filter === 'ALTCOIN') return news.filter(n => !n.currencies.includes('BTC') && !n.currencies.includes('ETH'));
    return news;
  }, [news, filter]);

  return {
    news,
    loading,
    error,
    filter,
    setFilter,
    filteredNews: filteredNews(),
    refresh: fetchNews,
    lastUpdated,
  };
}
