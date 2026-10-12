import { useRef, useState } from 'react';
import { z } from 'zod';
import { draftSchema, receiptSchema, type OrderDraft, type PublicOrder } from '../../../shared/orders';
import { request } from './api';

const pendingSchema = z.object({ fingerprint: z.string(), submissionId: z.string().uuid(), trackingKey: z.string().regex(/^[a-f0-9]{64}$/) });
export type Receipt = { order: PublicOrder; trackingKey: string; submissionId: string };
const hex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
export function useOrderSubmission() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const attempt = useRef<z.infer<typeof pendingSchema> | null>(null);
  async function submit(input: OrderDraft): Promise<Receipt | null> {
    if (busy.current) return null;
    busy.current = true; setPending(true); setError('');
    try {
      const draft = draftSchema.parse(input);
      const fingerprint = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(draft)))));
      const storageKey = `3t-pending-${draft.service}`;
      if (!attempt.current) {
        try { const saved = pendingSchema.safeParse(JSON.parse(sessionStorage.getItem(storageKey) || 'null')); if (saved.success) attempt.current = saved.data; } catch { /* Memory still preserves retries when storage is unavailable. */ }
      }
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, submissionId: crypto.randomUUID(), trackingKey: hex(crypto.getRandomValues(new Uint8Array(32))) };
      try { sessionStorage.setItem(storageKey, JSON.stringify(attempt.current)); } catch { /* Storage is optional. */ }
      const result = await request('/api/orders', receiptSchema, { draft, submissionId: attempt.current.submissionId, trackingKey: attempt.current.trackingKey });
      const next = { ...result, trackingKey: attempt.current.trackingKey, submissionId: attempt.current.submissionId };
      setReceipt(next);
      try { sessionStorage.setItem('3t-last-tracking', JSON.stringify({ reference: result.order.reference, trackingKey: next.trackingKey })); } catch { /* The receipt remains copyable. */ }
      return next;
    } catch (failure) {
      setError(failure instanceof z.ZodError ? failure.issues[0]?.message || 'Please check your details.' : failure instanceof Error ? failure.message : 'Unable to save your order. Please try again.');
      return null;
    } finally { busy.current = false; setPending(false); }
  }
  return { receipt, pending, error, submit };
}
