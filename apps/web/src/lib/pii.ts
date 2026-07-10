/** Pilot-only: show full phone, email, and text previews in admin/counselor UIs. */
const TRUTHY = new Set(['1', 'true', 'yes']);

export function isPilotPiiVisible(): boolean {
  const explicit = process.env.PILOT_SHOW_PII?.trim().toLowerCase();
  if (explicit === 'false' || explicit === '0' || explicit === 'no') return false;
  if (explicit && TRUTHY.has(explicit)) return true;
  const pilot = process.env.OTP_TEST_MODE?.trim().toLowerCase();
  return pilot ? TRUTHY.has(pilot) : false;
}

export function displayEmail(email: string): string {
  if (isPilotPiiVisible()) return email;
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local[0] ?? ''}***@${domain}`;
}

export function displayPhone(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, '');
  if (isPilotPiiVisible()) {
    if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2)}`;
    if (digits.length === 10) return `+91 ${digits}`;
    return phone;
  }
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}

/** Truncate long text in production; show full text during pilot. */
export function displayText(text: string, maxLen: number): string {
  if (isPilotPiiVisible() || text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

export function userContactLabel(
  displayName: string | null | undefined,
  email: string,
  phone: string | null | undefined,
): string {
  if (displayName?.trim()) return displayName.trim();
  const shownPhone = displayPhone(phone);
  if (shownPhone) return shownPhone;
  return displayEmail(email);
}

/** Counselor-facing client row: name, then phone, then email (all unmasked in pilot). */
export function formatClientContact(client: {
  displayName?: string | null;
  phone?: string | null;
  email: string;
}): string {
  if (isPilotPiiVisible()) {
    const parts = [
      client.displayName?.trim(),
      displayPhone(client.phone),
      displayEmail(client.email),
    ].filter(Boolean);
    return parts.join(' · ') || displayEmail(client.email);
  }
  return userContactLabel(client.displayName ?? null, client.email, client.phone ?? null);
}
