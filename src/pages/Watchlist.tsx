/**
 * Watchlist.tsx — ZERØ MERIDIAN push101
 * FULL UPGRADE — Bloomberg-grade personal watchlist
 * - Live prices via CryptoContext (WS-fed) ✓
 * - Add/remove coins, notes, sort ✓
 * - Pure SVG sparkline, zero recharts ✓
 * ✅ Zero className  ✅ rgba() only  ✅ JetBrains Mono
 * ✅ React.memo + displayName  ✅ useCallback + useMemo  ✅ mountedRef
 */

import {
  memo, useReducer, useCallback, useMemo, useEffect, useRef, useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrypto } from '@/contexts/CryptoContext';
import SparklineChart from '@/components/shared/SparklineChart';
import { formatPrice, formatCompact } from '@/lib/formatters';
import type { CryptoAsset } from '@/lib/formatters';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const FONT   = "'JetBrains Mono', monospace";
const LS_KEY = 'zm_watchlist_v1';
const MAX    = 50;

// ─── Types ────────────────────────────────────────────────────────────────────
interface WatchlistEntry { id: string; addedAt: number; note: string; }
interface WatchlistState {
  entries: WatchlistEntry[]; sortKey: string; sortAsc: boolean;
  noteEditId: string | null; search: string;
}
type WatchlistAction =
  | { type: 'ADD'; id: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_SORT'; key: string }
  | { type: 'SET_NOTE'; id: string; note: string }
  | { type: 'EDIT_NOTE'; id: string | null }
  | { type: 'SET_SEARCH'; q: string }
  | { type: 'LOAD'; entries: WatchlistEntry[] };

// ─── Storage helpers ──────────────────────────────────────────────────────────
function loadLS(): WatchlistEntry[] {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function saveLS(e: WatchlistEntry[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(e)); } catch { /* ignore */ }
}

// ─── Reducer ─────────────────────────────────────────────────────────────────
const INIT: WatchlistState = { entries: [], sortKey: 'added', sortAsc: false, noteEditId: null, search: '' };

function reducer(s: WatchlistState, a: WatchlistAction): WatchlistState {
  switch (a.type) {
    case 'LOAD':    return { ...s, entries: a.entries };
    case 'ADD': {
      if (s.entries.length >= MAX || s.entries.some(e => e.id === a.id)) return s;
      const n = [...s.entries, { id: a.id, addedAt: Date.now(), note: '' }];
      saveLS(n); return { ...s, entries: n };
    }
    case 'REMOVE': {
      const n = s.entries.filter(e => e.id !== a.id); saveLS(n);
      return { ...s, entries: n, noteEditId: s.noteEditId === a.id ? null : s.noteEditId };
    }
    case 'SET_SORT': return { ...s, sortAsc: s.sortKey === a.key ? !s.sortAsc : a.key === 'added', sortKey: a.key };
    case 'SET_NOTE': { const n = s.entries.map(e => e.id === a.id ? { ...e, note: a.note } : e); saveLS(n); return { ...s, entries: n }; }
    case 'EDIT_NOTE': return { ...s, noteEditId: a.id };
    case 'SET_SEARCH': return { ...s, search: a.q };
    default: return s;
  }
}

// ─── Price Cell with flash ────────────────────────────────────────────────────
const PriceCell = memo(({ price, direction }: { price: number; direction?: string }) => {
  const ref  = useRef<HTMLSpanElement>(null);
  const prev = useRef(price);
  const m    = useRef(true);
  useEffect(() => { m.current = true; return () => { m.current = false; }; }, []);
  useEffect(() => {
    if (price === prev.current || !ref.current) { prev.current = price; return; }
    const cls = direction === 'up' ? 'animate-flash-pos' : direction === 'down' ? 'animate-flash-neg' : '';
    if (cls) {
      ref.current.classList.remove('animate-flash-pos', 'animate-flash-neg');
      void ref.current.offsetWidth;
      ref.current.classList.add(cls);
      const t = setTimeout(() => ref.current?.classList.remove(cls), 300);
      prev.current = price;
      return () => clearTimeout(t);
    }
    prev.current = price;
  }, [price, direction]);
  return (
    <span ref={ref} style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600,
      color: 'rgba(230,230,242,1)', borderRadius: 4, padding: '0 3px', willChange: 'background' }}>
      {formatPrice(price)}
    </span>
  );
});
PriceCell.displayName = 'PriceCell';

