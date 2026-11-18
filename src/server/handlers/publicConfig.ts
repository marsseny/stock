/**
 * GET /api/public-config
 *
 * Public (browser-safe) settings resolved at runtime, so the storefront does not depend on VITE_
 * variables being present at build time. Returns ONLY public values:
 *   supabaseUrl     — SUPABASE_URL (or VITE_SUPABASE_URL)
 *   supabaseAnonKey — SUPABASE_ANON_KEY / SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)
 * The service-role key is never returned.
 */

import { getEnv } from '../env';
import { createHandler, json } from '../http';

export const publicConfig = createHandler(['GET'], async () => {
  const supabaseUrl = getEnv('SUPABASE_URL') ?? getEnv('VITE_SUPABASE_URL') ?? null;
  const supabaseAnonKey =
    getEnv('SUPABASE_ANON_KEY') ?? getEnv('SUPABASE_PUBLISHABLE_KEY') ?? getEnv('VITE_SUPABASE_ANON_KEY') ?? null;
  return json({ supabaseUrl, supabaseAnonKey: supabaseUrl ? supabaseAnonKey : null }, 200, {
    'Cache-Control': 'public, max-age=300',
  });
});

export default publicConfig;
