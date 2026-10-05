# 3T Station

A responsive React + TypeScript + Vite business website for game top-ups, phone repair, and yogurt. Built within the supplied `muiz` project.

## Run locally

Use Node.js 22.22.2 or newer (Node 24 LTS recommended).

```bash
npm install
npm run preview:full
```

This builds the site, initializes the local review database, and serves the full site at `http://127.0.0.1:8787`. For live frontend editing, keep the API server running and start `npm run dev` in a second terminal; Vite forwards `/api` requests to port 8787.

Production check: `npm run build`. Preview the build with `npm run preview`.

Browser smoke check: with Vite running and Playwright/Chromium available, run `node smoke.mjs`. If Playwright is installed outside the project, set `PLAYWRIGHT_MODULE` to its absolute `index.mjs` path. The check covers top-up navigation, catalogue filtering, calculator, ID format, required fields, enquiry drafts, yogurt quantities, mobile navigation, and horizontal overflow at four widths. Set `SITE_URL` to check another server.

## Home-page DotGrid

The hero uses the supplied React Bits DotGrid JavaScript + CSS component, in `src/components/DotGrid/`. GSAP and its InertiaPlugin provide the pointer response and click shockwaves. GSAP is included in the normal dependency install; no React Bits Pro license key is needed.

Change dot size, spacing, proximity, or shockwave strength on the `DotGrid` instance in `Hero` in `src/App.tsx`. The `--hero-dot-base` and `--hero-dot-active` variables in `src/index.css` define its light and dark colours. The component loads only when the home-page hero is rendered, preserves link interactions, draws a static grid for reduced-motion users, and pauses canvas animation outside the viewport or in a hidden tab. Its `.d.ts` file describes the JavaScript props for TypeScript callers.

## Replace the placeholders

- **Business information:** edit the `business` object in `src/data.ts`. WhatsApp (+601128094829), Instagram, and Facebook are configured. Add your email, address, and logo path. No contact information from the reference businesses is reused.
- **Logo:** add your logo to `public/images/`, then set `business.logo`. Until then, the site shows a simple 3T placeholder. Replace `public/favicon.svg` too.
- **Yogurt photos:** `public/images/yogurt-mango.jpg`, `yogurt-blueberry.jpg`, and `yogurt-strawberry.jpg` are copied from the supplied `yourgert picture` directory. Replace these files to update the product photos.
- **Gaming illustration:** replace `public/images/game-controller.svg` if desired. Phone visuals are CSS illustrations in `src/index.css`.
- **Game catalogue:** the 28 games and remote image links are adapted from the supplied project. Confirm availability and image usage rights, then preferably host approved artwork locally. An illustrated text fallback appears if remote images fail.
- **Packages:** `topupPackages` in `src/data.ts` reproduces the example's 12 denominations and RM prices, shared across every game as requested. Package cards use native radio selection; the chosen denomination and price appear in the enquiry draft. Confirm availability and prices before accepting orders.

## What works

- Responsive navigation and service anchors.
- Dark mode by default across all pages and dialogs, with a sun/moon toggle in the shared header. A visitor’s saved light/dark choice persists in localStorage.
- Short page transitions, staggered hero entrances, and scroll-triggered section/card reveals; reduced-motion preference disables motion. The header’s Phone repair link scrolls to the homepage repair section.
- Dedicated `/topup` page with a second navigation bar, featured games, a searchable 28-game catalogue with category filters, and `/topup/order/:slug` game enquiry pages.
- Dedicated `/repair` page with a device selector, “Get your device fixed” workflow, editable repair estimates, transparent service pricing, process steps, and quote request form.
- `/topup/calculator` win-rate estimates and `/topup/check-region` player ID format checks. `/topup/track-order` explains that tracking requires a live ordering system.
- Validated top-up and repair enquiry builders.
- Yogurt flavour selection, per-flavour quantities, and trio selection.
- Editable enquiry drafts, clipboard copying, and a WhatsApp handoff when your number is configured.
- Keyboard-accessible native dialogs with Escape dismissal, focus containment/restoration, and scroll locking.
- FAQ disclosures, reduced-motion support, SEO metadata, product photos, and local illustrations.

## Before going live

