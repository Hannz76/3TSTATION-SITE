# 3T Station: detailed project guide

This document describes the repository as it exists now. It is intended for someone who needs to understand the site, locate a feature, change its content, or prepare it for launch. The site is a responsive React and TypeScript front end for three services: game top-up enquiries, phone repair quote enquiries, and yogurt enquiries. It does not place orders, collect payment, book repairs, or store customer records.

## 1. The project at a glance

The browser loads `index.html`, which provides the `#root` element. `src/main.tsx` imports the global stylesheet and mounts `src/App.tsx` into that element. `App.tsx` chooses which page to render from the browser's current pathname. Most page sections, forms, dialogs, and route decisions are implemented in that one file. `src/data.ts` supplies the business placeholders, game catalogue, package list, yogurt flavours, and repair categories. `src/index.css` supplies nearly all custom styling. Vite builds the application, Tailwind processes its CSS directives, and `wrangler.jsonc` configures static asset serving with a single page application fallback.

```text
index.html
  └── src/main.tsx
        ├── src/index.css
        └── src/App.tsx
              └── src/data.ts

public/ assets ──copied into──> dist/ ──served by──> Cloudflare assets configuration
```

There is no React Router dependency, API client, server application, database, authentication system, checkout, or payment integration in this repository. Navigation uses ordinary links. When a page path changes, the browser loads that path again and the app chooses its view from `window.location.pathname`.

## 2. Repository tree and responsibility of every project file

The table covers every first-party file found outside dependency and Git internals, including generated files. `node_modules/` contains installed third-party packages; `.git/` contains Git's object database and metadata. Neither directory is authored application code. Empty `.agents/` and `.codex/` directories currently contain no project instructions or source files.

| File or directory | Purpose and important details |
| --- | --- |
| `README.md` | Short project introduction, local commands, existing feature list, placeholders to replace, and launch caveats. It ends with an extra `# 3TSTATION-SITE` heading. |
| `detailed.md` | This guide. |
| `package.json` | Package identity, scripts, runtime dependencies, and development tools. Its package name is the template-like `react-vite-tailwind`, not the public brand. |
| `package-lock.json` | npm lockfile, format version 3; records the exact npm dependency tree. It currently contains 512 package entries. |
| `bun.lock` | Bun lockfile, format version 1; records a separate resolution of the same declared packages. This is Bun's text lock format, which allows trailing commas and is not strict JSON. |
| `.gitignore` | Ignores `node_modules/`, `tsconfig.tsbuildinfo`, `.wrangler/`, `.dev.vars`, and environment files. It does **not** ignore `dist/`; the current build files are tracked in Git. |
| `index.html` | HTML shell, metadata, favicon link, root element, and a small early script that applies saved dark mode before React renders. |
| `src/main.tsx` | Imports CSS and `App`, checks for `#root`, and calls React's `createRoot(...).render(...)`. |
| `src/App.tsx` | All page sections, navigation, state, forms, enquiry draft generation, dialog handling, and pathname-based page choice. |
| `src/components/DotGrid/DotGrid.jsx` | Supplied React Bits JavaScript canvas component adapted for the home hero, with GSAP inertia, pointer proximity, click shockwaves, lifecycle cleanup, and reduced-motion support. It loads lazily when the hero renders. |
| `src/components/DotGrid/DotGrid.css` | Wrapper and canvas sizing for the decorative dot grid. |
| `src/components/DotGrid/DotGrid.d.ts` | TypeScript declaration describing the JavaScript component's optional props. |
| `src/data.ts` | Editable content data: business details, games, top-up packages, yogurt flavours, and repair service descriptions. |
| `src/index.css` | Global design system and styles for the home page, top-up pages, repair page, forms, dialogs, responsive layouts, dark mode, and reduced motion. |
| `src/vite-env.d.ts` | Adds Vite's TypeScript client types through a triple-slash reference. |
| `tsconfig.json` | Strict TypeScript configuration for the browser code and Vite config. `noEmit` means TypeScript checks types but does not emit JavaScript. |
| `tsconfig.tsbuildinfo` | Small TypeScript incremental-build metadata. It is generated and ignored by Git. |
| `vite.config.ts` | Enables the React Vite plugin and excludes two `same-runtime` JSX runtime paths from dependency optimization. |
| `tailwind.config.js` | Tailwind content paths, theme token mappings, container sizes, accordion animations, and the `tailwindcss-animate` plugin. |
| `postcss.config.js` | Runs Tailwind and Autoprefixer when CSS is processed. |
| `biome.js` | JSON-shaped text containing intended Biome settings for formatting, import organization, lint rules, and `src` file selection. Biome does not automatically recognize this filename as its configuration. |
| `wrangler.jsonc` | Cloudflare static asset deployment configuration. Serves `./dist` and sends unknown asset paths to the single page application. |
| `smoke.mjs` | Optional Playwright browser smoke test covering routes, forms, theme, responsive widths, and browser errors. Playwright is not declared in `package.json`. |
| `public/favicon.svg` | Small green 3T placeholder favicon, 64 × 64 SVG view box. |
| `public/images/game-controller.svg` | Local, detailed controller illustration used on the home and top-up pages. It has a 500 × 350 SVG view box and its own gradients and shadow. |
| `public/images/yogurt-mango.jpg` | Tall photo of packaged Limory Mango Sticky Rice yogurt; 220 × 1102 pixels. |
| `public/images/yogurt-blueberry.jpg` | Tall photo of packaged Limory Blueberry yogurt; 211 × 1094 pixels. |
| `public/images/yogurt-strawberry.jpg` | Tall photo of packaged Limory Strawberry yogurt; 201 × 1061 pixels. |
| `dist/index.html` | Built HTML shell pointing to hashed JavaScript and CSS bundles. It is output from an earlier build, not the source HTML to edit. |
| `dist/assets/index-UtfYajxy.js` | Compiled and minified application JavaScript. Edit source files and rebuild instead of editing this bundle. |
| `dist/assets/index-fJDWdjbg.css` | Compiled CSS output, including framework processing. Edit `src/index.css` or styling configuration instead. |
| `dist/_redirects` | A committed `/* /index.html 200` fallback rule for static hosts that support this syntax. Wrangler's own fallback is configured in `wrangler.jsonc`. |
| `dist/favicon.svg`, `dist/images/*` | Build-time copies of the corresponding `public/` assets. The current copies are byte-for-byte identical to the public originals. |

