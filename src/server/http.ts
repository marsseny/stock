/** Small helpers for standard Fetch API handlers. */

import { MissingEnvError } from './env';

export type Handler = (req: Request) => Promise<Response>;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return json({ error: error.code, message: error.message }, error.status);
  }
  if (error instanceof MissingEnvError) {
    console.error(error.message);
    return json({ error: 'server_not_configured', message: error.message }, 503);
  }
  console.error('Unhandled server error:', error);
  return json({ error: 'internal_error', message: 'Something went wrong. Please try again.' }, 500);
}

/** Wraps a handler with CORS preflight, method checks and uniform error responses. */
export function createHandler(methods: string[], handler: Handler): Handler {
  const allowed = methods.map((m) => m.toUpperCase());
  return async (req: Request): Promise<Response> => {
    const method = req.method.toUpperCase();
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (!allowed.includes(method)) {
      return json({ error: 'method_not_allowed', message: `Use ${allowed.join(' or ')}.` }, 405, {
        Allow: [...allowed, 'OPTIONS'].join(', '),
      });
    }
    try {
      return await handler(req);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function readJsonBody<T extends object>(req: Request): Promise<Partial<T>> {
  const text = await req.text();
  if (!text.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Partial<T>;
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body must be valid JSON.');
  }
  throw new HttpError(400, 'invalid_json', 'Request body must be a JSON object.');
}

export function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (value: string): boolean => EMAIL_RE.test(value);
