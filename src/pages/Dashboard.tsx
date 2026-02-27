/**
 * Dashboard.tsx — ZERØ MERIDIAN 2026 push88
 * Bloomberg-grade dashboard — semua inline rgba → CSS variables
 * Section labels Bloomberg-style, metric cards dengan price flash
 * - Zero className → style={{}} only
 * - rgba() only
 * - React.memo + displayName
 * - useCallback + useMemo + mountedRef
 */

import React, { memo, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCryptoContext } from '@/contexts/CryptoContext';
import MetricCard from '@/components/shared/MetricCard';
import GlassCard  from '@/components/shared/GlassCard';

/* ── Section label ── */
const SectionLabel = memo(({ text }: { text: string }) => (
  <div style={{
    display:'flex',alignItems:'center',gap:8,marginBottom:12,marginTop:28,
    fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'0.15em',
    color:'rgba(60,65,95,1)',textTransform:'uppercase' as const,
  }}>
    <div style={{ width:2,height:12,background:'rgba(79,127,255,0.6)',borderRadius:1,flexShrink:0 }}/>
    <span>{text}</span>
    <div style={{ flex:1,height:1,background:'linear-gradient(to right, rgba(255,255,255,0.05), transparent)' }}/>
  </div>
));
SectionLabel.displayName = 'SectionLabel';

/* ── Donut chart ── */
const DonutChart = memo(({ pct, color, size=52 }: { pct: number; color: string; size?: number }) => {
  const r = 18, c = Math.PI * 2 * r;
  const dash = (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{ transform:'rotate(-90deg)' }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round" opacity="0.85"/>
    </svg>
  );
});
DonutChart.displayName = 'DonutChart';

/* ── Mini bar chart ── */
const MiniBarChart = memo(({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display:'flex',alignItems:'flex-end',gap:2,height:36 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex:1,borderRadius:'2px 2px 0 0',
          background: i === data.length - 1 ? color : 'rgba(255,255,255,0.06)',
          height: Math.max((v / max) * 36, 3),
          transition:'height 0.4s ease',
        }}/>
      ))}
    </div>
  );
});
MiniBarChart.displayName = 'MiniBarChart';

/* ── Trending coin row ── */
const CoinRow = memo(({ coin, rank, onClick }: { coin: any; rank: number; onClick?: () => void }) => {
  const [hov, setHov] = useState(false);
  const isPos = (coin.change24h ?? 0) >= 0;
  const chColor = isPos ? 'rgba(61,214,140,1)' : 'rgba(255,102,102,1)';
  const fmtP = (v: number) => v > 1e9 ? '$'+(v/1e9).toFixed(1)+'B' : v > 1e6 ? '$'+(v/1e6).toFixed(1)+'M' : '$'+v.toLocaleString();
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:'grid',gridTemplateColumns:'20px 28px 1fr auto auto',gap:8,alignItems:'center',
        padding:'7px 14px',cursor:onClick ? 'pointer' : 'default',
        background: hov ? 'rgba(255,255,255,0.025)' : 'transparent',
        transition:'background 0.12s',borderBottom:'1px solid rgba(255,255,255,0.03)',
      }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(55,60,85,1)',textAlign:'right' as const }}>{rank}</span>
      <div style={{ width:26,height:26,borderRadius:'50%',background:'rgba(79,127,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'rgba(79,127,255,0.8)',fontFamily:"'JetBrains Mono',monospace" }}>
        {(coin.symbol ?? '?').slice(0,2)}
      </div>
      <div>
        <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:500,color:'rgba(200,205,230,1)' }}>{coin.name ?? coin.symbol}</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(75,80,105,1)',marginTop:1 }}>{coin.symbol}</div>
      </div>
      <div style={{ textAlign:'right' as const }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'rgba(200,205,230,1)',fontWeight:500 }}>{fmtP(coin.price ?? 0)}</div>
        {coin.marketCap && <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(75,80,105,1)',marginTop:1 }}>{fmtP(coin.marketCap)}</div>}
      </div>
      <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:chColor,minWidth:50,textAlign:'right' as const,fontWeight:500 }}>
        {isPos ? '+' : ''}{(coin.change24h ?? 0).toFixed(2)}%
      </span>
    </div>
  );
});
CoinRow.displayName = 'CoinRow';

