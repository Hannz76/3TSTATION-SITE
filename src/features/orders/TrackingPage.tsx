import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { receiptSchema, trackingSchema, type PublicOrder } from '../../../shared/orders';
import { request } from './api';
import { OrderProgress } from './OrderReceipt';
function savedTracking() {
  try {
    const hash = new URLSearchParams(location.hash.slice(1));
    const parsed = trackingSchema.safeParse(hash.has('reference') ? { reference: hash.get('reference'), trackingKey: hash.get('trackingKey') } : JSON.parse(sessionStorage.getItem('3t-last-tracking') || 'null'));
    if (parsed.success) { sessionStorage.setItem('3t-last-tracking', JSON.stringify(parsed.data)); if (hash.has('reference')) history.replaceState(null, '', location.pathname); return parsed.data; }
  } catch { /* Manual tracking remains available. */ }
  return { reference: '', trackingKey: '' };
}
export default function TrackingPage({ embedded = false }: { embedded?: boolean }) {
  const [credentials] = useState(savedTracking);
  const [reference, setReference] = useState(credentials.reference);
  const [trackingKey, setKey] = useState(credentials.trackingKey);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const load = useCallback(async (ref: string, key: string) => {
    setLoading(true); setError(''); setOrder(null);
    const parsed = trackingSchema.safeParse({ reference: ref.trim().toUpperCase(), trackingKey: key.trim() });
    if (!parsed.success) { setError('Enter the order number and private tracking key from your confirmation link.'); setLoading(false); return; }
    try { const result = await request('/api/orders/track', receiptSchema, parsed.data); setOrder(result.order); try { sessionStorage.setItem('3t-last-tracking', JSON.stringify(parsed.data)); } catch { /* Tracking works without storage. */ } }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load this order.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (credentials.reference) void load(credentials.reference, credentials.trackingKey); }, [credentials, load]);
  const submit = (event: FormEvent) => { event.preventDefault(); void load(reference, trackingKey); };
  const content = <><div className="commerce-heading"><span className="eyebrow">YOUR ORDER</span><h1>Track your order.</h1><p>Top-ups, repairs and yogurt. Check the latest update here.</p></div><div className="tracking-layout"><form className="commerce-panel enquiry-form" onSubmit={submit}><label>Order number<input name="reference" required value={reference} onChange={event => setReference(event.target.value)} placeholder="3T-…" autoComplete="off" /></label><label>Private tracking key<input name="trackingKey" type="password" required value={trackingKey} onChange={event => setKey(event.target.value)} autoComplete="off" /></label><button className="button" disabled={loading}>{loading ? 'Checking…' : 'Check status'}</button>{error && <p className="order-error" role="alert">{error}</p>}<p className="order-muted">Open the link saved after checkout to fill these in automatically. Lost the link? <a href="https://wa.me/601128094829" target="_blank" rel="noreferrer">Contact our team.</a></p></form><div className="commerce-panel" aria-live="polite">{order ? <><h2>{order.reference}</h2><OrderProgress order={order} /></> : <div className="tracking-empty"><span aria-hidden="true">↗</span><h2>Your updates, in one place.</h2><p>Status and confirmed payments will appear here.</p></div>}</div></div></>;
  return embedded ? <section className="commerce-page">{content}</section> : <main id="main-content" className="container commerce-page">{content}</main>;
}
