import dns from 'node:dns/promises';

// Confirms an email's domain has valid mail infrastructure (MX records,
// or an A/AAAA record as a fallback for the rare domain that accepts mail
// without MX). This is free — just a DNS lookup — and catches typos and
// fake/nonexistent domains before we ever send a confirmation email.
//
// It cannot confirm the specific mailbox (e.g. "asdf@") exists, only that
// the domain itself is capable of receiving mail. That's why we still rely
// on the real confirmation email as the final proof.

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const LOOKUP_TIMEOUT_MS = 3000;

export type DomainCheckResult =
  | { ok: true }
  | { ok: false; reason: 'no-mail-domain' } // confirmed: domain has no MX/A/AAAA records
  | { ok: false; reason: 'lookup-failed' }; // our DNS lookup errored/timed out — inconclusive

const cache = new Map<string, { result: DomainCheckResult; expires: number }>();

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

async function hasAOrAaaaRecord(domain: string): Promise<boolean | 'unknown'> {
  const [a, aaaa] = await Promise.allSettled([
    withTimeout(dns.resolve4(domain), LOOKUP_TIMEOUT_MS),
    withTimeout(dns.resolve6(domain), LOOKUP_TIMEOUT_MS),
  ]);

  if (a.status !== 'fulfilled' && aaaa.status !== 'fulfilled') {
    // Both failed. Could mean the domain truly doesn't exist (NXDOMAIN),
    // or our resolver had a hiccup — we can't tell which, so we report
    // "unknown" and let the caller decide (we fail closed on this).
    return 'unknown';
  }

  const aHasRecords = a.status === 'fulfilled' && a.value.length > 0;
  const aaaaHasRecords = aaaa.status === 'fulfilled' && aaaa.value.length > 0;
  return aHasRecords || aaaaHasRecords;
}

export async function checkEmailDomain(email: string): Promise<DomainCheckResult> {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return { ok: false, reason: 'no-mail-domain' };

  const cached = cache.get(domain);
  if (cached && cached.expires > Date.now()) {
    return cached.result;
  }

  let result: DomainCheckResult;

  try {
    const mxRecords = await withTimeout(dns.resolveMx(domain), LOOKUP_TIMEOUT_MS);
    if (mxRecords.length > 0) {
      result = { ok: true };
    } else {
      result = await resolveViaFallback(domain);
    }
  } catch (err: any) {
    if (err?.message === 'timeout') {
      // Our own lookup timed out — inconclusive, not the domain's fault.
      result = { ok: false, reason: 'lookup-failed' };
    } else {
      // MX query errored (commonly ENOTFOUND/ENODATA), which usually just
      // means "no MX record" rather than "our DNS is broken" — check
      // A/AAAA before concluding anything.
      result = await resolveViaFallback(domain);
    }
  }

  // Only cache definitive answers. A transient lookup failure shouldn't
  // keep blocking a real domain for the next hour.
  if (result.ok || result.reason === 'no-mail-domain') {
    cache.set(domain, { result, expires: Date.now() + CACHE_TTL_MS });
  }

  return result;
}

async function resolveViaFallback(domain: string): Promise<DomainCheckResult> {
  try {
    const fallback = await hasAOrAaaaRecord(domain);
    if (fallback === 'unknown') return { ok: false, reason: 'lookup-failed' };
    return fallback ? { ok: true } : { ok: false, reason: 'no-mail-domain' };
  } catch {
    return { ok: false, reason: 'lookup-failed' };
  }
}