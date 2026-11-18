/**
 * Typed client for the platform-independent backend routes.
 * The base path is `VITE_API_BASE_URL` (e.g. `https://api.example.com`) and defaults to the same-origin `/api`.
 */

export interface ClaimDownloadRequest {
  receiptId: string;
  planId: string;
  productSlug: string;
  email?: string;
}

export interface ClaimDownloadResult {
  downloadUrl: string;
  licenseKey: string;
  email: string;
  fileName: string;
  totalPurchasesCount: number;
  nextPromoCode: string;
  nextDiscountPercent: number;
}

export interface DownloadUrlResult {
  downloadUrl: string;
  fileName: string;
  expiresIn: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Could not reach the server. Check your connection and try again.');
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const body = (data ?? {}) as { error?: string; message?: string };
    throw new ApiError(res.status, body.error ?? 'request_failed', body.message ?? `Request failed (HTTP ${res.status}).`);
  }
  return data as T;
}

const API = () => import.meta.env.VITE_API_BASE_URL || '/api';
const auth = (token?: string): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

/**
 * Verifies a completed Whop payment and returns the license key + a presigned ZIP link.
 * With `accessToken` the purchase is linked to the signed-in account.
 */
export const claimDownload = (body: ClaimDownloadRequest, accessToken?: string) =>
  request<ClaimDownloadResult>(`${API()}/claim-download`, {
    method: 'POST',
    headers: auth(accessToken),
    body: JSON.stringify(body),
  });

/** Issues a product for a 100%-off promo code (no Whop payment). The e-mail is enough; a session token is optional. */
export const claimFree = (body: { productSlug: string; promoCode: string; email: string }, accessToken?: string) =>
  request<ClaimDownloadResult>(`${API()}/claim-free`, {
    method: 'POST',
    headers: auth(accessToken),
    body: JSON.stringify(body),
  });

/* ------------------------------------ Contact ------------------------------------ */

export const CONTACT_MAX_LENGTH = 2000;

/** Sends a question to the support inbox; the signed-in e-mail (token) wins over `email`. */
export const sendContact = (
  body: { message: string; email?: string; website?: string; topic?: 'author'; portfolio?: string },
  accessToken?: string,
) =>
  request<{ ok: true }>(`${API()}/contact`, { method: 'POST', headers: auth(accessToken), body: JSON.stringify(body) });

/* ------------------------------------ Reviews ------------------------------------ */

export interface ApiReview {
  id: string;
  productSlug: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export const REVIEW_MAX_LENGTH = 500;

/** Public reviews of a product, newest first. */
export const fetchProductReviews = (slug: string) =>
  request<{ reviews: ApiReview[] }>(`${API()}/reviews?slug=${encodeURIComponent(slug)}`, { method: 'GET' }).then((r) => r.reviews);

/** Reviews written by the signed-in buyer. */
export const fetchMyReviews = (accessToken: string) =>
  request<{ reviews: ApiReview[] }>(`${API()}/reviews?mine=1`, { method: 'GET', headers: auth(accessToken) }).then((r) => r.reviews);

/** Creates or updates the buyer's review of a purchased product. */
export const submitReview = (body: { productSlug: string; rating: number; comment: string }, accessToken: string) =>
  request<{ review: ApiReview }>(`${API()}/reviews`, {
    method: 'POST',
    headers: auth(accessToken),
    body: JSON.stringify(body),
  }).then((r) => r.review);

/** Re-issues a fresh presigned ZIP link for a purchase of the signed-in buyer. */
export const getDownloadUrl = (purchaseId: string, accessToken: string) =>
  request<DownloadUrlResult>(
    `${API()}/get-download-url?purchaseId=${encodeURIComponent(purchaseId)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

/** Starts a browser download of a (cross-origin) presigned URL without leaving the page. */
export function startDownload(url: string, fileName: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
