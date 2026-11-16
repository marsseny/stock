/**
 * Private Cloudflare R2 bucket — presigned (SigV4, query-string) download links for paid ZIP archives.
 * Pure Web Crypto, no AWS SDK: runs on Cloudflare Workers/Pages, Node 18+, Deno and Bun.
 */

import { getEnv, requireEnv } from './env';

const enc = new TextEncoder();

function endpoint(): URL {
  const explicit = getEnv('R2_ENDPOINT');
  return new URL(explicit ? explicit.replace(/\/+$/, '') : `https://${requireEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`);
}

export const getPrivateBucket = (): string => requireEnv('R2_PRIVATE_BUCKET_NAME');

/** `folder/phone-20-pro-mockups.zip` → `phone-20-pro-mockups.zip` */
export function fileNameFromKey(objectKey: string): string {
  const name = objectKey.split('/').filter(Boolean).pop() ?? 'download.zip';
  return name.replace(/["\\\r\n]/g, '_');
}

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (s: string) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

async function hmac(key: ArrayBuffer | Uint8Array, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, enc.encode(msg));
}

/** RFC 3986 encoding as required by SigV4. */
const rfc3986 = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/**
 * Creates a unique, time-limited download link for an object in the private bucket.
 * The browser receives the file as an attachment with its original file name.
 */
export async function getPresignedDownloadUrl(objectKey: string, expiresIn = 3600): Promise<string> {
  const key = objectKey.replace(/^\/+/, '');
  if (!key) throw new Error('R2 object key is empty.');
  const accessKey = requireEnv('R2_ACCESS_KEY_ID');
  const secretKey = requireEnv('R2_SECRET_ACCESS_KEY');
  const base = endpoint();
  const fileName = fileNameFromKey(key);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // YYYYMMDDTHHMMSSZ
  const date = amzDate.slice(0, 8);
  const scope = `${date}/auto/s3/aws4_request`;

  // Path-style URL: /<bucket>/<key>
  const path = `${base.pathname.replace(/\/+$/, '')}/${rfc3986(getPrivateBucket())}/${key.split('/').map(rfc3986).join('/')}`;

  const params: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKey}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(Math.min(Math.max(1, Math.floor(expiresIn)), 604800)),
    'X-Amz-SignedHeaders': 'host',
    'response-content-disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    'response-content-type': fileName.toLowerCase().endsWith('.zip') ? 'application/zip' : 'application/octet-stream',
  };
  const query = Object.keys(params)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(params[k])}`)
    .join('&');

  const canonical = ['GET', path, query, `host:${base.host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, await sha256(canonical)].join('\n');

  let signingKey = await hmac(enc.encode(`AWS4${secretKey}`), date);
  for (const part of ['auto', 's3', 'aws4_request']) signingKey = await hmac(signingKey, part);
  const signature = hex(await hmac(signingKey, stringToSign));

  return `${base.protocol}//${base.host}${path}?${query}&X-Amz-Signature=${signature}`;
}
