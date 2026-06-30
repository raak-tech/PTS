type AdminUser = { email: string; role: string };

export function isAdminUser(user: AdminUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(user.email.toLowerCase());
}