The `public/` directory is served at the site root. For example, `public/images/yogurt-mango.jpg` is requested as `/images/yogurt-mango.jpg`. Vite copies these assets into `dist/` during a production build. The controller and favicon are SVG files, while the three yogurt photos are JPEG files; these images are not source code.

## 3. Toolchain and commands

The application uses React 18, React DOM 18, TypeScript 5.6, Vite 6, Tailwind CSS 3, PostCSS, and Autoprefixer. `react-grab`, `same-runtime`, and `tailwindcss-animate` are declared runtime dependencies. The first two are not imported by the application source; `same-runtime` is mentioned in Vite's optimization exclusions, and `tailwindcss-animate` is loaded by the Tailwind config. The source relies mostly on custom CSS instead of Tailwind utility classes. ESLint and Prettier packages are installed, but the defined `lint` and `format` scripts invoke Biome.

| Command | What it does |
| --- | --- |
| `npm install` | Installs packages from npm; `npm ci` is appropriate when using the committed npm lockfile exactly. |
| `npm run dev` | Starts Vite on all interfaces (`vite --host 0.0.0.0`). The usual local URL is port 5173. |
| `npm run build` | Runs `tsc -b`, then writes a production Vite build into `dist/`. Because `dist/` is tracked, rebuilding can change tracked output. |
| `npm run preview` | Serves the production build locally for inspection. |
| `npm run lint` | Runs TypeScript checking through `bunx`, then runs `biome lint --write`. This can modify source files. It requires Bun or `bunx` to be available. |
| `npm run format` | Runs `biome format --write` through `bunx`; it can modify source files. |
| `node smoke.mjs` | Runs the optional browser smoke suite after a server is already running and Playwright/Chromium are available. `SITE_URL` changes the target URL; `PLAYWRIGHT_MODULE` can point to an external Playwright module. |

There are **two lockfiles**. They may not give identical installs: at the time of inspection, `package-lock.json` resolves Vite `6.4.3`, while `bun.lock` records Vite `6.3.5`. Choose one package manager for a change and update its lockfile consistently. `package.json` declares ranges for several packages, so the exact installed version comes from the chosen lockfile. The current npm lock also records React `18.3.1`, React DOM `18.3.1`, TypeScript `5.6.3`, Tailwind `3.4.19`, and Biome `1.9.4`.

