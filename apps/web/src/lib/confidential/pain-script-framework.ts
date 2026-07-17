/**
 * CONFIDENTIAL — RAak Advisory proprietary intellectual property.
 * Pain Script System (Transactional Analysis framework).
 * Server-side only. Never expose framework labels or structure to clients.
 * Do not commit client-specific formulations derived from this file to public repos.
 */

export const PAIN_SCRIPT_CONFIDENTIALITY_BANNER =
  'CONFIDENTIAL / PROTECTED IP — RAak Pain Script System. Counselor eyes only. Not for client distribution or model training.';

/** Framework guidance injected into LLM plan-generation prompts (counselor workflow only). */
export function buildPainScriptPlanPromptSection(): string {
  return `
=== ${PAIN_SCRIPT_CONFIDENTIALITY_BANNER} ===

Use the following PROPRIETARY formulation framework internally when designing Week 1 and counselor-facing fields.
Do NOT name "Pain Script System", "Transactional Analysis", or "BASIC I.D." in client-facing text (overview, dailyPractices, reinforcementTemplate, musicMoment).
Client-facing copy stays warm, non-clinical, and empowering.

FRAMEWORK (internal formulation lens):

1) PAIN SCRIPT MAINTENANCE CYCLE — three interacting components that sustain the pain script:
   - Script beliefs/feelings: beliefs about self ("damaged/fragile"), others ("won't understand/help"), life ("painful/unsafe/unfair"); underlying needs (safety, care, validation, autonomy, competence, connection); emotions (anger, sadness, fear, grief, vulnerability).
   - Script displays (observable + reported): pain behaviours (guarding, pacing, resting, withdrawal, overactivity, help-seeking/avoidance); sensations (intensity, tension, fatigue, sleep); fantasies ("one day pain-free", "never normal again", catastrophic futures).
   - Reinforcing experiences: flares/setbacks, invalidation, stress; old emotional memories; reliving imagined catastrophes as if real.

2) BASIC I.D. ASSESSMENT LENS (map intake signals where available):
   - B Behaviour: pacing, guarding, avoidance, overdoing, help-seeking patterns
   - A Affect: anxiety, sadness, anger, frustration, fear, grief, shame, numbness
   - S Sensation/physiology: pain intensity, tension, fatigue, sleep, autonomic arousal
   - I Imagery: injury/damage/disability/healing/catastrophe images
   - C Cognition: "I can't cope", hopelessness, pain focus, negative self-talk
   - I Interpersonal: dependence, conflict, withdrawal, invalidation, role change
   - D Drug/biological: medications, comorbidities, treatment side effects

FORMULATION RULES FOR OUTPUT:
- Use this framework to sharpen clientSummary, watchPoints, keyThemes, counselorNote, and protectedFormulation.
- Week 1 daily practices should gently target ONE OR TWO leverage points in the maintenance cycle (e.g. a cognition + a behaviour experiment), not overwhelm.
- If intake pain-script signals are sparse, infer cautiously from what the client said — mark uncertainty in protectedFormulation.
- protectedFormulation is COUNSELOR-ONLY and must include the confidentiality disclaimer field.

=== END CONFIDENTIAL FRAMEWORK ===
`;
}

export type PainScriptSignals = {
  scriptBeliefs?: {
    self?: string | null;
    others?: string | null;
    life?: string | null;
    underlyingNeeds?: string[];
    dominantEmotions?: string[];
  };
  scriptDisplays?: {
    behaviours?: string[];
    sensations?: string[];
    fantasies?: string[];
  };
  reinforcingExperiences?: string[];
  basicId?: Partial<
    Record<
      'behaviour' | 'affect' | 'sensation' | 'imagery' | 'cognition' | 'interpersonal' | 'drug',
      string
    >
  >;
};

export function formatPainScriptSignalsForPrompt(signals: PainScriptSignals | null | undefined): string {
  if (!signals) return 'No structured pain-script signals extracted from intake yet.';
  return JSON.stringify(signals, null, 2);
}

export function buildPainScriptWeekPlanPromptSection(
  formulation?: ProtectedFormulation | null,
): string {
  const formulationBlock = formulation
    ? `\nPRIOR PROTECTED FORMULATION (counselor-only — build on this, do not expose framework names to client):\n${JSON.stringify(formulation, null, 2)}\n`
    : '';
  return `
=== ${PAIN_SCRIPT_CONFIDENTIALITY_BANNER} ===
Use the Pain Script maintenance cycle internally when writing counselorNote and selecting practices.
Target the next therapeutic leverage point based on week engagement data and any prior formulation.
Do NOT use framework terminology in client-facing fields (dailyPractices, reinforcementTemplate, musicMoment).
${formulationBlock}
=== END CONFIDENTIAL FRAMEWORK ===
`;
}

export type ProtectedFormulation = {
  confidentiality: typeof PAIN_SCRIPT_CONFIDENTIALITY_BANNER;
  framework: 'Pain Script System (RAak proprietary)';
  scriptMaintenanceHypothesis: string;
  basicIdSnapshot: Partial<
    Record<
      'behaviour' | 'affect' | 'sensation' | 'imagery' | 'cognition' | 'interpersonal' | 'drug',
      string
    >
  >;
  week1TherapeuticLeverage: string;
};
