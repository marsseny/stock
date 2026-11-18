/**
 * /api/sb/auth/v1/<endpoint> — minimal Supabase Auth proxy used ONLY when no public (anon/publishable)
 * key is configured on the server. The browser Supabase client is then pointed at `/api/sb`, and this
 * handler forwards a short allow-list of sign-in endpoints to Supabase, adding the key server-side.
 *
 * Safety:
 *   - only end-user endpoints are forwarded (magic link, verify, refresh, current user, logout);
 *     `admin/*`, `invite`, `signup` etc. return 404;
 *   - `user` and `logout` require the buyer's own access token — the server key is never used
 *     as `Authorization` there, so it cannot act on anyone's behalf;
 *   - the database REST API is NOT proxied (purchases come from `/api/my-purchases`);
 *   - browser headers (User-Agent, cookies) are not forwarded.
 */

import { getEnv, MissingEnvError } from '../env';
import { json, type Handler } from '../http';
import { getPublicSupabaseKey, getSupabaseUrl } from '../publicKey';

export const AUTH_PROXY_PREFIX = 'sb/auth/v1/';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-api-version',
  'Access-Control-Max-Age': '86400',
};

type Rule = { methods: string[]; userToken?: boolean };
const RULES: Record<string, Rule> = {
  otp: { methods: ['POST'] },
  verify: { methods: ['GET', 'POST'] },
  token: { methods: ['POST'] },
  user: { methods: ['GET'], userToken: true },
  logout: { methods: ['POST'], userToken: true },
  settings: { methods: ['GET'] },
};
const TOKEN_GRANTS = new Set(['refresh_token', 'pkce']);

/** A real user JWT (three dot-separated parts), not the placeholder key the client was created with. */
function userBearer(req: Request): string | undefined {
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization')?.trim() ?? '');
  return m && m[1].split('.').length === 3 ? m[1] : undefined;
}

export const authProxy: Handler = async (req) => {
  const method = req.method.toUpperCase();
  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const url = new URL(req.url);
  const idx = url.pathname.indexOf(`/${AUTH_PROXY_PREFIX}`);
  const endpoint = idx >= 0 ? url.pathname.slice(idx + AUTH_PROXY_PREFIX.length + 1).replace(/\/+$/, '') : '';

  try {
    const base = getSupabaseUrl();
    if (!base) throw new MissingEnvError('SUPABASE_URL');

    // OAuth (Google button): the browser navigates here — send it straight to Supabase, no key needed.
    if (endpoint === 'authorize' && method === 'GET') {
      return Response.redirect(`${base}/auth/v1/authorize${url.search}`, 302);
    }

    const rule = RULES[endpoint];
    if (!rule || !rule.methods.includes(method)) {
      return json({ error: 'not_found', message: 'Unknown auth route.' }, 404, CORS);
    }
    if (endpoint === 'token' && !TOKEN_GRANTS.has(url.searchParams.get('grant_type') ?? '')) {
      return json({ error: 'unsupported_grant_type', message: 'Unsupported grant type.' }, 400, CORS);
    }

    const key = getPublicSupabaseKey() ?? getEnv('SUPABASE_SERVICE_ROLE_KEY');
    if (!key) throw new MissingEnvError('SUPABASE_ANON_KEY');

    const headers = new Headers({ apikey: key, Accept: 'application/json' });
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);
    const apiVersion = req.headers.get('x-supabase-api-version');
    if (apiVersion) headers.set('X-Supabase-Api-Version', apiVersion);
    const ip = req.headers.get('cf-connecting-ip');
    if (ip) headers.set('X-Forwarded-For', ip);

    if (rule.userToken) {
      const token = userBearer(req);
      if (!token) return json({ code: 401, error_code: 'no_authorization', msg: 'Sign in to continue.' }, 401, CORS);
      headers.set('Authorization', `Bearer ${token}`);
    }

    const upstream = await fetch(`${base}/auth/v1/${endpoint}${url.search}`, {
      method,
      headers,
      body: method === 'GET' ? undefined : await req.text(),
      redirect: 'manual',
    });
    const out = new Headers(CORS);
    out.set('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    out.set('Cache-Control', 'no-store');
    const location = upstream.headers.get('location');
    if (location) out.set('Location', location);
    return new Response(upstream.status === 204 ? null : await upstream.arrayBuffer(), { status: upstream.status, headers: out });
  } catch (error) {
    if (error instanceof MissingEnvError) {
      return json({ error: 'server_not_configured', message: error.message }, 503, CORS);
    }
    console.error('Auth proxy error:', error);
    return json({ error: 'internal_error', message: 'Sign-in service is unavailable. Please try again.' }, 502, CORS);
  }
};

export default authProxy;
