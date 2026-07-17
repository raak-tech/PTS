import type { AyurvedaBlock, GeneratedPlan, WeekPlan, YogicPractice } from '@/lib/holistic-plan-types';
import { isLegacyAyurvedaBlock } from '@/lib/holistic-plan-types';
import {
  containsClientJargon,
  defaultYogicDisclaimers,
  sanitizeBreathingText,
  screenAyurvedaFoods,
} from '@/lib/pain-script/holistic-guardrails';
import { resolveMusicMoment } from '@/lib/pain-script/music-resolver';
import { isModalityCode } from '@/lib/pain-script/modalities';
import type { FormulationTag } from '@/lib/pain-script/tags';
import { filterValidTags } from '@/lib/pain-script/tags';
import type { ProfileSnapshot } from '@/lib/pain-script/types';

export type PlanPostProcessOpts = {
  profile?: ProfileSnapshot | null;
  primaryTargets?: FormulationTag[];
  resolveMusic?: boolean;
};

function migrateAyurvedaBlock(raw: AyurvedaBlock | undefined): AyurvedaBlock | undefined {
  if (!raw) return undefined;
  if (isLegacyAyurvedaBlock(raw)) {
    return {
      dietaryGuidance: raw.practices.join('. '),
      foodsToFavour: [],
      foodsToAvoid: [],
      rhythmNote: raw.rhythmNote,
      disclaimer: raw.disclaimer ?? defaultYogicDisclaimers().ayurveda,
      targets: raw.targets,
      mechanism: raw.mechanism,
      personalizationBasis: raw.personalizationBasis,
    };
  }
  return {
    dietaryGuidance: raw.dietaryGuidance ?? '',
    foodsToFavour: raw.foodsToFavour ?? [],
    foodsToAvoid: raw.foodsToAvoid ?? [],
    rhythmNote: raw.rhythmNote ?? '',
    disclaimer: raw.disclaimer ?? defaultYogicDisclaimers().ayurveda,
    targets: raw.targets,
    mechanism: raw.mechanism,
    personalizationBasis: raw.personalizationBasis,
  };
}

function migrateYogicPractice(week: WeekPlan): YogicPractice | undefined {
  if (week.yogicPractice) {
    const y = week.yogicPractice;
    return {
      ...y,
      breathingTechnique: {
        ...y.breathingTechnique,
        description: sanitizeBreathingText(y.breathingTechnique.description),
      },
      disclaimer: y.disclaimer || defaultYogicDisclaimers().yogic,
      targets: y.targets ? filterValidTags(y.targets) : undefined,
    };
  }
  if (!week.yogaTrial) return undefined;
  const t = week.yogaTrial;
  return {
    breathingTechnique: {
      title: 'Gentle breath awareness',
      description: sanitizeBreathingText(
        'Slow, comfortable breathing — exhale slightly longer than inhale. No strain.',
      ),
      duration: '3–5 min',
    },
    meditation: {
      title: 'Grounding pause',
      description: t.applicability || 'A short present-moment pause.',
      duration: '3–5 min',
    },
    philosophicalFraming: t.principle,
    disclaimer: t.disclaimer || defaultYogicDisclaimers().yogic,
  };
}

function constrainWeekTargets(week: WeekPlan, primaryTargets?: FormulationTag[]): WeekPlan {
  if (!primaryTargets?.length) {
    return {
      ...week,
      targets: week.targets ? filterValidTags(week.targets) : undefined,
    };
  }
  const allowed = new Set(primaryTargets);
  const weekTargets = filterValidTags(week.targets ?? []);
  const constrained = weekTargets.filter((t) => allowed.has(t));
  return {
    ...week,
    targets: constrained.length ? constrained : primaryTargets.slice(0, 3),
  };
}

export async function normalizeWeekPlan(
  week: WeekPlan,
  opts: PlanPostProcessOpts = {},
): Promise<WeekPlan> {
  let normalized: WeekPlan = {
    ...week,
    dailyPractices: (week.dailyPractices ?? []).map((p) => ({
      ...p,
      targets: p.targets ? filterValidTags(p.targets) : undefined,
      modality: p.modality && isModalityCode(p.modality) ? p.modality : undefined,
    })),
  };

  normalized = constrainWeekTargets(normalized, opts.primaryTargets);

  const ayurveda = migrateAyurvedaBlock(normalized.ayurvedaBlock);
  if (ayurveda) {
    normalized.ayurvedaBlock = screenAyurvedaFoods(ayurveda, opts.profile ?? null);
  }

  const yogic = migrateYogicPractice(normalized);
  if (yogic) {
    normalized.yogicPractice = yogic;
    delete normalized.yogaTrial;
  }

  if (normalized.musicMoment) {
    const purpose = normalized.musicMoment.purpose;
    const validPurpose = ['grounding', 'activation', 'flare', 'reflection'].includes(purpose)
      ? purpose
      : 'grounding';
    normalized.musicMoment = {
      ...normalized.musicMoment,
      purpose: validPurpose as WeekPlan['musicMoment'] extends { purpose: infer P } ? P : never,
      targets: normalized.musicMoment.targets
        ? filterValidTags(normalized.musicMoment.targets)
        : undefined,
    };
    if (opts.resolveMusic !== false) {
      normalized.musicMoment = await resolveMusicMoment(normalized.musicMoment);
    }
  }

  if (
    normalized.personalizationBasis &&
    containsClientJargon(normalized.personalizationBasis)
  ) {
    normalized.personalizationBasis = 'This week builds on what you shared with your counselor.';
  }

  return normalized;
}

export async function postProcessGeneratedPlan(
  plan: GeneratedPlan,
  opts: PlanPostProcessOpts = {},
): Promise<GeneratedPlan> {
  const weeks = await Promise.all(
    (plan.weeks ?? []).map((w) => normalizeWeekPlan(w, opts)),
  );

  let formulationSummary = plan.formulationSummary;
  if (formulationSummary && containsClientJargon(formulationSummary)) {
    formulationSummary = plan.overview;
  }

  return {
    ...plan,
    weeks,
    formulationSummary,
  };
}

export function validatePlanTags(
  plan: GeneratedPlan,
  primaryTargets: FormulationTag[],
): string[] {
  const errors: string[] = [];
  const allowed = new Set(primaryTargets);

  for (const week of plan.weeks ?? []) {
    for (const t of week.targets ?? []) {
      if (!allowed.has(t)) errors.push(`Week ${week.week}: target ${t} not in primaryTargets`);
    }
    for (const p of week.dailyPractices ?? []) {
      for (const t of p.targets ?? []) {
        if (!allowed.has(t)) errors.push(`Week ${week.week} practice "${p.title}": target ${t} not in primaryTargets`);
      }
    }
  }
  return errors;
}
