import {
  APP_DAYS_PER_WEEK,
  PROGRAM_WEEK_COUNT,
  REAL_MS_PER_APP_WEEK,
} from '@/config/testTime';

export type WeekStatus = 'complete' | 'current' | 'locked';

export type ProgramWeek = {
  id: string;
  theme: string;
  focus: string;
  status: WeekStatus;
};

export type ProgramTimeState = {
  weekNumber: number;
  dayInWeek: number;
  theme: string;
  focus: string;
  programComplete: boolean;
  completedAt?: string; // ISO date when program completed
  weeks: ProgramWeek[];
  subtitle: string;
  dayProgress: number;
  eveningReflectionAvailable: boolean;
  weeklyCheckInDue: boolean;
  elapsedRealMs: number;
  msUntilNextWeek: number;
  testModeLabel: string;
};

export const PROGRAM_WEEK_THEMES = [
  { theme: 'Finding Ground', focus: 'Safety, grounding, understanding your pain' },
  { theme: 'Understanding the Pain', focus: 'Patterns, triggers, and what your pain is telling you' },
  { theme: 'Gentle Re-engagement', focus: 'Small steps back into meaningful activity' },
  { theme: 'Values in Action', focus: 'Living by what matters, even with pain' },
  { theme: 'Building Confidence', focus: 'Trusting your body and your plan' },
  { theme: 'Moving Forward', focus: 'Sustaining progress beyond the program' },
] as const;

export function computeProgramTime(programStartedAt: Date, now = new Date()): ProgramTimeState {
  const elapsedRealMs = Math.max(0, now.getTime() - programStartedAt.getTime());
  const msPerDay = REAL_MS_PER_APP_WEEK / APP_DAYS_PER_WEEK;
  const weekIndex = Math.floor(elapsedRealMs / REAL_MS_PER_APP_WEEK);
  const weekNumber = Math.min(weekIndex + 1, PROGRAM_WEEK_COUNT);
  const dayInWeek = Math.min(Math.floor((elapsedRealMs % REAL_MS_PER_APP_WEEK) / msPerDay) + 1, APP_DAYS_PER_WEEK);
  const dayProgress = (elapsedRealMs % msPerDay) / msPerDay;
  const programComplete = elapsedRealMs >= PROGRAM_WEEK_COUNT * REAL_MS_PER_APP_WEEK;
  const current = PROGRAM_WEEK_THEMES[weekNumber - 1];

  const weeks: ProgramWeek[] = PROGRAM_WEEK_THEMES.map((entry, index) => {
    const id = String(index + 1);
    let status: WeekStatus = 'locked';
    if (index + 1 < weekNumber) status = 'complete';
    else if (index + 1 === weekNumber) status = 'current';
    return { id, theme: entry.theme, focus: entry.focus, status };
  });

  const msUntilNextWeek =
    weekNumber >= PROGRAM_WEEK_COUNT
      ? 0
      : REAL_MS_PER_APP_WEEK - (elapsedRealMs % REAL_MS_PER_APP_WEEK);

  const completedAt = programComplete ? new Date(programStartedAt.getTime() + PROGRAM_WEEK_COUNT * REAL_MS_PER_APP_WEEK).toISOString() : undefined;

  return {
    weekNumber,
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
