import type { ExtractedIntake } from './intake-extractor';

/**
 * Maps AI-extracted intake fields to the `intakeResponses` DB insert shape.
 * Handles the nullable conversions and type coercions that the existing
 * intake POST route does (painSourceOther → null, hasDependents → boolean, etc.).
 */
export type IntakeInsertShape = {
  painSource: string;
  painSourceOther: string | null;
  painDescription: string;
  painDuration: string;
  ageRange: string | null;
  gender: string | null;
  occupation: string | null;
  affectsWork: string | null;
  hasDependents: boolean | null;
  priorTherapy: string | null;
  countryRegion: string | null;
  activitiesAffected: string;
  biggestChange: string;
  recoveryGoal: string;
  recoveryTimeline: string | null;
  currentTreatment: string | null;
  socialSupport: string | null;
  structurePreference: string | null;
  engagementTime: string | null;
  ayurvedaPreferences: string | null;
  onsetType: 'sudden' | 'gradual' | 'mixed' | null;
  hasRedFlags: boolean;
  isSafe: boolean;
  consentGiven: boolean;
};

/**
 * Coerce a field value to string or null. Boolean values are not coerced
 * here — they're handled separately for hasRedFlags/isSafe/hasDependents.
 */
function stringOrNull(value: string | boolean | null): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return null;
  return String(value);
}

/**
 * Convert the AI-extracted intake into the shape expected by the DB insert.
 *
 * Falls back gracefully: if a required field is null, it uses a placeholder
 * so the DB insert doesn't fail — but the data bar will show low confidence.
 * The counselor can request more detail before plan generation.
 */
export function mapExtractionToIntake(
  extracted: ExtractedIntake,
): IntakeInsertShape {
  // activitiesAffected is stored as JSON string in the DB
  let activitiesAffectedJson = '[]';
  const activitiesRaw = extracted.activitiesAffected.value;
  if (Array.isArray(activitiesRaw)) {
    activitiesAffectedJson = JSON.stringify(activitiesRaw);
  } else if (typeof activitiesRaw === 'string' && activitiesRaw.trim()) {
    try {
      const parsed = JSON.parse(activitiesRaw);
      if (Array.isArray(parsed)) {
        activitiesAffectedJson = JSON.stringify(parsed);
      } else {
        activitiesAffectedJson = JSON.stringify([activitiesRaw]);
      }
    } catch {
      activitiesAffectedJson = JSON.stringify([activitiesRaw]);
    }
  }

  // ayurvedaPreferences: if object, stringify; if string, pass through
  let ayurvedaStr: string | null = null;
  const ayurVal = extracted.ayurvedaPreferences.value;
  if (ayurVal && typeof ayurVal === 'object') {
    ayurvedaStr = JSON.stringify(ayurVal);
  } else if (typeof ayurVal === 'string' && ayurVal.trim()) {
    ayurvedaStr = ayurVal;
  }

  // hasDependents: "yes" → true, "no" → false, anything else → null
  let hasDeps: boolean | null = null;
  const depsVal = extracted.hasDependents.value;
  if (typeof depsVal === 'string') {
    if (depsVal.toLowerCase() === 'yes') hasDeps = true;
    else if (depsVal.toLowerCase() === 'no') hasDeps = false;
  } else if (typeof depsVal === 'boolean') {
    hasDeps = depsVal;
  }

  // painSource: fallback to "general" if null
  const painSource =
    typeof extracted.painSource.value === 'string'
      ? extracted.painSource.value
      : 'general';

  const onsetRaw = extracted.onsetType?.value;
  const onsetType =
    typeof onsetRaw === 'string' &&
    ['sudden', 'gradual', 'mixed'].includes(onsetRaw)
      ? (onsetRaw as 'sudden' | 'gradual' | 'mixed')
      : null;

  return {
    painSource: painSource || 'general',
    painSourceOther:
      painSource === 'other'
        ? stringOrNull(extracted.painSourceOther.value)
        : null,
    painDescription:
      stringOrNull(extracted.painDescription.value) ??
      'Not provided — counselor review required',
    painDuration:
      stringOrNull(extracted.painDuration.value) ?? 'not_specified',
    ageRange: stringOrNull(extracted.ageRange.value),
    gender: stringOrNull(extracted.gender.value),
    occupation: stringOrNull(extracted.occupation.value),
    affectsWork: stringOrNull(extracted.affectsWork.value),
    hasDependents: hasDeps,
    priorTherapy: stringOrNull(extracted.priorTherapy.value),
    countryRegion: stringOrNull(extracted.countryRegion.value),
    activitiesAffected: activitiesAffectedJson,
    biggestChange:
      stringOrNull(extracted.biggestChange.value) ??
      'Not provided — counselor review required',
    recoveryGoal:
      stringOrNull(extracted.recoveryGoal.value) ??
      'Not provided — counselor review required',
    recoveryTimeline: stringOrNull(extracted.recoveryTimeline.value),
    currentTreatment: stringOrNull(extracted.currentTreatment.value),
    socialSupport: stringOrNull(extracted.socialSupport.value),
    structurePreference:
      stringOrNull(extracted.structurePreference.value),
    engagementTime: stringOrNull(extracted.engagementTime.value),
    ayurvedaPreferences: ayurvedaStr,
    onsetType,
    hasRedFlags: Boolean(extracted.hasRedFlags.value),
    isSafe: extracted.isSafe.value !== false,
    consentGiven: true, // Consent is implicitly given via confirmation card
  };
}

/**
 * Returns a human-readable field label.
 */
export function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    painSource: 'Pain source',
    painSourceOther: 'Other pain source',
    painDescription: 'Situation',
    painDuration: 'How long',
    activitiesAffected: 'Activities affected',
    biggestChange: "What's changed most for you",
    recoveryGoal: 'Your goal',
    recoveryTimeline: 'Timeline expectation',
    ageRange: 'Age range',
    gender: 'Gender',
    occupation: 'Occupation',
    affectsWork: 'Affects work',
    hasDependents: 'Has dependents',
    priorTherapy: 'Prior therapy',
    countryRegion: 'Location',
    currentTreatment: 'Current treatment',
    socialSupport: 'Support system',
    structurePreference: 'Structure preference',
    engagementTime: 'Best time of day',
    ayurvedaPreferences: 'Ayurveda preferences',
    onsetType: 'How it started',
    hasRedFlags: 'Safety flags',
    isSafe: 'Safe environment',
  };
  return labels[field] ?? field;
}