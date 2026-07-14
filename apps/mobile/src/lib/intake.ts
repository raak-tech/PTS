export const INTAKE_STEPS = [
  { title: 'Your situation', subtitle: "Let's start with what happened." },
  { title: 'A little about you', subtitle: 'Your background helps us build the right support.' },
  { title: 'The impact on your life', subtitle: "Understanding what's changed." },
  { title: 'What recovery means to you', subtitle: 'Your goals shape everything.' },
  { title: 'Your current support', subtitle: "What's already in place." },
  { title: "How you'd like to work", subtitle: "We'll tailor the program to fit you." },
  { title: 'A few important things', subtitle: "We ask this so your counselor can make sure your program is right for you." },
  { title: 'Almost there', subtitle: 'One final step before we submit your assessment.' },
] as const;

export type IntakeFormData = {
  painSource: string;
  painSourceOther: string;
  painDescription: string;
  painDuration: string;
  ageRange: string;
  gender: string;
  occupation: string;
  affectsWork: string;
  hasDependents: string;
  priorTherapy: string;
  countryRegion: string;
  activitiesAffected: string[];
  biggestChange: string;
  recoveryGoal: string;
  recoveryTimeline: string;
  currentTreatment: string;
  socialSupport: string;
  structurePreference: string;
  engagementTime: string;
  /** sudden | gradual | mixed — optional, used for pain-script modalities */
  onsetType: string;
  energyPattern: string;
  dinacharyaOpenness: string;
  breathStillnessOpenness: string;
  yogaOpenness: string;
  movementPreference: string;
  hasRedFlags: boolean;
  isSafe: boolean;
  consentGiven: boolean;
};

export type IntakeDraft = {
  data: IntakeFormData;
  step: number;
  startedAt: string;
};

export const emptyIntake: IntakeFormData = {
  painSource: '',
  painSourceOther: '',
  painDescription: '',
  painDuration: '',
  ageRange: '',
  gender: '',
  occupation: '',
  affectsWork: '',
  hasDependents: '',
  priorTherapy: '',
  countryRegion: '',
  activitiesAffected: [],
  biggestChange: '',
  recoveryGoal: '',
  recoveryTimeline: '',
  currentTreatment: '',
  socialSupport: '',
  structurePreference: '',
  engagementTime: '',
  onsetType: '',
  energyPattern: '',
  dinacharyaOpenness: '',
  breathStillnessOpenness: '',
  yogaOpenness: '',
  movementPreference: '',
  hasRedFlags: false,
  isSafe: true,
  consentGiven: false,
};

/** True when a saved draft is worth offering resume (not an empty step-0 stub). */
export function hasIntakeDraftProgress(draft: IntakeDraft): boolean {
  if (draft.step > 0) return true;
  return JSON.stringify(draft.data) !== JSON.stringify(emptyIntake);
}

export function canAdvanceIntake(step: number, data: IntakeFormData): boolean {
  switch (step) {
    case 0:
      return Boolean(data.painSource && data.painDescription.trim().length > 10 && data.painDuration);
    case 1:
      return Boolean(data.ageRange && data.gender && data.occupation.trim().length > 0);
    case 2:
      return data.activitiesAffected.length > 0 && data.biggestChange.trim().length > 10;
    case 3:
      return data.recoveryGoal.trim().length > 10 && Boolean(data.recoveryTimeline);
    case 4:
      return Boolean(data.socialSupport);
    case 5:
      return Boolean(data.structurePreference && data.engagementTime);
    case 6:
      // Red flags screen — always advanceable (counselor is alerted regardless)
      return true;
    case 7:
      // Consent + safety screen
      return data.consentGiven;
    default:
      return true;
  }
}

export function intakeToApiPayload(data: IntakeFormData) {
  const ayurveda =
    data.energyPattern ||
    data.dinacharyaOpenness ||
    data.breathStillnessOpenness ||
    data.yogaOpenness ||
    data.movementPreference
      ? JSON.stringify({
          energyPattern: data.energyPattern || undefined,
          dinacharyaOpenness: data.dinacharyaOpenness || undefined,
          breathStillnessOpenness: data.breathStillnessOpenness || undefined,
          yogaOpenness: data.yogaOpenness || undefined,
          movementPreference: data.movementPreference || undefined,
        })
      : undefined;

  return {
    painSource: data.painSource,
    painSourceOther: data.painSourceOther || undefined,
    painDescription: data.painDescription,
    painDuration: data.painDuration,
    ageRange: data.ageRange || undefined,
    gender: data.gender || undefined,
    occupation: data.occupation || undefined,
    affectsWork: data.affectsWork || undefined,
    hasDependents: data.hasDependents || undefined,
    priorTherapy: data.priorTherapy || undefined,
    countryRegion: data.countryRegion || undefined,
    activitiesAffected: JSON.stringify(data.activitiesAffected),
    biggestChange: data.biggestChange,
    recoveryGoal: data.recoveryGoal,
    recoveryTimeline: data.recoveryTimeline || undefined,
    currentTreatment: data.currentTreatment || undefined,
    socialSupport: data.socialSupport || undefined,
    structurePreference: data.structurePreference || undefined,
    engagementTime: data.engagementTime || undefined,
    ayurvedaPreferences: ayurveda,
    onsetType:
      data.onsetType === 'sudden' || data.onsetType === 'gradual' || data.onsetType === 'mixed'
        ? data.onsetType
        : undefined,
    hasRedFlags: data.hasRedFlags,
    isSafe: data.isSafe,
    consentGiven: data.consentGiven,
  };
}
