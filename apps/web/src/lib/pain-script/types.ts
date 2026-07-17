import type {
  AyurvedaBlock,
  DailyPractice,
  MusicMoment,
  WeekPlan,
  YogicPractice,
} from '@/lib/holistic-plan-types';
import type { ModalityCode } from '@/lib/pain-script/modalities';
import type { FormulationTag } from '@/lib/pain-script/tags';

export type BeliefItem = {
  statement: string;
  evidence: string;
  tags: FormulationTag[];
};

export type ScriptBeliefs = {
  self: BeliefItem[];
  others: BeliefItem[];
  life: BeliefItem[];
  needs: string[];
  coreFeelings: string[];
};

export type ScriptDisplays = {
  behaviours: string[];
  somaticExperience: string[];
  fantasies: string[];
};

export type ReinforcingExperiences = {
  currentTriggers: string[];
  oldMemories: string[];
  catastrophicReliving: string[];
};

export type BasicIdDomain = {
  present: boolean;
  summary: string;
  examples: string[];
};

export type BasicIdProfile = {
  behaviour: BasicIdDomain;
  affect: BasicIdDomain;
  sensation: BasicIdDomain;
  imagery: BasicIdDomain;
  cognition: BasicIdDomain;
  interpersonal: BasicIdDomain;
  drugBiological: BasicIdDomain;
};

export type PainScriptFormulation = {
  scriptBeliefs: ScriptBeliefs;
  scriptDisplays: ScriptDisplays;
  reinforcingExperiences: ReinforcingExperiences;
  basicId: BasicIdProfile;
  maintenanceHypothesis: string;
  primaryTargets: FormulationTag[];
  confidence: Partial<Record<FormulationTag, number>>;
};

export type FormulationGenerationResult = PainScriptFormulation & {
  safetyFlag: boolean;
  safetyReason?: string | null;
};

export type ProfileSnapshot = {
  structured: Record<string, string | null>;
  facts: {
    key: string;
    value: string;
    category: string;
    source: string;
    sensitive: boolean;
    counselorHeld: boolean;
  }[];
  completeness: number;
};

export type TaggedDailyPractice = DailyPractice & {
  targets: FormulationTag[];
  mechanism?: string;
  modality?: ModalityCode;
};

export type TaggedWeekPlan = Omit<WeekPlan, 'dailyPractices' | 'ayurvedaBlock' | 'musicMoment' | 'yogicPractice'> & {
  dailyPractices: TaggedDailyPractice[];
  ayurvedaBlock?: AyurvedaBlock;
  yogicPractice?: YogicPractice;
  musicMoment?: MusicMoment;
};

export type PilotCohort = 'legacy' | 'pain_script';
