export class ApiError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export const json = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
export const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
export const randomHex = length => Array.from(crypto.getRandomValues(new Uint8Array(length)), byte => byte.toString(16).padStart(2, '0')).join('');
export function parse(schema, value) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message || 'Invalid input.');
  return parsed.data;
}
export async function body(request, limit = 16000) {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw new ApiError('Send JSON data.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError('Missing request data.');
  let size = 0;
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new ApiError('Request is too large.', 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new ApiError('Invalid JSON data.'); }
}
export function sameOrigin(request) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) throw new ApiError('Please use this website to submit changes.', 403);
}
export async function throttle(request, db, purpose, limit, duration) {
  const now = Date.now();
  const bucket = Math.floor(now / duration);
  const key = await hash(`${purpose}:${bucket}:${request.headers.get('CF-Connecting-IP') || 'local'}`);
  const row = await db.prepare('INSERT INTO commerce_limits(key, attempts, expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1 RETURNING attempts').bind(key, now + duration).first();
  if (row.attempts > limit) throw new ApiError('Too many attempts. Please try again later.', 429);
  if (row.attempts === 1) await db.prepare('DELETE FROM commerce_limits WHERE expires_at < ?').bind(now).run();
}
