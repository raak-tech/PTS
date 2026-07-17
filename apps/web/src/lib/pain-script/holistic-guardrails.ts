import type { AyurvedaBlock } from '@/lib/holistic-plan-types';
import type { ProfileSnapshot } from '@/lib/pain-script/types';

const FORCEFUL_BREATH_PATTERNS = [
  /kapalabhati/i,
  /bhastrika/i,
  /kumbhaka/i,
  /breath\s*hold/i,
  /retention/i,
  /forceful/i,
  /rapid\s*breath/i,
];

const AYURVEDA_DISCLAIMER =
  'General wellbeing only — not medical or Ayurvedic treatment. Check with your doctor or dietitian before changing diet.';

const YOGIC_DISCLAIMER =
  'Supportive wellbeing — not medical or physical-therapy advice. Stop if you feel unwell.';

/** Extract allergy / comorbidity tokens from profile for food screening. */
export function extractDietaryRestrictions(profile: ProfileSnapshot | null): string[] {
  if (!profile) return [];
  const tokens: string[] = [];
  for (const fact of profile.facts) {
    const cat = fact.category.toLowerCase();
    if (
      cat.includes('allerg') ||
      cat.includes('medical') ||
      cat.includes('comorbid') ||
      cat.includes('medication') ||
      fact.key.toLowerCase().includes('allerg') ||
      fact.key.toLowerCase().includes('comorbid')
    ) {
      tokens.push(fact.value.toLowerCase());
    }
  }
  const meds = profile.structured.medications ?? profile.structured.medicalConditions;
  if (meds) tokens.push(meds.toLowerCase());
  return tokens;
}

function foodConflicts(food: string, restrictions: string[]): boolean {
  const f = food.toLowerCase();
  return restrictions.some((r) => r.length > 2 && (f.includes(r) || r.includes(f)));
}

/** Screen foods against profile allergies/comorbidities — §7B.2. */
export function screenAyurvedaFoods(
  block: AyurvedaBlock,
  profile: ProfileSnapshot | null,
): AyurvedaBlock {
  const restrictions = extractDietaryRestrictions(profile);
  if (!restrictions.length) {
    return {
      ...block,
      disclaimer: block.disclaimer?.includes('doctor') ? block.disclaimer : AYURVEDA_DISCLAIMER,
    };
  }

  const favour = (block.foodsToFavour ?? []).filter((f) => !foodConflicts(f, restrictions));
  const avoid = [
    ...(block.foodsToAvoid ?? []),
    ...(block.foodsToFavour ?? []).filter((f) => foodConflicts(f, restrictions)),
  ];
  const uniqueAvoid = [...new Set(avoid)];

  return {
    ...block,
    foodsToFavour: favour,
    foodsToAvoid: uniqueAvoid,
    disclaimer: `${AYURVEDA_DISCLAIMER} Adjusted for your known health considerations.`,
  };
}

/** Reject forceful breathing language in descriptions — §7B.2. */
export function sanitizeBreathingText(text: string): string {
  for (const pattern of FORCEFUL_BREATH_PATTERNS) {
    if (pattern.test(text)) {
      return 'Slow, comfortable breathing — let the exhale be slightly longer than the inhale. No strain or breath-holding.';
    }
  }
  return text;
}

export function defaultYogicDisclaimers(): { ayurveda: string; yogic: string } {
  return { ayurveda: AYURVEDA_DISCLAIMER, yogic: YOGIC_DISCLAIMER };
}

/** Client-facing jargon that must not appear in formulationSummary / personalizationBasis. */
export const CLIENT_JARGON_PATTERNS = [
  /\bscript\b/i,
  /\bfantasy\b/i,
  /transactional analysis/i,
  /maintenance loop/i,
  /\bdisplays\b/i,
  /\bcatastrophic\b/i,
  /\bpathology\b/i,
  /\bpain script\b/i,
  /\bBASIC I\.D\./i,
];

export function containsClientJargon(text: string): boolean {
  return CLIENT_JARGON_PATTERNS.some((p) => p.test(text));
}
