/**
 * Browser Supabase client (public publishable/anon key only — access is limited by RLS).
 * `supabase` is `null` when the VITE_ variables are not configured, so the storefront keeps working without it.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

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

/** Purchases of the signed-in user, newest first. Returns an empty list when signed out or not configured. */
export async function fetchMyPurchases(): Promise<Purchase[]> {
  if (!supabase) return [];
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [];
  const { data, error } = await supabase
    .from('purchases')
    .select('id, email, product_slug, whop_plan_id, whop_receipt_id, license_key, r2_object_key, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Purchase[];
}
