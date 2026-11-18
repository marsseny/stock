/**
 * Browser Supabase client (public URL + anon/publishable key only — access is limited by RLS).
 *
 * The public config is resolved in this order:
 *   1. build-time `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (from the build env or `public.env`);
 *   2. runtime `GET /api/public-config` (server env `SUPABASE_URL` + `SUPABASE_ANON_KEY`);
 *   3. if the server has no public key but does have `SUPABASE_SERVICE_ROLE_KEY`, sign-in goes through
 *      the server's auth proxy `/api/sb/auth/v1/*` (the key never reaches the browser).
 *
 * So My Account works as soon as the server has SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (which the
 * checkout already needs). The client is created once; the magic-link tokens in the URL
 * (`#access_token=…`) are picked up by `detectSessionInUrl` as soon as it is created.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const buildUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const buildKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
const API = () => import.meta.env.VITE_API_BASE_URL || '/api';

let client: SupabaseClient | null = null;
let loading: Promise<SupabaseClient | null> | null = null;

function create(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    // Implicit flow: the magic link works even when it is opened in another browser / on the phone.
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
  });
}

interface RuntimeConfig {
  supabaseUrl?: string | null;
  supabaseAnonKey?: string | null;
  authProxy?: boolean;
  missing?: string[];
}

/** Variables the server reported as missing (shown on the "not available" screen). */
export let missingConfig: string[] = [];

/** Placeholder key for proxy mode — the real key is added by the server. */
const PROXY_KEY = 'server-proxy';

async function fetchRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const res = await fetch(`${API()}/public-config`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) return {};
    return (await res.json()) as RuntimeConfig;
  } catch {
    return {};
  }
}

/** Resolves the shared client, or `null` when Supabase is not configured anywhere. */
export function loadSupabase(): Promise<SupabaseClient | null> {
  if (client) return Promise.resolve(client);
  if (!loading) {
    loading = (async () => {
      if (buildUrl && buildKey) {
        client = create(buildUrl, buildKey);
        return client;
      }
      const cfg = await fetchRuntimeConfig();
      missingConfig = cfg.missing ?? [];
      if (cfg.supabaseUrl && cfg.supabaseAnonKey) client = create(cfg.supabaseUrl, cfg.supabaseAnonKey);
      else if (cfg.authProxy) client = create(new URL(`${API()}/sb`, window.location.origin).href, PROXY_KEY);
      else loading = null; // allow a later retry (e.g. a network hiccup)
      return client;
    })();
  }
  return loading;
}

/** React hook: `{ supabase, ready }`. `ready && !supabase` means accounts are not configured. */
export function useSupabase(): { supabase: SupabaseClient | null; ready: boolean } {
  const [state, setState] = useState<{ supabase: SupabaseClient | null; ready: boolean }>({
    supabase: client,
    ready: Boolean(client),
  });
  useEffect(() => {
    if (state.ready) return;
    let active = true;
    void loadSupabase().then((c) => {
      if (active) setState({ supabase: c, ready: true });
    });
    return () => {
      active = false;
    };
  }, [state.ready]);
  return state;
}

/**
 * Error from an opened magic link, e.g. `#error=access_denied&error_code=otp_expired&error_description=…`.
 * Read once at startup (before the client consumes the URL) so the sign-in form can explain it.
 */
function readLinkError(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  const code = params.get('error_code') ?? query.get('error_code') ?? '';
  const description = params.get('error_description') ?? query.get('error_description') ?? '';
  if (!code && !description && !params.get('error')) return '';
  if (code === 'otp_expired') return 'This sign-in link has expired or was already used. Enter your e-mail to get a new one.';
  return description ? `Sign-in failed: ${description}` : 'Sign-in failed. Please request a new link.';
}

export const initialLinkError = readLinkError();

// Start immediately so a magic-link hash in the URL is consumed before any page code runs.
if (typeof window !== 'undefined') void loadSupabase();

/** Purchase row as visible to the signed-in buyer (RLS: own e-mail only). */
export interface Purchase {
  id: string;
  email: string;
  product_slug: string;
  whop_plan_id: string;
  whop_receipt_id: string;
  license_key: string;
  r2_object_key: string;
  created_at: string;
}

/** Products issued with a 100%-off code (`/api/claim-free`) — free files, not paid purchases. */
export const isFreePurchase = (p: Pick<Purchase, 'whop_receipt_id'>): boolean => p.whop_receipt_id.startsWith('free_');

/**
 * Purchases of the signed-in user, newest first, loaded by the server (`/api/my-purchases`, matched by
 * the verified e-mail of the session). Returns an empty list when signed out or not configured.
 */
export async function fetchMyPurchases(): Promise<Purchase[]> {
  const supabase = await loadSupabase();
  if (!supabase) return [];
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return [];
  const res = await fetch(`${API()}/my-purchases`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => null)) as { purchases?: Purchase[]; message?: string } | null;
  if (!res.ok) throw new Error(body?.message ?? `Could not load your purchases (HTTP ${res.status}).`);
  return body?.purchases ?? [];
}
