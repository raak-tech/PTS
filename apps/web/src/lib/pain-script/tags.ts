/** Canonical tag taxonomy — RAak proprietary. Server-side clinical descriptions. */
export const SCRIPT_TAGS = {
  SB_SELF: 'Belief about self ("I am damaged / fragile")',
  SB_OTHERS: 'Belief about others ("others won\'t understand / help")',
  SB_LIFE: 'Belief about life ("life is painful / unsafe / unfair")',
  SB_NEEDS: 'Underlying needs & feelings (safety, care, validation, autonomy, competence, connection)',
  SD_BEHAVIOUR: 'Behaviours (guarding, pacing, resting, withdrawal, over/under-activity, help-seeking/avoidant)',
  SD_SOMATIC: 'Internal experience (pain intensity, tension, fatigue, sleep, somatic complaints)',
  SD_FANTASY: 'Fantasies ("pain free one day", "never normal again", catastrophic futures)',
  RE_TRIGGERS: 'Current events confirming pain (flares, setbacks, limitations, invalidation, stress)',
  RE_MEMORIES: 'Old emotional memories linked to pain & helplessness',
  RE_RELIVING: 'Reliving imagined catastrophes as if happening now',
} as const;

export const BASIC_ID_TAGS = {
  BID_B: 'Behaviour — pain behaviours & activity patterns',
  BID_A: 'Affect — emotions related to pain',
  BID_S: 'Sensation/physiology — bodily sensations & responses',
  BID_IM: 'Imagery — pain-related images, fantasies, internal representations',
  BID_C: 'Cognition — pain-related thoughts, beliefs, meanings, expectations',
  BID_IP: 'Interpersonal — impact on relationships & social roles',
  BID_D: 'Drug/biological — medical, biological, treatment factors',
} as const;

/** Client-safe friendly labels (no clinical framework names). */
export const CLIENT_FRIENDLY_TARGET_LABELS: Record<ScriptTag, string> = {
  SB_SELF: 'How you see yourself since the pain',
  SB_OTHERS: 'Trust and support from others',
  SB_LIFE: 'What still matters in your life',
  SB_NEEDS: 'What you need underneath the struggle',
  SD_BEHAVIOUR: 'Daily coping patterns',
  SD_SOMATIC: 'Body tension, sleep, and energy',
  SD_FANTASY: 'Worried pictures of the future',
  RE_TRIGGERS: 'Moments that make pain feel bigger',
  RE_MEMORIES: 'Earlier experiences linked to pain',
  RE_RELIVING: 'When the mind pulls you into worst-case scenarios',
};

export type ScriptTag = keyof typeof SCRIPT_TAGS;
export type BasicIdTag = keyof typeof BASIC_ID_TAGS;
export type FormulationTag = ScriptTag | BasicIdTag;

const ALL_TAGS = new Set<string>([
  ...Object.keys(SCRIPT_TAGS),
  ...Object.keys(BASIC_ID_TAGS),
]);

export function isFormulationTag(tag: string): tag is FormulationTag {
  return ALL_TAGS.has(tag);
}

export function filterValidTags(tags: string[]): FormulationTag[] {
  return tags.filter(isFormulationTag);
}