`tsconfig.json` targets ES2020, includes browser DOM libraries, uses bundler module resolution and the React JSX transform, enables strict checking, and includes `src` plus `vite.config.ts`. `vite.config.ts` has no custom aliases or server proxy. `tailwind.config.js` maps many semantic colours to CSS variables such as `--background`, but the active design in `src/index.css` mainly uses its own variables (`--green`, `--dark`, `--muted`, `--border`, `--heading`) and literal colours. The accordion animation extension appears configured but there is no Radix accordion in the source; the FAQ uses native `<details>` elements.

The Biome command reports its configuration status as **unset** in this repository. That matches the nonstandard `biome.js` filename: Biome normally looks for `biome.json` or `biome.jsonc`. As a result, the stated rules in `biome.js` should not be assumed to control `npm run lint` or `npm run format` until that file is converted to a recognized configuration file and checked again.

## 4. How a page is selected and navigated

`App` removes trailing slashes from `window.location.pathname` and treats an empty result as `/`. It checks whether the path is `/topup` or begins with `/topup/`, or whether it is exactly `/repair`. All other paths render the home page. This is a small manual route switch, not a client-side router. Search, category, forms, and dialog state live in React memory and reset after a full page navigation or reload.

| URL | Rendered view | Main behavior |
| --- | --- | --- |
| `/` | Home page | Hero, three service links, six featured games, repair teaser, three yogurt flavours, about section, FAQ. |
| `/#home`, `/#services`, `/#games`, `/#repair`, `/#yogurt`, `/#about` | Home page section anchors | Scroll to the corresponding home section. |
| `/topup` | Game top-up catalogue | Six popular games plus searchable, filterable full catalogue. |
| `/topup/order/:slug` | Game-specific enquiry page | Package selection and validated top-up enquiry draft if `:slug` exists in `games`. |
| `/topup/calculator` | Win-rate calculator | Estimates the consecutive wins needed for a target rate. |
| `/topup/check-region` | Player/zone ID format check | Checks numeric shape only, without contacting game servers. |
| `/topup/track-order` | Tracking information page | Explains that live order tracking is unavailable. |
| `/repair` | Repair service page | Device/model selector, indicative price table, process, and quote enquiry form. |
| Unknown `/topup/...` path | Top-up “page not found” view | Link back to catalogue. |
| Other unknown path | Home page | There is no general 404 view. |

The shared `Header` contains the brand, links to the three service areas and story, a theme toggle, contact button, and a small-screen menu. Every page also has a shared footer with another contact entry point. Top-up pages add a second sticky navigation bar for catalogue, tracking, calculator, and ID checking. The top-up navigation marks the current page with `aria-current="page"`; an order page highlights “All games.”

Normal anchors perform browser navigation. A document-level click handler in `App` catches ordinary same-origin links **only when their pathname differs from the current one**, adds a short exit class, then calls `location.assign` after 150 ms. It leaves modified clicks, downloads, external links, links inside an open dialog, same-path anchors, and reduced-motion navigation to the browser. Because it ultimately uses browser navigation, history and deep links behave as regular URLs. The host must serve `index.html` for unknown asset paths; `wrangler.jsonc` provides this for its target platform, and `dist/_redirects` provides a separate static-host rule.

The document title starts in `index.html` and changes in `App` for top-up views. The current `/repair` view retains the general site title. All views share the same meta description, favicon, and `theme-color` from `index.html`; there are no route-specific social preview tags.

## 5. Data and content model in `src/data.ts`

### Business identity

`business` has `name`, `whatsapp`, `email`, `address`, and `logo`. Only `name` is filled; the other four are empty strings. The UI therefore displays the fallback 3T text logo, hides email/address/WhatsApp links, and explains that contact information is still being set up. The WhatsApp field expects international digits without `+` or spaces, because links are built as `https://wa.me/<number>?text=<encoded enquiry>`. The logo should be a public URL such as `/images/your-logo.svg`.

### Games and packages

`Game` has `name`, `slug`, `image`, `category`, and `region`. The `games` array contains 28 entries. The first six become the featured games on the home page and the popular list on `/topup`. Every game has a unique URL slug used in `/topup/order/:slug`. There are 18 “UID Games,” nine “Other Region” games, and one “Via Login” game. Search matches a case-insensitive combination of name, region, and category; a separate category filter intersects with the search result. The selected filters live only in the catalogue component.

