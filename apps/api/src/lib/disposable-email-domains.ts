// Common disposable / temp-mail domains. This is not exhaustive — it's a
// cheap first filter, not a substitute for real email confirmation (which
// is the actual fix for fake signups). Add to this list as new ones show up.
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
    'mailinator.com',
    'guerrillamail.com',
    'guerrillamail.info',
    'guerrillamail.biz',
    'guerrillamail.de',
    '10minutemail.com',
    '10minutemail.net',
    'tempmail.com',
    'temp-mail.org',
    'yopmail.com',
    'yopmail.fr',
    'trashmail.com',
    'getnada.com',
    'throwawaymail.com',
    'sharklasers.com',
    'dispostable.com',
    'fakeinbox.com',
    'maildrop.cc',
    'mintemail.com',
    'mailnesia.com',
    'discard.email',
    'moakt.com',
    'emailondeck.com',
    'spamgourmet.com',
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}