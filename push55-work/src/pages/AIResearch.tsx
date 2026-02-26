/**
 * AIResearch.tsx — ZERØ MERIDIAN push34
 * AI Narrative Generator: token → viral tweets + hashtags + Midjourney prompt
 * Uses Claude API via Anthropic
 */
import { memo, useState, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const CHAINS = Object.freeze(['Ethereum', 'Solana', 'Base', 'Arbitrum', 'BNB Chain', 'Polygon']);
const VIBES  = Object.freeze(['Bullish Moon', 'FUD Destroyer', 'Degen Ape', 'Whale Alert', 'Alpha Leak']);

const containerVariants = Object.freeze({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
});
const itemVariants = Object.freeze({
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22,1,0.36,1] } },
});

interface GeneratedContent {
  tweets: string[];
  hashtags: string[];
  midjourneyPrompt: string;
  narrative: string;
}

const TweetCard = memo(({ tweet, index }: { tweet: string; index: number }) => {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(tweet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [tweet]);

  return (
    <div style={{
      background: 'var(--zm-surface-1)', border: '1px solid var(--zm-divider)',
      borderRadius: 12, padding: '14px 16px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,238,255,0.10)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: 8, padding: '2px 7px',
            borderRadius: 4, background: 'var(--zm-accent-bg)', border: '1px solid var(--zm-accent-border)',
            color: 'var(--zm-accent)', letterSpacing: '0.1em',
          }}>TWEET {index + 1}</span>
        </div>
        <button onClick={copy} style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9, padding: '3px 10px',
          borderRadius: 5, cursor: 'pointer', flexShrink: 0,
          background: copied ? 'var(--zm-positive-bg)' : 'var(--zm-surface-2)',
          border: '1px solid ' + (copied ? 'var(--zm-positive-border)' : 'var(--zm-divider)'),
          color: copied ? 'var(--zm-positive)' : 'var(--zm-text-faint)',
        }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <p style={{
        fontFamily: "'Space Mono', monospace", fontSize: 12, lineHeight: 1.6,
        color: 'var(--zm-text-primary)', margin: 0,
      }}>{tweet}</p>
    </div>
  );
});
TweetCard.displayName = 'TweetCard';

