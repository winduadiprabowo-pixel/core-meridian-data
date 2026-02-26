/**
 * api/narrative.ts — ZERØ MERIDIAN push39
 * Vercel Edge Function: proxy Groq API untuk AIResearch page.
 * FREE tier — model: llama-3.3-70b-versatile
 * Env var: GROQ_API_KEY (set di Vercel dashboard)
 * Runtime: Edge (Vercel)
 */

export const config = { runtime: 'edge' };

const CORS = Object.freeze({
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cross-Origin-Resource-Policy': 'cross-origin',
});

function errRes(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// Convert Anthropic messages format → Groq (OpenAI-compatible)
function toGroqBody(body: Record<string, unknown>): Record<string, unknown> {
  return {
    model:       'llama-3.3-70b-versatile',
    max_tokens:  body['max_tokens'] ?? 1000,
    messages:    body['messages'],
    temperature: 0.8,
  };
}

// Convert Groq response → Anthropic-compatible format
// so AIResearch.tsx does not need any changes
function toAnthropicFormat(groqData: Record<string, unknown>): Record<string, unknown> {
  const choices = groqData['choices'] as Array<Record<string, unknown>> | undefined;
  const text = (choices?.[0]?.['message'] as Record<string, unknown> | undefined)?.['content'] as string ?? '';
  return {
    content: [{ type: 'text', text }],
    model:   'llama-3.3-70b-versatile',
    role:    'assistant',
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...CORS } });
  }
  if (req.method !== 'POST') return errRes('Method not allowed', 405);

  const apiKey = (globalThis as Record<string, unknown>)['GROQ_API_KEY'] as string | undefined
    ?? (typeof process !== 'undefined' ? process.env?.['GROQ_API_KEY'] : undefined);

  if (!apiKey) return errRes('GROQ_API_KEY not configured', 503);

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return errRes('Invalid JSON body', 400);
  }

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25_000);

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      signal:  ctrl.signal,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify(toGroqBody(body)),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return errRes('Groq error: ' + upstream.status + ' ' + errText.slice(0, 200), 502);
    }

    const groqData = await upstream.json() as Record<string, unknown>;
    const adapted  = toAnthropicFormat(groqData);

    return new Response(JSON.stringify(adapted), {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type':  'application/json',
        'Cache-Control': 'no-store',
        'X-ZM-Source':   'edge-narrative-groq',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return errRes(msg.includes('abort') ? 'Timeout' : 'Edge error: ' + msg, 504);
  } finally {
    clearTimeout(timer);
  }
}