The game, repair, and yogurt flows are **frontend enquiries**, not a payment gateway, live game API, inventory system, or booking backend. Customer reviews are stored by the separate review API described below. Form submission prepares a request locally; it never claims an order, repair appointment, or payment has been completed. Details remain in React memory and are cleared on page reload. Enquiry details are not sent to a server by the app. Review submissions are different: the customer explicitly agrees to publish their name, rating, service, and review, which are stored in the review database. Only the theme preference is stored in localStorage.

With a business WhatsApp number configured, customers can open their prepared message in WhatsApp and send it themselves. Without contact details, the site clearly explains that enquiries have not been sent and offers a copyable draft.

Before launch, add verified contacts, prices and currency, service coverage, shop hours, repair terms, any applicable inspection fees/warranties, and yogurt sizes/ingredients/allergen information. Connect a backend only if live order placement or payment is needed. Fonts currently load from Google Fonts; host them locally if required by your privacy or offline requirements.

SPA fallback is handled by `wrangler.jsonc` (`not_found_handling: single-page-application`), so no `_redirects` file is needed.
# 3TSTATION-SITE


## Customer reviews

The homepage `#reviews` section includes the supplied React Bits CircularCarousel, the three business-supplied WhatsApp screenshots, a public review form, average rating, review count, and paginated written reviews. Screenshots open in a native dialog at their original aspect ratio. The carousel supports drag, keyboard arrows, pause/play, dark mode, and reduced motion.

- Screenshot files: `public/images/reviews/`; captions: `src/components/CustomerReviews/reviews.ts`.
- UI and styles: `src/components/CustomerReviews/`.
- API: `worker/index.js` (`GET /api/reviews` and `POST /api/reviews`).
- Database schema: `migrations/0001_customer_reviews.sql`.
- Local database: `.wrangler/state/` (ignored by Git).

The API validates every field, uses parameterized SQL, limits body size, blocks cross-origin browser submissions, checks a honeypot, and limits new submissions to five per IP/hour. It stores only an hourly hash of the IP for limiting, never the raw address. Retrying the same submission ID does not create another review. Reviews publish immediately after consent; they are customer submissions, not verified purchases. Reviews persist across reloads. The form retains text when a request fails.

### Connect the production database

The checked-in `database_id: "local-reviews-db"` is a **local placeholder**, not a provisioned Cloudflare database. No live deployment or remote database was created during this change. To connect your Cloudflare account:

```bash
npx wrangler login
npx wrangler d1 create 3tstation-reviews
```

Replace `database_id` in `wrangler.jsonc` with the UUID returned by the create command. Then apply the schema and deploy when ready:

```bash
npx wrangler d1 migrations apply REVIEWS_DB --remote
npm run build
npx wrangler deploy
```

Keep the `REVIEWS_DB` and `ASSETS` bindings and `run_worker_first: ["/api/*"]`; they ensure API requests reach the Worker while page links continue to load the site. A static-only preview (`npm run preview`) cannot publish reviews.

To hide an unwanted review without deleting it, use Cloudflare's D1 console: `UPDATE reviews SET visible = 0 WHERE id = <review_id>;`. Hidden reviews are excluded from the list, count, and average. There is no public moderation endpoint or admin page.

Cloudflare references: [D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/) and [Workers static asset bindings](https://developers.cloudflare.com/workers/static-assets/binding/).

### Review checks

```bash
npx playwright install chromium
npm run build
npm run test:reviews
```

The review check starts its own server at port 8788 and uses a temporary database, so test submissions never appear in your real review list. It covers API validation, consent, duplicate retries, persistence, rate limiting, pagination, failed submission recovery, screenshot opening, keyboard controls, responsive layouts, dark mode, and reduced motion. Preview screenshots are written to `/tmp/3t-review-previews/`.


## Company and founders

The homepage `#about` section introduces the company and its three founders. Edit descriptions and job titles in `src/components/About/founders.ts`; the layout and styles are in the same folder. The business supplied and confirmed the portrait mapping: Muiz (game top-ups), Sidqi (phone repair), and Syabil (yogurt). Original portraits are stored in `public/images/founders/`; responsive CSS controls their framing without changing the image files.
