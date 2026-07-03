import {
  APP_DAYS_PER_WEEK,
  PROGRAM_WEEK_COUNT,
  REAL_MS_PER_APP_WEEK,
} from '@/config/testTime';
import {
  calendarDaysBetween,
  dayProgressFromClock,
  msUntilNextWeekBoundary,
} from '@/lib/program-calendar';

export type WeekStatus = 'complete' | 'current' | 'locked';

export type ProgramWeek = {
  id: string;
  theme: string;
  focus: string;
  status: WeekStatus;
};

export type ProgramTimeState = {
  weekNumber: number;
  /** Week used for plan content (released weeks capped by calendar). */
  contentWeekNumber: number;
  dayInWeek: number;
  theme: string;
  focus: string;
  programComplete: boolean;
  completedAt?: string;
  weeks: ProgramWeek[];
  subtitle: string;
  dayProgress: number;
  eveningReflectionAvailable: boolean;
  weeklyCheckInDue: boolean;
  elapsedRealMs: number;
  msUntilNextWeek: number;
  testModeLabel: string;
  usesCalendarWeeks: boolean;
};

export const PROGRAM_WEEK_THEMES = [
  { theme: 'Finding Ground', focus: 'Safety, grounding, understanding your pain' },
  { theme: 'Understanding the Pain', focus: 'Patterns, triggers, and what your pain is telling you' },
  { theme: 'Gentle Re-engagement', focus: 'Small steps back into meaningful activity' },
  { theme: 'Values in Action', focus: 'Living by what matters, even with pain' },
  { theme: 'Building Confidence', focus: 'Trusting your body and your plan' },
  { theme: 'Moving Forward', focus: 'Sustaining progress beyond the program' },
] as const;

function effectiveContentWeek(calendarWeek: number, released: number[]): number {
  if (released.length === 0) return Math.min(calendarWeek, PROGRAM_WEEK_COUNT);
  const available = released.filter((w) => w <= calendarWeek).sort((a, b) => b - a);
  return available[0] ?? released[0] ?? 1;
}

export function computeCalendarProgramTime(
  anchorIso: string,
  releasedWeeks: number[],
  now = new Date(),
): ProgramTimeState {
  const daysSinceAnchor = calendarDaysBetween(anchorIso, now);
  const calendarWeekNumber = Math.min(Math.floor(daysSinceAnchor / APP_DAYS_PER_WEEK) + 1, PROGRAM_WEEK_COUNT);
  const dayInWeek = Math.min((daysSinceAnchor % APP_DAYS_PER_WEEK) + 1, APP_DAYS_PER_WEEK);
  const programComplete = daysSinceAnchor >= PROGRAM_WEEK_COUNT * APP_DAYS_PER_WEEK;
  const anchorStart = new Date(`${anchorIso}T00:00:00`);
  const completedAt = programComplete
    ? new Date(
        anchorStart.getTime() + PROGRAM_WEEK_COUNT * APP_DAYS_PER_WEEK * 86_400_000,
      ).toISOString()
    : undefined;
  const contentWeekNumber = effectiveContentWeek(calendarWeekNumber, releasedWeeks);
  const current = PROGRAM_WEEK_THEMES[contentWeekNumber - 1] ?? PROGRAM_WEEK_THEMES[0];

  const weeks: ProgramWeek[] = PROGRAM_WEEK_THEMES.map((entry, index) => {
    const weekNum = index + 1;
    const released = releasedWeeks.includes(weekNum);
    let status: WeekStatus = 'locked';
    if (released && weekNum < calendarWeekNumber) status = 'complete';
    else if (released && weekNum === calendarWeekNumber) status = 'current';
    return { id: String(weekNum), theme: entry.theme, focus: entry.focus, status };
  });

  const dayProgress = dayProgressFromClock(now);
  const msUntilNextWeek = msUntilNextWeekBoundary(anchorIso, now);

  return {
    weekNumber: calendarWeekNumber,
    contentWeekNumber,
    dayInWeek,
    theme: current.theme,
    focus: current.focus,
    programComplete,
    completedAt,
    weeks,
    subtitle: programComplete
      ? `Program complete — ${current.theme}`
      : `Week ${calendarWeekNumber} · Day ${dayInWeek} — ${current.theme}`,
    dayProgress,
    eveningReflectionAvailable: dayProgress >= 0.75,
    weeklyCheckInDue: dayInWeek === APP_DAYS_PER_WEEK && dayProgress >= 0.5,
    elapsedRealMs: daysSinceAnchor * 86_400_000,
    msUntilNextWeek,
    testModeLabel: `Calendar program · Next week in ${formatDuration(msUntilNextWeek)}`,
    usesCalendarWeeks: true,
  };
}

