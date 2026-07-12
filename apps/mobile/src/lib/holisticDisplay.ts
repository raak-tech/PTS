/** Client display helpers for holistic week blocks (mirrors web holistic-plan-types). */

export type AyurvedaBlock = {
  dietaryGuidance?: string;
  foodsToFavour?: string[];
  foodsToAvoid?: string[];
  rhythmNote: string;
  disclaimer?: string;
  practices?: string[];
};

export type YogicPractice = {
  breathingTechnique: { title: string; description: string; duration: string };
  meditation: { title: string; description: string; duration: string };
  philosophicalFraming: string;
  disclaimer: string;
};

export type YogaTrial = {
  principle: string;
  applicability: string;
  microMovement?: { title: string; description: string; duration: string };
  disclaimer: string;
};

export type ResolvedMusicTrack = {
  title: string;
  artist?: string;
  url: string;
};

export type MusicMoment = {
  purpose: string;
  suggestion: string;
  mood?: string;
  searchTerms?: string[];
  resolvedTracks?: ResolvedMusicTrack[];
  playlist?: {
    title: string;
    description?: string;
    tracks?: { title: string; artist: string; note?: string }[];
    spotifySearchQuery?: string;
  };
};

export function ayurvedaDisplayLines(block: AyurvedaBlock): string[] {
  if (block.dietaryGuidance) {
    const lines = [block.dietaryGuidance];
    if (block.foodsToFavour?.length) lines.push(`Favour: ${block.foodsToFavour.join(', ')}`);
    if (block.foodsToAvoid?.length) lines.push(`Limit: ${block.foodsToAvoid.join(', ')}`);
    if (block.rhythmNote) lines.push(block.rhythmNote);
    return lines;
  }
  if (block.practices?.length) return block.practices;
  return block.rhythmNote ? [block.rhythmNote] : [];
}

export function weekHolisticYoga(week: {
  yogicPractice?: YogicPractice;
  yogaTrial?: YogaTrial;
}): YogicPractice | null {
  if (week.yogicPractice) return week.yogicPractice;
  if (!week.yogaTrial) return null;
  return {
    breathingTechnique: {
      title: 'Gentle breath awareness',
      description: 'Slow, comfortable breathing — exhale slightly longer than inhale.',
      duration: '3–5 min',
    },
    meditation: {
      title: 'Grounding pause',
      description: week.yogaTrial.applicability || 'A short present-moment pause.',
      duration: '3–5 min',
    },
    philosophicalFraming: week.yogaTrial.principle,
    disclaimer: week.yogaTrial.disclaimer,
  };
}