/* ── Main Dashboard ── */
const Dashboard: React.FC = () => {
  const mountedRef = useRef(true);
  const rm         = useReducedMotion();
  const navigate   = useNavigate();
  const { state }  = useCryptoContext();

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const nav = useCallback((path: string) => navigate(path), [navigate]);

  const prices  = state.prices  ?? {};
  const markets = state.markets ?? [];
  const fg      = state.fearGreed;
  const global  = state.global;

  /* BTC/ETH */
  const btc = prices['BTC'] ?? prices['BTCUSDT'];
  const eth = prices['ETH'] ?? prices['ETHUSDT'];
  const sol = prices['SOL'] ?? prices['SOLUSDT'];

  /* Top movers */
  const topGainers = useMemo(() =>
    [...markets].filter(c => c.change24h !== undefined).sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0)).slice(0, 5)
  , [markets]);
  const topLosers = useMemo(() =>
    [...markets].filter(c => c.change24h !== undefined).sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0)).slice(0, 5)
  , [markets]);

  /* Global metrics */
  const totalMcap    = global?.totalMarketCap  ?? 0;
  const totalVol     = global?.totalVolume24h  ?? 0;
  const btcDom       = global?.btcDominance    ?? 0;
  const ethDom       = global?.ethDominance    ?? 0;
  const fgValue      = fg?.value ?? 50;
  const fgLabel      = fg?.label ?? 'Neutral';

  const fgColor  = fgValue >= 70 ? 'rgba(61,214,140,1)' : fgValue >= 45 ? 'rgba(255,180,50,1)' : 'rgba(255,102,102,1)';
  const fgClr    = fgValue >= 70 ? 'green' as const : fgValue >= 45 ? 'yellow' as const : 'red' as const;

  const gridStyle = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap:                 12,
  }), []);

  const twoColStyle = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 16,
  }), []);

  const threeColStyle = useMemo(() => ({
    display:             'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap:                 16,
  }), []);

  return (
    <div style={{ color:'rgba(215,220,240,1)' }}>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:22,fontWeight:700,color:'rgba(215,220,240,0.95)',letterSpacing:'-0.01em' }}>
          Dashboard
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:'rgba(60,65,95,1)',marginTop:3,letterSpacing:'0.08em' }}>
          {new Date().toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })} — MARKET OVERVIEW
        </div>
      </div>

      {/* Key prices */}
      <SectionLabel text="MAJOR ASSETS" />
      <div style={gridStyle}>
        {btc && <MetricCard label="BTC" prefix="$" value={btc.price ?? 0} change={btc.change24h} color="yellow" size="md" highlight sparkline={btc.sparkline} onClick={() => nav('/charts')}/>}
        {eth && <MetricCard label="ETH" prefix="$" value={eth.price ?? 0} change={eth.change24h} color="blue"   size="md" onClick={() => nav('/charts')}/>}
        {sol && <MetricCard label="SOL" prefix="$" value={sol.price ?? 0} change={sol.change24h} color="violet" size="md" onClick={() => nav('/charts')}/>}
        {global && <MetricCard label="MARKET CAP" prefix="$" value={totalMcap / 1e12} suffix="T" change={(global as any).marketCapChange24h} color="auto" size="md" onClick={() => nav('/markets')}/>}
      </div>

      {/* Global metrics */}
      <SectionLabel text="GLOBAL METRICS" />
      <div style={gridStyle}>
        <MetricCard label="24H VOLUME"  prefix="$" value={totalVol / 1e9} suffix="B"    color="blue"         />
        <MetricCard label="BTC.DOM"     value={btcDom.toFixed(1)} suffix="%" color="yellow"       />
        <MetricCard label="ETH.DOM"     value={ethDom.toFixed(1)} suffix="%" color="violet"       />
        <MetricCard label="FEAR & GREED" value={fgValue} sub={fgLabel}    color={fgClr}         />
      </div>

      {/* Movers + Sentiment */}
      <SectionLabel text="MARKET ACTIVITY" />
      <div style={twoColStyle}>
        {/* Top Gainers */}
        <GlassCard title="TOP GAINERS" badge="24H" badgeColor="green"
          action={<button type="button" onClick={() => nav('/markets')} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(79,127,255,0.7)',background:'none',border:'none',cursor:'pointer',letterSpacing:'0.08em' }}>VIEW ALL</button>}
          padding={0}>
          <div>
            {topGainers.length > 0
              ? topGainers.map((c, i) => <CoinRow key={c.id ?? c.symbol} coin={c} rank={i+1} onClick={() => nav('/charts')}/>)
              : Array.from({length:5}).map((_,i) => (
                <div key={i} style={{ height:44,background:'rgba(255,255,255,0.02)',margin:'3px 14px',borderRadius:4 }}/>
              ))
            }
          </div>
        </GlassCard>

        {/* Top Losers */}
        <GlassCard title="TOP LOSERS" badge="24H" badgeColor="red"
          action={<button type="button" onClick={() => nav('/markets')} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(79,127,255,0.7)',background:'none',border:'none',cursor:'pointer',letterSpacing:'0.08em' }}>VIEW ALL</button>}
          padding={0}>
          <div>
            {topLosers.length > 0
              ? topLosers.map((c, i) => <CoinRow key={c.id ?? c.symbol} coin={c} rank={i+1} onClick={() => nav('/charts')}/>)
              : Array.from({length:5}).map((_,i) => (
                <div key={i} style={{ height:44,background:'rgba(255,255,255,0.02)',margin:'3px 14px',borderRadius:4 }}/>
              ))
            }
          </div>
        </GlassCard>
      </div>

      {/* Sentiment row */}
      <SectionLabel text="SENTIMENT & DOMINANCE" />
      <div style={threeColStyle}>
        {/* Fear & Greed gauge */}
        <GlassCard title="FEAR & GREED" padding="18px">
          <div style={{ display:'flex',alignItems:'center',gap:16 }}>
            <div style={{ position:'relative' as const,flexShrink:0 }}>
              <DonutChart pct={fgValue} color={fgColor} size={68}/>
              <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center' }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:fgColor,lineHeight:1 }}>{fgValue}</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:600,color:fgColor }}>{fgLabel}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(70,75,100,1)',marginTop:4,letterSpacing:'0.08em' }}>MARKET SENTIMENT</div>
              {fg?.previousValue && (
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(70,75,100,1)',marginTop:2 }}>
                  Yesterday: {fg.previousValue}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* BTC Dom donut */}
        <GlassCard title="DOMINANCE" padding="18px">
          <div style={{ display:'flex',gap:20,alignItems:'center' }}>
            <div style={{ position:'relative' as const,flexShrink:0 }}>
              <DonutChart pct={btcDom} color="rgba(255,180,50,0.85)" size={68}/>
              <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center' }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:'rgba(255,180,50,0.9)' }}>{btcDom.toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <div style={{ display:'flex',flexDirection:'column' as const,gap:6 }}>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <div style={{ width:8,height:8,borderRadius:2,background:'rgba(255,180,50,0.85)',flexShrink:0 }}/>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(160,165,195,1)' }}>BTC {btcDom.toFixed(1)}%</span>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <div style={{ width:8,height:8,borderRadius:2,background:'rgba(79,127,255,0.85)',flexShrink:0 }}/>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(160,165,195,1)' }}>ETH {ethDom.toFixed(1)}%</span>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <div style={{ width:8,height:8,borderRadius:2,background:'rgba(150,120,255,0.7)',flexShrink:0 }}/>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(160,165,195,1)' }}>OTHER {(100-btcDom-ethDom).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Quick nav cards */}
        <GlassCard title="QUICK ACCESS" padding="14px">
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
            {[
              ['AI Intel','/intelligence','rgba(150,120,255,1)'],
              ['On-Chain','/onchain','rgba(61,214,140,1)'],
              ['Portfolio','/portfolio','rgba(255,180,50,1)'],
              ['Heatmap','/heatmap','rgba(79,127,255,1)'],
            ].map(([l, p, c]) => (
              <motion.button key={p} type="button" onClick={() => nav(p)}
                whileHover={rm ? {} : { scale:1.02 }}
                style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:7,padding:'9px 10px',cursor:'pointer',textAlign:'left' as const,display:'flex',flexDirection:'column' as const,gap:3 }}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:c,opacity:0.8 }}/>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(150,155,185,1)',letterSpacing:'0.06em',fontWeight:600 }}>{l}</span>
              </motion.button>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Markets table preview */}
      <SectionLabel text="ALL MARKETS PREVIEW" />
      <GlassCard padding={0} title="TOP 10 BY MARKET CAP"
        action={<button type="button" onClick={() => nav('/markets')} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(79,127,255,0.7)',background:'none',border:'none',cursor:'pointer',letterSpacing:'0.08em' }}>FULL TABLE →</button>}>
        <div style={{ overflowX:'auto' as const }}>
          <table style={{ width:'100%',borderCollapse:'collapse' as const,fontFamily:"'JetBrains Mono',monospace",fontSize:10 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {['#','Name','Price','24h %','7d %','Mkt Cap'].map(h => (
                  <th key={h} style={{ padding:'8px 14px',textAlign: h === '#' || h === 'Name' ? 'left' as const : 'right' as const,color:'rgba(60,65,90,1)',fontWeight:600,letterSpacing:'0.09em',fontSize:9,whiteSpace:'nowrap' as const }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {markets.slice(0,10).map((c, i) => {
                const isPos7 = (c.change7d ?? 0) >= 0;
                const isPos24 = (c.change24h ?? 0) >= 0;
                return (
                  <tr key={c.id ?? i} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)',cursor:'pointer' }}
                    onClick={() => nav('/charts')}>
                    <td style={{ padding:'9px 14px',color:'rgba(55,60,85,1)' }}>{i+1}</td>
                    <td style={{ padding:'9px 14px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <div style={{ width:24,height:24,borderRadius:'50%',background:'rgba(79,127,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'rgba(79,127,255,0.8)',fontWeight:700,flexShrink:0 }}>
                          {(c.symbol ?? '?').slice(0,2)}
                        </div>
                        <div>
                          <div style={{ color:'rgba(190,195,225,1)',fontWeight:500 }}>{c.symbol}</div>
                          <div style={{ color:'rgba(60,65,90,1)',fontSize:8 }}>{c.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'9px 14px',textAlign:'right' as const,color:'rgba(190,195,225,1)',fontWeight:500 }}>
                      ${(c.price ?? 0).toLocaleString('en-US', { maximumFractionDigits:4 })}
                    </td>
                    <td style={{ padding:'9px 14px',textAlign:'right' as const,color: isPos24 ? 'rgba(61,214,140,1)' : 'rgba(255,102,102,1)' }}>
                      {isPos24 ? '+' : ''}{(c.change24h ?? 0).toFixed(2)}%
                    </td>
                    <td style={{ padding:'9px 14px',textAlign:'right' as const,color: isPos7 ? 'rgba(61,214,140,1)' : 'rgba(255,102,102,1)' }}>
                      {isPos7 ? '+' : ''}{(c.change7d ?? 0).toFixed(2)}%
                    </td>
                    <td style={{ padding:'9px 14px',textAlign:'right' as const,color:'rgba(140,145,175,1)' }}>
                      ${((c.marketCap ?? 0)/1e9).toFixed(1)}B
                    </td>
                  </tr>
                );
              })}
              {markets.length === 0 && Array.from({length:5}).map((_,i) => (
                <tr key={i}><td colSpan={6} style={{ padding:'10px 14px' }}>
                  <div style={{ height:16,background:'rgba(255,255,255,0.03)',borderRadius:4 }}/>
                </td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </div>
  );
};

Dashboard.displayName = 'Dashboard';
export default memo(Dashboard);
