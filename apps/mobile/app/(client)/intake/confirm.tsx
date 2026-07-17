import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { formatIntakeFieldValue, toClientSummary } from '@/lib/intake-display';
import { persistOneBoxDraft } from '@/lib/intake-draft-sync';
import { buildFollowUpPack } from '@/lib/intake-followups';
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

const REQUIRED_FIELDS = [
  'painSource',
  'painDescription',
  'activitiesAffected',
  'biggestChange',
  'recoveryGoal',
] as const;

const EDITABLE_FIELDS = [...REQUIRED_FIELDS, 'onsetType'] as const;

const FIELD_LABELS: Record<string, string> = {
  painSource: 'What happened',
  painDescription: 'Your situation',
  activitiesAffected: 'Activities affected',
  biggestChange: "What's changed most for you",
  recoveryGoal: 'Your goal',
  onsetType: 'How it started',
};

const FIELD_HELPERS: Record<string, string> = {
  biggestChange: 'How life feels different since this started — not your goal.',
  recoveryGoal: 'What you’re hoping to get back to.',
  activitiesAffected: 'What this gets in the way of day to day.',
  onsetType: 'Sudden after an event, or gradual over time.',
};

function parseActivities(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function initialEdits(result: ExtractionResult, freeText: string, segmentType: string) {
  const mapped = result.mapped ?? {};
  const extracted = result.extracted ?? {};
  const fromField = (key: string, fallback = '') => {
    const display = formatIntakeFieldValue(extracted[key]?.value, key);
    if (display && display !== 'Not provided yet') return display;
    const m = mapped[key];
    if (m === null || m === undefined || m === '') return fallback;
    if (Array.isArray(m)) return m.map(String).join(', ');
    return String(m);
  };
  return {
    painSource: fromField('painSource', segmentType),
    painDescription: fromField('painDescription', freeText),
    activitiesAffected: fromField('activitiesAffected'),
    biggestChange: fromField('biggestChange'),
    recoveryGoal: fromField('recoveryGoal'),
    onsetType: fromField('onsetType'),
  };
}

export default function ConfirmScreen() {
  const params = useLocalSearchParams<{
    result: string;
    freeText: string;
    segmentType: string;
    round: string;
    draftEdits?: string;
  }>();
  const router = useRouter();
  const { completeIntake, token } = useAuth();
  const result: ExtractionResult = useMemo(
    () => JSON.parse(params.result ?? '{}') as ExtractionResult,
    [params.result],
  );
  const round = parseInt(params.round ?? '1', 10);
  const segmentType = params.segmentType ?? 'other';
  const freeText = params.freeText ?? '';

  const [edits, setEdits] = useState(() => {
    const base = initialEdits(result, freeText, segmentType);
    if (params.draftEdits) {
      try {
        const parsed = JSON.parse(params.draftEdits) as Record<string, string>;
        return { ...base, ...parsed };
      } catch {
        return base;
      }
    }
    return base;
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startEditing = (field: string) => setEditingField(field);
  const stopEditing = () => setEditingField(null);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', stopEditing);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistOneBoxDraft(
        {
          step: 'confirm',
          segmentType,
          freeText,
          round,
          resultJson: params.result ?? '{}',
          edits,
        },
        token,
      );
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [edits, freeText, params.result, round, segmentType, token]);

  const extractionUsable = result.extractionUsable !== false;
  const displaySummary =
    result.clientSummary?.trim() ||
    toClientSummary(result.summary ?? '', segmentType);

  const followUpPack = useMemo(() => buildFollowUpPack(result), [result]);
  const allRequiredMet = result.requiredFieldsMet === true;
  // One structured follow-up pack (round 2) is enough — then allow start.
  const canSubmit = extractionUsable && (allRequiredMet || round >= 2);
  const needsFollowUp = followUpPack.length > 0 && round < 2;
  const screenTitle = !extractionUsable
    ? 'Please try again'
    : allRequiredMet
      ? 'Here is what we understood'
      : 'A few more details';

  const styles = useThemedStyles((c) => ({
    field: {
      padding: spacing.sm,
      borderRadius: 10,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      gap: 4,
    },
    fieldName: { fontSize: 13, color: c.muted },
    helper: { fontSize: 12, color: c.faint, lineHeight: 16 },
    fieldValue: { fontSize: 14, color: c.text, lineHeight: 20 },
    editHint: { fontSize: 12, color: c.accentDark, fontWeight: '600' as const },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      padding: spacing.sm,
      fontSize: 14,
      color: c.text,
      minHeight: 72,
      textAlignVertical: 'top' as const,
      backgroundColor: c.bg,
    },
    summary: {
      fontSize: 14,
      color: c.text,
      lineHeight: 21,
      fontStyle: 'italic' as const,
      backgroundColor: c.surface,
      padding: spacing.md,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    followUp: {
      fontSize: 14,
      color: c.text,
      lineHeight: 20,
      paddingLeft: spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: c.accent,
    },
    rewrite: { fontSize: 15, color: c.text, lineHeight: 22, textAlign: 'center' as const },
  }));

  const handleSubmit = async () => {
    const mapped = result.mapped ?? {};
    const activities = parseActivities(
      edits.activitiesAffected || mapped.activitiesAffected,
    );
    const onsetRaw = edits.onsetType.trim().toLowerCase();
    const onsetType =
      onsetRaw === 'sudden' || onsetRaw === 'gradual' || onsetRaw === 'mixed'
        ? onsetRaw
        : edits.onsetType.trim().toLowerCase().includes('sudden')
          ? 'sudden'
          : edits.onsetType.trim().toLowerCase().includes('gradual')
            ? 'gradual'
            : String(mapped.onsetType ?? '');

    const intake: IntakeFormData = {
      ...emptyIntake,
      painSource: edits.painSource || String(mapped.painSource ?? segmentType ?? ''),
      painDescription:
        edits.painDescription ||
        String(mapped.painDescription ?? freeText ?? ''),
      painDuration: String(mapped.painDuration ?? ''),
      ageRange: String(mapped.ageRange ?? ''),
      gender: String(mapped.gender ?? ''),
      occupation: String(mapped.occupation ?? ''),
      affectsWork: String(mapped.affectsWork ?? ''),
      hasDependents: String(mapped.hasDependents ?? ''),
      priorTherapy: String(mapped.priorTherapy ?? ''),
      countryRegion: String(mapped.countryRegion ?? ''),
      activitiesAffected: activities,
      biggestChange: edits.biggestChange || String(mapped.biggestChange ?? ''),
      recoveryGoal: edits.recoveryGoal || String(mapped.recoveryGoal ?? ''),
      recoveryTimeline: String(mapped.recoveryTimeline ?? ''),
      currentTreatment: String(mapped.currentTreatment ?? ''),
      socialSupport: String(mapped.socialSupport ?? ''),
      structurePreference: String(mapped.structurePreference ?? ''),
      engagementTime: String(mapped.engagementTime ?? ''),
      onsetType,
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
    void persistOneBoxDraft(
      {
        step: 'follow-up',
        segmentType,
        freeText,
        round,
        resultJson: params.result ?? '{}',
        edits,
        followUpStep: 0,
        followUpAnswers: [],
      },
      token,
    );
    router.push({
      pathname: '/(client)/intake/follow-up',
      params: {
        result: params.result ?? '{}',
        freeText,
        segmentType,
        round: String(round),
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
      <Screen title={screenTitle} subtitle="We need a clear description before we can continue." showAccountExit>
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
          ? 'Tap any detail to edit, then start your program.'
          : 'Answer a few questions once — or edit the details below.'
      }
      showAccountExit
      footer={
        <View style={{ gap: spacing.sm }}>
          {needsFollowUp ? (
            <Button label="Answer a few questions" onPress={handleAddMore} />
          ) : null}
          {canSubmit ? (
            <Button
              label="Start my program"
              onPress={handleSubmit}
              variant={needsFollowUp ? 'secondary' : undefined}
            />
          ) : null}
          <Button label="Go back" variant="ghost" onPress={() => router.back()} />
        </View>
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
          {EDITABLE_FIELDS.map((field) => {
            const value = edits[field] ?? '';
            if (
              field === 'onsetType' &&
              !value.trim() &&
              editingField !== field
            ) {
              return null;
            }
            const isEditing = editingField === field;
            // Do not nest TextInput in Pressable — focus is unreliable on Android.
            // Also avoid scrollToEndOnKeyboard on this screen (jumps away from mid-list fields).
            if (isEditing) {
              return (
                <View key={field} style={styles.field}>
                  <Text style={styles.fieldName}>{FIELD_LABELS[field] ?? field}</Text>
                  {FIELD_HELPERS[field] ? (
                    <Text style={styles.helper}>{FIELD_HELPERS[field]}</Text>
                  ) : null}
                  <TextField
                    style={styles.input}
                    multiline
                    autoFocus
                    value={value}
                    onChangeText={(t) =>
                      setEdits((prev) => ({ ...prev, [field]: t }))
                    }
                    // Exit edit via Done / keyboard dismiss — not onBlur.
                    // Spurious blur from layout/keyboard was closing the field and scrolling away.
                    blurOnSubmit={false}
                    placeholder="Tap to type…"
                  />
                  <Pressable onPress={stopEditing} hitSlop={8}>
                    <Text style={styles.editHint}>Done</Text>
                  </Pressable>
                </View>
              );
            }
            return (
              <Pressable
                key={field}
                style={styles.field}
                onPress={() => startEditing(field)}
              >
                <Text style={styles.fieldName}>{FIELD_LABELS[field] ?? field}</Text>
                {FIELD_HELPERS[field] ? (
                  <Text style={styles.helper}>{FIELD_HELPERS[field]}</Text>
                ) : null}
                <Text style={styles.fieldValue}>
                  {value.trim() ? value : 'Not provided yet'}
                </Text>
                <Text style={styles.editHint}>Tap to edit</Text>
              </Pressable>
            );
          })}
        </View>

        {needsFollowUp ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ fontSize: 13, fontWeight: '700' as const, color: '#666' }}>
              A COUPLE QUICK QUESTIONS
            </Text>
            {followUpPack.slice(0, 3).map((q) => (
              <Text key={q.id} style={styles.followUp}>
                {q.question}
              </Text>
            ))}
            {followUpPack.length > 3 ? (
              <Text style={styles.helper}>
                +{followUpPack.length - 3} more when you continue
              </Text>
            ) : null}
          </View>
        ) : null}

        {!allRequiredMet && round >= 2 ? (
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' as const, lineHeight: 20 }}>
            You can still edit details above. Your counselor can follow up if anything is unclear.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
