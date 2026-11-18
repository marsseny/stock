/** GET /api/my-purchases + Bearer token — purchases of the signed-in buyer (matched by e-mail), newest first. */

import { requireUser } from '../auth';
import { createHandler, json } from '../http';
import { listPurchasesByEmail } from '../supabaseAdmin';

export const myPurchases = createHandler(['GET'], async (req) => {
  const user = await requireUser(req);
  return json({ purchases: await listPurchasesByEmail(user.email) });
});

export default myPurchases;
