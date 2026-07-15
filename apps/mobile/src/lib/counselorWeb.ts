import { API_URL } from '@/config';

export type ChartTab = 'plan' | 'activity' | 'messages' | 'notes';

/**
 * Deep-links into the web Client Chart (Caseload workplace).
 * Bridge mode: phone for quick actions; web for deep clinical work.
 */
export function chartUrl(
  clientId: string,
  opts?: { tab?: ChartTab; week?: number },
): string {
  const url = new URL(`${API_URL}/provider/clients/${clientId}`);
  url.searchParams.set('tab', opts?.tab ?? 'plan');
  if (opts?.week != null && opts.week >= 1) {
    url.searchParams.set('week', String(opts.week));
  }
  return url.toString();
}

export function formulationUrl(userId: string): string {
  return `${API_URL}/provider/formulations/${userId}`;
}

export function caseloadUrl(filter?: 'plans'): string {
  const url = new URL(`${API_URL}/provider/clients`);
  if (filter === 'plans') url.searchParams.set('filter', 'plans');
  return url.toString();
}

export function openCounselorWeb(url: string): void {
  // Dynamic import avoids RN bundling issues in tests; callers use Linking directly too.
  void import('expo-linking').then(({ openURL }) => openURL(url));
}
