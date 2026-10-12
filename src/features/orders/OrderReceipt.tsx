import { useEffect, useState } from 'react';
import { formatMoney, shopSchema, statusLabels, type PublicOrder } from '../../../shared/orders';
import { request } from './api';
import './orders.css';
export function OrderProgress({ order }: { order: PublicOrder }) {
  const [shop, setShop] = useState<ReturnType<typeof shopSchema.parse> | null>(null);
  const [paymentError, setPaymentError] = useState('');
  useEffect(() => { let live = true; request('/api/shop', shopSchema).then(value => { if (live) setShop(value); }).catch(() => { if (live) setPaymentError('Payment instructions are unavailable. Please contact our team before paying.'); }); return () => { live = false; }; }, []);
  const balance = order.totalSen === null ? null : order.totalSen - order.paidSen;
  return <>
    <div className="order-status-strip"><span className="order-badge">{statusLabels[order.status]}</span><span>{order.service === 'yogurt' ? 'Fresh yogurt' : order.service === 'topup' ? 'Game top-up' : 'Phone repair'}</span></div>
    <div className="order-amounts"><div><span>Order total</span><strong>{order.totalSen === null ? 'Quote pending' : formatMoney(order.totalSen)}</strong></div><div><span>Payment confirmed</span><strong>{formatMoney(order.paidSen)}</strong></div>{balance !== null && <div><span>{balance < 0 ? 'Overpayment' : 'Balance'}</span><strong>{formatMoney(Math.abs(balance))}</strong></div>}</div>
    <ol className="order-timeline">{order.events.map((event, index) => <li key={`${event.createdAt}-${index}`}><span className="timeline-dot" /><div><strong>{statusLabels[event.status]}</strong>{event.message && <p>{event.message}</p>}<time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' })}</time></div></li>)}</ol>
    {order.status !== 'cancelled' && balance !== null && balance > 0 && <section className="payment-panel" aria-label="DuitNow payment"><div><h3>Pay with DuitNow</h3><p>Use <strong>{order.reference}</strong> as your payment reference. Your payment stays unconfirmed until our team checks it.</p>{shop?.instructions && <p>{shop.instructions}</p>}{paymentError ? <p role="status">{paymentError}</p> : shop?.qrDataUrl ? <img className="payment-qr" src={shop.qrDataUrl} alt="3T Station DuitNow payment QR code" /> : <p>{shop ? 'Our DuitNow QR will appear here when available. Contact our team to arrange payment.' : 'Loading payment instructions…'}</p>}</div></section>}
    {order.totalSen === null && <p className="order-muted">Our team will confirm availability and your quote before payment or work begins.</p>}
    <a className="text-link" href={`https://wa.me/601128094829?text=${encodeURIComponent(`Hi 3T Station, I have a question about order ${order.reference}.`)}`} target="_blank" rel="noreferrer">Contact us about this order ↗</a>
  </>;
}
export function trackingLink(reference: string, trackingKey: string) { return `${location.origin}/track#${new URLSearchParams({ reference, trackingKey })}`; }
export default function OrderReceipt({ order, trackingKey }: { order: PublicOrder; trackingKey: string }) {
  const [copied, setCopied] = useState(false);
  const url = trackingLink(order.reference, trackingKey);
  return <section className="order-receipt"><span className="eyebrow">ORDER SAVED</span><h2>{order.reference}</h2><p>Keep your private tracking link. Anyone with this link can see your order status.</p><div className="tracking-link-box"><input aria-label="Private tracking link" readOnly value={url} onFocus={event => event.currentTarget.select()} /><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { setCopied(false); } }}>{copied ? 'Copied' : 'Copy link'}</button></div><div className="order-actions"><a className="button" href={url}>Track this order ↗</a><a className="text-link" href="/">Back to store</a></div><OrderProgress order={order} /></section>;
}