const AIResearch = memo(() => {
  const [ticker, setTicker]   = useState('');
  const [chain, setChain]     = useState('Ethereum');
  const [vibe, setVibe]       = useState('Bullish Moon');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<GeneratedContent | null>(null);
  const [error, setError]     = useState('');
  const mountedRef            = useRef(true);
  const abortRef              = useRef<AbortController | null>(null);
  const { isMobile, isTablet } = useBreakpoint();

  const generate = useCallback(async () => {
    if (!ticker.trim()) { setError('Masukkan ticker token dulu bro!'); return; }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError('');
    setResult(null);

    const prompt = [

      'You are a crypto narrative expert and viral content creator.',
      'Generate content for token: ' + ticker.toUpperCase() + ' on ' + chain + ' chain.',
      'Vibe/tone: ' + vibe + '.',
      context ? 'Additional context: ' + context : '',
      '',
      'Return ONLY valid JSON with this exact structure:',
      '{',
      '  "tweets": ["tweet1 max 280 chars", "tweet2", "tweet3", "tweet4", "tweet5"],',
      '  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6"],',
      '  "midjourneyPrompt": "detailed midjourney prompt for token art",',
      '  "narrative": "2-3 sentence bull case narrative"',
      '}',
      'Make tweets viral, use emojis, crypto slang. No markdown, only JSON.',
    
    ].join('\n');

    try {
      const res = await fetch('/api/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current!.signal,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      const text = (data.content || []).map((b: {type: string; text?: string}) => b.type === 'text' ? b.text : '').join('');
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: GeneratedContent = JSON.parse(clean);
      if (mountedRef.current) setResult(parsed);
    } catch (e) {
      if (mountedRef.current) setError('🐋 API lagi moody, coba lagi bentar...');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [ticker, chain, vibe, context]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">

      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: 'var(--zm-text-primary)', letterSpacing: '0.04em', margin: 0 }}>
            AI NARRATIVE GENERATOR
          </h1>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--zm-text-faint)', letterSpacing: '0.08em', marginTop: 3 }}>
            Token → Viral Tweets + Hashtags + Midjourney Prompt
          </p>
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--zm-violet)',
          background: 'var(--zm-violet-bg)', border: '1px solid var(--zm-violet-border)',
          borderRadius: 6, padding: '5px 12px',
        }}>
          🤖 POWERED BY CLAUDE AI
        </div>
      </motion.div>

      {/* Input form */}
      <motion.div variants={itemVariants} style={{
        background: 'var(--zm-surface-1)', border: '1px solid var(--zm-divider)',
        borderRadius: 16, padding: isMobile ? '14px 16px' : isTablet ? '16px 20px' : '20px 24px', marginBottom: 20,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
          {/* Ticker */}
          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
              TOKEN TICKER
            </label>
            <input
              type="text" value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              placeholder="PEPE, WIF, MOO..."
              maxLength={12}
              style={{
                width: '100%', fontFamily: "'Space Mono', monospace", fontSize: 13,
                fontWeight: 700, background: 'var(--zm-surface-2)',
                border: '1px solid var(--zm-divider)', borderRadius: 8,
                padding: '10px 14px', color: 'var(--zm-accent)', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--zm-accent-border)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--zm-divider)'; }}
            />
          </div>

          {/* Chain */}
          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
              CHAIN
            </label>
            <select value={chain} onChange={e => setChain(e.target.value)}
              style={{
                width: '100%', fontFamily: "'Space Mono', monospace", fontSize: 11,
                background: 'var(--zm-surface-2)', border: '1px solid var(--zm-divider)',
                borderRadius: 8, padding: '10px 14px', color: 'var(--zm-text-primary)',
                outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
              }}>
              {CHAINS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Vibe */}
          <div>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
              VIBE / TONE
            </label>
            <select value={vibe} onChange={e => setVibe(e.target.value)}
              style={{
                width: '100%', fontFamily: "'Space Mono', monospace", fontSize: 11,
                background: 'var(--zm-surface-2)', border: '1px solid var(--zm-divider)',
                borderRadius: 8, padding: '10px 14px', color: 'var(--zm-text-primary)',
                outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
              }}>
              {VIBES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Context */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
            KONTEKS TAMBAHAN (OPTIONAL)
          </label>
          <textarea value={context} onChange={e => setContext(e.target.value)}
            placeholder="Partnership baru, listing CEX, catalyst, tokenomics unik..."
            maxLength={300} rows={2}
            style={{
              width: '100%', fontFamily: "'Space Mono', monospace", fontSize: 11,
              background: 'var(--zm-surface-2)', border: '1px solid var(--zm-divider)',
              borderRadius: 8, padding: '10px 14px', color: 'var(--zm-text-primary)',
              outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--zm-accent-border)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--zm-divider)'; }}
          />
        </div>

        {/* Generate button */}
        <button onClick={generate} disabled={loading}
          style={{
            fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700,
            letterSpacing: '0.08em', padding: isMobile ? '12px 16px' : isTablet ? '12px 20px' : '12px 28px', borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'var(--zm-surface-2)' : 'var(--zm-accent-bg)',
            border: '1px solid ' + (loading ? 'var(--zm-divider)' : 'var(--zm-accent-border)'),
            color: loading ? 'var(--zm-text-faint)' : 'var(--zm-accent)',
            transition: 'all 0.2s ease',
          }}>
          {loading ? '🤖 AI lagi mikir...' : '⚡ GENERATE NARRATIVE'}
        </button>

        {error && (
          <div style={{
            marginTop: 12, fontFamily: "'Space Mono', monospace", fontSize: 11,
            color: 'var(--zm-negative)', padding: '8px 12px', borderRadius: 8,
            background: 'var(--zm-negative-bg)', border: '1px solid var(--zm-negative-border)',
          }}>{error}</div>
        )}
      </motion.div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Narrative */}
          <div style={{
            background: 'var(--zm-violet-bg)', border: '1px solid var(--zm-violet-border)',
            borderRadius: 12, padding: '16px 20px',
          }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-violet)', letterSpacing: '0.12em', marginBottom: 8 }}>
              📖 BULL CASE NARRATIVE
            </div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, lineHeight: 1.7, color: 'var(--zm-text-primary)', margin: 0 }}>
              {result.narrative}
            </p>
          </div>

          {/* Tweets */}
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', letterSpacing: '0.12em', marginBottom: 10 }}>
              🐦 VIRAL TWEETS (COPY & POST)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.tweets.map((t, i) => <TweetCard key={i} tweet={t} index={i} />)}
            </div>
          </div>

          {/* Hashtags */}
          <div style={{ background: 'var(--zm-surface-1)', border: '1px solid var(--zm-divider)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', letterSpacing: '0.12em', marginBottom: 10 }}>
              # HASHTAGS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {result.hashtags.map((h, i) => (
                <span key={i} onClick={() => navigator.clipboard.writeText(h)}
                  style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 11,
                    padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                    background: 'var(--zm-accent-bg)', border: '1px solid var(--zm-accent-border)',
                    color: 'var(--zm-accent)',
                  }}>
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Midjourney prompt */}
          <div style={{ background: 'var(--zm-surface-1)', border: '1px solid var(--zm-divider)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--zm-text-faint)', letterSpacing: '0.12em', marginBottom: 8 }}>
              🎨 MIDJOURNEY PROMPT
            </div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, lineHeight: 1.6, color: 'var(--zm-cyan)', margin: '0 0 12px' }}>
              {result.midjourneyPrompt}
            </p>
            <button onClick={() => navigator.clipboard.writeText(result.midjourneyPrompt)}
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: 9, padding: '5px 14px',
                borderRadius: 6, cursor: 'pointer',
                background: 'var(--zm-surface-2)', border: '1px solid var(--zm-divider)',
                color: 'var(--zm-text-secondary)',
              }}>
              📋 Copy Prompt
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});
AIResearch.displayName = 'AIResearch';
export default AIResearch;
