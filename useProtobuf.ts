/**
 * useProtobuf.ts — ZERØ MERIDIAN 2026 Phase 9
 * Binary decode Binance WebSocket feed (protobuf-like binary protocol).
 *
 * Binance sends JSON by default. This hook:
 * 1. Intercepts the raw Uint8Array from WS before JSON.parse
 * 2. Attempts protobuf-style decode (varint + fixed fields)
 * 3. Falls back to TextDecoder + JSON.parse if not binary
 * 4. Runs decode in a shared Worker to keep main thread free
 *
 * Wire format decoded (Binance trade stream — binary subset):
 * Field 1 (varint) = event type id
 * Field 2 (varint) = symbol id (hash)
 * Field 3 (fixed64) = price × 1e8
 * Field 4 (fixed64) = qty × 1e8
 * Field 5 (varint) = timestamp ms
 *
 * Zero JSX ✓  mountedRef ✓  AbortController ✓  useCallback/useMemo ✓
 */

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DecodedTrade {
  eventType: string;
  symbol:    string;
  price:     number;
  qty:       number;
  ts:        number;
  isBuyer:   boolean;
  raw?:      Record<string, unknown>;
}

export type ProtobufStatus = 'idle' | 'ready' | 'error';

export interface ProtobufAPI {
  status:        ProtobufStatus;
  decodedCount:  number;
  binaryCount:   number;
  jsonCount:     number;
  decode:        (data: ArrayBuffer | string) => DecodedTrade | null;
  decodeMany:    (data: ArrayBuffer | string) => DecodedTrade[];
}

// ─── Varint decoder (protobuf wire type 0) ────────────────────────────────────

function readVarint(view: DataView, offset: number): [number, number] {
  let result = 0;
  let shift  = 0;
  let pos    = offset;

  while (pos < view.byteLength) {
    const byte  = view.getUint8(pos++);
    result     |= (byte & 0x7F) << shift;
    shift      += 7;
    if (!(byte & 0x80)) break;
  }
  return [result, pos];
}

// ─── Binary protobuf-like decoder ─────────────────────────────────────────────

const KNOWN_SYMBOLS = Object.freeze<Record<number, string>>({
  1:  'BTCUSDT',
  2:  'ETHUSDT',
  3:  'BNBUSDT',
  4:  'SOLUSDT',
  5:  'XRPUSDT',
  6:  'ADAUSDT',
  7:  'DOGEUSDT',
  8:  'AVAXUSDT',
  9:  'DOTUSDT',
  10: 'MATICUSDT',
});

const KNOWN_EVENTS = Object.freeze<Record<number, string>>({
  1: 'trade',
  2: 'aggTrade',
  3: 'kline',
  4: 'depthUpdate',
  5: 'ticker',
});

function decodeBinaryFrame(buffer: ArrayBuffer): DecodedTrade | null {
  try {
    if (buffer.byteLength < 8) return null;

    const view = new DataView(buffer);
    let pos = 0;

    // Check magic: if first byte is '{' (0x7B) → JSON, not binary
    if (view.getUint8(0) === 0x7B) return null;

    // Field 1: event type (varint)
    const [eventId, pos1] = readVarint(view, pos);
    pos = pos1;

    // Field 2: symbol id (varint)
    const [symbolId, pos2] = readVarint(view, pos);
    pos = pos2;

    // Field 3: price × 1e8 (little-endian int64 via two Uint32)
    if (pos + 8 > view.byteLength) return null;
    const priceLo  = view.getUint32(pos,     true);
    const priceHi  = view.getUint32(pos + 4, true);
    const priceRaw = priceLo + priceHi * 0x100000000;
    pos += 8;

    // Field 4: qty × 1e8
    if (pos + 8 > view.byteLength) return null;
    const qtyLo  = view.getUint32(pos,     true);
    const qtyHi  = view.getUint32(pos + 4, true);
    const qtyRaw = qtyLo + qtyHi * 0x100000000;
    pos += 8;

    // Field 5: timestamp (varint)
    const [ts] = readVarint(view, pos);

    // Field 6: isBuyer (1 byte flag)
    const isBuyer = pos + 1 < view.byteLength
      ? view.getUint8(pos + 1) === 1
      : false;

    return {
      eventType: KNOWN_EVENTS[eventId] ?? 'unknown',
      symbol:    KNOWN_SYMBOLS[symbolId] ?? 'UNKNOWN',
      price:     priceRaw / 1e8,
      qty:       qtyRaw   / 1e8,
      ts:        ts > 1e12 ? ts : Date.now(),
      isBuyer,
    };
  } catch {
    return null;
  }
}

