import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { formatIntakeFieldValue, toClientSummary } from '@/lib/intake-display';
import { emptyIntake, type IntakeFormData } from '@/lib/intake';
import { spacing } from '@/theme';

type ExtractionField = { value: unknown; confidence: number };
type ExtractionResult = {
  extracted: Record<string, ExtractionField>;
  requiredFieldsMet: boolean;
  missingRequired: string[];
  lowConfidenceRequired: string[];
  followUpQuestions: string[];
  summary: string;
  clientSummary?: string;
  extractionUsable?: boolean;
  overallConfidence: number;
  mapped: Record<string, unknown>;
};

const REQUIRED_FIELDS = ['painSource', 'painDescription', 'activitiesAffected', 'biggestChange', 'recoveryGoal'];
const FIELD_LABELS: Record<string, string> = {
  painSource: 'What happened',
  painDescription: 'Your situation',
  activitiesAffected: 'Activities affected',
  biggestChange: 'Biggest change',
  recoveryGoal: 'Your goal',
  onsetType: 'How it started',
  ageRange: 'Age range',
  gender: 'Gender',
  occupation: 'Occupation',
  priorTherapy: 'Prior therapy',
  socialSupport: 'Support system',
  structurePreference: 'Structure preference',
  engagementTime: 'Best time to engage',
};

function formatFieldForDisplay(fieldName: string, value: unknown): string {
  return formatIntakeFieldValue(value);
}

