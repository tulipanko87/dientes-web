import { createHash } from 'node:crypto';

export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function siteUrl() {
  const url = new URL(process.env.SITE_URL || 'https://dientes.sk');
  if (url.username || url.password || (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && url.hostname === 'localhost'))) throw new Error('Invalid SITE_URL');
  return url.origin;
}
export const privateHeaders = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" };
export const validToken = (token: unknown): token is string => typeof token === 'string' && /^(?:[a-f0-9]{64}|[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})$/.test(token);

// Best effort per-process protection. A shared gateway limiter is still required on serverless.
const buckets = new Map<string, { count: number; until: number }>();
export function rateLimit(request: Request, scope: string, limit: number, windowMs = 600_000, identity?: string) {
  const now = Date.now();
  for (const [key, value] of buckets) if (value.until <= now) buckets.delete(key);
  // Vercel overwrites x-forwarded-for. Do not trust this header on an untrusted proxy.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = `${scope}:${createHash('sha256').update(identity || ip).digest('hex')}`;
  const bucket = buckets.get(key);
  if (!bucket && buckets.size >= 10_000) return false;
  if (bucket && bucket.count >= limit) return false;
  buckets.set(key, { count: (bucket?.count || 0) + 1, until: bucket?.until || now + windowMs });
  return true;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  if (!origin) return true;
  const requestUrl = new URL(request.url);
  if (origin === requestUrl.origin || origin === siteUrl()) return true;
  // Next may use an internal hostname in request.url behind a reverse proxy.
  // The browser still sends the public Host and Origin (including the port).
  try {
    const source = new URL(origin);
    return source.origin === origin && source.host === request.headers.get('host') &&
      (source.protocol === 'https:' || (source.protocol === 'http:' && requestUrl.protocol === 'http:'));
  } catch { return false; }
}
async function readBody(request: Request, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > maxBytes) { await reader.cancel(); throw new Error('Body too large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Invalid content type');
  const body = JSON.parse(await readBody(request, 8192));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
  return body;
}
export function reservationInput(body: Record<string, unknown>) {
  const bounds = {service: 160, name: 100, email: 254, phone: 32, date: 10, time: 5, note: 1000};
  const result: Record<string, string> = {};
  for (const [key, max] of Object.entries(bounds)) {
    const value = body[key] ?? (key === 'note' ? '' : undefined);
    if (typeof value !== 'string' || value.length > max || Buffer.byteLength(value, 'utf8') > 1024 || (key === 'note' ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/ : /[\x00-\x1f\x7f]/).test(value) || (key !== 'note' && !value.trim())) return null;
    result[key] = value.trim();
  }
  if (!/^[^\s@<>,;:"\\]+@[^\s@<>,;:"\\]+\.[^\s@<>,;:"\\]+$/.test(result.email) || !/^\+?[0-9]{9,15}$/.test(result.phone.replace(/\s/g, ''))) return null;
  if (body.website !== undefined && body.website !== '') return null;
  if (body.consent !== true) return null;
  return result;
}
export function actionPage(action: string, token: string, label: string) {
  return `<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:Arial,sans-serif;text-align:center;padding:40px;color:#174A4A"><h1>${escapeHtml(label)}</h1><form method="post" action="/api/${action}"><input type="hidden" name="token" value="${escapeHtml(token)}"><button style="background:#1CC7C9;color:white;border:0;border-radius:24px;padding:14px 24px;font-size:16px" type="submit">${escapeHtml(label)}</button></form></body></html>`;
}

export async function actionToken(request: Request) {
  const queryToken = new URL(request.url).searchParams.get('token');
  if (queryToken) return queryToken;
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return null;
  try { return new URLSearchParams(await readBody(request, 1024)).get('token'); } catch { return null; }
}
