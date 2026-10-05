import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const site = process.env.SITE_URL || 'http://127.0.0.1:8787';
const errors = [];
async function createPage(reducedMotion = 'no-preference', disableWebGL = false) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, reducedMotion });
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ disableWebGL }) => {
    window.waveDrawCount = 0;
    if (disableWebGL) {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        return type === 'webgl2' ? null : original.call(this, type, ...args);
      };
    } else {
      const draw = WebGL2RenderingContext.prototype.drawArrays;
      WebGL2RenderingContext.prototype.drawArrays = function(...args) {
        window.waveDrawCount++;
        return draw.apply(this, args);
      };
    }
  }, { disableWebGL });
  await page.goto(site + '/#home', { waitUntil: 'networkidle' });
  await page.locator('.gradient-waves-container').waitFor();
  return page;
}
try {
  const active = await createPage();
  await active.waitForFunction(() => window.waveDrawCount > 3);
  assert.equal(await active.locator('.dot-grid').count(), 0);
  assert.equal(await active.locator('.gradient-waves-container canvas').evaluate(canvas => canvas.width * canvas.height <= 240000), true, 'Render resolution stays bounded');
  await active.locator('#main-navigation').getByRole('link', { name: 'Our story', exact: true }).click();
  await active.waitForFunction(() => document.querySelector('.hero-shell').getBoundingClientRect().bottom < 0);
  await active.waitForTimeout(200);
  const pausedCount = await active.evaluate(() => window.waveDrawCount);
  await active.waitForTimeout(200);
  assert.equal(await active.evaluate(() => window.waveDrawCount), pausedCount, 'Off-screen waves stop rendering');
  await active.close();

  const reduced = await createPage('reduce');
  const staticCount = await reduced.evaluate(() => window.waveDrawCount);
  await reduced.waitForTimeout(200);
  assert.equal(await reduced.evaluate(() => window.waveDrawCount), staticCount, 'Reduced-motion waves remain still');
  await reduced.emulateMedia({ reducedMotion: 'no-preference' });
  await reduced.waitForFunction(start => window.waveDrawCount > start + 2, staticCount);
  await reduced.close();

  const fallback = await createPage('no-preference', true);
  assert.equal(await fallback.locator('.gradient-waves-container canvas').count(), 0);
  assert.equal(await fallback.locator('.hero h1').isVisible(), true);
  assert.notEqual(await fallback.locator('.hero-wave-background').evaluate(el => getComputedStyle(el).backgroundImage), 'none', 'Fallback gradient remains visible without WebGL');
  await fallback.close();
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  console.log('Passed: waves render, old dots removed, bounded resolution, off-screen pause, reduced motion, live preference changes, and WebGL fallback.');
} finally { await browser.close(); }
