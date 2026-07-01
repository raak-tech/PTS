import type { WeekPlan } from '@/lib/plan-generator';

export type ReinforcementTemplate = { title: string; bodyText: string };

/** Read-outs from a week plan (array + legacy single field). */
export function getWeekReinforcementTemplates(week: WeekPlan): ReinforcementTemplate[] {
  if (week.reinforcementTemplates?.length) {
    return week.reinforcementTemplates;
  }
  if (week.reinforcementTemplate?.title || week.reinforcementTemplate?.bodyText) {
    return [week.reinforcementTemplate];
  }
  return [];
}

export function withWeekReinforcementTemplates(
  week: WeekPlan,
  templates: ReinforcementTemplate[],
): WeekPlan {
  const cleaned = templates.filter((t) => t.title.trim() || t.bodyText.trim());
  const next: WeekPlan = { ...week, reinforcementTemplates: cleaned };
  if (cleaned[0]) {
    next.reinforcementTemplate = cleaned[0];
  } else {
    delete next.reinforcementTemplate;
  }
  return next;
}
