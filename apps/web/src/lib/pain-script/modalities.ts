import type { FormulationTag } from '@/lib/pain-script/tags';

/** Integrative modality codes — §1A toolkit. */
export const MODALITY_CODES = {
  MOD_TA: 'MOD_TA',
  MOD_ACT: 'MOD_ACT',
  MOD_CBT: 'MOD_CBT',
  MOD_PNE: 'MOD_PNE',
  MOD_CFT: 'MOD_CFT',
  MOD_MIND: 'MOD_MIND',
  MOD_SLEEP: 'MOD_SLEEP',
  MOD_NARR: 'MOD_NARR',
  MOD_YOGA: 'MOD_YOGA',
  MOD_PHIL: 'MOD_PHIL',
  MOD_AYU: 'MOD_AYU',
  MOD_MUSIC: 'MOD_MUSIC',
  MOD_EAET: 'MOD_EAET',
  MOD_PEER: 'MOD_PEER',
  MOD_MI: 'MOD_MI',
} as const;

export type ModalityCode = keyof typeof MODALITY_CODES;

export type EvidenceTier = 'strong' | 'moderate' | 'emerging' | 'resonance' | 'adjunct' | 'proprietary' | 'style';

export type ModalityMeta = {
  code: ModalityCode;
  label: string;
  evidenceTier: EvidenceTier;
  pilot: boolean;
  mapsToTags: FormulationTag[];
};

export const MODALITIES: Record<ModalityCode, ModalityMeta> = {
  MOD_TA: {
    code: 'MOD_TA',
    label: 'Pain Script formulation spine',
    evidenceTier: 'proprietary',
    pilot: true,
    mapsToTags: ['SB_SELF', 'SB_OTHERS', 'SB_LIFE', 'SD_BEHAVIOUR', 'SD_SOMATIC', 'SD_FANTASY', 'RE_TRIGGERS'],
  },
  MOD_ACT: {
    code: 'MOD_ACT',
    label: 'ACT — acceptance, defusion, values',
    evidenceTier: 'strong',
    pilot: true,
    mapsToTags: ['SB_SELF', 'SB_LIFE', 'SD_FANTASY', 'BID_C'],
  },
  MOD_CBT: {
    code: 'MOD_CBT',
    label: 'CBT micro-skills',
    evidenceTier: 'strong',
    pilot: true,
    mapsToTags: ['SD_BEHAVIOUR', 'BID_C'],
  },
  MOD_PNE: {
    code: 'MOD_PNE',
    label: 'Pain neuroscience education',
    evidenceTier: 'strong',
    pilot: true,
    mapsToTags: ['SB_SELF', 'SD_FANTASY', 'SD_SOMATIC'],
  },
  MOD_CFT: {
    code: 'MOD_CFT',
    label: 'Self-compassion',
    evidenceTier: 'strong',
    pilot: true,
    mapsToTags: ['SB_SELF', 'BID_A'],
  },
  MOD_MIND: {
    code: 'MOD_MIND',
    label: 'Mindfulness for pain',
    evidenceTier: 'strong',
    pilot: true,
    mapsToTags: ['SD_SOMATIC', 'RE_RELIVING'],
  },
  MOD_SLEEP: {
    code: 'MOD_SLEEP',
    label: 'Sleep (CBT-I-lite)',
    evidenceTier: 'strong',
    pilot: true,
    mapsToTags: ['SD_SOMATIC', 'BID_S'],
  },
  MOD_NARR: {
    code: 'MOD_NARR',
    label: 'Expressive writing / narrative',
    evidenceTier: 'moderate',
    pilot: true,
    mapsToTags: ['SB_SELF', 'RE_MEMORIES'],
  },
  MOD_YOGA: {
    code: 'MOD_YOGA',
    label: 'Yogic breath, meditation, philosophy (no movement)',
    evidenceTier: 'resonance',
    pilot: true,
    mapsToTags: ['SD_SOMATIC', 'SB_LIFE', 'RE_RELIVING'],
  },
  MOD_PHIL: {
    code: 'MOD_PHIL',
    label: 'Wisdom philosophy of pain',
    evidenceTier: 'resonance',
    pilot: true,
    mapsToTags: ['SB_LIFE', 'SB_SELF'],
  },
  MOD_AYU: {
    code: 'MOD_AYU',
    label: 'Ayurveda diet/rhythm (lifestyle only)',
    evidenceTier: 'resonance',
    pilot: true,
    mapsToTags: ['BID_S'],
  },
  MOD_MUSIC: {
    code: 'MOD_MUSIC',
    label: 'Music psychology',
    evidenceTier: 'adjunct',
    pilot: true,
    mapsToTags: ['SD_SOMATIC'],
  },
  MOD_EAET: {
    code: 'MOD_EAET',
    label: 'EAET / pain reprocessing',
    evidenceTier: 'emerging',
    pilot: false,
    mapsToTags: ['RE_MEMORIES', 'SD_SOMATIC'],
  },
  MOD_PEER: {
    code: 'MOD_PEER',
    label: 'Peer / community support',
    evidenceTier: 'moderate',
    pilot: false,
    mapsToTags: ['SB_OTHERS', 'BID_IP'],
  },
  MOD_MI: {
    code: 'MOD_MI',
    label: 'Motivational interviewing (style)',
    evidenceTier: 'style',
    pilot: true,
    mapsToTags: [],
  },
};

export type OnsetType = 'sudden' | 'gradual' | 'mixed' | null;

const PILOT_MODALITIES: ModalityCode[] = Object.values(MODALITIES)
  .filter((m) => m.pilot)
  .map((m) => m.code);

/** Acute/injury → stabilisation; hold EAET. Chronic → add narrative; EAET still staged. */
export function allowedModalities(onsetType: OnsetType): ModalityCode[] {
  const base = PILOT_MODALITIES.filter((c) => c !== 'MOD_EAET' && c !== 'MOD_PEER');
  if (onsetType === 'sudden') {
    return base.filter((c) => c !== 'MOD_NARR');
  }
  return base;
}

export function isModalityCode(code: string): code is ModalityCode {
  return code in MODALITY_CODES;
}

export function modalityListForPrompt(onsetType: OnsetType): string {
  return allowedModalities(onsetType)
    .map((c) => `${c} (${MODALITIES[c].label})`)
    .join('; ');
}
