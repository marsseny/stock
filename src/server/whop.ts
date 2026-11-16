/**
 * Whop integration over plain `fetch` + Web Crypto (no SDK, works on any runtime).
 *
 * - `fetchWhopPayment` — reads a payment (receipt) with the company API key and normalizes it.
 * - `verifyWhopWebhook` — checks the webhook signature with WHOP_WEBHOOK_SECRET.
 *   Supports Standard Webhooks headers (`webhook-id`, `webhook-timestamp`, `webhook-signature`)
 *   used by current Whop webhooks, and the legacy `x-whop-signature: t=…,v1=…` header.
 */

import { getEnv, requireEnv } from './env';

export interface WhopPayment {
  id: string;
  status: string;
  planId?: string;
  email?: string;
  paid: boolean;
}

const API_BASE = 'https://api.whop.com/api';

const PAID_STATUSES = new Set(['paid', 'succeeded', 'success', 'completed', 'complete']);

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);

function pathString(source: unknown, path: string[]): string | undefined {
  let current: unknown = source;
  for (const key of path) {
    if (!isObject(current)) return undefined;
    current = current[key];
  }
  return typeof current === 'string' && current.trim() !== '' ? current.trim() : undefined;
}

function firstString(source: unknown, paths: string[][]): string | undefined {
  for (const path of paths) {
    const value = pathString(source, path);
    if (value) return value;
  }
  return undefined;
}

/** Extracts the useful fields from any known shape of a Whop payment / receipt object. */
export function normalizeWhopPayment(raw: unknown): WhopPayment | null {
  if (!isObject(raw)) return null;
  const id = firstString(raw, [['id'], ['receipt_id'], ['payment_id']]);
  if (!id) return null;

  const status = (firstString(raw, [['status'], ['substatus']]) ?? '').toLowerCase();
  const planId = firstString(raw, [['plan_id'], ['plan', 'id'], ['membership', 'plan_id'], ['membership', 'plan', 'id']]);
  const email = firstString(raw, [
    ['email'],
    ['user_email'],
    ['user', 'email'],
    ['member', 'email'],
    ['member', 'user', 'email'],
    ['membership', 'email'],
    ['membership', 'user', 'email'],
    ['billing_details', 'email'],
    ['customer', 'email'],
  ]);
  const paidAt = firstString(raw, [['paid_at']]);
  const paid = PAID_STATUSES.has(status) || (status === '' && Boolean(paidAt));

  return { id, status, planId, email: email?.toLowerCase(), paid };
}

async function whopGet(path: string, apiKey: string): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
  });
}

/**
 * Loads a payment by its receipt id (`pay_…` / `R-…`).
 * Tries the current v1 API first and falls back to the v2 API. Returns `null` when Whop does not know the id.
 */
export async function fetchWhopPayment(receiptId: string): Promise<WhopPayment | null> {
  const apiKey = requireEnv('WHOP_API_KEY');
  const id = encodeURIComponent(receiptId);
  const attempts = [`/v1/payments/${id}`, `/v2/payments/${id}?expand[]=user&expand[]=membership`];
  let lastError = '';

  for (const path of attempts) {
    const res = await whopGet(path, apiKey);
    if (res.ok) {
      const body: unknown = await res.json();
      const payment = normalizeWhopPayment(isObject(body) && isObject(body.data) ? body.data : body);
      if (payment) return payment;
      lastError = 'unexpected response shape';
      continue;
    }
    if (res.status === 404) {
      lastError = 'not found';
      continue;
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Whop API rejected WHOP_API_KEY (HTTP ${res.status}).`);
    }
    lastError = `HTTP ${res.status}`;
  }

  if (lastError === 'not found') return null;
  throw new Error(`Whop API: could not load payment ${receiptId} (${lastError}).`);
}

/* ------------------------------------------------------------------ */
/* Webhook signature verification                                      */
/* ------------------------------------------------------------------ */

const encoder = new TextEncoder();

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256(keyBytes: Uint8Array, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', keyBytes as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return new Uint8Array(signature);
}

/** Candidate HMAC keys: `whsec_<base64>` → decoded bytes; plain secret → its UTF-8 bytes (Whop SDK behaviour). */
function secretKeys(secret: string): Uint8Array[] {
  const keys: Uint8Array[] = [encoder.encode(secret)];
  const b64 = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  try {
    keys.push(base64ToBytes(b64));
  } catch {
    // Not base64 — the UTF-8 variant above is used.
  }
  return keys;
}

const TOLERANCE_SECONDS = 5 * 60;

function timestampIsFresh(timestamp: string): boolean {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const seconds = ts > 1e12 ? ts / 1000 : ts;
  return Math.abs(Date.now() / 1000 - seconds) <= TOLERANCE_SECONDS;
}

async function verifyStandardWebhook(headers: Headers, body: string, secret: string): Promise<boolean> {
  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  const signatureHeader = headers.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader || !timestampIsFresh(timestamp)) return false;

  const provided = signatureHeader
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.includes(',') ? part.split(',')[1] : part));

  for (const key of secretKeys(secret)) {
    const expected = bytesToBase64(await hmacSha256(key, `${id}.${timestamp}.${body}`));
    if (provided.some((sig) => timingSafeEqual(sig, expected))) return true;
  }
  return false;
}

async function verifyLegacyWebhook(headers: Headers, body: string, secret: string): Promise<boolean> {
  const header = headers.get('x-whop-signature');
  if (!header) return false;
  const parts = new Map(
    header.split(',').map((part) => {
      const [k, ...rest] = part.trim().split('=');
      return [k, rest.join('=')] as [string, string];
    }),
  );
  const timestamp = parts.get('t');
  const signature = parts.get('v1');
  if (!timestamp || !signature || !timestampIsFresh(timestamp)) return false;

  for (const key of secretKeys(secret)) {
    const expected = bytesToHex(await hmacSha256(key, `${timestamp}.${body}`));
    if (timingSafeEqual(signature.toLowerCase(), expected)) return true;
  }
  return false;
}

/**
 * Returns `true` when the request is signed with WHOP_WEBHOOK_SECRET.
 * When the secret is not configured, verification is skipped (local testing) and `true` is returned.
 */
export async function verifyWhopWebhook(headers: Headers, rawBody: string): Promise<boolean> {
  const secret = getEnv('WHOP_WEBHOOK_SECRET');
  if (!secret) {
    console.warn('WHOP_WEBHOOK_SECRET is not set — webhook signature verification is skipped.');
    return true;
  }
  if (await verifyStandardWebhook(headers, rawBody, secret)) return true;
  return verifyLegacyWebhook(headers, rawBody, secret);
}
