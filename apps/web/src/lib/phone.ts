/** Normalize Indian mobile numbers to E.164 +91XXXXXXXXXX */
export function normalizePhone(phone = ''): string {
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (String(phone).startsWith('+')) return String(phone);
  return `+${digits}`;
}

export function isValidIndianMobile(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+91[6-9]\d{9}$/.test(normalized);
}

export function phoneToEmail(phone: string): string {
  const digits = normalizePhone(phone).replace(/\D/g, '');
  return `${digits}@phone.pts.local`;
}

export function isTestPhone(phone: string): boolean {
  return normalizePhone(phone).startsWith('+919900000');
}

/** Fixed OTP for pilot/testing — all numbers when OTP_TEST_MODE or MSG91 is not configured. */
export function usesFixedOtp(phone: string): boolean {
  if (isTestPhone(phone)) return true;

  const mode = process.env.OTP_TEST_MODE?.trim().toLowerCase();
  if (mode === '1' || mode === 'true' || mode === 'yes') return true;

  const hasMsg91 =
    Boolean(process.env.MSG91_AUTH_KEY?.trim()) &&
    Boolean(process.env.MSG91_TEMPLATE_ID?.trim());
  if (!hasMsg91) return true;

  return false;
}
