import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { emptyIntake, intakeToApiPayload, type IntakeFormData } from '@/lib/intake';
import { spacing } from '@/theme';

type ExtractionField = { value: any; confidence: number };
type ExtractionResult = {
  extracted: Record<string, ExtractionField>;
  requiredFieldsMet: boolean;
  missingRequired: string[];
  lowConfidenceRequired: string[];
  followUpQuestions: string[];
  summary: string;
  overallConfidence: number;
  mapped: Record<string, any>;
};

const REQUIRED_FIELDS = ['painSource', 'painDescription', 'activitiesAffected', 'biggestChange', 'recoveryGoal'];
const FIELD_LABELS: Record<string, string> = {
  painSource: 'What happened',
  painDescription: 'Your situation',
  activitiesAffected: 'Activities affected',
  biggestChange: 'Biggest change',
  recoveryGoal: 'Your goal',
  ageRange: 'Age range',
  gender: 'Gender',
  occupation: 'Occupation',
  priorTherapy: 'Prior therapy',
  socialSupport: 'Support system',
  structurePreference: 'Structure preference',
  engagementTime: 'Best time to engage',
};

export default function ConfirmScreen() {
  const params = useLocalSearchParams<{ result: string; freeText: string; segmentType: string; round: string }>();
  const router = useRouter();
  const { completeIntake } = useAuth();
  const result: ExtractionResult = JSON.parse(params.result ?? '{}');
  const round = parseInt(params.round ?? '1', 10);

  const styles = useThemedStyles((c) => ({
    section: { gap: spacing.sm },
    field: { padding: spacing.sm, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    fieldName: { fontSize: 13, color: c.muted, marginBottom: 2 },
    fieldValue: { fontSize: 14, color: c.text, lineHeight: 20 },
    confidence: { fontSize: 11, color: c.muted, marginTop: 2 },
    summary: { fontSize: 14, color: c.text, lineHeight: 21, fontStyle: 'italic' as const, backgroundColor: c.surface, padding: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: c.border },
    followUp: { fontSize: 14, color: c.text, lineHeight: 20, paddingLeft: spacing.sm, borderLeftWidth: 3, borderLeftColor: c.accent },
    note: { fontSize: 13, color: c.muted, textAlign: 'center' as const, marginTop: spacing.sm },
  }));

  const confidenceIcon = (confidence: number) => {
    if (confidence >= 0.85) return '✅';
    if (confidence > 0) return '⚠️';
    return '❌';
  };

  const getFieldDisplay = (fieldName: string) => {
    const field = result.extracted?.[fieldName];
    if (!field) return { icon: '❌', value: 'Not provided', confidence: 0 };
    const val = typeof field.value === 'string' ? field.value : JSON.stringify(field.value);
    return { icon: confidenceIcon(field.confidence), value: val, confidence: field.confidence };
  };

  const allRequiredMet = result.requiredFieldsMet !== false;
  const canSubmit = allRequiredMet || round >= 3;

  const handleSubmit = async () => {
    // Build IntakeFormData from mapped result + empty defaults
    const mapped = result.mapped ?? {};
    const intake: IntakeFormData = {
      ...emptyIntake,
      painSource: mapped.painSource ?? params.segmentType ?? '',
      painDescription: mapped.painDescription ?? params.freeText ?? '',
      painDuration: mapped.painDuration ?? '',
      ageRange: mapped.ageRange ?? '',
      gender: mapped.gender ?? '',
      occupation: mapped.occupation ?? '',
      affectsWork: mapped.affectsWork ?? '',
      hasDependents: mapped.hasDependents ?? '',
      priorTherapy: mapped.priorTherapy ?? '',
      countryRegion: mapped.countryRegion ?? '',
      activitiesAffected: Array.isArray(mapped.activitiesAffected) ? mapped.activitiesAffected : [],
      biggestChange: mapped.biggestChange ?? '',
      recoveryGoal: mapped.recoveryGoal ?? '',
      recoveryTimeline: mapped.recoveryTimeline ?? '',
      currentTreatment: mapped.currentTreatment ?? '',
      socialSupport: mapped.socialSupport ?? '',
      structurePreference: mapped.structurePreference ?? '',
      engagementTime: mapped.engagementTime ?? '',
      hasRedFlags: mapped.hasRedFlags ?? false,
      isSafe: mapped.isSafe ?? true,
      consentGiven: true,
    };
    try {
      await completeIntake(intake);
      router.replace('/(client)/intake-complete');
    } catch {
      // Error handled by completeIntake internally
    }
  };

  const handleAddMore = () => {
    router.push({
      pathname: '/(client)/intake/onebox',
      params: {
        segmentType: params.segmentType ?? 'other',
        round: String(round + 1),
        priorExtraction: JSON.stringify({ extracted: result.extracted, summary: result.summary }),
      },
    });
  };

  return (
    <Screen title={allRequiredMet ? 'Here is what we understood' : 'Almost there'} subtitle={allRequiredMet ? 'Check this looks right before we build your program.' : 'A few more details would help your counselor.'}>
      <View style={{ gap: spacing.md }}>
        {/* Summary */}
        {result.summary ? (
          <View style={{ gap: spacing.xs }}>
            <Text style={{ fontSize: 13, fontWeight: '700' as const, color: '#666' }}>SUMMARY</Text>
            <Text style={styles.summary}>"{result.summary}"</Text>
          </View>
        ) : null}

        {/* Required fields with confidence */}
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: 13, fontWeight: '700' as const, color: '#666' }}>KEY DETAILS</Text>
          {REQUIRED_FIELDS.map((field) => {
            const d = getFieldDisplay(field);
            return (
              <View key={field} style={styles.field}>
                <Text style={styles.fieldName}>{FIELD_LABELS[field] ?? field}</Text>
                <Text style={styles.fieldValue}>{d.icon} {d.value}</Text>
                {d.confidence > 0 ? <Text style={styles.confidence}>Confidence: {Math.round(d.confidence * 100)}%</Text> : null}
              </View>
            );
          })}
        </View>

        {/* Follow-up questions */}
        {!allRequiredMet && result.followUpQuestions?.length > 0 && round < 3 ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ fontSize: 13, fontWeight: '700' as const, color: '#666' }}>A COUPLE QUICK QUESTIONS</Text>
            {result.followUpQuestions.map((q: string, i: number) => (
              <Text key={i} style={styles.followUp}>{q}</Text>
            ))}
          </View>
        ) : null}

        {/* Counselor surrender note */}
        {!allRequiredMet && round >= 3 ? (
          <View style={{ gap: spacing.sm, alignItems: 'center' as const }}>
            <Text style={{ fontSize: 15, color: '#666', textAlign: 'center' as const, lineHeight: 22 }}>
              Your counselor will review this manually. {'\n'}
              They may reach out if they need more detail.
            </Text>
          </View>
        ) : null}

        {/* Overall confidence */}
        {result.overallConfidence ? (
          <Text style={styles.note}>Overall confidence: {Math.round(result.overallConfidence * 100)}%</Text>
        ) : null}

        {/* Action buttons */}
        <View style={{ gap: spacing.sm }}>
          {canSubmit ? (
            <Button label="Start my program" onPress={handleSubmit} />
          ) : (
            <Button label="Add more detail" onPress={handleAddMore} />
          )}
          <Button label="Go back" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
