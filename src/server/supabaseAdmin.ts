/** Server-side Supabase client with the service-role key (bypasses RLS). Never ship to the browser. */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from './env';

export interface PurchaseRow {
  id: string;
  email: string;
  product_slug: string;
  whop_plan_id: string;
  whop_receipt_id: string;
  license_key: string;
  r2_object_key: string;
  created_at: string;
}

export interface NewPurchase {
  email: string;
  product_slug: string;
  whop_plan_id: string;
  whop_receipt_id: string;
  r2_object_key: string;
}

let admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  admin = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return admin;
}

const PURCHASE_COLUMNS = 'id, email, product_slug, whop_plan_id, whop_receipt_id, license_key, r2_object_key, created_at';

export async function findPurchaseByReceipt(receiptId: string): Promise<PurchaseRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('purchases')
    .select(PURCHASE_COLUMNS)
    .eq('whop_receipt_id', receiptId)
    .maybeSingle();
  if (error) throw new Error(`Supabase: failed to read purchase — ${error.message}`);
  return (data as PurchaseRow | null) ?? null;
}

export async function findPurchaseById(id: string): Promise<PurchaseRow | null> {
  const { data, error } = await getSupabaseAdmin().from('purchases').select(PURCHASE_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw new Error(`Supabase: failed to read purchase — ${error.message}`);
  return (data as PurchaseRow | null) ?? null;
}

/**
 * Idempotent insert: `INSERT … ON CONFLICT (whop_receipt_id) DO NOTHING`, then read the stored row.
 * An already-issued license key (e.g. created earlier by the webhook) is never replaced.
 */
export async function ensurePurchase(purchase: NewPurchase): Promise<PurchaseRow> {
  const { error } = await getSupabaseAdmin()
    .from('purchases')
    .upsert({ ...purchase, email: purchase.email.trim().toLowerCase() }, { onConflict: 'whop_receipt_id', ignoreDuplicates: true });
  if (error) throw new Error(`Supabase: failed to save purchase — ${error.message}`);

  const row = await findPurchaseByReceipt(purchase.whop_receipt_id);
  if (!row) throw new Error('Supabase: purchase was not found right after saving it.');
  return row;
}

/** Moves a purchase to the signed-in buyer's account e-mail (license key and receipt stay unchanged). */
export async function reassignPurchaseEmail(id: string, email: string): Promise<PurchaseRow> {
  const { data, error } = await getSupabaseAdmin()
    .from('purchases')
    .update({ email: email.trim().toLowerCase() })
    .eq('id', id)
    .select(PURCHASE_COLUMNS)
    .single();
  if (error) throw new Error(`Supabase: failed to update purchase — ${error.message}`);
  return data as PurchaseRow;
}

/** Total number of purchases made with this e-mail (case-insensitive; e-mails are stored lower-cased). */
export async function countPurchasesByEmail(email: string): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('purchases')
    .select('id', { count: 'exact', head: true })
    .eq('email', email.trim().toLowerCase());
  if (error) throw new Error(`Supabase: failed to count purchases — ${error.message}`);
  return count ?? 0;
}

/**
 * Paid purchases only: products issued with the 100%-off code (`/api/claim-free`, receipt `free_…`)
 * are free files and do not unlock loyalty promo codes.
 */
export async function countPaidPurchasesByEmail(email: string): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('purchases')
    .select('id', { count: 'exact', head: true })
    .eq('email', email.trim().toLowerCase())
    .not('whop_receipt_id', 'like', 'free_%');
  if (error) throw new Error(`Supabase: failed to count purchases — ${error.message}`);
  return count ?? 0;
}

/** Existing purchase of a product by this e-mail (oldest first), if any. */
export async function findPurchaseBySlugAndEmail(slug: string, email: string): Promise<PurchaseRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('purchases')
    .select(PURCHASE_COLUMNS)
    .eq('product_slug', slug)
    .eq('email', email.trim().toLowerCase())
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Supabase: failed to read purchase — ${error.message}`);
  return (data as PurchaseRow | null) ?? null;
}

/** True when this e-mail PAID for the product (purchases issued by a 100%-off code, receipt `free_…`, do not count). */
export async function hasPaidPurchase(slug: string, email: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from('purchases')
    .select('id')
    .eq('product_slug', slug)
    .eq('email', email.trim().toLowerCase())
    .not('whop_receipt_id', 'like', 'free_%')
    .limit(1);
  if (error) throw new Error(`Supabase: failed to read purchase — ${error.message}`);
  return (data?.length ?? 0) > 0;
}

/** All purchases of this e-mail, newest first (used by My Account via `/api/my-purchases`). */
export async function listPurchasesByEmail(email: string): Promise<PurchaseRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('purchases')
    .select(PURCHASE_COLUMNS)
    .eq('email', email.trim().toLowerCase())
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(`Supabase: failed to read purchases — ${error.message}`);
  return (data as PurchaseRow[] | null) ?? [];
}

/* ----------------------------------- Reviews ----------------------------------- */

export interface ReviewRow {
  id: string;
  product_slug: string;
  email: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

const REVIEW_COLUMNS = 'id, product_slug, email, author_name, rating, comment, created_at, updated_at';

export async function listReviewsBySlug(slug: string, limit = 200): Promise<ReviewRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .eq('product_slug', slug)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Supabase: failed to read reviews — ${error.message}`);
  return (data ?? []) as ReviewRow[];
}

export async function listReviewsByEmail(email: string): Promise<ReviewRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .eq('email', email.trim().toLowerCase())
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`Supabase: failed to read reviews — ${error.message}`);
  return (data ?? []) as ReviewRow[];
}

/** One review per buyer and product: a second submission updates the first one. */
export async function upsertReview(review: {
  product_slug: string;
  email: string;
  author_name: string;
  rating: number;
  comment: string;
}): Promise<ReviewRow> {
  const { data, error } = await getSupabaseAdmin()
    .from('reviews')
    .upsert(
      { ...review, email: review.email.trim().toLowerCase(), updated_at: new Date().toISOString() },
      { onConflict: 'email,product_slug' },
    )
    .select(REVIEW_COLUMNS)
    .single();
  if (error) throw new Error(`Supabase: failed to save review — ${error.message}`);
  return data as ReviewRow;
}
