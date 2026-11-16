/** Resolves the signed-in buyer from `Authorization: Bearer <Supabase access token>`. */

import { HttpError, normalizeEmail } from './http';
import { getSupabaseAdmin } from './supabaseAdmin';

export interface AuthUser {
  id: string;
  email: string;
  /** Public display name for reviews, e.g. "Maya R." */
  displayName: string;
}

export function bearerToken(req: Request): string | undefined {
  const header = req.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : undefined;
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s);

/** "Maya Rossi" → "Maya R.", "john.doe@x.com" → "John D." */
export function shortName(fullName: string | undefined, email: string): string {
  const source = fullName?.trim() || email.split('@')[0];
  const parts = source.split(/[\s._-]+/).filter(Boolean).map((p) => p.replace(/\d+/g, '')).filter(Boolean);
  if (parts.length === 0) return 'Buyer';
  const first = cap(parts[0]).slice(0, 24);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1][0].toUpperCase()}.` : first;
}

/** Returns the user for a valid token, `null` when no token was sent; throws 401 for a bad/expired token. */
export async function optionalUser(req: Request): Promise<AuthUser | null> {
  const token = bearerToken(req);
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  const user = data.user;
  if (error || !user?.email) throw new HttpError(401, 'unauthorized', 'Your session has expired. Please sign in again.');
  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  return { id: user.id, email: normalizeEmail(user.email), displayName: shortName(meta.full_name ?? meta.name, user.email) };
}

export async function requireUser(req: Request): Promise<AuthUser> {
  const user = await optionalUser(req);
  if (!user) throw new HttpError(401, 'unauthorized', 'Sign in to continue.');
  return user;
}
