# Orders and manager workflow

Customers add yogurt to a saved cart, choose collection or delivery, and submit their contact details. Top-up and repair requests use the same order inbox. A successful submission returns an order reference and private tracking link. The manager signs in, confirms quotes, posts status updates and records cash received or spent.

## Synthesis decision

Two independent architecture candidates were compared. Candidate A uses one orders table with validated service-specific details. Candidate B uses three service tables and immutable activity records. Choose A for one-manager operations, adding B's atomic public activity history. Separate service tables would multiply retry, tracking and inbox code without a present need. The requested candidate models were unavailable; the available inherited model produced both independent candidates.

`shared/orders.ts` defines the validated contract, money formatting and allowed status transitions. `shared/catalog.ts` owns product identifiers. The Worker owns price calculation, credentials, private tracking, status changes and the cashbook. The client owns cart quantities and pending submission credentials. Prices in submitted JSON have no authority.

Yogurt costs 180 sen per stick. Delivery needs five sticks and adds 100 sen, confirmed for delivery within TVETMARA Besut only. Top-up and repair requests need a manager-confirmed quote. Payment is manual DuitNow confirmation. Completing an order never records cash automatically.

## Persistence and access

One new D1 migration preserves existing reviews. Unique submission IDs and request hashes make retries safe. Order updates compare a version, and activity entries must commit with the update. Cash entries cannot be edited or deleted; corrections void them with a reason. Summaries exclude voided entries and use Malaysia calendar dates. Net cash is receipts minus outgoings, not profit.

A single manager credential is provisioned outside the browser. Password hashes remain in Worker secrets. Hashed, expiring session tokens use HttpOnly cookies; same-origin checks protect writes. Public tracking requires a random private key and exposes no contact details, game identifiers, address or internal notes. Login, order creation and tracking are rate limited.

## Modules

- `worker/commerce.js`, `worker/auth.js`: authenticated APIs, D1 writes and cash reporting.
- `src/features/orders`: validated HTTP client, submission state, receipts and tracking.
- `src/features/cart`: persistent quantities, checkout and flavour suggestions.
- `src/features/admin`: login, summary, orders, cashbook and payment settings.
- `src/App.tsx`: routes and existing service forms.

## Verification

Use an isolated local D1 database for API and browser checks. Exercise duplicate submissions, price tampering, invalid tracking keys, unauthorized admin access, concurrent updates, cash corrections and manager logout. Check mobile layouts, cart persistence, submission failures and existing reviews/repair selection.
