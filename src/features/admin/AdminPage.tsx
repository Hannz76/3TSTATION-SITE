import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { z } from 'zod';
import { adminOrderSchema, cashEntrySchema, cashInputSchema, cashListSchema, formatMoney, nextStatuses, okSchema, orderListSchema, parseMoney, paymentSettingsSchema, serviceSchema, sessionSchema, shopSchema, statusLabels, statusSchema, summarySchema, updateOrderSchema, type AdminOrder, type CashInput } from '../../../shared/orders';
import { ApiError, request } from '../orders/api';
import './admin.css';

type Tab = 'overview' | 'orders' | 'cashbook' | 'settings';
type Summary = z.infer<typeof summarySchema>;
type CashEntry = z.infer<typeof cashEntrySchema>;
type DateRange = { from: string; to: string };
type AdminRequest = <T>(path: string, schema: z.ZodType<T>, body?: unknown, method?: string) => Promise<T>;
const serviceNames = { yogurt: 'Yogurt', topup: 'Game top-up', repair: 'Phone repair' };
const cashNames = { payment: 'Order payment', refund: 'Order refund', income: 'Other income', expense: 'Expense' };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';
const malaysiaDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const timestamp = (value: string) => new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const rangeQuery = (range: DateRange) => new URLSearchParams({ from: range.from, to: range.to }).toString();

function Notice({ text, success = false }: { text: string; success?: boolean }) {
  return text ? <p className={`admin-notice${success ? ' is-success' : ''}`} role={success ? 'status' : 'alert'}>{text}</p> : null;
}
function Pagination({ page, total, busy, change }: { page: number; total: number; busy: boolean; change: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / 20));
  return <div className="admin-pagination"><span>{total} record{total === 1 ? '' : 's'} · Page {page} of {pages}</span><div><button type="button" disabled={busy || page <= 1} onClick={() => change(page - 1)}>Previous</button><button type="button" disabled={busy || page >= pages} onClick={() => change(page + 1)}>Next</button></div></div>;
}
function RangeFilter({ value, change }: { value: DateRange; change: (range: DateRange) => void }) {
  const [from, setFrom] = useState(value.from);
  const [to, setTo] = useState(value.to);
  return <form className="admin-range" onSubmit={event => { event.preventDefault(); if (from <= to) change({ from, to }); }}><label>From<input type="date" required value={from} max={to} onChange={event => setFrom(event.target.value)} /></label><label>To<input type="date" required value={to} min={from} onChange={event => setTo(event.target.value)} /></label><button className="button button-small button-outline" type="submit">Apply dates</button><small>Malaysia time</small></form>;
}
function Login({ onLogin, expired }: { onLogin: (username: string) => void; expired: boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { const session = await request('/api/admin/login', sessionSchema, { username, password }); setPassword(''); onLogin(session.username); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <div className="admin-login-wrap"><section className="admin-login admin-panel"><span className="eyebrow">3T STATION · MANAGER ACCESS</span><h1>{expired ? 'Welcome back.' : 'Your shop, in view.'}</h1><p>{expired ? 'Sign in again to continue. Your open form stays here.' : 'Manage orders, track cash and keep customers up to date.'}</p><form className="admin-form" onSubmit={submit}><label>Username<input autoComplete="username" required maxLength={100} value={username} onChange={event => setUsername(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label><Notice text={error} /><button className="button button-dark" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form><small>Access is set up by the shop owner.</small></section></div>;
}

export default function AdminPage() {
  const [session, setSession] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [receivedOnly, setReceivedOnly] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    request('/api/admin/session', sessionSchema).then(data => { if (active) { setSession(data.username); setHasLoggedIn(true); } }).catch(() => {}).finally(() => { if (active) setChecked(true); });
    return () => { active = false; };
  }, []);
  const adminRequest: AdminRequest = useCallback(async (path, schema, body, method) => {
    try { return await request(path, schema, body, method); }
    catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) setSession(null);
      throw cause;
    }
  }, []);
  async function logout() {
    try { await adminRequest('/api/admin/logout', okSchema, {}); setSession(null); setHasLoggedIn(false); setNotice(''); }
    catch (cause) { setNotice(errorMessage(cause)); }
  }
  const openReceived = () => { setReceivedOnly(true); setTab('orders'); };
  if (!checked) return <main id="main-content" className="admin-shell"><p role="status">Checking manager access…</p></main>;
  return <main id="main-content" className="admin-shell">
    {hasLoggedIn && <div hidden={!session}>
      <header className="admin-heading"><div><span className="eyebrow">3T STATION · SHOP DESK</span><h1>Manager dashboard</h1><p>Orders and cash, all in one place.</p></div><div className="admin-session"><span>{session}</span><button type="button" className="button button-small button-outline" onClick={logout}>Sign out</button></div></header>
      <nav className="admin-tabs" aria-label="Manager sections">{([{ id: 'overview', label: 'Overview' }, { id: 'orders', label: 'Orders' }, { id: 'cashbook', label: 'Cashbook' }, { id: 'settings', label: 'Payment settings' }] satisfies { id: Tab; label: string }[]).map(item => <button type="button" key={item.id} aria-current={tab === item.id ? 'page' : undefined} onClick={() => { setTab(item.id); if (item.id === 'orders') setReceivedOnly(false); }}>{item.label}</button>)}</nav>
      <Notice text={notice} />
      {tab === 'overview' && <Overview api={adminRequest} openReceived={openReceived} />}
      {tab === 'orders' && <Orders api={adminRequest} receivedOnly={receivedOnly} />}
      {tab === 'cashbook' && <Cashbook api={adminRequest} />}
      {tab === 'settings' && <PaymentSettings api={adminRequest} />}
    </div>}
    {!session && <Login expired={hasLoggedIn} onLogin={username => { setSession(username); setHasLoggedIn(true); }} />}
  </main>;
}