Game images are **remote**: each file name in `games` is prefixed with `https://ext.same-assets.com/3977561172/`. `GameImage` replaces a failed remote image with a local CSS-backed text and icon fallback. The full catalogue can still function if that remote host is unavailable, but its original cover art will not appear. Check availability and image usage rights before launch, and prefer approved local assets.

`topupPackages` has 12 `[denomination, RM price]` pairs, from `14 (13+1) Diamonds` at RM 1.13 through `1192 (1010+182) Diamonds` at RM 81.30. **The same diamond list is shown for every game**, including titles whose currency may differ. The list is example content, not a live price feed. The selected package appears in the generated enquiry draft; the UI asks staff to reconfirm availability and price.

### Yogurt and repairs

`flavors` contains Mango, Blueberry, and Strawberry with a slug, marketing text, note, and local JPEG path. The photos visibly show packaged Limory products; the Mango packet says “Mango Sticky Rice.” The copy in the site describes mango yogurt more generally. If the displayed product, size, ingredients, and allergen details must be exact, confirm them against what is actually sold.

`repairs` contains four issue choices: Screen repair, Battery replacement, Charging issues, and Something else. Each has an icon name and explanatory text for the home-page selector. Separate model names and estimate tables are defined directly inside `src/App.tsx`, not in `src/data.ts`.

## 6. Home page: section by section

The hero's decorative background uses the supplied open-source React Bits DotGrid JavaScript + CSS component. GSAP `3.15.0` and its InertiaPlugin are installed in both lockfiles. The hero sets 3-pixel dots with a 20-pixel gap, a 140-pixel pointer proximity, and a 200-pixel click shockwave radius. The `--hero-dot-base` and `--hero-dot-active` CSS tokens supply light and dark palettes; a theme-attribute observer updates those canvas colours when the header toggle changes the theme. The canvas sits behind the existing content with no pointer hit area. Reduced-motion users see a static grid. Canvas frames pause outside the viewport or in a hidden tab; tweens, listeners, and observers are cleaned up on unmount. DotGrid and GSAP are loaded as a separate lazy chunk only for the home hero. This integration uses the user-supplied source and needs no Pro registry configuration or license key.

The home page starts with `Hero`: a three-line message and a bento-style set of links for gaming, repair, and yogurt. `PhoneArt` draws the two-phone illustration with HTML and CSS; it is not an image file. `Services` adds a three-item strip linking to the matching home anchors. `GameSection` shows the first six games and links to the full top-up catalogue. `RepairSection` offers four selectable repair issues; selection changes the explanatory paragraph, and its main action opens `/repair`. `YogurtSection` maps all three flavours to cards. A flavour button opens a yogurt enquiry dialog seeded with that flavour; “Make it a trio” starts with one of each.

`AboutSection` contains brand copy and three short service tags. `FaqSection` uses native `<details>` disclosures for top-up, repair, flavours, and allergens. `Footer` has a contact callout, service links, brand information, and a “Back to top” link. Home-page sections are visual and informational; the order and repair enquiries are completed on their dedicated page or in dialogs.

## 7. Top-up flow and tools

`TopupPage` renders the appropriate child for each top-up path. `TopupCatalog` shows the hero, a popular list only while the default search and category are active, then the complete list. Search and filter updates produce a result count; an empty state offers “Show all games” to reset both controls. Selecting a card follows its slug to the relevant enquiry page.

The order page shows the chosen game, its region/category, package cards, and a reassurance panel. `TopupForm` has three distinct cases:

1. Ordinary UID game: a required numeric player ID of 4–20 digits. Mobile Legends and Magic Chess slugs also require a numeric server/zone ID of 3–10 digits. Other UID games have an optional free-text server/region field, up to 50 characters.
2. “Via Login” category: the form omits player ID fields and displays a warning not to send passwords, verification codes, or recovery details. It still asks for a package and contact details.
3. Every game: one of the 12 radio-button packages is required, as are the customer's name and phone number. Contact fields are shared with repair and yogurt forms.

The name input is required and capped at 80 characters. The phone input is required and uses the HTML pattern `[+0-9() .\-]{7,20}`: 7–20 characters from digits, spaces, `+`, parentheses, period, and hyphen. The form relies on native HTML validation before its submit handler builds a plain-text enquiry. It does not check a game account, compute an order total, request payment, or send the message automatically.

