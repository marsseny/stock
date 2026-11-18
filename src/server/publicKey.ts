/**
 * Finds the PUBLIC Supabase key (legacy `anon` JWT or new `sb_publishable_…`) in the server env.
 *
 * Several common variable names are accepted, and every candidate is checked so a secret key
 * (`service_role` JWT or `sb_secret_…`) pasted by mistake is never sent to the browser.
 */

import { getEnv } from './env';

const NAMES = [
  'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_KEY',
];

function jwtRole(token: string): string | undefined {
  const parts = token.split('.');
  if (parts.length !== 3) return undefined;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : undefined;
  } catch {
    return undefined;
  }
}

/** `true` only for keys that are safe to expose: an `anon` JWT or an `sb_publishable_` key. */
export function isPublicKey(key: string): boolean {
  if (key.startsWith('sb_publishable_')) return true;
  if (key.startsWith('sb_secret_')) return false;
  return jwtRole(key) === 'anon';
}

export function getPublicSupabaseKey(): string | undefined {
  for (const name of NAMES) {
    const value = getEnv(name);
    if (value && isPublicKey(value)) return value;
  }
  return undefined;
}

export const getSupabaseUrl = (): string | undefined =>
  (getEnv('SUPABASE_URL') ?? getEnv('VITE_SUPABASE_URL'))?.replace(/\/+$/, '');
