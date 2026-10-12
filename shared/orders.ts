import { z } from 'zod';

export const serviceSchema = z.enum(['yogurt', 'topup', 'repair']);
export const statusSchema = z.enum(['received', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled']);
export type OrderStatus = z.infer<typeof statusSchema>;
export const statusLabels: Record<OrderStatus, string> = { received: 'Received', confirmed: 'Confirmed', in_progress: 'In progress', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' };
export const nextStatuses: Record<OrderStatus, OrderStatus[]> = { received: ['confirmed', 'cancelled'], confirmed: ['in_progress', 'cancelled'], in_progress: ['ready', 'completed', 'cancelled'], ready: ['completed', 'cancelled'], completed: [], cancelled: [] };
export const moneySchema = z.number().int().min(0).max(100000000);
export const flavorSchema = z.enum(['mango', 'blueberry', 'strawberry']);
export const cartLineSchema = z.object({ flavorId: flavorSchema, quantity: z.number().int().min(1).max(20) }).strict();
export type CartLine = z.infer<typeof cartLineSchema>;
export const cartSchema = z.array(cartLineSchema).max(3).refine(lines => new Set(lines.map(line => line.flavorId)).size === lines.length, 'Each flavour can appear once.');
const contactSchema = z.object({ name: z.string().trim().min(1).max(80), phone: z.string().trim().regex(/^[+0-9() .\-]{7,20}$/).refine(phone => phone.replace(/\D/g, '').length >= 7, 'Enter a valid phone number.') }).strict();
const common = { contact: contactSchema, notes: z.string().trim().max(1000), consent: z.literal(true) };
export const draftSchema = z.discriminatedUnion('service', [
  z.object({ ...common, service: z.literal('yogurt'), items: cartSchema.refine(lines => lines.length > 0, 'Add yogurt to your cart.'), fulfillment: z.discriminatedUnion('method', [z.object({ method: z.literal('pickup') }).strict(), z.object({ method: z.literal('delivery'), address: z.string().trim().min(10).max(500) }).strict()]) }).strict(),
  z.object({ ...common, service: z.literal('topup'), gameSlug: z.string().max(100), packageId: z.number().int().min(0).max(11), uid: z.string().trim().max(20), server: z.string().trim().max(50) }).strict(),
  z.object({ ...common, service: z.literal('repair'), brand: z.string().trim().min(1).max(80), model: z.string().trim().min(1).max(80), issue: z.string().trim().min(1).max(100) }).strict(),
]);
export type OrderDraft = z.infer<typeof draftSchema>;
export const attemptSchema = z.object({ submissionId: z.string().uuid(), trackingKey: z.string().regex(/^[a-f0-9]{64}$/), draft: draftSchema }).strict();
export const trackingSchema = z.object({ reference: z.string().regex(/^3T-[A-F0-9]{12}$/), trackingKey: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const eventSchema = z.object({ status: statusSchema, message: z.string(), createdAt: z.string() });
export const publicOrderSchema = z.object({ reference: z.string(), service: serviceSchema, status: statusSchema, totalSen: moneySchema.nullable(), paidSen: z.number().int(), createdAt: z.string(), updatedAt: z.string(), events: z.array(eventSchema) });
export type PublicOrder = z.infer<typeof publicOrderSchema>;
export const receiptSchema = z.object({ order: publicOrderSchema });
export const adminOrderSchema = publicOrderSchema.extend({ version: z.number().int(), draft: draftSchema, internalNote: z.string(), description: z.string() });
export type AdminOrder = z.infer<typeof adminOrderSchema>;
export const orderListSchema = z.object({ orders: z.array(adminOrderSchema), total: z.number().int(), page: z.number().int() });
export const updateOrderSchema = z.object({ version: z.number().int().min(1), status: statusSchema, totalSen: moneySchema.nullable(), internalNote: z.string().trim().max(2000), message: z.string().trim().max(500) }).strict();
const cashCommon = { submissionId: z.string().uuid(), amountSen: moneySchema.refine(n => n > 0), occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), note: z.string().trim().min(1).max(500) };
export const cashInputSchema = z.discriminatedUnion('kind', [
  z.object({ ...cashCommon, kind: z.literal('payment'), orderReference: trackingSchema.shape.reference }).strict(),
  z.object({ ...cashCommon, kind: z.literal('refund'), orderReference: trackingSchema.shape.reference }).strict(),
  z.object({ ...cashCommon, kind: z.literal('income') }).strict(),
  z.object({ ...cashCommon, kind: z.literal('expense') }).strict(),
]);
export type CashInput = z.infer<typeof cashInputSchema>;
export const cashEntrySchema = z.object({ id: z.string(), kind: z.enum(['payment', 'refund', 'income', 'expense']), amountSen: moneySchema, occurredOn: z.string(), note: z.string(), orderReference: z.string().nullable(), createdAt: z.string(), voidedAt: z.string().nullable(), voidReason: z.string().nullable() });
export const cashListSchema = z.object({ entries: z.array(cashEntrySchema), total: z.number().int(), page: z.number().int() });
export const summarySchema = z.object({ totalOrders: z.number().int(), openOrders: z.number().int(), receivedOrders: z.number().int(), completedOrders: z.number().int(), incomeSen: z.number().int(), expenseSen: z.number().int(), netSen: z.number().int(), byService: z.object({ yogurt: z.number().int(), topup: z.number().int(), repair: z.number().int() }) });
export const paymentSettingsSchema = z.object({ qrDataUrl: z.string().nullable(), instructions: z.string().max(500) });
export const shopSchema = paymentSettingsSchema.extend({ unitSen: z.literal(180), deliverySen: z.literal(100), deliveryMinimum: z.literal(5) });
export const sessionSchema = z.object({ username: z.string() });
export const okSchema = z.object({ ok: z.literal(true) });
export const formatMoney = (sen: number) => `RM ${(sen / 100).toFixed(2)}`;
export function parseMoney(value: string): number | null {
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ''] = value.trim().split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return moneySchema.safeParse(amount).success ? amount : null;
}