// ─── Change Badge ─────────────────────────────────────────────────────────────
const Badge = memo(({ val }: { val: number }) => {
  const pos = val >= 0;
  return (
    <span style={{
      fontFamily: FONT, fontSize: 10, fontWeight: 600,
      color:       pos ? 'rgba(34,255,170,1)' : 'rgba(255,68,136,1)',
      background:  pos ? 'rgba(34,255,170,0.08)' : 'rgba(255,68,136,0.08)',
      border:      '1px solid ' + (pos ? 'rgba(34,255,170,0.2)' : 'rgba(255,68,136,0.2)'),
      borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap',
    }}>
      {(pos ? '+' : '') + val.toFixed(2) + '%'}
    </span>
  );
});
Badge.displayName = 'Badge';

// ─── Sort Header ──────────────────────────────────────────────────────────────
const SortHdr = memo(({ label, k, sortKey, sortAsc, onSort, align = 'right', w }:
  { label: string; k: string; sortKey: string; sortAsc: boolean; onSort: (k: string) => void; align?: string; w?: number }) => {
  const active = sortKey === k;
  return (
    <button type="button" onClick={() => onSort(k)} style={{
      fontFamily: FONT, fontSize: 9, letterSpacing: '0.1em',
      color: active ? 'rgba(0,238,255,0.9)' : 'rgba(80,80,100,0.8)',
      textAlign: align as 'right' | 'left',
      cursor: 'pointer', background: 'none', border: 'none', padding: 0,
      display: 'flex', alignItems: 'center', gap: 3,
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      width: w ? w + 'px' : undefined, flexShrink: 0,
      transition: 'color 0.15s', textTransform: 'uppercase',
    }}>
      {label}
      <span style={{ opacity: active ? 1 : 0.3 }}>
        {active ? (sortAsc ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
});
SortHdr.displayName = 'SortHdr';

// ─── Note Cell ────────────────────────────────────────────────────────────────
const NoteCell = memo(({ id, note, editing, onEdit, onSave }:
  { id: string; note: string; editing: boolean; onEdit: (id: string | null) => void; onSave: (id: string, note: string) => void }) => {
  const [draft, setDraft] = useState(note);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing && inputRef.current) { setDraft(note); inputRef.current.focus(); } }, [editing, note]);
  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onSave(id, draft); onEdit(null); }}
        onKeyDown={e => { if (e.key === 'Enter') { onSave(id, draft); onEdit(null); } if (e.key === 'Escape') onEdit(null); }}
        style={{
          fontFamily: FONT, fontSize: 10, color: 'rgba(230,230,242,0.9)',
          background: 'rgba(0,238,255,0.06)', border: '1px solid rgba(0,238,255,0.3)',
          borderRadius: 4, padding: '3px 7px', outline: 'none', width: '100%',
        }}
      />
    );
  }
  return (
    <span
      onClick={() => onEdit(id)}
      title="Click to edit note"
      style={{
        fontFamily: FONT, fontSize: 10,
        color: note ? 'rgba(200,200,220,0.7)' : 'rgba(80,80,100,0.4)',
        cursor: 'pointer', maxWidth: 140, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
      }}>
      {note || '+ note'}
    </span>
  );
});
NoteCell.displayName = 'NoteCell';

