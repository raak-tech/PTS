export const WEEKLY_CHECK_IN_PROMPTS = [
  { id: 'q1', question: 'What did you do most days this week?' },
  { id: 'q2', question: 'What felt easier vs harder?' },
  { id: 'q3', question: 'What is one small adjustment you will try next week?' },
] as const;

export type WeeklyCheckInAnswers = Record<(typeof WEEKLY_CHECK_IN_PROMPTS)[number]['id'], string>;

export function formatWeeklyCheckInSummary(answers: WeeklyCheckInAnswers): string {
  return WEEKLY_CHECK_IN_PROMPTS.map((p) => `${p.question}\n${answers[p.id]?.trim() || '—'}`).join('\n\n');
}

export function parseWeeklyCheckInAnswers(raw: string): WeeklyCheckInAnswers {
  try {
    const parsed = JSON.parse(raw) as WeeklyCheckInAnswers;
    return {
      q1: parsed.q1 ?? '',
      q2: parsed.q2 ?? '',
      q3: parsed.q3 ?? '',
    };
  } catch {
    return { q1: '', q2: '', q3: '' };
  }
}
