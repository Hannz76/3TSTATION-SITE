import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { cartSchema, flavorSchema, type CartLine } from '../../../shared/orders';
const key = '3t-yogurt-cart-v1';
const storageSchema = z.object({ version: z.literal(1), items: cartSchema, acknowledged: z.array(z.string()).max(30) });
type Cart = z.infer<typeof storageSchema>;
let snapshot: Cart = { version: 1, items: [], acknowledged: [] };
const listeners = new Set<() => void>();
function read() { try { const saved = storageSchema.safeParse(JSON.parse(localStorage.getItem(key) || 'null')); if (saved.success) snapshot = saved.data; } catch { /* A private browser can still use the cart in memory. */ } }
read();
window.addEventListener('storage', event => { if (event.key === key) { snapshot = { version: 1, items: [], acknowledged: [] }; read(); for (const listener of listeners) listener(); } });
function save(next: Cart) { snapshot = next; try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Cart remains usable for this page. */ } for (const listener of listeners) listener(); }
export function changeCart(flavorId: string, delta: number) {
  const flavor = flavorSchema.parse(flavorId);
  read();
  const quantity = Math.max(0, Math.min(20, (snapshot.items.find(line => line.flavorId === flavor)?.quantity || 0) + delta));
  const items = snapshot.items.filter(line => line.flavorId !== flavor);
  if (quantity) items.push({ flavorId: flavor, quantity });
  save({ ...snapshot, items });
}
export function acknowledgeCart(lines: CartLine[], submissionId: string) {
  read();
  if (snapshot.acknowledged.includes(submissionId)) return;
  const items = snapshot.items.map(line => ({ ...line, quantity: Math.max(0, line.quantity - (lines.find(submitted => submitted.flavorId === line.flavorId)?.quantity || 0)) })).filter(line => line.quantity > 0);
  save({ ...snapshot, items, acknowledged: [...snapshot.acknowledged, submissionId].slice(-30) });
}
export function useCart() {
  const cart = useSyncExternalStore(callback => { listeners.add(callback); return () => { listeners.delete(callback); }; }, () => snapshot);
  return { items: cart.items, count: cart.items.reduce((sum, line) => sum + line.quantity, 0), change: changeCart };
}
