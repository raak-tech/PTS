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

export type TaggedDailyPractice = {
  title: string;
  description: string;
  duration: string;
  targets: FormulationTag[];
  mechanism?: string;
};

export type TaggedWeekPlan = {
  week: number;
  theme: string;
  focus: string;
  targets: FormulationTag[];
  personalizationBasis?: string;
  dailyPractices: TaggedDailyPractice[];
  weeklyReflection: string;
  counselorNote: string;
  ayurvedaBlock?: { practices: string[]; rhythmNote: string; disclaimer?: string };
  yogaTrial?: {
    principle: string;
    applicability: string;
    microMovement: { title: string; description: string; duration: string };
    disclaimer: string;
  };
  reinforcementTemplate?: { title: string; bodyText: string };
  reinforcementTemplates?: { title: string; bodyText: string }[];
  musicMoment?: {
    purpose: string;
    suggestion: string;
    playlist: {
      title: string;
      description: string;
      tracks: { title: string; artist: string; note: string }[];
      spotifySearchQuery: string;
    };
  };
};

export type PilotCohort = 'legacy' | 'pain_script';
