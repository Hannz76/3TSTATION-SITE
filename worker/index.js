const services = new Set(["Game top-up", "Phone repair", "Fresh yogurt", "Store visit"]);
const json = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers } });
const publicFields = "id, name, service, rating, message, created_at";

async function reviews(request, env) {
  if (!env.REVIEWS_DB) return json({ error: "Reviews are temporarily unavailable. Please try again later." }, 503);
  const db = env.REVIEWS_DB;
  if (request.method === "GET") {
    const before = new URL(request.url).searchParams.get("before");
    if (before !== null && (!/^\d+$/.test(before) || !Number.isSafeInteger(Number(before)) || Number(before) < 1)) return json({ error: "Invalid review page." }, 400);
    const [rows, summary] = await db.batch([
      db.prepare(`SELECT ${publicFields} FROM reviews WHERE visible = 1 AND id < ? ORDER BY id DESC LIMIT 13`).bind(before ? Number(before) : Number.MAX_SAFE_INTEGER),
      db.prepare("SELECT COUNT(*) AS total, COALESCE(AVG(rating), 0) AS average FROM reviews WHERE visible = 1"),
    ]);
    const items = rows.results.slice(0, 12);
    return json({ reviews: items, ...summary.results[0], nextCursor: rows.results.length > 12 ? items.at(-1).id : null });
  }
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, { Allow: "GET, POST" });
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Please submit your review from our website." }, 403);
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) return json({ error: "Please send a JSON review." }, 415);
  // Bound the body while reading, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return json({ error: "Please enter your review." }, 400);
  let size = 0;
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 10000) { await reader.cancel(); return json({ error: "Your review is too long." }, 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let input;
  try { input = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { return json({ error: "Please enter a valid review." }, 400); }
  if (!input || typeof input !== "object") return json({ error: "Please enter a valid review." }, 400);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (input.website) return json({ error: "We couldn’t accept this submission." }, 400);
  if (name.length < 1 || name.length > 60 || message.length < 10 || message.length > 1500 || !services.has(input.service) || !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5 || input.consent !== true || typeof input.submissionId !== "string" || !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(input.submissionId)) {
    return json({ error: "Please add your name, service, 1–5 star rating, a review of 10–1500 characters, and permission to publish." }, 400);
  }
  // A retry after a lost response must not publish the same review twice.
  const existing = await db.prepare(`SELECT ${publicFields} FROM reviews WHERE submission_id = ?`).bind(input.submissionId).first();
  if (existing) return json({ review: existing });
  const now = Date.now();
  const bucket = Math.floor(now / 3600000);
  const address = request.headers.get("CF-Connecting-IP") || "local";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${bucket}:${address}`));
  const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  const limit = await db.prepare("INSERT INTO review_limits (key, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1 RETURNING attempts").bind(key, now + 3600000).first();
  if (limit.attempts > 5) return json({ error: "You’ve submitted several reviews recently. Please try again in an hour." }, 429, { "Retry-After": "3600" });
  await db.batch([
    db.prepare("DELETE FROM review_limits WHERE expires_at < ?").bind(now),
    db.prepare("INSERT INTO reviews (submission_id, name, service, rating, message) VALUES (?, ?, ?, ?, ?) ON CONFLICT(submission_id) DO NOTHING").bind(input.submissionId, name, input.service, input.rating, message),
  ]);
  const review = await db.prepare(`SELECT ${publicFields} FROM reviews WHERE submission_id = ?`).bind(input.submissionId).first();
  return json({ review }, 201);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/api/reviews") {
      try { return await reviews(request, env); }
      catch { return json({ error: "Reviews are temporarily unavailable. Your review has not been confirmed; please try again." }, 503); }
    }
    if (path.startsWith("/api/")) return json({ error: "Not found." }, 404);
    return env.ASSETS.fetch(request);
  },
};
