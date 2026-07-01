/** Program week/day from anchor date (Week 1 release = Day 1). */
export type ProgramCalendar = {
  anchorDate: string;
  weekNumber: number;
  dayInWeek: number;
  daysSinceAnchor: number;
};

export function parseAnchorDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function calendarDaysBetween(anchorIso: string, today = new Date()): number {
  const anchor = parseAnchorDate(anchorIso);
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

export function computeProgramCalendar(anchorIso: string, today = new Date()): ProgramCalendar {
  const daysSinceAnchor = calendarDaysBetween(anchorIso, today);
  return {
    anchorDate: anchorIso,
    weekNumber: Math.floor(daysSinceAnchor / 7) + 1,
    dayInWeek: (daysSinceAnchor % 7) + 1,
    daysSinceAnchor,
  };
}

export function weekDateRange(anchorIso: string, weekNumber: number): { start: string; end: string } {
  const anchor = parseAnchorDate(anchorIso);
  const start = new Date(anchor);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: toDateIso(start), end: toDateIso(end) };
}