`TopupCalculator` accepts a positive integer match count, a current win rate from 0 to 100, and a higher target below 100. It calculates `ceil(matches × (target − current) / (100 − target))`. For 200 matches, 50% current rate, and 60% target, the result is 50 consecutive wins. This is an estimate because the game's displayed win rate may be rounded. `TopupRegion` strips non-digits while entering an MLBB user ID and zone ID, then checks lengths of 4–20 and 3–10 digits respectively. Its success message explicitly says it cannot verify a real account or region. `TopupTracking` explains there is no connected order system; with no configured WhatsApp number it links back to games.

## 8. Repair flow

`RepairPage` presents a hero, three process steps, a device selector, an estimated service price table, a longer process explanation, and an inline `RepairForm`. The selector lists iPhone 11, iPhone 13, iPhone 15, Galaxy S23, Galaxy A54, and Redmi Note 13. Detailed hard-coded estimate arrays exist for the first four; Galaxy A54 and Redmi Note 13 use generic “From RM ...” fallback rows. For example, the iPhone 13 table lists an LCD screen replacement estimate of RM 550. These prices are planning examples, with the page repeatedly stating that final costs, parts, timing, fees, and warranty need confirmation.

Clicking a price row changes the page's `issue` state. The “Request a quote for [model]” button scrolls to the form. The form requests brand, model, issue, optional details (maximum 1,000 characters), name, and phone. It builds a quote request draft and does not book or charge the customer. The `RepairForm` component is also used inside a dialog opened by contact actions.

There is a current mismatch to understand before extending this flow: price rows use service names such as “LCD screen replacement,” while the form's issue `<select>` is populated from the four broad `repairs` labels. Choosing a price row can therefore give `RepairForm` a `defaultValue` that is not one of its option values. The selected device model also is not transferred into the form's model input; the customer must enter it again. These are source-level behavior limits, not evidence of an integrated booking process.

## 9. Yogurt, contact, and enquiry drafts

`YogurtForm` opens in a native dialog. A single-flavour action begins with quantity one for that flavour and zero for the others; the trio action begins with one of each. Plus and minus buttons clamp each flavour quantity between zero and 20. Submission is disabled when all quantities are zero. The form asks for name and phone, allows dietary or collection notes up to 500 characters, and produces a draft listing each chosen flavour and the total number of sticks. It has no price calculator or stock check. The notice asks customers to confirm dairy, ingredients, allergens, sizes, prices, and collection arrangements.

`Contact` is a selection dialog that sends a visitor to the top-up catalogue or switches the dialog to a repair or yogurt enquiry. It shows WhatsApp, email, and address only if those fields are configured in `business`; currently none are configured. `Modal` uses the native `<dialog>` element with `showModal()`, Escape/cancel handling, a close button, backdrop click handling, body scroll locking, and focus restoration when it unmounts. The same `modal` state drives contact, repair, and yogurt dialogs.

`RequestReady` is the shared result view for all three enquiries. It displays the generated plain-text message, says nothing has been sent, offers clipboard copying, and lets the customer return to edit their original form. If `business.whatsapp` is set, it also shows a WhatsApp link containing a URL-encoded draft; the customer must then send the message themselves. If clipboard access fails, the text can be selected manually. The form and draft remain in React component state only. Reloading the page clears them. The app does not save names, phone numbers, or enquiry contents to local storage; local storage holds only the theme choice.

## 10. Styling, responsiveness, and accessibility

`src/index.css` starts with a Google Fonts import for **DM Sans** and **Outfit**, followed by Tailwind's `base`, `components`, and `utilities` directives. Base CSS establishes typography, colours, the shared `.container`, buttons, links, focus styles, and global reset. Subsequent groups style the announcement/header, hero and bento tiles, CSS phone illustration, service strip, game cards, repair teaser, yogurt cards, story/FAQ/footer, dialogs/forms, top-up catalogue/tools/order view, and repair page. Most declarations are compressed onto long lines, so one line often contains many selectors. Editing by component class name is easier than navigating by line number alone.

Main responsive breakpoints include 1150, 900, 650, and 370 pixels; top-up-specific styles also use 1100 pixels, and very wide styling begins at 1600 pixels. At smaller sizes, the navigation becomes a menu, the six-column game grid becomes three then two columns, the repair and yogurt layouts stack, form fields and price tables become narrower, and the sticky top-up navigation adapts. The CSS uses `scroll-padding-top` to account for sticky headers. The design also has a dark theme under `html[data-theme="dark"]`, covering common page surfaces, cards, forms, and dialogs.

