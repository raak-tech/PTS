/** Curated flare intervention copy — [PROMPTS §4.2]. Ramya to finalise wording. */

export const FLARE_OPENING =
  "A flare-up is really hard — and it's a normal part of recovery, not a sign you're back to square one. Let's take the next few minutes together.";

export const FLARE_SAFETY_FALLBACK =
  "If you're worried this is a new injury, or you feel unsafe in any way, please contact your clinician or use the support numbers in Crisis resources.";

export type FlareInterventionKey =
  | 'RE_RELIVING'
  | 'RE_TRIGGERS'
  | 'SD_SOMATIC'
  | 'SD_BEHAVIOUR'
  | 'SB_SELF'
  | 'DEFAULT';

export const FLARE_INTERVENTIONS: Record<FlareInterventionKey, string> = {
  RE_RELIVING:
    "Your mind may be pulling you into a worst-case picture right now. That picture is a prediction, not a fact about today. Let's come back to this moment: name 5 things you can see, 4 you can hear, 3 you can feel. You've got through hard days before.",
  RE_TRIGGERS:
    "Setbacks are part of the path, not the end of it. Let's ease the load: slow your breathing for one minute, then choose one small, kind thing to do next — little and often, not push-and-crash.",
  SD_SOMATIC:
    "When pain flares, your system is turned up and sensitised — that's your alarm being loud, and it can settle. Try a slow breath out, longer than the breath in, for a minute, and let your shoulders drop.",
  SD_BEHAVIOUR:
    "It's tempting to stop everything — a little gentle movement or a change of position often helps more than total rest. Only what feels safe, and stop if pain sharply increases.",
  SB_SELF:
    "You are not fragile — you are someone managing something genuinely hard, and you're doing it right now by pausing to look after yourself.",
  DEFAULT:
    "Pause for a minute. Slow your breathing. Choose one small, kind next step — rest, water, or a change of position. You don't need to fix everything right now.",
};

const TAG_PRIORITY = [
  'RE_RELIVING',
  'SD_FANTASY',
  'RE_TRIGGERS',
  'SD_SOMATIC',
  'SD_BEHAVIOUR',
  'SB_SELF',
] as const;

export function pickFlareIntervention(tags: string[]): {
  key: FlareInterventionKey;
  body: string;
} {
  for (const tag of tags) {
    if (tag === 'SD_FANTASY') {
      return { key: 'RE_RELIVING', body: FLARE_INTERVENTIONS.RE_RELIVING };
    }
    if (tag in FLARE_INTERVENTIONS) {
      const key = tag as FlareInterventionKey;
      return { key, body: FLARE_INTERVENTIONS[key] };
    }
  }
  return { key: 'DEFAULT', body: FLARE_INTERVENTIONS.DEFAULT };
}

export function buildFlareClientMessage(opts: {
  tags: string[];
  readOutBody?: string | null;
}): { opening: string; intervention: string; readOut?: string; safety: string } {
  const { key, body } = pickFlareIntervention(opts.tags);
  return {
    opening: FLARE_OPENING,
    intervention: body,
    readOut: opts.readOutBody?.trim() || undefined,
    safety: FLARE_SAFETY_FALLBACK,
  };
}
