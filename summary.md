# 3T Station — Complete Project Summary

> Detailed, file-by-file analysis of the entire repository at `/workspace`.
> Every file listed below was read in full. Generated/vendored artifacts (`node_modules`, `bun.lock`, `package-lock.json`, `dist/assets/*`) were inspected structurally rather than line-by-line.

---

## 1. What This Project Is

**3T Station** ("Play. Repair. Refresh.") is a **frontend-only business enquiry website** for a Malaysian small business offering three services:

1. **Game top-ups** — credit/diamond purchases for mobile games (Mobile Legends, PUBG Mobile, Free Fire, etc.), priced in **RM (Malaysian Ringgit)**.
2. **Phone repair** — screen, battery, charging-port and other repairs, with indicative price estimates per device model.
3. **Yogurt sticks** — three flavors: Mango, Blueberry, Strawberry.

Critically, **there is no backend, database, or payment integration**. Forms do not submit anywhere; they build a **copyable text "enquiry draft"** that the customer can copy to the clipboard or (if the business configures a WhatsApp number) hand off to WhatsApp themselves. The site is honest about this everywhere ("This is a draft — nothing has been sent and no payment has been taken").

- **Stack:** React 18 + TypeScript + Vite 6, styled almost entirely by one large handwritten CSS file (Tailwind is configured but barely used).
- **Deployment target:** static assets served by Cloudflare Workers/Pages style config (`wrangler.jsonc` → `./dist` with SPA fallback).
- **Origin:** built inside a `muiz` scaffold project (per README); some dependencies from that scaffold remain unused.

---

## 2. Repository Layout