// ─── Watchlist Row (Desktop) ──────────────────────────────────────────────────
const WatchRow = memo(({ asset, note, noteEditing, index, onRemove, onEditNote, onSaveNote }:
  {
    asset: CryptoAsset; note: string; noteEditing: boolean; index: number;
    onRemove: () => void; onEditNote: (id: string | null) => void; onSaveNote: (id: string, n: string) => void;
  }) => {
  const bg = index % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent';
  return (
    <div style={{
      height: 52, background: bg,
      borderBottom: '1px solid rgba(255,255,255,0.035)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 0,
      transition: 'background 0.12s', willChange: 'transform',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,238,255,0.025)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = bg; }}
    >
      {/* Rank */}
      <span style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(80,80,100,0.6)',
        width: 28, flexShrink: 0 }}>{asset.rank}</span>
      {/* Asset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 170, flexShrink: 0 }}>
        {asset.image
          ? <img src={asset.image} alt="" style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0 }} />
          : <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: 'rgba(0,238,255,0.1)' }} />
        }
        <div>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: 'rgba(230,230,242,1)' }}>
            {asset.symbol.toUpperCase()}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(80,80,100,0.7)' }}>
            {asset.name}
          </div>
        </div>
      </div>
      {/* Price */}
      <div style={{ marginLeft: 'auto', minWidth: 110, textAlign: 'right' }}>
        <PriceCell price={asset.price} direction={asset.priceDirection} />
      </div>
      {/* 24h */}
      <div style={{ minWidth: 85, display: 'flex', justifyContent: 'flex-end', paddingRight: 12 }}>
        <Badge val={asset.change24h} />
      </div>
      {/* 7d */}
      <div style={{ minWidth: 78, display: 'flex', justifyContent: 'flex-end', paddingRight: 12 }}>
        <Badge val={asset.change7d ?? 0} />
      </div>
      {/* Mcap */}
      <span style={{ fontFamily: FONT, fontSize: 11, minWidth: 96, textAlign: 'right',
        color: 'rgba(138,138,158,0.65)', paddingRight: 12 }}>
        {formatCompact(asset.marketCap)}
      </span>
      {/* Sparkline */}
      <div style={{ width: 80, flexShrink: 0 }}>
        {asset.sparkline && asset.sparkline.length > 0 && (
          <SparklineChart data={asset.sparkline} positive={(asset.change7d ?? 0) >= 0} width={80} height={30} />
        )}
      </div>
      {/* Note */}
      <div style={{ width: 150, paddingLeft: 12 }}>
        <NoteCell id={asset.id} note={note} editing={noteEditing}
          onEdit={onEditNote} onSave={onSaveNote} />
      </div>
      {/* Remove */}
      <button type="button" onClick={onRemove} style={{
        fontFamily: FONT, fontSize: 10, color: 'rgba(255,68,136,0.5)',
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px 6px', borderRadius: 4, marginLeft: 8, flexShrink: 0,
        transition: 'color 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,68,136,1)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,68,136,0.5)'; }}
      >
        ✕
      </button>
    </div>
  );
});
WatchRow.displayName = 'WatchRow';

// ─── Add Asset Modal ──────────────────────────────────────────────────────────
const AddModal = memo(({ assets, watchIds, onAdd, onClose }:
  { assets: CryptoAsset[]; watchIds: Set<string>; onAdd: (id: string) => void; onClose: () => void }) => {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    if (!q.trim()) return assets.slice(0, 20);
    const lq = q.toLowerCase();
    return assets.filter(a =>
      a.symbol.toLowerCase().includes(lq) || a.name.toLowerCase().includes(lq)
    ).slice(0, 20);
  }, [assets, q]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, borderRadius: 16,
          background: 'rgba(10,12,22,1)',
          border: '1px solid rgba(0,238,255,0.2)',
          boxShadow: '0 0 60px rgba(0,238,255,0.12)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700,
            color: 'rgba(0,238,255,0.9)', letterSpacing: '0.1em' }}>
            ADD TO WATCHLIST
          </span>
          <button type="button" onClick={onClose} style={{
            fontFamily: FONT, fontSize: 14, color: 'rgba(138,138,158,0.6)',
            background: 'none', border: 'none', cursor: 'pointer',
          }}>✕</button>
        </div>
        {/* Search */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <input
            autoFocus
            type="text"
            placeholder="Search by name or symbol…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{
              width: '100%', fontFamily: FONT, fontSize: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '9px 14px',
              color: 'rgba(230,230,242,0.9)', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {results.map((a, i) => {
            const inList = watchIds.has(a.id);
            const bg = i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent';
            return (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px', background: bg,
                borderBottom: '1px solid rgba(255,255,255,0.035)',
                cursor: inList ? 'default' : 'pointer',
                opacity: inList ? 0.45 : 1,
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => { if (!inList) e.currentTarget.style.background = 'rgba(0,238,255,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = bg; }}
                onClick={() => { if (!inList) { onAdd(a.id); onClose(); } }}
              >
                {a.image
                  ? <img src={a.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,238,255,0.1)' }} />
                }
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700,
                    color: 'rgba(230,230,242,1)' }}>{a.symbol.toUpperCase()}</span>
                  <span style={{ fontFamily: FONT, fontSize: 10,
                    color: 'rgba(80,80,100,0.7)', marginLeft: 8 }}>{a.name}</span>
                </div>
                <span style={{ fontFamily: FONT, fontSize: 11,
                  color: 'rgba(230,230,242,0.8)' }}>{formatPrice(a.price)}</span>
                {inList && (
                  <span style={{ fontFamily: FONT, fontSize: 9,
                    color: 'rgba(0,238,255,0.6)', letterSpacing: '0.08em' }}>✓ ADDED</span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
});
AddModal.displayName = 'AddModal';

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = memo(({ onAdd }: { onAdd: () => void }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '80px 20px', gap: 16 }}>
    <div style={{ fontSize: 40, opacity: 0.3 }}>☆</div>
    <p style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(138,138,158,0.6)',
      textAlign: 'center', margin: 0 }}>
      Your watchlist is empty
    </p>
    <p style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(80,80,100,0.5)',
      textAlign: 'center', margin: 0 }}>
      Add assets to track prices, changes and take notes
    </p>
    <button type="button" onClick={onAdd} style={{
      fontFamily: FONT, fontSize: 10, letterSpacing: '0.1em',
      padding: '9px 20px', borderRadius: 8, cursor: 'pointer',
      background: 'rgba(0,238,255,0.1)', border: '1px solid rgba(0,238,255,0.3)',
      color: 'rgba(0,238,255,1)', marginTop: 8, transition: 'all 0.18s',
    }}>
      + ADD FIRST ASSET
    </button>
  </div>
));
EmptyState.displayName = 'EmptyState';

