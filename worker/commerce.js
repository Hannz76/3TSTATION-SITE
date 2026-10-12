import { z } from 'zod';
import { attemptSchema, trackingSchema, updateOrderSchema, cashInputSchema, paymentSettingsSchema, nextStatuses, serviceSchema, statusSchema } from '../shared/orders.ts';
import { games, topupPackages } from '../shared/catalog.ts';
import { authenticate, login, logout } from './auth.js';
import { ApiError, body, hash, json, parse, randomHex, sameOrigin, throttle } from './http.js';

const cashColumns = 'id, kind, amount_sen AS amountSen, occurred_on AS occurredOn, note, order_reference AS orderReference, created_at AS createdAt, voided_at AS voidedAt, void_reason AS voidReason';
const pageSize = 20;
function pageNumber(url) {
  const value = url.searchParams.get('page') || '1';
  if (!/^[1-9]\d{0,5}$/.test(value)) throw new ApiError('Invalid page.');
  return Number(value);
}
function validDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '2000-01-01' || value > '2199-12-31') return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function dateRange(url) {
  const from = url.searchParams.get('from') || '2000-01-01';
  const to = url.searchParams.get('to') || '2199-12-31';
  if (!validDay(from) || !validDay(to) || from > to) throw new ApiError('Choose a valid date range.');
  return [from, to];
}
async function settings(db) {
  return await db.prepare('SELECT qr_data_url AS qrDataUrl, instructions FROM payment_settings WHERE id = 1').first();
}
async function publicOrder(db, row) {
  const [history, cash] = await db.batch([
    db.prepare('SELECT status, message, created_at AS createdAt FROM order_events WHERE order_reference = ? ORDER BY version').bind(row.reference),
    db.prepare("SELECT COALESCE(SUM(CASE kind WHEN 'payment' THEN amount_sen ELSE -amount_sen END),0) AS paid FROM cash_entries WHERE order_reference = ? AND voided_at IS NULL").bind(row.reference),
  ]);
  return { reference: row.reference, service: row.service, status: row.status, totalSen: row.total_sen, paidSen: cash.results[0].paid, createdAt: row.created_at, updatedAt: row.updated_at, events: history.results };
}
async function adminOrder(db, row) {
  return { ...await publicOrder(db, row), version: row.version, draft: JSON.parse(row.draft_json), internalNote: row.internal_note, description: row.description };
}
async function findOrder(db, reference) {
  const row = await db.prepare('SELECT * FROM orders WHERE reference = ?').bind(reference).first();
  if (!row) throw new ApiError('Order not found.', 404);
  return row;
}
function describe(draft) {
  if (draft.service === 'yogurt') {
    const count = draft.items.reduce((sum, item) => sum + item.quantity, 0);
    if (draft.fulfillment.method === 'delivery' && count < 5) throw new ApiError('Delivery requires at least five yogurt sticks.');
    return { total: count * 180 + (draft.fulfillment.method === 'delivery' ? 100 : 0), description: `${count} yogurt sticks · ${draft.fulfillment.method === 'delivery' ? 'TVETMARA Besut delivery' : 'pickup'}` };
  }
  if (draft.service === 'topup') {
    const game = games.find(item => item.slug === draft.gameSlug);
    const pack = topupPackages[draft.packageId];
    if (!game || !pack) throw new ApiError('Choose an available game and package.');
    if (game.category === 'Via Login') {
      if (draft.uid || draft.server) throw new ApiError('Do not submit login details. Arrange this service with our team.');
    } else {
      if (!/^\d{4,20}$/.test(draft.uid)) throw new ApiError('Enter a player ID with 4–20 digits.');
      if ((game.slug.startsWith('mobile-legends') || game.slug.startsWith('magic-chess')) && !/^\d{3,10}$/.test(draft.server)) throw new ApiError('Enter a server ID with 3–10 digits.');
    }
    return { total: null, description: `${game.name} · ${pack[0]}` };
  }
  return { total: null, description: `${draft.brand} ${draft.model} · ${draft.issue}` };
}
async function createOrder(request, db) {
  const input = parse(attemptSchema, await body(request));
  const pricing = describe(input.draft);
  const requestHash = await hash(JSON.stringify(input.draft));
  const trackingHash = await hash(input.trackingKey);
  let row = await db.prepare('SELECT * FROM orders WHERE submission_id = ?').bind(input.submissionId).first();
  const existing = Boolean(row);
  if (!row) {
    await throttle(request, db, 'create', 20, 3600000);
    const now = new Date().toISOString();
    const reference = `3T-${randomHex(6).toUpperCase()}`;
    await db.prepare('INSERT INTO orders(reference, submission_id, request_hash, tracking_hash, service, draft_json, description, total_sen, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(submission_id) DO NOTHING').bind(reference, input.submissionId, requestHash, trackingHash, input.draft.service, JSON.stringify(input.draft), pricing.description, pricing.total, now, now).run();
    row = await db.prepare('SELECT * FROM orders WHERE submission_id = ?').bind(input.submissionId).first();
  }
  if (row.request_hash !== requestHash || row.tracking_hash !== trackingHash) throw new ApiError('This submission was already used for another request. Start a new order.', 409);
  return json({ order: await publicOrder(db, row) }, existing ? 200 : 201);
}
async function trackOrder(request, db) {
  await throttle(request, db, 'track', 60, 600000);
  const input = parse(trackingSchema, await body(request, 2000));
  const row = await db.prepare('SELECT * FROM orders WHERE reference = ? AND tracking_hash = ?').bind(input.reference, await hash(input.trackingKey)).first();
  if (!row) throw new ApiError('Order not found. Check the reference and private tracking key.', 404);
  return json({ order: await publicOrder(db, row) });
}
async function listOrders(url, db) {
  const page = pageNumber(url);
  const clauses = [];
  const values = [];
  for (const [field, schema] of [['service', serviceSchema], ['status', statusSchema]]) {
    const value = url.searchParams.get(field);
    if (value) { clauses.push(`${field} = ?`); values.push(parse(schema, value)); }
  }
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length > 100) throw new ApiError('Search is too long.');
  if (q) { clauses.push("(instr(lower(reference), lower(?)) > 0 OR instr(lower(description), lower(?)) > 0 OR instr(lower(json_extract(draft_json,'$.contact.name')), lower(?)) > 0 OR instr(json_extract(draft_json,'$.contact.phone'), ?) > 0)"); values.push(q, q, q, q); }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const [rows, count] = await db.batch([
    db.prepare(`SELECT * FROM orders${where} ORDER BY created_at DESC, reference DESC LIMIT ? OFFSET ?`).bind(...values, pageSize, (page - 1) * pageSize),
    db.prepare(`SELECT count(*) AS total FROM orders${where}`).bind(...values),
  ]);
  return json({ orders: await Promise.all(rows.results.map(row => adminOrder(db, row))), total: count.results[0].total, page });
}
async function updateOrder(request, db, reference) {
  const input = parse(updateOrderSchema, await body(request));
  const current = await findOrder(db, reference);
  if (input.version !== current.version) throw new ApiError('This order changed. Reload it before saving.', 409);
  if (input.status !== current.status && !nextStatuses[current.status].includes(input.status)) throw new ApiError('That status transition is not allowed.');
  const row = await db.prepare('UPDATE orders SET status = ?, total_sen = ?, internal_note = ?, public_message = ?, version = version + 1, updated_at = ? WHERE reference = ? AND version = ? RETURNING *').bind(input.status, input.totalSen, input.internalNote, input.message, new Date().toISOString(), reference, input.version).first();
  if (!row) throw new ApiError('This order changed. Reload it before saving.', 409);
  return json(await adminOrder(db, row));
}
async function createCash(request, db) {
  const input = parse(cashInputSchema, await body(request));
  if (!validDay(input.occurredOn)) throw new ApiError('Choose a valid transaction date.');
  const requestHash = await hash(JSON.stringify(input));
  let row = await db.prepare(`SELECT ${cashColumns}, request_hash FROM cash_entries WHERE submission_id = ?`).bind(input.submissionId).first();
  const existing = Boolean(row);
  if (!row) {
    if ('orderReference' in input) await findOrder(db, input.orderReference);
    await db.prepare('INSERT INTO cash_entries(id, submission_id, request_hash, kind, amount_sen, occurred_on, note, order_reference, created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(submission_id) DO NOTHING').bind(crypto.randomUUID(), input.submissionId, requestHash, input.kind, input.amountSen, input.occurredOn, input.note, 'orderReference' in input ? input.orderReference : null, new Date().toISOString()).run();
    row = await db.prepare(`SELECT ${cashColumns}, request_hash FROM cash_entries WHERE submission_id = ?`).bind(input.submissionId).first();
  }
  if (row.request_hash !== requestHash) throw new ApiError('This cash entry submission was already used. Start another entry.', 409);
  delete row.request_hash;
  return json(row, existing ? 200 : 201);
}
async function listCash(url, db) {
  const page = pageNumber(url);
  const [from, to] = dateRange(url);
  const [entries, count] = await db.batch([
    db.prepare(`SELECT ${cashColumns} FROM cash_entries WHERE occurred_on BETWEEN ? AND ? ORDER BY occurred_on DESC, created_at DESC, id DESC LIMIT ? OFFSET ?`).bind(from, to, pageSize, (page - 1) * pageSize),
    db.prepare('SELECT count(*) AS total FROM cash_entries WHERE occurred_on BETWEEN ? AND ?').bind(from, to),
  ]);
  return json({ entries: entries.results, total: count.results[0].total, page });
}
async function voidCash(request, db, id) {
  const input = parse(z.object({ reason: z.string().trim().min(1).max(500) }).strict(), await body(request, 3000));
  await db.prepare('UPDATE cash_entries SET voided_at = ?, void_reason = ? WHERE id = ? AND voided_at IS NULL').bind(new Date().toISOString(), input.reason, id).run();
  const row = await db.prepare(`SELECT ${cashColumns} FROM cash_entries WHERE id = ?`).bind(id).first();
  if (!row) throw new ApiError('Cash entry not found.', 404);
  return json(row);
}
async function summary(url, db) {
  const [from, to] = dateRange(url);
  const [orders, cash] = await db.batch([
    db.prepare("SELECT count(*) AS totalOrders, COALESCE(SUM(status NOT IN ('completed','cancelled')),0) AS openOrders, COALESCE(SUM(status = 'received'),0) AS receivedOrders, COALESCE(SUM(status = 'completed'),0) AS completedOrders, COALESCE(SUM(service='yogurt'),0) AS yogurt, COALESCE(SUM(service='topup'),0) AS topup, COALESCE(SUM(service='repair'),0) AS repair FROM orders WHERE date(created_at, '+8 hours') BETWEEN ? AND ?").bind(from, to),
    db.prepare("SELECT COALESCE(SUM(CASE WHEN kind IN ('payment','income') THEN amount_sen ELSE 0 END),0) AS incomeSen, COALESCE(SUM(CASE WHEN kind IN ('refund','expense') THEN amount_sen ELSE 0 END),0) AS expenseSen FROM cash_entries WHERE voided_at IS NULL AND occurred_on BETWEEN ? AND ?").bind(from, to),
  ]);
  const { yogurt, topup, repair, ...counts } = orders.results[0];
  const { incomeSen, expenseSen } = cash.results[0];
  return json({ ...counts, incomeSen, expenseSen, netSen: incomeSen - expenseSen, byService: { yogurt, topup, repair } });
}
async function updateSettings(request, db) {
  const input = parse(paymentSettingsSchema.strict(), await body(request, 415000));
  if (input.qrDataUrl !== null) {
    const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.qrDataUrl);
    if (!match) throw new ApiError('Upload a PNG or JPEG image.');
    let bytes;
    try { bytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0)); } catch { throw new ApiError('Invalid image data.'); }
    if (bytes.length > 300 * 1024) throw new ApiError('The QR image must be at most 300 KB.', 413);
    const png = [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n);
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes.at(-2) === 255 && bytes.at(-1) === 217;
    if (!(match[1] === 'png' ? png : jpeg)) throw new ApiError('The image does not match its PNG or JPEG format.');
  }
  await db.prepare('UPDATE payment_settings SET qr_data_url = ?, instructions = ? WHERE id = 1').bind(input.qrDataUrl, input.instructions).run();
  return json(input);
}
export async function commerce(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!env.REVIEWS_DB) throw new ApiError('Orders are temporarily unavailable.', 503);
  const db = env.REVIEWS_DB;
  if (!['GET', 'HEAD'].includes(request.method)) sameOrigin(request);
  if (path === '/api/shop' && request.method === 'GET') return json({ ...await settings(db), unitSen: 180, deliverySen: 100, deliveryMinimum: 5 });
  if (path === '/api/orders' && request.method === 'POST') return createOrder(request, db);
  if (path === '/api/orders/track' && request.method === 'POST') return trackOrder(request, db);
  if (path === '/api/admin/login' && request.method === 'POST') return login(request, env);
  if (!path.startsWith('/api/admin/')) throw new ApiError('Not found.', 404);
  const session = await authenticate(request, env);
  if (path === '/api/admin/session' && request.method === 'GET') return json(session);
  if (path === '/api/admin/logout' && request.method === 'POST') return logout(request, env);
  if (path === '/api/admin/orders' && request.method === 'GET') return listOrders(url, db);
  const order = /^\/api\/admin\/orders\/(3T-[A-F0-9]{12})$/.exec(path);
  if (order && request.method === 'GET') return json(await adminOrder(db, await findOrder(db, order[1])));
  if (order && request.method === 'PATCH') return updateOrder(request, db, order[1]);
  if (path === '/api/admin/ledger' && request.method === 'GET') return listCash(url, db);
  if (path === '/api/admin/ledger' && request.method === 'POST') return createCash(request, db);
  const entry = /^\/api\/admin\/ledger\/([a-f0-9-]{36})\/void$/.exec(path);
  if (entry && request.method === 'POST') return voidCash(request, db, entry[1]);
  if (path === '/api/admin/summary' && request.method === 'GET') return summary(url, db);
  if (path === '/api/admin/payment-settings' && request.method === 'PUT') return updateSettings(request, db);
  throw new ApiError('Not found.', 404);
}