export default function ConfirmScreen() {
  const params = useLocalSearchParams<{ result: string; freeText: string; segmentType: string; round: string }>();
  const router = useRouter();
  const { completeIntake } = useAuth();
  const result: ExtractionResult = JSON.parse(params.result ?? '{}');
  const round = parseInt(params.round ?? '1', 10);
  const segmentType = params.segmentType ?? 'other';

  const extractionUsable = result.extractionUsable !== false;
  const displaySummary =
    result.clientSummary?.trim() ||
    toClientSummary(result.summary ?? '', segmentType);

  const styles = useThemedStyles((c) => ({
    section: { gap: spacing.sm },
    field: { padding: spacing.sm, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    fieldName: { fontSize: 13, color: c.muted, marginBottom: 2 },
    fieldValue: { fontSize: 14, color: c.text, lineHeight: 20 },
    confidence: { fontSize: 11, color: c.muted, marginTop: 2 },
    summary: { fontSize: 14, color: c.text, lineHeight: 21, fontStyle: 'italic' as const, backgroundColor: c.surface, padding: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: c.border },
    followUp: { fontSize: 14, color: c.text, lineHeight: 20, paddingLeft: spacing.sm, borderLeftWidth: 3, borderLeftColor: c.accent },
    note: { fontSize: 13, color: c.muted, textAlign: 'center' as const, marginTop: spacing.sm },
    rewrite: { fontSize: 15, color: c.text, lineHeight: 22, textAlign: 'center' as const },
  }));

  const confidenceIcon = (confidence: number) => {
    if (confidence >= 0.85) return '✅';
    if (confidence > 0) return '⚠️';
    return '❌';
  };

  const getFieldDisplay = (fieldName: string) => {
    const field = result.extracted?.[fieldName];
    if (!field) return { icon: '❌', value: 'Not provided yet', confidence: 0 };
    const val = formatFieldForDisplay(fieldName, field.value);
    return { icon: confidenceIcon(field.confidence), value: val, confidence: field.confidence };
  };

  const allRequiredMet = result.requiredFieldsMet === true;
  const canSubmit = extractionUsable && (allRequiredMet || round >= 3);
  const screenTitle = !extractionUsable
    ? 'Please try again'
    : allRequiredMet
      ? 'Here is what we understood'
      : 'A few more details';

  const handleSubmit = async () => {
    const mapped = result.mapped ?? {};
    const intake: IntakeFormData = {
      ...emptyIntake,
      painSource: String(mapped.painSource ?? segmentType ?? ''),
      painDescription: String(mapped.painDescription ?? params.freeText ?? ''),
      painDuration: String(mapped.painDuration ?? ''),
      ageRange: String(mapped.ageRange ?? ''),
      gender: String(mapped.gender ?? ''),
      occupation: String(mapped.occupation ?? ''),
      affectsWork: String(mapped.affectsWork ?? ''),
      hasDependents: String(mapped.hasDependents ?? ''),
      priorTherapy: String(mapped.priorTherapy ?? ''),
      countryRegion: String(mapped.countryRegion ?? ''),
      activitiesAffected: Array.isArray(mapped.activitiesAffected) ? mapped.activitiesAffected.map(String) : [],
      biggestChange: String(mapped.biggestChange ?? ''),
      recoveryGoal: String(mapped.recoveryGoal ?? ''),
      recoveryTimeline: String(mapped.recoveryTimeline ?? ''),
      currentTreatment: String(mapped.currentTreatment ?? ''),
      socialSupport: String(mapped.socialSupport ?? ''),
      structurePreference: String(mapped.structurePreference ?? ''),
      engagementTime: String(mapped.engagementTime ?? ''),
      onsetType: String(mapped.onsetType ?? ''),
      hasRedFlags: Boolean(mapped.hasRedFlags ?? false),
      isSafe: mapped.isSafe !== false,
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
        segmentType,
        round: String(round + 1),
        priorExtraction: JSON.stringify({ extracted: result.extracted, summary: result.summary }),
      },
    });
  };

  const handleRewrite = () => {
    router.replace({
      pathname: '/(client)/intake/onebox',
      params: { segmentType, round: String(round) },
    });
  };

  if (!extractionUsable) {
    return (
      <Screen title={screenTitle} subtitle="We need a clear description before we can continue.">
        <View style={{ gap: spacing.md }}>
          <Text style={styles.rewrite}>{displaySummary}</Text>
          <Button label="Rewrite my answer" onPress={handleRewrite} />
          <Button label="Go back" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title={screenTitle}
      subtitle={
        allRequiredMet
          ? 'Check this looks right before we build your program.'
          : 'A few more details would help your counselor.'
      }
    >
      <View style={{ gap: spacing.md }}>
        {displaySummary ? (
          <View style={{ gap: spacing.xs }}>
            <Text style={{ fontSize: 13, fontWeight: '700' as const, color: '#666' }}>SUMMARY</Text>
            <Text style={styles.summary}>{displaySummary}</Text>
          </View>
        ) : null}

        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: 13, fontWeight: '700' as const, color: '#666' }}>KEY DETAILS</Text>
          {([...REQUIRED_FIELDS, 'onsetType'] as const).map((field) => {
            const d = getFieldDisplay(field);
            if (field === 'onsetType' && d.confidence === 0 && d.value === 'Not provided yet') return null;
            return (
              <View key={field} style={styles.field}>
                <Text style={styles.fieldName}>{FIELD_LABELS[field] ?? field}</Text>
                <Text style={styles.fieldValue}>{d.icon} {d.value}</Text>
                {d.confidence > 0 ? (
                  <Text style={styles.confidence}>Confidence: {Math.round(d.confidence * 100)}%</Text>
                ) : null}
              </View>
            );
          })}
        </View>

        {result.followUpQuestions?.length > 0 && round < 3 && !allRequiredMet ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ fontSize: 13, fontWeight: '700' as const, color: '#666' }}>A COUPLE QUICK QUESTIONS</Text>
            {result.followUpQuestions.map((q: string, i: number) => (
              <Text key={i} style={styles.followUp}>{q}</Text>
            ))}
          </View>
        ) : null}

        {result.followUpQuestions?.length > 0 && round < 3 && allRequiredMet ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ fontSize: 13, fontWeight: '700' as const, color: '#666' }}>OPTIONAL — HELPS US PERSONALIZE</Text>
            {result.followUpQuestions.map((q: string, i: number) => (
              <Text key={i} style={styles.followUp}>{q}</Text>
            ))}
          </View>
        ) : null}

        {!allRequiredMet && round >= 3 ? (
          <View style={{ gap: spacing.sm, alignItems: 'center' as const }}>
            <Text style={{ fontSize: 15, color: '#666', textAlign: 'center' as const, lineHeight: 22 }}>
              Your counselor will review this manually.{'\n'}
              They may reach out if they need more detail.
            </Text>
          </View>
        ) : null}

        {result.overallConfidence ? (
          <Text style={styles.note}>Overall confidence: {Math.round(result.overallConfidence * 100)}%</Text>
        ) : null}

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
