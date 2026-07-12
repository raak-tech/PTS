import type { ModalityCode } from '@/lib/pain-script/modalities';
import type { FormulationTag } from '@/lib/pain-script/tags';

export type ProtectedFormulationFields = {
  confidentiality: string;
  framework: string;
  scriptMaintenanceHypothesis: string;
  basicIdSnapshot: Partial<Record<string, string>>;
  week1TherapeuticLeverage: string;
};

export type MusicPurpose = 'grounding' | 'activation' | 'flare' | 'reflection';

export type ResolvedMusicTrack = {
  id: string;
  provider: 'youtube' | 'spotify' | 'owned';
  externalId?: string;
  title: string;
  artist?: string;
  url: string;
  thumbnailUrl?: string;
  durationSec?: number;
};

/** §7B — movement-free yogic support. */
export type YogicPractice = {
  breathingTechnique: { title: string; description: string; duration: string };
  meditation: { title: string; description: string; duration: string };
  philosophicalFraming: string;
  disclaimer: string;
  targets?: FormulationTag[];
  mechanism?: string;
  personalizationBasis?: string;
};

/** §7B — diet + rhythm only. */
export type AyurvedaBlock = {
  dietaryGuidance: string;
  foodsToFavour: string[];
  foodsToAvoid: string[];
  rhythmNote: string;
  disclaimer: string;
  targets?: FormulationTag[];
  mechanism?: string;
  personalizationBasis?: string;
  /** @deprecated legacy plans — mapped to dietaryGuidance on read */
  practices?: string[];
};

/** @deprecated legacy — read-only for old plans. */
export type YogaTrial = {
  principle: string;
  applicability: string;
  microMovement: { title: string; description: string; duration: string };
  disclaimer: string;
};

/** §7A M1 — intent + resolved tracks (no invented titles). */
export type MusicMoment = {
  purpose: MusicPurpose;
  mood?: string;
  suggestion: string;
  searchTerms?: string[];
  language?: string;
  resolvedTracks?: ResolvedMusicTrack[];
  resolvedTrackIds?: string[];
  targets?: FormulationTag[];
  mechanism?: string;
  personalizationBasis?: string;
  /** @deprecated legacy LLM hallucinated playlists */
  playlist?: {
    title: string;
    description: string;
    tracks: { title: string; artist: string; note: string }[];
    spotifySearchQuery: string;
  };
};

export type DailyPractice = {
  title: string;
  description: string;
  duration: string;
  targets?: FormulationTag[];
  mechanism?: string;
  modality?: ModalityCode;
};

export type WeekPlan = {
  week: number;
  theme: string;
  focus: string;
  targets?: FormulationTag[];
  personalizationBasis?: string;
  dailyPractices: DailyPractice[];
  weeklyReflection: string;
  counselorNote: string;
  ayurvedaBlock?: AyurvedaBlock;
  yogicPractice?: YogicPractice;
  /** @deprecated — use yogicPractice */
  yogaTrial?: YogaTrial;
  reinforcementTemplate?: { title: string; bodyText: string };
  reinforcementTemplates?: { title: string; bodyText: string }[];
  musicMoment?: MusicMoment;
};

export type GeneratedPlan = {
  overview: string;
  clientSummary: string;
  weeks: WeekPlan[];
  keyThemes: string[];
  watchPoints: string[];
  formulationSummary?: string;
  protectedFormulation?: ProtectedFormulationFields;
};

export function isLegacyAyurvedaBlock(
  block: AyurvedaBlock,
): block is AyurvedaBlock & { practices: string[] } {
  return Array.isArray(block.practices) && block.practices.length > 0 && !block.dietaryGuidance;
}

export function ayurvedaDisplayLines(block: AyurvedaBlock): string[] {
  if (block.dietaryGuidance) {
    const lines = [block.dietaryGuidance];
    if (block.foodsToFavour.length) lines.push(`Favour: ${block.foodsToFavour.join(', ')}`);
    if (block.foodsToAvoid.length) lines.push(`Limit: ${block.foodsToAvoid.join(', ')}`);
    if (block.rhythmNote) lines.push(block.rhythmNote);
    return lines;
  }
  if (block.practices?.length) return block.practices;
  return block.rhythmNote ? [block.rhythmNote] : [];
}

export function weekHolisticYoga(week: WeekPlan): YogicPractice | null {
  if (week.yogicPractice) return week.yogicPractice;
  if (!week.yogaTrial) return null;
  const t = week.yogaTrial;
  return {
    breathingTechnique: {
      title: 'Gentle breath awareness',
      description: 'Slow, comfortable breathing — in and out without strain. Let the exhale be slightly longer.',
      duration: '3–5 min',
    },
    meditation: {
      title: 'Grounding pause',
      description: t.applicability || 'A short present-moment pause.',
      duration: '3–5 min',
    },
    philosophicalFraming: t.principle,
    disclaimer: t.disclaimer || 'Supportive wellbeing — not medical or physical-therapy advice.',
  };
}

/** JSON schema snippet for LLM prompts — §7 + §7B + §7A M1. */
export function holisticWeekJsonSchemaSnippet(weekNumber = 1): string {
  return `"week": ${weekNumber},
  "theme": "short theme",
  "focus": "1-2 sentences",
  "targets": ["SD_SOMATIC"],
  "personalizationBasis": "Because you shared… (client-safe, no clinical jargon)",
  "dailyPractices": [
    {
      "title": "...",
      "description": "...",
      "duration": "X min",
      "targets": ["SD_SOMATIC"],
      "mechanism": "one line for counselor",
      "modality": "MOD_MIND"
    }
  ],
  "weeklyReflection": "one question",
  "counselorNote": "1-2 sentences",
  "ayurvedaBlock": {
    "dietaryGuidance": "general lifestyle guidance",
    "foodsToFavour": ["..."],
    "foodsToAvoid": ["..."],
    "rhythmNote": "sleep / daily rhythm",
    "disclaimer": "General wellbeing only — not medical or Ayurvedic treatment; check with your doctor/dietitian.",
    "targets": ["BID_S"],
    "mechanism": "one line for counselor"
  },
  "yogicPractice": {
    "breathingTechnique": { "title": "...", "description": "gentle only", "duration": "3-5 min" },
    "meditation": { "title": "...", "description": "grounding / present-moment", "duration": "3-5 min" },
    "philosophicalFraming": "acceptance / equanimity in plain language",
    "disclaimer": "Supportive wellbeing — not medical or physical-therapy advice.",
    "targets": ["SD_SOMATIC"],
    "mechanism": "one line for counselor"
  },
  "reinforcementTemplate": { "title": "...", "bodyText": "..." },
  "musicMoment": {
    "purpose": "grounding|activation|flare|reflection",
    "mood": "calm instrumental",
    "suggestion": "how to listen — 1-2 sentences",
    "searchTerms": ["calm instrumental piano", "slow tempo"],
    "language": "en",
    "targets": ["SD_SOMATIC"],
    "mechanism": "one line for counselor"
  }`;
}
