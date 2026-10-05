import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`${process.env.SITE_URL || 'http://127.0.0.1:8787'}/repair`);
  await page.getByLabel('Your name', { exact: true }).fill('Test customer');
  for (const [service, expected] of [
    ['Battery replacement', 'Battery replacement'],
    ['Charging port replacement', 'Charging port replacement'],
    ['Back camera replacement', 'Back camera replacement'],
    ['LCD screen replacement', 'LCD screen replacement'],
  ]) {
    await page.locator('.repair-price-row').filter({ hasText: service }).click();
    assert.equal(await page.getByLabel('What needs a little care?').inputValue(), expected, `Selecting ${service} updates the enquiry`);
    assert.equal(await page.getByLabel('Your name', { exact: true }).inputValue(), 'Test customer', 'Changing a service preserves entered details');
  }
  console.log('Passed: repair pricing selections update the enquiry without losing customer details.');
} finally {
  await browser.close();
}
