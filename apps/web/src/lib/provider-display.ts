/** Counselor-facing client labels — pilot shows full phone for testing. */
export function formatClientPhone(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2)}`;
  }
  if (digits.length === 10) {
    return `+91 ${digits}`;
  }
  return phone;
}

export function formatClientLabel(client: {
  displayName: string | null;
  phone: string | null;
  email: string;
}): string {
  if (client.displayName?.trim()) return client.displayName.trim();
  const phone = formatClientPhone(client.phone);
  if (phone) return phone;
  const [local, domain] = client.email.split('@');
  if (domain === 'phone.pts.local' && local) {
    const digits = local.replace(/\D/g, '');
    if (digits.length >= 10) {
      return formatClientPhone(`+${digits.startsWith('91') ? digits : `91${digits}`}`) ?? client.email;
    }
  }
  return client.email;
}
