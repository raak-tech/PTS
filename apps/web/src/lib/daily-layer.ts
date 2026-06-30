export type CalendarBlockType =
  | 'practice'
  | 'reinforcement'
  | 'rest'
  | 'work_break'
  | 'music'
  | 'custom';

export type CalendarBlockStatus = 'planned' | 'done' | 'partial' | 'skipped';

export type CalendarBlock = {
  id: string;
  type: CalendarBlockType;
  label: string;
  plannedTime?: string;
  status: CalendarBlockStatus;
};

export type ReinforcementTemplate = {
  title: string;
  bodyText: string;
};

export type AyurvedaBlock = {
  practices: string[];
  rhythmNote: string;
};

export type MusicMoment = {
  purpose: string;
  suggestion: string;
};

export function localDateIso(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseCalendarBlocks(raw: string): CalendarBlock[] {
  try {
    const parsed = JSON.parse(raw) as CalendarBlock[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isDateInRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}
