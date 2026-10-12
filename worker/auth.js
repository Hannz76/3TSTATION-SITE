import { scrypt, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { z } from 'zod';
import { ApiError, body, hash, json, parse, randomHex, throttle } from './http.js';
const loginSchema = z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(256) }).strict();
const sessionHours = 8;
function configured(env) {
  if (!env.ADMIN_USERNAME || !/^scrypt\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(env.ADMIN_PASSWORD_HASH || '')) throw new ApiError('Manager access has not been configured.', 503);
}
function cookieName(request, env) {
  const url = new URL(request.url);
  const local = env.LOCAL_ADMIN_DEV === 'true' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.protocol === 'http:';
  if (!local && url.protocol !== 'https:') throw new ApiError('Manager access requires HTTPS.', 403);
  return { name: local ? '3t-admin-dev' : '__Host-3t-admin', secure: !local };
}
function cookie(request, env, token, maxAge) {
  const { name, secure } = cookieName(request, env);
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
async function tokenHash(request, env) {
  const { name } = cookieName(request, env);
  const token = (request.headers.get('Cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${name}=`))?.slice(name.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return hash(token);
}
export async function authenticate(request, env) {
  configured(env);
  const token = await tokenHash(request, env);
  const fingerprint = await hash(`${env.ADMIN_USERNAME}:${env.ADMIN_PASSWORD_HASH}`);
  if (!token || !await env.REVIEWS_DB.prepare('SELECT token_hash FROM admin_sessions WHERE token_hash = ? AND credential_hash = ? AND expires_at > ?').bind(token, fingerprint, Date.now()).first()) throw new ApiError('Please sign in to continue.', 401);
  return { username: env.ADMIN_USERNAME };
}
export async function login(request, env) {
  configured(env);
  cookieName(request, env);
  await throttle(request, env.REVIEWS_DB, 'login', 10, 900000);
  const input = parse(loginSchema, await body(request, 2000));
  const [, , , , salt, expected] = env.ADMIN_PASSWORD_HASH.split('$');
  const actual = await new Promise((resolve, reject) => scrypt(input.password, salt, 32, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, result) => error ? reject(error) : resolve(result)));
  const correct = timingSafeEqual(actual, Buffer.from(expected, 'hex'));
  if (!correct || input.username !== env.ADMIN_USERNAME) throw new ApiError('Username or password is incorrect.', 401);
  const token = randomHex(32);
  const now = Date.now();
  await env.REVIEWS_DB.batch([
    env.REVIEWS_DB.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(now),
    env.REVIEWS_DB.prepare('INSERT INTO admin_sessions(token_hash, credential_hash, expires_at) VALUES(?,?,?)').bind(await hash(token), await hash(`${env.ADMIN_USERNAME}:${env.ADMIN_PASSWORD_HASH}`), now + sessionHours * 3600000),
  ]);
  return json({ username: env.ADMIN_USERNAME }, 200, { 'Set-Cookie': cookie(request, env, token, sessionHours * 3600) });
}
export async function logout(request, env) {
  const token = await tokenHash(request, env);
  if (token) await env.REVIEWS_DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(token).run();
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(request, env, '', 0) });
}
