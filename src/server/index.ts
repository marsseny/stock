/** Platform-independent server entry: standard `(req: Request) => Promise<Response>` handlers. */

export { claimDownload } from './handlers/claimDownload';
export { claimFree } from './handlers/claimFree';
export { contact } from './handlers/contact';
export { reviews } from './handlers/reviews';
export { getDownloadUrl } from './handlers/getDownloadUrl';
export { whopWebhook } from './handlers/whopWebhook';
export { setServerEnv } from './env';
export type { Handler } from './http';

import { claimDownload } from './handlers/claimDownload';
import { claimFree } from './handlers/claimFree';
import { contact } from './handlers/contact';
import { reviews } from './handlers/reviews';
import { getDownloadUrl } from './handlers/getDownloadUrl';
import { whopWebhook } from './handlers/whopWebhook';
import type { Handler } from './http';

/** Route table for custom servers / Workers: `routes[pathname.replace(/^\/api\//, '')]`. */
export const routes: Record<string, Handler> = {
  'claim-download': claimDownload,
  'whop-webhook': whopWebhook,
  'get-download-url': getDownloadUrl,
  'claim-free': claimFree,
  reviews,
  contact,
};