function Overview({ api, openReceived }: { api: AdminRequest; openReceived: () => void }) {
  const today = malaysiaDay();
  const [range, setRange] = useState<DateRange>({ from: `${today.slice(0, 7)}-01`, to: today });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [reload, setReload] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: The refresh counter reloads server data on request.
  useEffect(() => {
    let active = true; setBusy(true); setError('');
    api(`/api/admin/summary?${rangeQuery(range)}`, summarySchema).then(data => { if (active) setSummary(data); }).catch(cause => { if (active) setError(errorMessage(cause)); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [api, range, reload]);
  return <section className="admin-section"><div className="admin-section-heading"><div><h2>A clear view of the shop</h2><p>Order counts use the date received. Cash totals use the date recorded for each entry.</p></div><button type="button" className="admin-text-button" onClick={() => setReload(value => value + 1)}>Refresh</button></div><RangeFilter value={range} change={setRange} /><Notice text={error} />{busy && <p role="status">Loading overview…</p>}{summary && !busy && !error && <>
    <div className="admin-metrics"><Metric label="Orders received" value={String(summary.totalOrders)} /><Metric label="Open orders" value={String(summary.openOrders)} /><Metric label="Completed" value={String(summary.completedOrders)} /><button type="button" className="admin-metric admin-action-metric" onClick={openReceived}><span>New requests</span><strong>{summary.receivedOrders}</strong><small>View all new requests →</small></button></div>
    <div className="admin-cash-metrics"><Metric label="Cash in" value={formatMoney(summary.incomeSen)} /><Metric label="Cash out" value={formatMoney(summary.expenseSen)} /><Metric label="Net cash" value={formatMoney(summary.netSen)} /></div>
    <div className="admin-panel"><h3>Orders by service</h3><div className="admin-service-counts">{serviceSchema.options.map(service => <div key={service}><span>{serviceNames[service]}</span><strong>{summary.byService[service]}</strong></div>)}</div><p className="admin-help">Cash totals exclude voided entries. Quotes and unpaid orders do not count as cash received.</p></div>
  </>}</section>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="admin-metric"><span>{label}</span><strong>{value}</strong></div>; }

function Orders({ api, receivedOnly }: { api: AdminRequest; receivedOnly: boolean }) {
  const [service, setService] = useState('');
  const [status, setStatus] = useState(receivedOnly ? 'received' : '');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<z.infer<typeof orderListSchema> | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [reload, setReload] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: The refresh counter reloads server data on request.
  useEffect(() => {
    let active = true; setBusy(true); setError('');
    const params = new URLSearchParams({ service, status, q: query, page: String(page) });
    api(`/api/admin/orders?${params}`, orderListSchema).then(data => { if (active) setResult(data); }).catch(cause => { if (active) setError(errorMessage(cause)); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [api, service, status, query, page, reload]);
  if (selected) return <OrderDetail api={api} reference={selected} back={() => { setSelected(null); setReload(value => value + 1); }} />;
  return <section className="admin-section"><div className="admin-section-heading"><div><h2>Orders</h2><p>Customer requests across every service.</p></div><button type="button" className="admin-text-button" onClick={() => setReload(value => value + 1)}>Refresh</button></div><form className="admin-filters" onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search); }}><label>Service<select aria-label="Service" value={service} onChange={event => { setService(event.target.value); setPage(1); }}><option value="">All services</option>{serviceSchema.options.map(item => <option key={item} value={item}>{serviceNames[item]}</option>)}</select></label><label>Status<select aria-label="Status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{statusSchema.options.map(item => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label><label className="admin-search">Search<input placeholder="Reference, name or phone" value={search} maxLength={100} onChange={event => setSearch(event.target.value)} /></label><button type="submit" className="button button-small button-dark">Search</button></form><Notice text={error} />{busy ? <p role="status">Loading orders…</p> : result && !error && <><div className="admin-order-list">{result.orders.length === 0 && <div className="admin-empty">No orders match these filters.</div>}{result.orders.map(order => <button type="button" className="admin-order-row" key={order.reference} onClick={() => setSelected(order.reference)}><div><span className="admin-service-label">{serviceNames[order.service]}</span><strong>{order.reference}</strong><small>{order.draft.contact.name} · {order.draft.contact.phone}</small></div><div className="admin-order-description"><span>{order.description}</span><small>{timestamp(order.createdAt)}</small></div><div className="admin-order-numbers"><span className={`admin-status status-${order.status}`}>{statusLabels[order.status]}</span><strong>{order.totalSen === null ? 'Awaiting quote' : formatMoney(order.totalSen)}</strong><small>{formatMoney(order.paidSen)} paid</small></div><span aria-hidden="true">→</span></button>)}</div><Pagination page={page} total={result.total} busy={busy} change={setPage} /></>}</section>;
}

function OrderDetail({ api, reference, back }: { api: AdminRequest; reference: string; back: () => void }) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [revision, setRevision] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: The refresh counter reloads server data on request.
  useEffect(() => {
    let active = true; setBusy(true); setError('');
    api(`/api/admin/orders/${encodeURIComponent(reference)}`, adminOrderSchema).then(data => { if (active) setOrder(data); }).catch(cause => { if (active) setError(errorMessage(cause)); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [api, reference, revision]);
  return <section className="admin-section"><div className="admin-section-heading"><button type="button" className="admin-text-button" onClick={back}>← All orders</button><button type="button" className="admin-text-button" onClick={() => setRevision(value => value + 1)}>Reload order</button></div><Notice text={error} />{busy && <p role="status">Loading order…</p>}{order && !busy && <><div className="admin-detail-heading"><div><span className="eyebrow">{serviceNames[order.service]}</span><h2>{order.reference}</h2><p>Received {timestamp(order.createdAt)}</p></div><span className={`admin-status status-${order.status}`}>{statusLabels[order.status]}</span></div><div className="admin-detail-grid"><div><section className="admin-panel"><h3>Customer & request</h3><dl className="admin-details"><dt>Customer</dt><dd>{order.draft.contact.name}</dd><dt>Phone</dt><dd>{order.draft.contact.phone}</dd>{order.draft.service === 'yogurt' && <><dt>Items</dt><dd>{order.draft.items.map(line => <div key={line.flavorId}>{line.flavorId} × {line.quantity}</div>)}</dd><dt>Fulfilment</dt><dd>{order.draft.fulfillment.method === 'delivery' ? <>Delivery<br />{order.draft.fulfillment.address}</> : 'Self pickup'}</dd></>}{order.draft.service === 'topup' && <><dt>Game</dt><dd>{order.draft.gameSlug}</dd><dt>Package</dt><dd>{order.description}</dd><dt>Player UID</dt><dd>{order.draft.uid || 'Not required'}</dd><dt>Server / zone</dt><dd>{order.draft.server || 'Not required'}</dd></>}{order.draft.service === 'repair' && <><dt>Device</dt><dd>{order.draft.brand} {order.draft.model}</dd><dt>Issue</dt><dd>{order.draft.issue}</dd></>}<dt>Customer notes</dt><dd>{order.draft.notes || 'None'}</dd><dt>Total / quote</dt><dd>{order.totalSen === null ? 'Awaiting quote' : formatMoney(order.totalSen)}</dd><dt>Net paid</dt><dd>{formatMoney(order.paidSen)}</dd>{order.totalSen !== null && <><dt>Balance</dt><dd>{formatMoney(order.totalSen - order.paidSen)}</dd></>}</dl></section><section className="admin-panel"><h3>Customer-visible history</h3><ol className="admin-timeline">{order.events.map((event, index) => <li key={`${event.createdAt}-${index}`}><strong>{statusLabels[event.status]}</strong>{event.message && <p>{event.message}</p>}<small>{timestamp(event.createdAt)}</small></li>)}</ol></section></div><div><OrderEditor key={`${order.reference}-${order.version}-${revision}`} api={api} order={order} saved={setOrder} /><section className="admin-panel"><h3>Record a payment or refund</h3><p className="admin-help">Record money only after it has been received or returned.</p><CashForm api={api} reference={order.reference} saved={() => setRevision(value => value + 1)} /></section></div></div></>}</section>;
}

function OrderEditor({ api, order, saved }: { api: AdminRequest; order: AdminOrder; saved: (order: AdminOrder) => void }) {
  const [status, setStatus] = useState(order.status);
  const [quote, setQuote] = useState(order.totalSen === null ? '' : (order.totalSen / 100).toFixed(2));
  const [internalNote, setInternalNote] = useState(order.internalNote);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    const totalSen = quote.trim() ? parseMoney(quote) : null;
    if (quote.trim() && totalSen === null) { setError('Enter a valid RM amount, with up to two decimal places.'); return; }
    const result = updateOrderSchema.safeParse({ version: order.version, status, totalSen, internalNote, message });
    if (!result.success) { setError(result.error.issues[0]?.message || 'Review these details.'); return; }
    setBusy(true);
    try { saved(await api(`/api/admin/orders/${order.reference}`, adminOrderSchema, result.data, 'PATCH')); }
    catch (cause) { setError(`${errorMessage(cause)} If the order changed or the response was interrupted, reload the order and review it before saving again.`); }
    finally { setBusy(false); }
  }
  return <section className="admin-panel"><h3>Update order</h3><form className="admin-form" onSubmit={submit}><label>Status<select aria-label="Status" value={status} onChange={event => setStatus(statusSchema.parse(event.target.value))}>{[order.status, ...nextStatuses[order.status]].map(item => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label><label>Total / quote (RM)<input inputMode="decimal" placeholder="Leave blank if not yet quoted" value={quote} onChange={event => setQuote(event.target.value)} /></label><label>Customer status note<textarea maxLength={500} rows={3} value={message} onChange={event => setMessage(event.target.value)} placeholder="An update the customer can see" /></label><label>Internal note<textarea maxLength={2000} rows={3} value={internalNote} onChange={event => setInternalNote(event.target.value)} placeholder="Visible only to the manager" /></label><Notice text={error} /><button type="submit" className="button button-dark" disabled={busy}>{busy ? 'Saving…' : 'Save order update'}</button></form></section>;
}

function CashForm({ api, reference, saved }: { api: AdminRequest; reference?: string; saved: () => void }) {
  const [kind, setKind] = useState<CashInput['kind']>(reference ? 'payment' : 'expense');
  const [orderReference, setOrderReference] = useState(reference || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(malaysiaDay());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const attempt = useRef<{ fingerprint: string; id: string } | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSuccess('');
    const amountSen = parseMoney(amount);
    if (amountSen === null || amountSen <= 0) { setError('Enter an amount greater than RM 0.00, with up to two decimal places.'); return; }
    const fields = { kind, amountSen, occurredOn: date, note, ...(kind === 'payment' || kind === 'refund' ? { orderReference: orderReference.trim().toUpperCase() } : {}) };
    const fingerprint = JSON.stringify(fields);
    if (!attempt.current || attempt.current.fingerprint !== fingerprint) attempt.current = { fingerprint, id: crypto.randomUUID() };
    const parsed = cashInputSchema.safeParse({ ...fields, submissionId: attempt.current.id });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Review the entry details.'); return; }
    setBusy(true);
    try { await api('/api/admin/ledger', cashEntrySchema, parsed.data); setAmount(''); setNote(''); attempt.current = null; setSuccess('Cash entry recorded.'); saved(); }
    catch (cause) { setError(`${errorMessage(cause)} Retry with the same details if the response was interrupted.`); }
    finally { setBusy(false); }
  }
  return <form className="admin-form" onSubmit={submit}><label>Entry type<select aria-label="Entry type" value={kind} onChange={event => setKind(cashEntrySchema.shape.kind.parse(event.target.value))}>{(reference ? ['payment', 'refund'] : cashEntrySchema.shape.kind.options).map(item => <option key={item} value={item}>{cashNames[cashEntrySchema.shape.kind.parse(item)]}</option>)}</select></label>{(kind === 'payment' || kind === 'refund') && <label>Order reference<input required readOnly={Boolean(reference)} placeholder="3T-…" value={orderReference} onChange={event => setOrderReference(event.target.value)} /></label>}<div className="admin-form-pair"><label>Amount (RM)<input required inputMode="decimal" value={amount} placeholder="0.00" onChange={event => setAmount(event.target.value)} /></label><label>Date<input required type="date" value={date} onChange={event => setDate(event.target.value)} /></label></div><label>Note<textarea rows={2} required maxLength={500} value={note} onChange={event => setNote(event.target.value)} placeholder="What was this payment or expense for?" /></label><Notice text={error} /><Notice text={success} success /><button type="submit" className="button button-dark" disabled={busy}>{busy ? 'Recording…' : 'Record cash entry'}</button></form>;
}

function Cashbook({ api }: { api: AdminRequest }) {
  const today = malaysiaDay();
  const [range, setRange] = useState<DateRange>({ from: `${today.slice(0, 7)}-01`, to: today });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<z.infer<typeof cashListSchema> | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [reload, setReload] = useState(0);
  const [voiding, setVoiding] = useState<CashEntry | null>(null);
  const [reason, setReason] = useState('');
  const [voidError, setVoidError] = useState('');
  const [voidBusy, setVoidBusy] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: The refresh counter reloads server data on request.
  useEffect(() => {
    let active = true; setBusy(true); setError('');
    Promise.all([api(`/api/admin/ledger?${rangeQuery(range)}&page=${page}`, cashListSchema), api(`/api/admin/summary?${rangeQuery(range)}`, summarySchema)]).then(([entries, totals]) => { if (active) { setResult(entries); setSummary(totals); } }).catch(cause => { if (active) setError(errorMessage(cause)); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [api, range, page, reload]);
  async function voidEntry(event: FormEvent) {
    event.preventDefault(); if (!voiding) return; setVoidBusy(true); setVoidError('');
    try { await api(`/api/admin/ledger/${encodeURIComponent(voiding.id)}/void`, cashEntrySchema, { reason: reason.trim() }); setVoiding(null); setReason(''); setReload(value => value + 1); }
    catch (cause) { setVoidError(errorMessage(cause)); }
    finally { setVoidBusy(false); }
  }
  return <section className="admin-section"><div className="admin-section-heading"><div><h2>Cashbook</h2><p>Money received and spent. Every entry keeps its history.</p></div><button type="button" className="admin-text-button" onClick={() => setReload(value => value + 1)}>Refresh</button></div><RangeFilter value={range} change={value => { setRange(value); setPage(1); }} /><Notice text={error} />{summary && !busy && !error && <div className="admin-cash-metrics"><Metric label="Cash in" value={formatMoney(summary.incomeSen)} /><Metric label="Cash out" value={formatMoney(summary.expenseSen)} /><Metric label="Net cash" value={formatMoney(summary.netSen)} /></div>}<div className="admin-cash-grid"><div><h3 className="admin-list-heading">Entries</h3>{busy ? <p role="status">Loading cash entries…</p> : result && !error && <><div className="admin-ledger-list">{result.entries.length === 0 && <div className="admin-empty">No cash entries in this date range.</div>}{result.entries.map(entry => <article key={entry.id} className={`admin-ledger-entry${entry.voidedAt ? ' is-void' : ''}`}><div className="admin-ledger-top"><span className="admin-service-label">{cashNames[entry.kind]}</span><strong>{entry.kind === 'payment' || entry.kind === 'income' ? '+' : '−'}{formatMoney(entry.amountSen)}</strong></div><p>{entry.note}</p><small>{entry.occurredOn}{entry.orderReference ? ` · ${entry.orderReference}` : ''}</small>{entry.voidedAt ? <p className="admin-void-note">Voided: {entry.voidReason}</p> : <button type="button" className="admin-text-button" onClick={() => { setVoiding(entry); setReason(''); setVoidError(''); }}>Void entry</button>}</article>)}</div><Pagination page={page} total={result.total} busy={busy} change={setPage} /></>}{voiding && <section className="admin-panel admin-void-panel"><h3>Void {formatMoney(voiding.amountSen)} entry?</h3><p>This excludes the entry from cash totals and retains its history.</p><form className="admin-form" onSubmit={voidEntry}><label>Reason<textarea required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></label><Notice text={voidError} /><div className="admin-actions"><button className="button button-dark" type="submit" disabled={voidBusy || !reason.trim()}>{voidBusy ? 'Voiding…' : 'Confirm void'}</button><button className="button button-outline" type="button" disabled={voidBusy} onClick={() => setVoiding(null)}>Cancel</button></div></form></section>}</div><section className="admin-panel"><h3>Add a cash entry</h3><p className="admin-help">Use order payments and refunds when money belongs to a customer order.</p><CashForm api={api} saved={() => setReload(value => value + 1)} /></section></div></section>;
}

function PaymentSettings({ api }: { api: AdminRequest }) {
  const [qr, setQr] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: The refresh counter reloads server data on request.
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    api('/api/shop', shopSchema).then(data => { if (active) { setQr(data.qrDataUrl); setInstructions(data.instructions); setLoaded(true); } }).catch(cause => { if (active) setError(errorMessage(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api, reload]);
  function upload(file?: File) {
    if (!file) return; setError(''); setSuccess('');
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 300 * 1024) { setError('Choose a PNG or JPEG image no larger than 300 KB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') setQr(reader.result); };
    reader.onerror = () => setError('This image could not be read. Choose it again.');
    reader.readAsDataURL(file);
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try { const settings = paymentSettingsSchema.parse({ qrDataUrl: qr, instructions }); await api('/api/admin/payment-settings', paymentSettingsSchema, settings, 'PUT'); setSuccess('Payment settings saved. Customers will see these details.'); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <section className="admin-section"><div className="admin-section-heading"><div><h2>Payment settings</h2><p>The QR code and instructions shown to customers after ordering.</p></div><button className="admin-text-button" type="button" onClick={() => setReload(value => value + 1)}>Reload settings</button></div><Notice text={error} />{loading ? <p role="status">Loading payment settings…</p> : loaded && <form className="admin-settings-grid" onSubmit={submit}><section className="admin-panel"><h3>Payment QR</h3><div className="admin-qr-preview">{qr ? <img src={qr} alt="Current customer payment QR code" /> : <p>No payment QR configured.<br /><small>Add one when it is ready.</small></p>}</div><label className="admin-upload-label">Choose QR image<input type="file" accept="image/png,image/jpeg" onChange={event => upload(event.target.files?.[0])} /></label><p className="admin-help">PNG or JPEG, up to 300 KB. Check that the QR belongs to the shop before saving.</p>{qr && <button type="button" className="admin-text-button" onClick={() => { setQr(null); setSuccess(''); }}>Remove QR image</button>}</section><section className="admin-panel"><h3>Customer instructions</h3><div className="admin-form"><label>Payment instructions<textarea rows={7} maxLength={500} value={instructions} onChange={event => { setInstructions(event.target.value); setSuccess(''); }} placeholder="Tell customers how to pay and how payment is confirmed." /></label><p className="admin-help">Payments are confirmed manually. Uploading a QR does not automatically mark an order as paid.</p><Notice text={success} success /><button type="submit" className="button button-dark" disabled={busy}>{busy ? 'Saving…' : 'Save payment settings'}</button></div></section></form>}</section>;
}
