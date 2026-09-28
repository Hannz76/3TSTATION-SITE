// Run with Playwright installed: node smoke.mjs (start the Vite server first).
// Optional: PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs
import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.goto(process.env.SITE_URL || "http://localhost:5173", { waitUntil: "networkidle" });
  assert.match(await page.title(), /3T Station/);
  assert.match(await page.locator("main").evaluate(element => getComputedStyle(element).animationName), /content-in/);
  assert.equal(await page.locator(".game-grid .game-card").count(), 6);
  assert.equal(await page.locator(".bento-yogurt-photos img").count(), 3);
  assert.equal(await page.locator(".bento-yogurt-photos img").evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), true, "Yogurt photos load");
  await page.locator("#main-navigation").getByRole("link", { name: "Game top-up", exact: true }).click();
  assert.match(page.url(), /\/#games$/);
  await page.getByRole("link", { name: /Explore all games/ }).click();
  await page.waitForURL(/\/topup$/);
  assert.match(page.url(), /\/topup$/);
  await page.waitForFunction(() => document.title.includes("Game Top-up"));
  assert.match(await page.title(), /Game Top-up/);
  assert.equal(await page.getByRole("navigation", { name: "Game top-up navigation" }).count(), 1);
  assert.equal(await page.locator(".topup-game-grid .game-card").count(), 28);
  await page.getByLabel("Search games").fill("PUBG");
  assert.equal(await page.locator(".topup-game-grid .game-card").count(), 2);
  await page.getByLabel("Search games").fill("not-a-real-game");
  assert.equal(await page.getByText("No games found just yet.").count(), 1);
  await page.getByRole("button", { name: "Show all games" }).click();
  await page.getByRole("button", { name: "Other Region", exact: true }).click();
  assert.equal(await page.locator(".topup-game-grid .game-card").count(), 9);
  await page.getByRole("navigation", { name: "Game top-up navigation" }).getByRole("link", { name: "Calculator" }).click();
  await page.waitForURL(/\/topup\/calculator$/);
  assert.match(page.url(), /\/topup\/calculator$/);
  await page.getByLabel("Total matches played").fill("200");
  await page.getByLabel("Current win rate (%)").fill("50");
  await page.getByLabel("Target win rate (%)").fill("60");
  await page.getByRole("button", { name: /Calculate wins/ }).click();
  assert.match(await page.locator(".topup-tool-result").textContent(), /50 consecutive wins/);
  await page.getByRole("navigation", { name: "Game top-up navigation" }).getByRole("link", { name: "Check region" }).click();
  await page.getByLabel("User ID").fill("12345678");
  await page.getByLabel("Zone ID").fill("1234");
  await page.getByRole("button", { name: "Check ID format" }).click();
  assert.match(await page.locator(".topup-tool-result").textContent(), /Only the game's servers can verify/);
  await page.getByRole("navigation", { name: "Game top-up navigation" }).getByRole("link", { name: "Track order" }).click();
  await page.waitForURL(/\/topup\/track-order$/);
  assert.match(await page.locator(".topup-tool-panel").textContent(), /Tracking isn't live yet/);
  await page.getByRole("navigation", { name: "Game top-up navigation" }).getByRole("link", { name: "All games" }).click();
  await page.waitForURL(/\/topup$/);

  await page.locator(".topup-game-grid .game-card").first().click();
  await page.waitForURL(/\/topup\/order\/mobile-legends-my$/);
  assert.match(page.url(), /\/topup\/order\/mobile-legends-my$/);
  await page.getByRole("button", { name: "Prepare top-up enquiry" }).click();
  assert.equal(await page.locator(".request-ready").count(), 0, "Required fields block empty submission");
  await page.getByLabel("Player / User ID").fill("12345678");
  await page.getByLabel("Server / Zone ID").fill("1234");
  assert.equal(await page.getByRole("radio").count(), 12);
  await page.getByRole("radio", { name: "70 (64+6) Diamonds RM 5.39", exact: true }).check();
  await page.getByLabel("Your name", { exact: true }).fill("Test Customer");
  await page.getByLabel("Phone / WhatsApp").fill("0123456789");
  await page.getByRole("button", { name: "Prepare top-up enquiry" }).click();
  assert.match(await page.getByLabel("Your request").inputValue(), /70 \(64\+6\) Diamonds — RM 5\.39/);
  assert.match(await page.getByLabel("Your request").inputValue(), /Player ID: 12345678/);
  await page.getByRole("button", { name: "Edit my enquiry" }).click();
  assert.equal(await page.getByLabel("Player / User ID").inputValue(), "12345678", "Editing retains form details");
  const packageValues = await page.getByRole("radio").evaluateAll(radios => radios.map(radio => radio.value));
  for (const slug of ["pubg-mobile", "free-fire-malaysia", "mobile-legends-top-up-via-login"]) {
    await page.goto((process.env.SITE_URL || "http://localhost:5173") + `/topup/order/${slug}`);
    await page.getByRole("radio").first().waitFor();
    assert.deepEqual(await page.getByRole("radio").evaluateAll(radios => radios.map(radio => radio.value)), packageValues, `Same packages for ${slug}`);
  }
  await page.getByRole("navigation", { name: "Game top-up navigation" }).getByRole("link", { name: "Main site" }).click();
  await page.waitForURL(/\/$/);
  assert.match(page.url(), /\/$/);

  await page.getByRole("button", { name: "Battery replacement", exact: true }).click();
  await page.getByRole("link", { name: "Explore repair services" }).click();
  await page.waitForURL(/\/repair$/);
  assert.match(page.url(), /\/repair$/);
  await page.getByLabel("Select your model").selectOption("iPhone 13");
  assert.match(await page.locator(".repair-pricing-card").textContent(), /RM 550/);
  await page.getByRole("button", { name: /Request a quote for iPhone 13/ }).click();
  assert.equal(await page.getByLabel("What needs a little care?").inputValue(), "Screen repair");
  await page.getByLabel("Phone brand").selectOption("Apple");
  await page.getByLabel("Phone model").fill("iPhone 14");
  await page.getByLabel("Your name", { exact: true }).fill("Test Customer");
  await page.getByLabel("Phone / WhatsApp").fill("0123456789");
  await page.getByRole("button", { name: "Prepare repair enquiry" }).click();
  assert.match(await page.getByLabel("Your request").inputValue(), /Apple iPhone 14/);
  assert.match(await page.getByLabel("Your request").inputValue(), /Screen repair/);
  await page.keyboard.press("Escape");

  await page.goto((process.env.SITE_URL || "http://localhost:5173") + "/");
  await page.getByRole("button", { name: "Make it a trio" }).click();
  for (const flavor of ["Mango", "Blueberry", "Strawberry"]) {
    assert.equal(await page.getByLabel(`${flavor} quantity`, { exact: true }).textContent(), "1");
    await page.getByLabel(`Remove one ${flavor}`, { exact: true }).click();
  }
  assert.equal(await page.getByRole("button", { name: /Ask about my/ }).isDisabled(), true);
  await page.getByLabel("Add one Mango", { exact: true }).click();
  await page.getByLabel("Add one Mango", { exact: true }).click();
  await page.getByLabel("Your name", { exact: true }).fill("Test Customer");
  await page.getByLabel("Phone / WhatsApp").fill("0123456789");
  await page.getByRole("button", { name: /Ask about my/ }).click();
  const yogurtRequest = await page.getByLabel("Your request").inputValue();
  assert.match(yogurtRequest, /Mango: 2 sticks/);
  assert.doesNotMatch(yogurtRequest, /Blueberry:/);
  assert.equal(await page.locator(".yogurt-order-row img[src$='.jpg']").count(), 3);
  await page.keyboard.press("Escape");

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `No horizontal overflow at ${width}px`);
  }
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.locator("#main-navigation").getByRole("link", { name: "Fresh yogurt" }).click();
  assert.equal(await page.getByRole("button", { name: "Open navigation" }).getAttribute("aria-expanded"), "false");
  await page.getByRole("button", { name: "Choose Strawberry yogurt" }).click();
  assert.equal(await page.getByLabel("Strawberry quantity", { exact: true }).textContent(), "1");
  await page.keyboard.press("Escape");
  await page.goto((process.env.SITE_URL || "http://localhost:5173") + "/topup");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `No top-up page overflow at ${width}px`);
  }
  await page.reload();
  assert.equal(await page.locator(".topup-game-grid .game-card").count(), 28, "Direct top-up deep link loads");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  assert.equal(await page.getByRole("button", { name: "Switch to light mode" }).count(), 1);
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgb(19, 27, 22)");
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark", "Dark choice persists on reload");
  await page.goto((process.env.SITE_URL || "http://localhost:5173") + "/topup/order/mobile-legends-my");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark", "Dark choice persists on game page");
  assert.equal(await page.locator(".topup-order-card").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(29, 42, 32)");
  await page.goto((process.env.SITE_URL || "http://localhost:5173") + "/repair");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark", "Dark choice persists on repair page");
  assert.equal(await page.locator(".repair-pricing-card").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(29, 42, 32)");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Let's talk" }).click();
  assert.equal(await page.locator("dialog").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(29, 42, 32)");
  await page.keyboard.press("Escape");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `No dark repair page overflow at ${width}px`);
  }
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  assert.equal(await page.evaluate(() => localStorage.getItem("3t-theme")), "light");
  const reduced = await browser.newPage({ reducedMotion: "reduce" });
  try {
    await reduced.goto((process.env.SITE_URL || "http://localhost:5173") + "/topup", { waitUntil: "networkidle" });
    assert.equal(await reduced.locator("main").evaluate(element => getComputedStyle(element).animationName), "none", "Reduced-motion users see content immediately");
    await reduced.getByRole("navigation", { name: "Game top-up navigation" }).getByRole("link", { name: "Main site" }).click();
    await reduced.waitForURL(/\/$/);
    assert.match(reduced.url(), /\/$/, "Navigation works with reduced motion");
  } finally {
    await reduced.close();
  }
  assert.deepEqual(errors, [], "No uncaught browser errors");
  console.log("Passed: top-up routes/navigation, catalogue search/filter, calculator, ID format, enquiry draft, repair, yogurt, mobile navigation, theme, transitions, reduced motion, responsive widths, browser errors.");
} finally {
  await browser.close();
}