export function computeProgramTime(
  programStartedAt: Date,
  releasedWeeks: number[] = [],
  now = new Date(),
): ProgramTimeState {
  const elapsedRealMs = Math.max(0, now.getTime() - programStartedAt.getTime());
  const msPerDay = REAL_MS_PER_APP_WEEK / APP_DAYS_PER_WEEK;
  const weekIndex = Math.floor(elapsedRealMs / REAL_MS_PER_APP_WEEK);
  const calendarWeekNumber = Math.min(weekIndex + 1, PROGRAM_WEEK_COUNT);
  const dayInWeek = Math.min(Math.floor((elapsedRealMs % REAL_MS_PER_APP_WEEK) / msPerDay) + 1, APP_DAYS_PER_WEEK);
  const dayProgress = (elapsedRealMs % msPerDay) / msPerDay;
  const programComplete = elapsedRealMs >= PROGRAM_WEEK_COUNT * REAL_MS_PER_APP_WEEK;
  // Gate content by counselor-released weeks (Week-1-first). Empty list = no gate
  // (legacy / mock test accounts) so existing test flows keep working.
  const gate = releasedWeeks.length > 0;
  const weekNumber = gate ? effectiveContentWeek(calendarWeekNumber, releasedWeeks) : calendarWeekNumber;
  const current = PROGRAM_WEEK_THEMES[weekNumber - 1];

  const weeks: ProgramWeek[] = PROGRAM_WEEK_THEMES.map((entry, index) => {
    const id = String(index + 1);
    const weekNum = index + 1;
    const released = !gate || releasedWeeks.includes(weekNum);
    let status: WeekStatus = 'locked';
    if (released && weekNum < calendarWeekNumber) status = 'complete';
    else if (released && weekNum === calendarWeekNumber) status = 'current';
    return { id, theme: entry.theme, focus: entry.focus, status };
  });

  const msUntilNextWeek =
    calendarWeekNumber >= PROGRAM_WEEK_COUNT
      ? 0
      : REAL_MS_PER_APP_WEEK - (elapsedRealMs % REAL_MS_PER_APP_WEEK);

  const completedAt = programComplete ? new Date(programStartedAt.getTime() + PROGRAM_WEEK_COUNT * REAL_MS_PER_APP_WEEK).toISOString() : undefined;

  return {
    weekNumber,
    contentWeekNumber: weekNumber,
    dayInWeek,
    theme: current.theme,
    focus: current.focus,
    programComplete,
    completedAt,
    weeks,
    subtitle: programComplete
      ? `Program complete — ${current.theme}`
      : `Week ${weekNumber} · Day ${dayInWeek} — ${current.theme}`,
    dayProgress,
    eveningReflectionAvailable: dayProgress >= 0.75,
    weeklyCheckInDue: dayInWeek === APP_DAYS_PER_WEEK && dayProgress >= 0.5,
    elapsedRealMs,
    msUntilNextWeek,
    testModeLabel: `Test time: 1 hour = 1 week · Next week in ${formatDuration(msUntilNextWeek)}`,
    usesCalendarWeeks: false,
  };
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.ceil(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function greetingForDayProgress(dayProgress: number): string {
  if (dayProgress < 0.35) return 'Good morning';
  if (dayProgress < 0.7) return 'Good afternoon';
  return 'Good evening';
}