```
/workspace
├── .gitignore               # ignores node_modules, tsbuildinfo, .wrangler, .dev.vars
├── README.md                # project docs: run steps, placeholder replacement, feature list, launch caveats
├── biome.js                 # Biome linter/formatter config (NOTE: named biome.js, not biome.json — see §7)
├── bun.lock                 # lockfile from Bun package manager (1,097 lines)
├── index.html               # Vite entry HTML shell
├── package-lock.json        # npm lockfile (~265 KB)
├── package.json             # name "react-vite-tailwind", scripts, deps
├── postcss.config.js        # tailwindcss + autoprefixer plugins
├── smoke.mjs                # Playwright end-to-end smoke test (166 lines)
├── tailwind.config.js       # shadcn-style theme tokens (largely unused by app code)
├── tsconfig.json            # strict TS, noEmit, bundler resolution
├── vite.config.ts           # Vite + @vitejs/plugin-react
├── wrangler.jsonc           # Cloudflare static-assets config (SPA fallback)
├── public/                  # static assets copied verbatim into dist
│   ├── favicon.svg                          # green rounded square with "3T" text
│   └── images/
│       ├── game-controller.svg              # white controller w/ lime details
│       ├── yogurt-mango.jpg                 # product photo (~44 KB)
│       ├── yogurt-blueberry.jpg             # product photo (~34 KB)
│       └── yogurt-strawberry.jpg            # product photo (~34 KB)
├── dist/                    # committed production build (duplicate of public/ + bundled assets)
│   │                        # (formerly contained a committed dist/_redirects whose
│   │                        #  `/* /index.html 200` rule broke Cloudflare deploys — removed)
│   ├── index.html, favicon.svg, images/…    # copies of public/
│   └── assets/
│       ├── index-UtfYajxy.js               # bundled app (~202 KB minified)
│       └── index-fJDWdjbg.css              # compiled CSS (~84 KB)
└── src/                     # ALL application source lives here
    ├── main.tsx             # 10-line React bootstrap
    ├── App.tsx              # the entire UI: ~30 components in ONE file (304 dense lines)
    ├── data.ts              # all business/content data (70 lines)
    ├── index.css            # complete design system (114 very long lines ≈ 77.5 KB)
    └── vite-env.d.ts        # Vite client type reference
```

Git history: a single commit, `8df59a9 update zuzuzu`, containing everything above.

---

## 3. File-by-File Analysis

### 3.1 `src/main.tsx` (entry point)
- Gets `#root`, throws if missing, calls `createRoot(...).render(<App />)`.
- Imports `./index.css` globally. No providers, no router library, no error boundary.

### 3.2 `index.html` (Vite shell)
- Sets title `3T Station — Play. Repair. Refresh.`, description meta, `theme-color #c2ef7b` (brand lime-green), SVG favicon.
- Contains an **inline pre-paint theme script**: reads `localStorage['3t-theme']` inside try/catch and sets `document.documentElement.dataset.theme = 'dark'` *before* React loads — prevents dark-mode flash on refresh. Uses modern bare `catch { }` syntax.

### 3.3 `src/data.ts` — content & configuration (single source of truth)
Exports five things:

1. **`business`** — `{ name, whatsapp, email, address, logo }`. **All fields except `name` are empty strings**, i.e., placeholders awaiting real values. `whatsapp` expects international digits only (e.g. `60123456789`). Many UI branches check these fields to decide whether to show WhatsApp links or a "contact coming soon" notice.
2. **`games: Game[]`** — 28 entries typed `{ name, slug, image, category, region }`. Categories: **"UID Games" (18)**, **"Other Region" (9)**, **"Via Login" (1)** (Mobile Legends via login). Regions include Malaysia, Singapore, Indonesia, Brazil, Philippines, Russia, Turkey, Global. Images are filenames like `"1054403436.bin"` mapped through `.map()` to prepend the remote CDN base `https://ext.same-assets.com/3977561172/` — **external dependency; artwork rights unverified** (README flags this).
3. **`topupPackages`** — 12 `[label, RM price]` pairs from "14 (13+1) Diamonds — RM 1.13" up to "1192 (1010+182) Diamonds — RM 81.30". Deliberately **shared across every game** (mirrors the reference site), even though diamond packages realistically only fit MLBB-type games.
4. **`flavors`** — 3 yogurt objects: `{ name, slug, tagline, description, note, image }`, images pointing to local `/images/yogurt-*.jpg`.
5. **`repairs`** — 4 issue types with icon keys: Screen repair (`screen`), Battery replacement (`battery`), Charging issues (`bolt`), Something else (`tool`).

### 3.4 `src/App.tsx` — the whole application (~30 components, one file)

**Routing (manual, no router library):**
- `App` reads `window.location.pathname` once per render (trailing slashes stripped) and picks a page:
  - `/` → home (`Hero, Services, GameSection, RepairSection, YogurtSection, AboutSection, FaqSection`)
  - `/topup`, `/topup/order/:slug`, `/topup/calculator`, `/topup/check-region`, `/topup/track-order` → `TopupPage` (with unknown subpaths rendering a "Wrong turn?" 404 panel)
  - `/repair` → `RepairPage`
- Navigation uses **real `<a href>` links + full page reloads**. A global click interceptor (`useEffect` in `App`) adds a `.page-leaving` class and delays `location.assign` by **150 ms** for a fade/slide transition. It carefully skips: modified clicks (meta/ctrl/shift/alt), non-left buttons, downloads, `target≠_self`, cross-origin, same-path, open dialogs, and honors `prefers-reduced-motion` (skips animation entirely). A `pageshow` listener removes the leaving class on back/forward cache restore.
- `document.title` is set per top-up route via effect.
- Because each navigation is a full reload, **form state does not persist across pages** (intentional privacy property).

**Key components:**

- **`Icon`** — inline SVG sprite: a `Record<string, ReactNode>` of ~28 stroke-based 24×24 paths (arrow, game, screen, bolt, shield, heart, chat, search, sun/moon, calculator, receipt, pin, home, copy, leaf, globe…). Unknown names fall back to `sparkle`. **Bug found:** `RepairPage` requests `name="tag"`, which is undefined → silently renders sparkle instead of a price tag.
- **`Brand`** — logo link; shows `business.logo` image if configured, otherwise a rotated lime "3T✳" mark with tooltip "Your logo goes here".
- **`Header`** — announcement bar, sticky blurred header, desktop nav (Game top-up, Phone repair, Fresh yogurt, Our story), "Let's talk" contact button (desktop + mobile variants), hamburger with proper `aria-expanded`/`aria-controls`, and a **theme toggle** that flips `data-theme` on `<html>` and persists to `localStorage` in try/catch (private-browsing safe).
- **`PhoneArt`** — pure-CSS illustration of two phones (back with camera island, front showing "Good as new." lock screen); reused in hero bento, repair section, and repair page. `small` variant resizes via CSS.
- **Home sections:** `Hero` (headline "Level up. Fix up. Freshen up." + 3-tile bento grid linking to each service), `Services` (numbered strip), `GameSection` (first 6 games + benefits row + link to `/topup`), `RepairSection` (interactive 4-button issue selector with `aria-pressed` and `aria-live` description), `YogurtSection` (3 flavor cards opening the yogurt modal; trio button opens it with all flavors pre-selected), `AboutSection`, `FaqSection` (native `<details>/<summary>` disclosures covering top-up process, repair cost, flavors, allergens).
- **`GameImage` / `GameCard`** — `<img loading="lazy">` with `onError` → illustrated gradient fallback showing a game icon + title (fallback gradients rotate by card position). Cards link to `/topup/order/{slug}`; first card gets a "FAN FAVOURITE" badge.
- **Top-up area:** `TopupNavigation` (sticky secondary nav under the main header with `aria-current`), `TopupCatalog` (hero, conditional "Popular Picks" shown only when no search/category filter active, search input filtering name+region+category, 4 category tab buttons, live result count with `role="status"`, empty-state with reset button), `TopupForm` (see forms below), `TopupCalculator` (win-rate math: `wins = ceil(m·(desired−current)/(100−desired))` with validation message; explicitly labeled an estimate), `TopupRegion` (MLBB user-ID 4–20 digits / zone-ID 3–10 digits format checker using `pattern` + digit-stripping onChange; result clarifies it cannot verify against game servers), `TopupTracking` (honest "tracking isn't live yet" panel).
- **`RepairPage`** — hero, 3-step process strip, device picker (`repairModels`: iPhone 11/13/15, Galaxy S23, plus Galaxy A54 & Redmi Note 13 which have **no explicit price table**), editable estimate table from `repairPrices` map (fixed prices + ranges like "RM 250–350"; models without a table fall back to generic "From RM X" rows), clickable price rows that set the form's issue dropdown, quote-request form rendered inline, and a disclaimer about diagnosis fees/warranty.
- **Modals:** `Modal` wraps a native `<dialog>` opened with `showModal()` in an effect; captures previously focused element, locks body scroll, restores both on cleanup; backdrop-click detection includes coordinate bounds check; Escape works natively via `onCancel`. One `ModalState` discriminated union drives three contents: `repair`, `yogurt` (by flavor index, `-1` = trio), `contact`. `key={modal.type}` remounts on change.
- **Forms (all produce drafts, none transmit anything):**
  - Shared `ContactFields` (name ≤80 chars, phone `tel` with pattern `[+0-9() .\-]{7,20}`).
  - `TopupForm` — player UID/server ID fields (required numeric patterns only for ML-family slugs; optional free-text server otherwise), 12 radio package cards, "Via Login" special path that replaces ID fields with a security notice ("Do not send passwords, verification codes…"). Builds a formatted multi-line enquiry string.
  - `RepairForm` — brand select (10 options), model, issue select, optional details textarea; output asks for next steps/diagnosis fee/turnaround.
  - `YogurtForm` — per-flavor quantity steppers clamped 0–20, live total, notes field, dairy/allergen notice; submit disabled at zero.
  - `RequestReady` — the shared success view: read-only auto-selecting textarea of the draft, **WhatsApp deep-link** (`wa.me/<number>?text=<encoded>`) only if `business.whatsapp` is set, otherwise a "copy your request" notice; clipboard copy with success/error `role="status"` feedback and manual-copy fallback instructions; "← Edit my enquiry" returns to the hidden form (values retained because the form stays mounted but `hidden`).
- **`Footer`** — contact CTA banner, four-column footer, dynamic copyright year, back-to-top anchor.
- Accessibility touches throughout: skip-link, labelled dialogs, `role="group"`, polite live regions, focus-visible outlines.

### 3.5 `src/index.css` — the design system (≈77.5 KB, 114 very long lines)
- Starts with `@import` of **Google Fonts** (DM Sans + Outfit) and `@tailwind` directives (base/components/utilities) — but virtually all styling is **custom CSS**, not Tailwind utilities.
- Design tokens on `:root`: `--green:#c2ef7b`, `--dark:#263322`, `--muted`, `--border`, `--heading:'Outfit'`; background `#fcfcf8`.
- Global resets/normalization; strong focus-visible styling (3px green outline), styled `::selection`.
- Layout primitives: `.container` (min(1256px, 100%−112px)), `.section`, eyebrow/button/text-link/icon-button systems.
- Per-component blocks matching App.tsx classes: announcement/header/nav, hero + bento tiles, elaborate `.phone-art` CSS illustration rules, service strip, game grid/cards/fallbacks, repair section, flavor cards (CSS custom props `--flavor-bg/-text/-wash` per mango/blueberry/strawberry), about/FAQ/footer, `<dialog>` modal + form styles + package radio cards + quantity steppers, full top-up subsystem (secondary nav, hero, catalog grids, tool panels, order layout), and the repair subpage.
- **Responsive strategy:** media queries at 1100/900/650/370 px breakpoints; mobile nav overlay; horizontal-scroll-proof grids (verified by the smoke test at 1440/768/390/320 px).
- **Dark theme:** ~70 `[data-theme=dark]` override rules recoloring surfaces, text, borders, inputs, dialogs, while keeping bright brand tiles legible (they force dark text).
- **Motion:** `content-in` keyframe entrance for `main` and hero art gated behind `prefers-reduced-motion: no-preference`; `.page-leaving` opacity/transform for the 150 ms exit; a full motion kill-switch under `reduce`.

### 3.6 `smoke.mjs` — Playwright E2E smoke test (166 lines)
Run with `node smoke.mjs` against a dev server (`SITE_URL` overridable; `PLAYWRIGHT_MODULE` env for out-of-project installs). Sequentially asserts:
- Home renders 6 featured cards, 3 loaded yogurt photos, entrance animation active; no uncaught page errors collected throughout.
- `/topup`: 28 cards; search "PUBG" → 2; nonsense query → empty state + reset; "Other Region" tab → 9.
- Calculator: 200 matches @50%→60% yields "50 consecutive wins".
- Check-region: valid IDs produce the "only the game's servers can verify" result.
- Track-order honesty panel present.
- Order page: empty submit blocked; 12 radios; selected package + IDs appear in the draft; edit-retains-values check; **identical package values across 4 game slugs incl. Via Login**.
- Repair page: model switch updates price (iPhone 13 → RM 550), quote button presets issue, draft contains brand/model/issue; Escape closes.
- Yogurt trio modal: quantities, decrement-to-zero disables submit, draft math ("Mango: 2 sticks", excludes removed flavors).
- Responsive: no horizontal overflow at 4 widths on home, top-up, and dark repair pages.
- Mobile menu: opens, navigates, resets `aria-expanded`.
- Theme: toggle → `data-theme=dark`, computed body color `rgb(19,27,22)`, persists across reload and deep-linked pages, dialog recolored, light mode writes `3t-theme=light`.
- Reduced-motion emulation: animation `none`, navigation still works.

### 3.7 Config files
- **`package.json`** — name still `react-vite-tailwind`. Scripts: `dev` (Vite on 0.0.0.0), `build` = `tsc -b && vite build --outDir dist`, `lint` (uses `bunx` + Biome), `format`, `preview`. Runtime deps oddly include **`react-grab`** and **`same-runtime`** (never imported in src) and `tailwindcss-animate`; devDependencies carry a full ESLint+Prettier suite with **no corresponding config files** — dead weight.
- **`tsconfig.json`** — ES2020, strict, `noEmit` (type-check only; Vite emits), bundler resolution, react-jsx.
- **`vite.config.ts`** — just the React plugin plus `optimizeDeps.exclude` for `same-runtime` JSX runtimes (vestigial from the muiz scaffold).
- **`postcss.config.js` / `tailwind.config.js`** — Tailwind v3 wired up with a shadcn/ui-style token theme (HSL CSS vars, sidebar colors, accordion keyframes, container scales) that the app never consumes; no `src/**/*.css` scanning issues since utilities simply aren't used.
- **`biome.js`** — actually a JSON payload saved with a `.js` extension (Biome looks for `biome.json`; likely ignored). Disables most a11y lint rules and unused-variable checks; double-quote formatting.
- **`wrangler.jsonc`** — Cloudflare asset binding: serve `./dist`, `not_found_handling: "single-page-application"` (this is why `_redirects` is redundant).
- **`.gitignore`** — `node_modules/`, `.wrangler/`, `.dev.vars`, and now also `dist/` + `tsconfig.tsbuildinfo` (build output is regenerated by CI, no longer committed).
- **`public/favicon.svg`** — 64×64 lime rounded rect, bold "3T" wordmark (placeholder, README says replace).
- **`public/images/game-controller.svg`** — decorative controller illustration used in three places.
- **`dist/`** — previously committed build output; now removed from git tracking and ignored (CI rebuilds it via `bun run build`). It once contained a `_redirects` file whose `/* /index.html 200` rule caused Cloudflare's "Infinite loop detected" deploy error (code 100324) — fixed.

### 3.8 `README.md`
Thorough and candid: local run instructions, smoke-test usage, step-by-step placeholder replacement guide (business info, logo, photos, remote game art rights warning, shared-package caveat), a "What works" feature inventory, and a prominent **"Before going live"** section stating this is an enquiry frontend — not payments/orders/inventory — listing everything the owner must add (contacts, verified prices, hours, repair terms, allergen info) and noting Google Fonts are externally hosted.

---

## 4. Architecture & Data Flow

```
index.html (pre-paint theme) ─► src/main.tsx ─► App.tsx
                                   │
        window.location.pathname ◄─┤  (read at render; full-reload routing + 150ms exit FX)
                                   ├─► Home composition      ─┐
                                   ├─► TopupPage(path)        ├─ all consume src/data.ts
                                   ├─► RepairPage             ┘   (business/games/packages/flavors/repairs)
                                   └─► Modal(dialog) ─► RepairForm | YogurtForm | Contact
                                                        └─► RequestReady (draft text → clipboard / wa.me)
Styling: src/index.css (tokens + components + dark overrides + responsive + motion)
Output:  vite build → dist/ → wrangler static assets (SPA fallback)
Test:    smoke.mjs (Playwright) against dev/preview server
```

State is purely local component state; FormData is read only at submit time; nothing leaves the browser unless the user copies or opens WhatsApp.

---

## 5. Strengths

1. **Honest UX** — repeated, specific disclaimers that drafts aren't orders, prices are estimates, tracking/trio need confirmation; no fake checkout claims.
2. **Accessibility** — native `<dialog>` semantics, focus save/restore, scroll lock, `aria-current/pressed/expanded/live/status`, skip link, visible focus rings, reduced-motion support.
3. **Robustness** — graceful degradation everywhere: localStorage try/catch, remote-image `onError` fallbacks, conditional WhatsApp/email rendering, package-table fallback for unlisted models.
4. **Input validation** — pattern/step/min/max constraints plus friendly titles/hints; calculator math guarded against invalid ranges.
5. **Verified quality** — the smoke test covers routes, filters, all three forms, persistence, theme, responsiveness, and error-free console; genuinely thorough for a hand-rolled E2E script.
6. **Coherent design system** — one CSS file with tokens, dark theme, 4 breakpoint tiers, and distinctive CSS phone illustration instead of stock imagery.

---

## 6. Issues & Risks (prioritized)

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | High | All business contact fields empty — WhatsApp/email/address/logo placeholders; site currently can't receive enquiries beyond copy-paste | `src/data.ts` `business` |
| 2 | High | 28 game artworks hot-linked from `ext.same-assets.com` (rights + availability unconfirmed; CDN failure degrades to text fallback) | `src/data.ts` `assets` |
| 3 | Medium | Missing `tag` icon definition → falls back to sparkle in repair pricing header | `App.tsx` `Icon` vs `RepairPage` |
| 4 | Medium | Same 12 diamond packages offered for every game (incl. PUBG/Free Fire where "Diamonds" is wrong terminology); labels hardcode "— RM price" mixing display/value | `data.ts` `topupPackages`, `TopupForm` |
| 5 | Medium | Dual source of truth for package selection: `pack` state mirrors radio FormData value; needed only because FormData is read at submit — fragile pattern | `TopupForm` |
| 6 | Low | Dead configuration: Tailwind/shadcn tokens, ESLint/Prettier suites without configs, `react-grab`, `same-runtime`, `biome.js` misnamed (should be `biome.json`), `dist/_redirects` redundant with wrangler SPA handling | root configs, `package.json` |
| 7 | Low | Committed `dist/` will drift from source; should be gitignored and CI-built | `dist/` |
| 8 | Low | Routing reads `window.location.pathname` outside React state; fine with full reloads, but breaks if someone later converts to client-side routing | `App.tsx` |
| 9 | Low | Google Fonts external dependency (privacy/offline consideration noted in README) | `index.css` line 1 |
| 10 | Info | Repair price tables exist for only 4 of 6 selectable models (A54/Redmi Note 13 use generic fallbacks); prices are hardcoded marketing estimates needing verification | `App.tsx` `repairPrices` |

---

## 7. How to Run

```bash
npm install
npm run dev        # Vite dev server on 0.0.0.0:5173
npm run build      # tsc -b type-check, then vite build → dist/
npm run preview    # serve the production build
node smoke.mjs     # (with Playwright installed and dev server running) full E2E smoke test
```

Deploy: publish `dist/` as Cloudflare static assets per `wrangler.jsonc` (SPA fallback already configured).

---

## 8. One-Paragraph Verdict

A remarkably polished, single-file React/TS/Vite brochure-and-enquiry site for a three-service Malaysian micro-business: thoughtful accessibility, honest non-transactional UX, resilient fallbacks, a comprehensive Playwright smoke test, and a candid README. Before launch it needs real business contact data, licensed/local game artwork, corrected per-game package catalogs, the tiny `tag` icon fix, and removal of the vestigial scaffold tooling (unused Tailwind/ESLint/Prettier/react-grab/same-runtime configs and the committed `dist/`). Functionally, the current code fully delivers what it promises: validated enquiry-draft builders with clipboard/WhatsApp handoff — nothing more, and it never pretends to be more.