`index.html` reads the `3t-theme` local-storage key before first paint to avoid a light-mode flash when dark mode was selected. `Header` toggles the root `data-theme` attribute and saves `dark` or `light`; storage errors are caught so the toggle still works for the current page. The CSS disables animation and smooth scrolling under `prefers-reduced-motion: reduce`. The short page transition is only applied when reduced motion is not requested.

The shared skip link jumps to `#main-content`. Navigation controls have labels and expanded/current states. Game categories and repair options expose pressed states, result messages use live/status semantics where needed, and packages use native radio inputs. Dialogs rely on native modal focus containment. The FAQ uses native disclosure elements. The generated SVG icon component marks icons `aria-hidden="true"`; labels come from surrounding controls. A detail in `Icon` to remember: an unknown icon name falls back to the sparkle path. The repair pricing heading asks for `Icon name="tag"`, but `tag` is not defined in the icon map, so that instance currently renders a sparkle.

## 11. Testing and deployment behavior

`smoke.mjs` launches headless Chromium through Playwright and tests the running site. It checks the home page, featured cards and local yogurt images, top-up routes and 28-card catalogue, search/filter states, calculator result, ID format result, required order fields and shared packages, repair form output, yogurt quantity behavior, menu behavior, dark-mode persistence, reduced-motion behavior, several screen widths (1440, 768, 390, and 320 pixels), direct top-up page reload, and uncaught browser errors. It is a browser-level smoke test, not a unit-test suite. It requires Playwright and a browser installation plus a running development or preview server; those are not installed by this project's declared dependencies.

The normal production command is `npm run build`. Vite writes the built shell and hashed assets to `dist/`, while copying all `public/` assets. `wrangler.jsonc` points Cloudflare's static asset serving at `./dist` and uses `not_found_handling: "single-page-application"` so URLs such as `/topup/order/mobile-legends-my` can load directly. The committed `dist/_redirects` is another fallback convention and may serve hosts that support it; it is not the Wrangler setting. Because `dist/` is committed and not ignored, verify whether a deployment uses current source builds or committed output before publishing changes.

## 12. Where to make common changes

| Goal | Primary place to edit | Follow-up check |
| --- | --- | --- |
| Replace contact information or logo | `business` in `src/data.ts`; put logo in `public/images/` | Verify `wa.me` international digits, contact dialog, and all enquiry links. |
| Replace favicon or controller art | Corresponding asset under `public/` | Build and check its URL in the browser. |
| Add, remove, or rename a game | `games` in `src/data.ts` | Keep slugs unique; check category/region, image rights, search, and direct order URL. |
| Correct game-specific denominations or pricing | `topupPackages` in `src/data.ts`, then the package logic in `TopupForm` | The current array is shared across all games; game-specific packages require a data model change. |
| Change yogurt products | `flavors` in `src/data.ts` and the three photos in `public/images/` | Confirm actual product name, size, price, ingredient, and allergen copy. |
| Change repair estimates | `repairModels` and `repairPrices` in `src/App.tsx` | Keep displayed rows and form issue choices consistent; confirm prices and terms. |
| Change validation or enquiry text | `ContactFields`, `TopupForm`, `RepairForm`, `YogurtForm`, and `RequestReady` in `src/App.tsx` | Test native validity and the exact resulting draft. |
| Add a top-up tool or route | `TopupPage`, `topupLinks`, and title logic in `src/App.tsx` | Check direct loading and SPA fallback. |
| Change theme, layout, or responsive behavior | `src/index.css`, possibly `tailwind.config.js` | Check light/dark, mobile widths, dialogs, and reduced motion. |
| Change deployment fallback | `wrangler.jsonc` and the deployment build process | Check a direct nested URL after deployment. |

## 13. Launch readiness and current limitations

Before going live, replace the empty contact and logo fields, verify every game and package, and confirm repair estimates, currency, service coverage, hours, inspection fees, warranty terms, yogurt product details, and image permissions. The remote game art and Google-hosted fonts depend on external hosts. The current photos are third-party branded packages, so public marketing should match the real stock and usage rights.

The site currently prepares an enquiry only. There is no live top-up fulfillment, customer/order record, status tracker, repair appointment booking, inventory check, WhatsApp message delivery confirmation, or payment collection. No payment should be treated as complete because a draft appears. If live operations are required, they need a backend and a deliberate data and privacy design. The repair row/form issue mismatch and missing model prefill are concrete UI follow-ups in the current source. Finally, the two lockfiles and tracked `dist/` need a consistent project workflow so a deployment clearly reflects the intended source revision.
