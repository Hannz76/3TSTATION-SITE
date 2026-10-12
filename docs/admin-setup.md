# Manager access

The manager opens `/admin`. There is no public account creation or default password. One manager controls orders, public status updates, the cashbook and the DuitNow QR image.

Use Node 22.22.2 or newer. The Worker uses Cloudflare's supported `node:crypto` scrypt implementation with Node compatibility enabled. The password verifier uses a random 16-byte salt, N=32768, r=8, p=3 and a 32-byte result. Password verification needs enough CPU allowance for login. Cloudflare documents a [10 ms CPU limit on the free Workers plan](https://developers.cloudflare.com/workers/platform/limits/#cpu-time), which is too restrictive to rely on for this password work factor. Use the paid plan and verify a login after deployment; do not lower the work factor to fit the free CPU allowance. The plaintext password is never written to a file or passed as a command argument.

## Local setup

Run `node scripts/setup-admin.mjs --local` in a terminal. Choose a username and a unique password of at least 14 characters. The helper creates `.dev.vars` with owner-only permissions and refuses to overwrite an existing file. Preserve any existing secrets before replacing that file. `.dev.vars` is ignored by Git.

Apply migrations with `npm run db:migrate`, build with `npm run build`, then run `npm run dev:api`. Open the local Worker URL and sign in at `/admin`. The local cookie exception requires `LOCAL_ADMIN_DEV="true"` and an HTTP loopback hostname. It cannot disable HTTPS protection on a public hostname.

## Production provisioning

After reviewing the release and authenticating Wrangler, run `node scripts/setup-admin.mjs --remote`. The helper asks before storing `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` as Worker secrets. It does not deploy code or run migrations. Do not set `LOCAL_ADMIN_DEV` in production. Apply the new migration and deploy through the existing deployment workflow.

Changing either credential invalidates existing sessions because each session records the credential fingerprint. Sessions expire after eight hours. Logout deletes the server session and clears its cookie. Login attempts are limited per source address. Keep the chosen password in a password manager. To recover access, rerun remote provisioning with a new password; there is no public reset endpoint.

In the manager payment settings, upload a PNG or JPEG of the business DuitNow QR, at most 300 KB. Confirm that it routes funds to the correct account. Customers see payment instructions only; uploading a QR does not connect a bank or verify a transfer.

## Orders and cash records

Yogurt costs RM1.80 per stick. Delivery requires five sticks and costs RM1 per order within TVETMARA Besut only. Pickup has no shipping charge. Top-up and repair requests start without a final price; set the agreed amount in the order after confirming it with the customer.

Payment and refund entries must reference an order. General income and expenses have no order link. All amounts use integer sen in storage. Completing an order does not record payment. Cashbook totals use the entered Malaysia transaction date and exclude voided entries. Correct an entry by voiding it with a reason and entering its replacement. Net cash is receipts minus outgoings, not accounting profit.

Each order has a private tracking key. Public tracking shows status, public messages and amounts, but no contact details, delivery address, account identifiers or internal notes. Public status messages must avoid these private details. Customer links cannot be recovered from the stored hash; a customer who loses one should contact the business.

## Verification

Run `node tests/orders-api.mjs` for an isolated local D1 API check. It uses a temporary configuration and temporary test credentials and does not change remote data or the local `.dev.vars` file. Existing review and repair checks should also pass before release.
