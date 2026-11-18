/**
 * GET /api/public-config
 *
 * Public (browser-safe) settings resolved at runtime, so the storefront does not depend on VITE_
 * variables being present at build time. Returns ONLY public values:
 *   supabaseUrl     — SUPABASE_URL (or VITE_SUPABASE_URL), only together with a public key
 *   supabaseAnonKey — anon / publishable key (see `publicKey.ts`; a secret key is never returned)
 *   authProxy       — true when there is no public key but the server can still serve sign-in
 *                     through `/api/sb/auth/v1/*` (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set)
 *   missing         — names of variables to add (for the "not available" screen); never values
 */

import { getEnv } from '../env';
import { createHandler, json } from '../http';
import { getPublicSupabaseKey, getSupabaseUrl } from '../publicKey';

export const publicConfig = createHandler(['GET'], async () => {
  const url = getSupabaseUrl();
  const anonKey = getPublicSupabaseKey();
  const hasService = Boolean(getEnv('SUPABASE_SERVICE_ROLE_KEY'));
  const missing: string[] = [];
  if (!url) missing.push('SUPABASE_URL');
  if (!anonKey && !hasService) missing.push('SUPABASE_ANON_KEY');
  return json({
    supabaseUrl: url && anonKey ? url : null,
    supabaseAnonKey: url && anonKey ? anonKey : null,
    authProxy: Boolean(url && !anonKey && hasService),
    missing,
  });
});

export default publicConfig;
