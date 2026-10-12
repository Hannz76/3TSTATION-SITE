import { z } from 'zod';
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); this.name = 'ApiError'; } }
const errorSchema = z.object({ error: z.string() });
export async function request<T>(path: string, schema: z.ZodType<T>, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(path, { method, credentials: 'same-origin', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
    const data: unknown = await response.json();
    if (!response.ok) { const error = errorSchema.safeParse(data); throw new ApiError(error.success ? error.data.error : 'Unable to complete this request. Please try again.', response.status); }
    return schema.parse(data);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('The response took too long. Please retry with the same details.');
    if (error instanceof z.ZodError) throw new Error('Unexpected response. Please refresh and try again.');
    throw error;
  } finally { window.clearTimeout(timeout); }
}
