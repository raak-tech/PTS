/** Program week/day from anchor date (Week 1 release = Day 1). */

export function parseAnchorDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function calendarDaysBetween(anchorIso: string, today = new Date()): number {
  const anchor = parseAnchorDate(anchorIso);
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

export function msUntilLocalMidnight(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

export function msUntilNextWeekBoundary(anchorIso: string, now = new Date()): number {
  const daysSince = calendarDaysBetween(anchorIso, now);
  const dayInWeek = (daysSince % 7) + 1;
  const daysLeftInWeek = 7 - dayInWeek;
  return msUntilLocalMidnight(now) + daysLeftInWeek * 86_400_000;
}

export function dayProgressFromClock(now = new Date()): number {
  return (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86_400;
}
