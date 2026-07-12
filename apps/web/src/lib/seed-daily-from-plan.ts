import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import type { getDb } from '@/db';
import { dailyCalendarEntries, dailyReinforcements } from '@/db/schema';
import { localDateIso, type CalendarBlock } from '@/lib/daily-layer';
import type { GeneratedPlan } from '@/lib/holistic-plan-types';
import { ayurvedaDisplayLines, weekHolisticYoga } from '@/lib/holistic-plan-types';
import { getWeekReinforcementTemplates } from '@/lib/reinforcement-templates';

type Db = ReturnType<typeof getDb>;

export async function seedDailyFromApprovedPlan(
  db: Db,
  opts: { clientId: string; counselorId: string; planContent: string; planWeek?: number },
) {
  let plan: GeneratedPlan;
  try {
    plan = JSON.parse(opts.planContent) as GeneratedPlan;
  } catch {
    return;
  }

  const weekNumber = opts.planWeek ?? 1;
  const week = plan.weeks.find((w) => w.week === weekNumber) ?? plan.weeks[0];
  if (!week) return;

  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 6);
  const startIso = localDateIso(now);
  const endIso = localDateIso(end);

  const templates = getWeekReinforcementTemplates(week);
  if (templates.length > 0) {
    await db
      .delete(dailyReinforcements)
      .where(
        and(
          eq(dailyReinforcements.clientId, opts.clientId),
          eq(dailyReinforcements.planWeek, week.week),
        ),
      );

    for (const template of templates) {
      if (!template.title?.trim() || !template.bodyText?.trim()) continue;
      await db.insert(dailyReinforcements).values({
        id: randomUUID(),
        counselorId: opts.counselorId,
        clientId: opts.clientId,
        title: template.title,
        bodyText: template.bodyText,
        planWeek: week.week,
        startDate: startIso,
        endDate: endIso,
        createdAt: now,
      });
    }
  } else if (week.dailyPractices[0]) {
    const practice = week.dailyPractices[0];
    await db.insert(dailyReinforcements).values({
      id: randomUUID(),
      counselorId: opts.counselorId,
      clientId: opts.clientId,
      title: `Read-out: ${practice.title}`,
      bodyText: practice.description,
      planWeek: week.week,
      startDate: startIso,
      endDate: endIso,
      createdAt: now,
    });
  }

  const blocks: CalendarBlock[] = week.dailyPractices.map((p, i) => ({
    id: `practice-${i}`,
    type: 'practice',
    label: p.title,
    plannedTime: ['09:00', '13:00', '19:00'][i] ?? '12:00',
    status: 'planned',
  }));

  templates.forEach((template, i) => {
    if (!template.title?.trim()) return;
    blocks.unshift({
      id: `reinforcement-${i}`,
      type: 'reinforcement',
      label: template.title,
      plannedTime: i === 0 ? '08:00' : '08:30',
      status: 'planned',
    });
  });

  const ayurvedaLines = week.ayurvedaBlock ? ayurvedaDisplayLines(week.ayurvedaBlock) : [];
  if (ayurvedaLines[0]) {
    blocks.push({
      id: 'ayurveda-0',
      type: 'custom',
      label: `Ayurveda: ${ayurvedaLines[0].slice(0, 40)}`,
      plannedTime: '07:30',
      status: 'planned',
    });
  }

  const yogic = weekHolisticYoga(week);
  if (yogic) {
    blocks.push({
      id: 'yoga-0',
      type: 'custom',
      label: `Breath & reflection: ${yogic.breathingTechnique.title}`,
      plannedTime: '11:00',
      status: 'planned',
    });
  }

  const musicLabel =
    week.musicMoment?.resolvedTracks?.[0]?.title ??
    week.musicMoment?.playlist?.title ??
    week.musicMoment?.suggestion;
  if (musicLabel) {
    blocks.push({
      id: 'music-0',
      type: 'music',
      label: musicLabel.slice(0, 60),
      plannedTime: '17:00',
      status: 'planned',
    });
  }

  blocks.push({
    id: 'rest-0',
    type: 'rest',
    label: 'Rest / recovery break',
    plannedTime: '15:00',
    status: 'planned',
  });

  const dateIso = localDateIso(now);
  const [existingCalendar] = await db
    .select({ id: dailyCalendarEntries.id })
    .from(dailyCalendarEntries)
    .where(
      and(
        eq(dailyCalendarEntries.clientId, opts.clientId),
        eq(dailyCalendarEntries.dateIso, dateIso),
      ),
    )
    .limit(1);

  if (!existingCalendar) {
    await db.insert(dailyCalendarEntries).values({
      id: randomUUID(),
      clientId: opts.clientId,
      dateIso,
      blocks: JSON.stringify(blocks),
      updatedAt: now,
    });
  }
}
