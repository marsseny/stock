/**
 * POST /api/contact — { message: string, email?: string, website?: string (honeypot) }
 * Optional Bearer token: a signed-in buyer's account e-mail wins over the typed one.
 *
 * Sends the question to CONTACT_TO_EMAIL (default client@nuovamotion.com) through the Resend API
 * (RESEND_API_KEY; CONTACT_FROM_EMAIL must be on a domain verified in Resend). Reply-To is the buyer.
 */

import { optionalUser } from '../auth';
import { getEnv, requireEnv } from '../env';
import { asString, createHandler, HttpError, isEmail, json, normalizeEmail, readJsonBody } from '../http';

export const CONTACT_MAX_LENGTH = 2000;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export const contact = createHandler(['POST'], async (req) => {
  const body = await readJsonBody<{ message: string; email: string; website: string }>(req);
  // Bots fill every field; people never see this one. Pretend success.
  if (asString(body.website)) return json({ ok: true });

  const message = asString(body.message);
  if (!message) throw new HttpError(400, 'missing_message', 'Write your question first.');
  if (message.length > CONTACT_MAX_LENGTH) {
    throw new HttpError(400, 'message_too_long', `Keep it under ${CONTACT_MAX_LENGTH} characters.`);
  }

  let user = null;
  try {
    user = await optionalUser(req);
  } catch {
    user = null; // expired token: fall back to the typed e-mail
  }
  const typed = asString(body.email);
  const email = user?.email ?? (typed ? normalizeEmail(typed) : undefined);
  if (!email || !isEmail(email)) throw new HttpError(400, 'invalid_email', 'Enter a valid e-mail so we can reply.');

  const to = getEnv('CONTACT_TO_EMAIL') ?? 'client@nuovamotion.com';
  const from = getEnv('CONTACT_FROM_EMAIL') ?? 'Nuova Motion <noreply@nuovamotion.com>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${requireEnv('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `Question from ${email}`,
      text: `From: ${email}${user ? ' (signed in)' : ''}\n\n${message}`,
      html: `<p><b>From:</b> ${escapeHtml(email)}${user ? ' (signed in)' : ''}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    }),
  });
  if (!res.ok) {
    console.error('Resend error', res.status, await res.text().catch(() => ''));
    throw new HttpError(502, 'send_failed', 'We could not send your message. Please try again later.');
  }
  return json({ ok: true });
});

export default contact;
