# 3T Station

A responsive React + TypeScript + Vite business website for game top-ups, phone repair, and yogurt. Built within the supplied `muiz` project.

## Run locally

```bash
npm install
npm run dev
```

Production check: `npm run build`. Preview the build with `npm run preview`.

Browser smoke check: with Vite running and Playwright/Chromium available, run `node smoke.mjs`. If Playwright is installed outside the project, set `PLAYWRIGHT_MODULE` to its absolute `index.mjs` path. The check covers top-up navigation, catalogue filtering, calculator, ID format, required fields, enquiry drafts, yogurt quantities, mobile navigation, and horizontal overflow at four widths. Set `SITE_URL` to check another server.

## Replace the placeholders

- **Business information:** edit the `business` object in `src/data.ts`. Add your own WhatsApp number (international digits only), email, address, and logo path. No contact information from the reference businesses is reused.
- **Logo:** add your logo to `public/images/`, then set `business.logo`. Until then, the site shows a simple 3T placeholder. Replace `public/favicon.svg` too.
- **Yogurt photos:** `public/images/yogurt-mango.jpg`, `yogurt-blueberry.jpg`, and `yogurt-strawberry.jpg` are copied from the supplied `yourgert picture` directory. Replace these files to update the product photos.
- **Gaming illustration:** replace `public/images/game-controller.svg` if desired. Phone visuals are CSS illustrations in `src/index.css`.
- **Game catalogue:** the 28 games and remote image links are adapted from the supplied project. Confirm availability and image usage rights, then preferably host approved artwork locally. An illustrated text fallback appears if remote images fail.
- **Packages:** `topupPackages` in `src/data.ts` reproduces the example's 12 denominations and RM prices, shared across every game as requested. Package cards use native radio selection; the chosen denomination and price appear in the enquiry draft. Confirm availability and prices before accepting orders.

## What works

- Responsive navigation and service anchors.
- Sun/moon theme toggle in the shared header, with a dark theme across all pages and dialogs. The choice persists in localStorage.
- Short page transitions and gentle hero entrances; reduced-motion preference disables motion.
- Dedicated `/topup` page with a second navigation bar, featured games, a searchable 28-game catalogue with category filters, and `/topup/order/:slug` game enquiry pages.
- Dedicated `/repair` page with a device selector, “Get your device fixed” workflow, editable repair estimates, transparent service pricing, process steps, and quote request form.
- `/topup/calculator` win-rate estimates and `/topup/check-region` player ID format checks. `/topup/track-order` explains that tracking requires a live ordering system.
- Validated top-up and repair enquiry builders.
- Yogurt flavour selection, per-flavour quantities, and trio selection.
- Editable enquiry drafts, clipboard copying, and a WhatsApp handoff when your number is configured.
- Keyboard-accessible native dialogs with Escape dismissal, focus containment/restoration, and scroll locking.
- FAQ disclosures, reduced-motion support, SEO metadata, product photos, and local illustrations.

## Before going live

This is a **frontend enquiry site**, not a payment gateway, live game API, inventory system, or booking backend. Form submission prepares a request locally; it never claims an order, repair appointment, or payment has been completed. Details remain in React memory and are cleared on page reload. No personal details are stored in localStorage or sent to a server by the app.

With a business WhatsApp number configured, customers can open their prepared message in WhatsApp and send it themselves. Without contact details, the site clearly explains that enquiries have not been sent and offers a copyable draft.

Before launch, add verified contacts, prices and currency, service coverage, shop hours, repair terms, any applicable inspection fees/warranties, and yogurt sizes/ingredients/allergen information. Connect a backend only if live order placement or payment is needed. Fonts currently load from Google Fonts; host them locally if required by your privacy or offline requirements.

SPA fallback is handled by `wrangler.jsonc` (`not_found_handling: single-page-application`), so no `_redirects` file is needed.
# 3TSTATION-SITE
