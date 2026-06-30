export function normalizePhone(raw: string): string {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (raw.startsWith('+')) return raw;
  return `+${digits}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('91') ? digits.slice(2) : digits;
  if (local.length !== 10) return phone;
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

export function isValidIndianMobile(digits: string): boolean {
  return /^\d{10}$/.test(digits);
}
