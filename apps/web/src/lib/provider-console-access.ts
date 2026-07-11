import { isAdminUser } from '@/lib/admin';

export type ConsoleUser = { id: string; role: string; email: string };

export function canAccessProviderConsole(user: ConsoleUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'provider' || isAdminUser(user);
}

export function isProviderConsoleAdmin(user: ConsoleUser | null | undefined): boolean {
  if (!user) return false;
  return user.role !== 'provider' && isAdminUser(user);
}

type WeekRow = { weekNumber: number; status: string };

/** Human-readable label for which week(s) still need counselor action. */
export function describePendingPlanWeeks(planStatus: string, weeks: WeekRow[]): string {
  if (planStatus === 'pending_review') {
    return 'Week 1 not generated yet';
  }

  const pending = [...weeks]
    .filter((w) => w.status === 'draft' || w.status === 'edited')
    .sort((a, b) => a.weekNumber - b.weekNumber);

  if (pending.length > 0) {
    return pending
      .map((w) => {
        const suffix = w.status === 'edited' ? 'needs approval' : 'draft';
        return `Week ${w.weekNumber} (${suffix})`;
      })
      .join(' · ');
  }

  if (planStatus === 'draft') {
    const approved = weeks.filter((w) => w.status === 'approved').map((w) => w.weekNumber);
    const nextWeek = approved.length > 0 ? Math.max(...approved) + 1 : 1;
    return `Week ${nextWeek} pending review`;
  }

  return 'Awaiting counselor action';
}