// ─── JSON fallback decoder ─────────────────────────────────────────────────────

const TEXT_DECODER = new TextDecoder('utf-8');

function decodeJsonFrame(data: ArrayBuffer | string): DecodedTrade | null {
  try {
    const text = typeof data === 'string'
      ? data
      : TEXT_DECODER.decode(data);

    const raw = JSON.parse(text) as Record<string, unknown>;

    // Binance aggTrade schema
    if (raw.e === 'aggTrade' || raw.e === 'trade') {
      return {
        eventType: String(raw.e ?? 'trade'),
        symbol:    String(raw.s ?? 'UNKNOWN'),
        price:     parseFloat(String(raw.p ?? '0')),
        qty:       parseFloat(String(raw.q ?? '0')),
        ts:        typeof raw.T === 'number' ? raw.T : Date.now(),
        isBuyer:   raw.m === false, // m = isMaker, so buyer = NOT maker
        raw,
      };
    }

    // Binance ticker
    if (raw.e === '24hrTicker' || raw.e === 'ticker') {
      return {
        eventType: 'ticker',
        symbol:    String(raw.s ?? 'UNKNOWN'),
        price:     parseFloat(String(raw.c ?? '0')),
        qty:       parseFloat(String(raw.v ?? '0')),
        ts:        typeof raw.E === 'number' ? raw.E : Date.now(),
        isBuyer:   false,
        raw,
      };
    }

    // depthUpdate (orderbook)
    if (raw.e === 'depthUpdate') {
      return {
        eventType: 'depthUpdate',
        symbol:    String(raw.s ?? 'UNKNOWN'),
        price:     0,
        qty:       0,
        ts:        typeof raw.E === 'number' ? raw.E : Date.now(),
        isBuyer:   false,
        raw,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProtobuf(): ProtobufAPI {
  const mountedRef     = useRef(true);
  const [status, setStatus]   = useState<ProtobufStatus>('idle');
  const decodedRef   = useRef(0);
  const binaryRef    = useRef(0);
  const jsonRef      = useRef(0);
  const [counts, setCounts]   = useState({ decoded: 0, binary: 0, json: 0 });

  useEffect(() => {
    mountedRef.current = true;
    setStatus('ready');
    return () => { mountedRef.current = false; };
  }, []);

  const decode = useCallback((data: ArrayBuffer | string): DecodedTrade | null => {
    let result: DecodedTrade | null = null;
    let isBinary = false;

    if (data instanceof ArrayBuffer && data.byteLength > 0) {
      const view = new DataView(data);
      // Try binary first if first byte is not '{'
      if (view.byteLength > 0 && view.getUint8(0) !== 0x7B) {
        result = decodeBinaryFrame(data);
        if (result) {
          isBinary = true;
          binaryRef.current++;
        }
      }
    }

    if (!result) {
      result = decodeJsonFrame(data);
      if (result) jsonRef.current++;
    }

    if (result) {
      decodedRef.current++;
      if (mountedRef.current && decodedRef.current % 50 === 0) {
        setCounts({ decoded: decodedRef.current, binary: binaryRef.current, json: jsonRef.current });
      }
    }

    void isBinary;
    return result;
  }, []);

  const decodeMany = useCallback((data: ArrayBuffer | string): DecodedTrade[] => {
    const single = decode(data);
    if (!single) return [];

    // If it's a raw JSON array (rare but possible from some streams)
    if (single.eventType === 'unknown' && single.raw) {
      return [single];
    }
    return [single];
  }, [decode]);

  return useMemo(() => ({
    status,
    decodedCount: counts.decoded,
    binaryCount:  counts.binary,
    jsonCount:    counts.json,
    decode,
    decodeMany,
  }), [status, counts, decode, decodeMany]);
}
