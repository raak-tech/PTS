export const PROFILE_FIELD_KEYS = [
  'lifeRoles',
  'workStatus',
  'returnToWork',
  'livingSituation',
  'culturalFrame',
  'identityBefore',
  'whatMissed',
  'lifeBackVision',
  'coreValues',
  'onsetType',
  'trajectory',
  'diagnosesContext',
  'comorbidities',
  'currentTreatments',
  'whatHelps',
  'whoUnderstands',
  'engagementPrefs',
] as const;

export type ProfileFieldKey = (typeof PROFILE_FIELD_KEYS)[number];

export type ProfileFieldDef = {
  key: ProfileFieldKey;
  label: string;
  sensitive: boolean;
  consentScope: 'medical' | null;
  microPrompt: string;
  placeholder: string;
};

export const PROFILE_FIELD_DEFS: ProfileFieldDef[] = [
  {
    key: 'lifeRoles',
    label: 'Life roles',
    sensitive: false,
    consentScope: null,
    microPrompt: 'Which roles matter most in your life right now (parent, worker, friend…)?',
    placeholder: 'e.g. parent, part-time work, caregiver',
  },
  {
    key: 'workStatus',
    label: 'Work / occupation',
    sensitive: false,
    consentScope: null,
    microPrompt: 'What does work look like for you at the moment?',
    placeholder: 'e.g. desk job, on leave, retired',
  },
  {
    key: 'returnToWork',
    label: 'Return to work',
    sensitive: false,
    consentScope: null,
    microPrompt: 'Are you hoping to return to work or change how you work?',
    placeholder: 'Goals or barriers around work',
  },
  {
    key: 'livingSituation',
    label: 'Living situation',
    sensitive: false,
    consentScope: null,
    microPrompt: 'Who do you live with, and what is home like day to day?',
    placeholder: 'Household, support at home',
  },
  {
    key: 'culturalFrame',
    label: 'Cultural background',
    sensitive: false,
    consentScope: null,
    microPrompt: 'Is there a cultural or spiritual frame that shapes how you see pain and healing?',
    placeholder: 'Optional — only what you want to share',
  },
  {
    key: 'identityBefore',
    label: 'Who you were before pain',
    sensitive: false,
    consentScope: null,
    microPrompt: 'Before pain took centre stage, how would you describe yourself?',
    placeholder: 'Strengths, interests, identity',
  },
  {
    key: 'whatMissed',
    label: 'What you miss',
    sensitive: false,
    consentScope: null,
    microPrompt: 'What do you miss most because of pain?',
    placeholder: 'Activities, relationships, freedoms',
  },
  {
    key: 'lifeBackVision',
    label: 'Life back vision',
    sensitive: false,
    consentScope: null,
    microPrompt: 'If pain were more manageable, what would you want back in your life?',
    placeholder: 'Hopes for the next few months',
  },
  {
    key: 'coreValues',
    label: 'Core values',
    sensitive: false,
    consentScope: null,
    microPrompt: 'What values guide you when things are hard?',
    placeholder: 'e.g. family, honesty, perseverance',
  },
  {
    key: 'onsetType',
    label: 'Pain onset',
    sensitive: false,
    consentScope: null,
    microPrompt: 'How did your pain begin (gradual, sudden, after injury…)?',
    placeholder: 'Brief onset story',
  },
  {
    key: 'trajectory',
    label: 'Pain trajectory',
    sensitive: false,
    consentScope: null,
    microPrompt: 'Has pain been getting better, worse, or staying about the same?',
    placeholder: 'Trend over recent months',
  },
  {
    key: 'diagnosesContext',
    label: 'Diagnoses (context)',
    sensitive: true,
    consentScope: 'medical',
    microPrompt: 'Any diagnoses your counselor should know about?',
    placeholder: 'Only if you consent to share medical details',
  },
  {
    key: 'comorbidities',
    label: 'Other health conditions',
    sensitive: true,
    consentScope: 'medical',
    microPrompt: 'Other health conditions that affect your day?',
    placeholder: 'e.g. diabetes, anxiety, arthritis',
  },
  {
    key: 'currentTreatments',
    label: 'Current treatments',
    sensitive: true,
    consentScope: 'medical',
    microPrompt: 'What treatments or medications are you using now?',
    placeholder: 'Meds, physio, other care',
  },
  {
    key: 'whatHelps',
    label: 'What helps',
    sensitive: false,
    consentScope: null,
    microPrompt: 'What has helped even a little — even inconsistently?',
    placeholder: 'Strategies, people, routines',
  },
  {
    key: 'whoUnderstands',
    label: 'Who understands',
    sensitive: false,
    consentScope: null,
    microPrompt: 'Who in your life understands what you are going through?',
    placeholder: 'Support people',
  },
  {
    key: 'engagementPrefs',
    label: 'How you like to engage',
    sensitive: false,
    consentScope: null,
    microPrompt: 'How do you prefer to work on your plan (short steps, audio, writing…)?',
    placeholder: 'Learning and engagement style',
  },
];

export const PROFILE_FIELD_MAP = Object.fromEntries(
  PROFILE_FIELD_DEFS.map((d) => [d.key, d]),
) as Record<ProfileFieldKey, ProfileFieldDef>;

export const NON_SENSITIVE_PROFILE_KEYS = PROFILE_FIELD_DEFS.filter((d) => !d.sensitive).map(
  (d) => d.key,
);

export const CONSENT_SCOPES = ['medical'] as const;
export type ConsentScope = (typeof CONSENT_SCOPES)[number];

export function isProfileFieldKey(key: string): key is ProfileFieldKey {
  return (PROFILE_FIELD_KEYS as readonly string[]).includes(key);
}