// ─── Main Watchlist ───────────────────────────────────────────────────────────
const Watchlist = memo(() => {
  const { assets } = useCrypto();
  const { isMobile } = useBreakpoint();
  const [state, dispatch] = useReducer(reducer, INIT);
  const [showAdd, setShowAdd] = useState(false);
  const m = useRef(true);

  useEffect(() => { m.current = true; return () => { m.current = false; }; }, []);
  useEffect(() => {
    const entries = loadLS();
    if (entries.length > 0) dispatch({ type: 'LOAD', entries });
  }, []);

  const watchIds   = useMemo(() => new Set(state.entries.map(e => e.id)), [state.entries]);
  const noteMap    = useMemo(() => new Map(state.entries.map(e => [e.id, e.note])), [state.entries]);
  const addedAtMap = useMemo(() => new Map(state.entries.map(e => [e.id, e.addedAt])), [state.entries]);

  // Sort + filter watched assets
  const sorted = useMemo(() => {
    let list = assets.filter(a => watchIds.has(a.id));
    if (state.search) {
      const lq = state.search.toLowerCase();
      list = list.filter(a => a.symbol.toLowerCase().includes(lq) || a.name.toLowerCase().includes(lq));
    }
    list = [...list].sort((a, b) => {
      let av: number, bv: number;
      switch (state.sortKey) {
        case 'added':     av = addedAtMap.get(a.id) ?? 0;  bv = addedAtMap.get(b.id) ?? 0; break;
        case 'price':     av = a.price;                    bv = b.price;                    break;
        case 'change24h': av = a.change24h;                bv = b.change24h;                break;
        case 'change7d':  av = a.change7d ?? 0;            bv = b.change7d ?? 0;            break;
        case 'marketCap': av = a.marketCap;                bv = b.marketCap;                break;
        default:          av = 0; bv = 0;
      }
      return state.sortAsc ? av - bv : bv - av;
    });
    return list;
  }, [assets, watchIds, state.search, state.sortKey, state.sortAsc, addedAtMap]);

  const handleSort     = useCallback((k: string) => dispatch({ type: 'SET_SORT', key: k }), []);
  const handleSearch   = useCallback((e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_SEARCH', q: e.target.value }), []);
  const handleAdd      = useCallback((id: string) => dispatch({ type: 'ADD', id }), []);
  const handleRemove   = useCallback((id: string) => dispatch({ type: 'REMOVE', id }), []);
  const handleEditNote = useCallback((id: string | null) => dispatch({ type: 'EDIT_NOTE', id }), []);
  const handleSaveNote = useCallback((id: string, note: string) => dispatch({ type: 'SET_NOTE', id, note }), []);

  const containerStyle = useMemo(() => ({
    background: 'rgba(8,10,18,1)', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
  }), []);

  return (
    <div style={{ padding: isMobile ? '12px' : '16px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700,
            color: 'rgba(230,230,242,1)', margin: 0, letterSpacing: '0.06em',
            textShadow: '0 0 20px rgba(0,238,255,0.25)' }}>
            WATCHLIST
          </h1>
          <p style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(80,80,100,0.8)',
            margin: '2px 0 0', letterSpacing: '0.06em' }}>
            {state.entries.length}/{MAX} assets · Live prices
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="Filter…" value={state.search}
              onChange={handleSearch}
              style={{
                fontFamily: FONT, fontSize: 11,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '7px 12px 7px 30px',
                color: 'rgba(230,230,242,0.9)', outline: 'none',
                width: isMobile ? '130px' : '180px',
              }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%',
              transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(80,80,100,0.6)' }}>⌕</span>
          </div>
          {/* Add button */}
          <button type="button" onClick={() => setShowAdd(true)} style={{
            fontFamily: FONT, fontSize: 10, letterSpacing: '0.1em',
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            background: 'rgba(0,238,255,0.1)', border: '1px solid rgba(0,238,255,0.3)',
            color: 'rgba(0,238,255,1)', transition: 'all 0.15s',
          }}>
            + ADD ASSET
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={containerStyle}>
        {/* Column Headers — Desktop only */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', padding: '9px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.015)',
            position: 'sticky', top: 0, zIndex: 2,
          }}>
            <span style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(80,80,100,0.6)',
              letterSpacing: '0.1em', width: 28, flexShrink: 0 }}>#</span>
            <SortHdr label="Asset"    k="name"      sortKey={state.sortKey} sortAsc={state.sortAsc} onSort={handleSort} align="left"  w={170} />
            <SortHdr label="Price"    k="price"     sortKey={state.sortKey} sortAsc={state.sortAsc} onSort={handleSort} w={110} />
            <SortHdr label="24H"      k="change24h" sortKey={state.sortKey} sortAsc={state.sortAsc} onSort={handleSort} w={85} />
            <SortHdr label="7D"       k="change7d"  sortKey={state.sortKey} sortAsc={state.sortAsc} onSort={handleSort} w={78} />
            <SortHdr label="Mkt Cap"  k="marketCap" sortKey={state.sortKey} sortAsc={state.sortAsc} onSort={handleSort} w={96} />
            <span style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(80,80,100,0.6)',
              letterSpacing: '0.1em', width: 80, textAlign: 'center', flexShrink: 0,
              paddingLeft: 4 }}>7D CHART</span>
            <span style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(80,80,100,0.6)',
              letterSpacing: '0.1em', width: 150, paddingLeft: 12, flexShrink: 0 }}>NOTE</span>
            <span style={{ width: 38, flexShrink: 0 }} />
          </div>
        )}

        {/* Rows */}
        {sorted.length === 0 && state.entries.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : sorted.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center',
            fontFamily: FONT, fontSize: 11, color: 'rgba(80,80,100,0.6)' }}>
            No results for &quot;{state.search}&quot;
          </div>
        ) : (
          sorted.map((asset, i) => (
            isMobile ? (
              // Mobile compact row
              <div key={asset.id} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto',
                alignItems: 'center', padding: '10px 14px', gap: 10,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {asset.image
                    ? <img src={asset.image} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,238,255,0.1)' }} />
                  }
                  <div>
                    <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: 'rgba(230,230,242,1)' }}>
                      {asset.symbol.toUpperCase()}
                    </div>
                    <div style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(80,80,100,0.7)' }}>
                      {asset.name}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <PriceCell price={asset.price} direction={asset.priceDirection} />
                </div>
                <Badge val={asset.change24h} />
              </div>
            ) : (
              <WatchRow
                key={asset.id} asset={asset} index={i}
                note={noteMap.get(asset.id) ?? ''}
                noteEditing={state.noteEditId === asset.id}
                onRemove={() => handleRemove(asset.id)}
                onEditNote={handleEditNote}
                onSaveNote={handleSaveNote}
              />
            )
          ))
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <AddModal
            assets={assets}
            watchIds={watchIds}
            onAdd={handleAdd}
            onClose={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
Watchlist.displayName = 'Watchlist';
export default Watchlist;
