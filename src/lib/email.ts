const JUNK_DOMAINS = new Set([
  "example.com", "example.org", "example.net", "test.com", "test.org", "localhost", "invalid",
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "sharklasers.com", "10minutemail.com",
  "10minutemail.net", "tempmail.com", "temp-mail.org", "yopmail.com", "trashmail.com", "getnada.com",
  "dispostable.com", "maildrop.cc", "throwawaymail.com", "fakeinbox.com", "mintemail.com",
  "mailnesia.com", "emailondeck.com", "spamgourmet.com", "discard.email", "tempr.email", "moakt.com",
  "mohmal.com", "burnermail.io", "grr.la", "mailcatch.com", "inboxkitten.com", "tmpmail.org",
]);
const JUNK_LOCAL = /^(test|testing|tester|asdf|qwerty|foo|bar|fake|noreply|no-reply|null|none|abc|aaa+|xxx+)\d*$/i;
const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i;

export type EmailCheck = { ok: true; email: string } | { ok: false; error: string };

export function checkEmail(raw: unknown): EmailCheck {
  if (typeof raw !== "string") return { ok: false, error: "Enter an email address." };
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, error: "That email doesn't look right." };
  const [local, domain] = email.split("@");
  if (JUNK_DOMAINS.has(domain) || domain.endsWith(".test") || domain.endsWith(".example") || domain.endsWith(".invalid")) {
    return { ok: false, error: "Please use a real inbox (no throwaway or example addresses)." };
  }
  if (JUNK_LOCAL.test(local.split("+")[0])) return { ok: false, error: "Please use a real inbox." };
  return { ok: true, email };
}
