import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

// An isolated database keeps automated test reviews off the actual site.
const state = await mkdtemp(join(tmpdir(), '3t-review-test-'));
const base = 'http://127.0.0.1:8788';
const wrangler = 'node_modules/wrangler/bin/wrangler.js';
const env = { ...process.env, WRANGLER_LOG_PATH: join(state, 'wrangler.log') };
let server;
let browser;
try {
  execFileSync(process.execPath, [wrangler, 'd1', 'migrations', 'apply', 'REVIEWS_DB', '--local', '--persist-to', state], { env, stdio: 'pipe' });
  server = spawn(process.execPath, [wrangler, 'dev', '--ip', '127.0.0.1', '--port', '8788', '--persist-to', state], { env, stdio: 'ignore' });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { ready = (await fetch(`${base}/api/reviews`)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(ready, 'Local review API starts');
  const post = (data, headers = {}) => fetch(`${base}/api/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
  const valid = { submissionId: crypto.randomUUID(), name: 'Test customer', service: 'Game top-up', rating: 4, message: 'Helpful and friendly service.', consent: true, website: '' };
  assert.equal((await post({ ...valid, rating: 6 })).status, 400);
  assert.equal((await post({ ...valid, consent: false })).status, 400);
  assert.equal((await post({ ...valid, name: '   ' })).status, 400);
  assert.equal((await post({ ...valid, website: 'spam' })).status, 400);
  assert.equal((await post(valid, { Origin: 'https://unrelated.example' })).status, 403);
  assert.equal((await post({ ...valid, message: 'x'.repeat(12000) })).status, 413);
  assert.equal((await fetch(`${base}/api/reviews?before=wrong`)).status, 400);
  assert.equal((await fetch(`${base}/api/missing`)).status, 404);
  assert.equal((await post(valid)).status, 201);
  assert.equal((await post(valid)).status, 200, 'Retry is idempotent');
  let feed = await (await fetch(`${base}/api/reviews`)).json();
  assert.equal(feed.total, 1);
  assert.equal(feed.average, 4);
  assert.equal(feed.reviews[0].message, valid.message);
  assert.equal('submission_id' in feed.reviews[0], false);

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  const section = page.locator('#reviews');
  await section.scrollIntoViewIfNeeded();
  await page.locator('.circular-carousel[data-ready]').waitFor();
  assert.equal(await page.locator('.circular-carousel__card').count(), 3);
  assert.ok(await page.locator('.circular-carousel__photo').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
  await page.getByRole('button', { name: 'Pause review carousel' }).click();
  const carousel = page.getByRole('region', { name: 'Customer review screenshots' });
  await carousel.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
  assert.match(await page.getByRole('dialog').locator('img').getAttribute('src'), /images\/reviews\//);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.getByRole('button', { name: 'Next review screenshot' }).click();
  await page.waitForFunction(() => document.querySelector('.circular-carousel__title')?.textContent.includes('Another top-up'));
  await page.getByRole('button', { name: 'Previous review screenshot' }).click();
  await page.waitForFunction(() => document.querySelector('.circular-carousel__title')?.textContent.includes('Top-up received'));
  await page.getByRole('button', { name: 'Publish my review' }).click();
  assert.equal((await (await fetch(`${base}/api/reviews`)).json()).total, 1, 'Required inputs block submission');
  await page.getByRole('radio', { name: '5 stars — Excellent', exact: true }).check();
  await page.getByLabel('Display name', { exact: true }).fill('Browser test');
  await page.getByLabel('Your service', { exact: true }).selectOption('Fresh yogurt');
  await page.getByLabel('Your review', { exact: true }).fill('A lovely visit and delicious yogurt.');
  await page.getByLabel('I agree to display').check();
  await page.route('**/api/reviews', async route => {
    if (route.request().method() === 'POST') return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Temporary test outage. Please retry.' }) });
    return route.continue();
  });
  await page.getByRole('button', { name: 'Publish my review' }).click();
  await page.getByText('Temporary test outage. Please retry.').waitFor();
  assert.equal(await page.getByLabel('Your review', { exact: true }).inputValue(), 'A lovely visit and delicious yogurt.');
  await page.unroute('**/api/reviews');
  await page.getByRole('button', { name: 'Publish my review' }).click();
  await page.getByText('Thank you! Your review is now published below.').waitFor();
  await page.getByRole('heading', { name: 'Browser test', exact: true }).waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Browser test', exact: true }).waitFor();
  assert.equal((await (await fetch(`${base}/api/reviews`)).json()).average, 4.5);
  await mkdir('/tmp/3t-review-previews', { recursive: true });
  await page.getByRole('button', { name: 'Pause review carousel' }).click();
  await page.waitForTimeout(1800); // Let the supplied carousel's entrance and settling finish.
  await section.screenshot({ style: '.header, .skip-link { visibility: hidden !important; }', path: '/tmp/3t-review-previews/desktop.png' });
  for (const width of [1440, 1024, 768, 650, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}`);
    assert.ok(await page.locator('.review-form-card').evaluate(el => el.getBoundingClientRect().right <= innerWidth), `Form fits at ${width}`);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(1800); // Let the supplied carousel's entrance and settling finish.
  await section.screenshot({ style: '.header, .skip-link { visibility: hidden !important; }', path: '/tmp/3t-review-previews/mobile.png' });
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(1800); // Let the supplied carousel's entrance and settling finish.
  await section.screenshot({ style: '.header, .skip-link { visibility: hidden !important; }', path: '/tmp/3t-review-previews/dark.png' });
  const reduced = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 390, height: 900 } });
  await reduced.goto(`${base}/#reviews`, { waitUntil: 'networkidle' });
  await reduced.locator('.circular-carousel[data-ready]').waitFor();
  const transform = await reduced.locator('.circular-carousel__ring').evaluate(el => el.style.transform);
  await reduced.waitForTimeout(250);
  assert.equal(await reduced.locator('.circular-carousel__ring').evaluate(el => el.style.transform), transform, 'Reduced motion disables autoplay');
  assert.deepEqual(errors, [], 'No browser runtime errors');
  // Additional records exercise public pagination and the per-hour submission limit.
  for (let i = 0; i < 4; i++) await post({ ...valid, submissionId: crypto.randomUUID() });
  assert.equal((await post({ ...valid, submissionId: crypto.randomUUID() })).status, 429, 'Repeated submissions are limited');
  const sql = "INSERT INTO reviews (submission_id,name,service,rating,message) SELECT 'seed-' || value, 'Pagination fixture', 'Store visit', 3, 'A test review for pagination.' FROM json_each('[1,2,3,4,5,6,7,8,9,10,11,12,13]');";
  execFileSync(process.execPath, [wrangler, 'd1', 'execute', 'REVIEWS_DB', '--local', '--persist-to', state, '--command', sql], { env, stdio: 'pipe' });
  feed = await (await fetch(`${base}/api/reviews`)).json();
  assert.equal(feed.reviews.length, 12);
  assert.ok(feed.nextCursor);
  const next = await (await fetch(`${base}/api/reviews?before=${feed.nextCursor}`)).json();
  assert.ok(next.reviews.every(review => review.id < feed.nextCursor));
  assert.equal(new Set([...feed.reviews, ...next.reviews].map(review => review.id)).size, feed.total);
  console.log('Passed: database persistence, validation, retry deduplication, rate limits, pagination, public submission, failure recovery, screenshot viewer, keyboard controls, mobile widths, dark mode, reduced motion.');
} finally {
  await browser?.close();
  if (server && server.exitCode === null) {
    const stopped = new Promise(resolve => server.once('exit', resolve));
    server.kill('SIGTERM');
    await stopped;
  }
  await rm(state, { recursive: true, force: true });
}
