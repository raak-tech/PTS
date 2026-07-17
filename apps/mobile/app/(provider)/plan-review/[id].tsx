import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HitTarget } from '@/components/HitTarget';
import { PlanGenerationOverlay } from '@/components/PlanGenerationOverlay';
import { ClientStoryCard, type ClientStorySnippet } from '@/components/provider/ClientStoryCard';
import { Screen } from '@/components/Screen';
import { HolisticWeekSection } from '@/components/holistic/HolisticCards';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  apiApproveWeek,
  apiGetPlan,
  apiGetProviderQueue,
  apiRegeneratePlan,
  parseGeneratedPlan,
  type GeneratedPlan,
} from '@/lib/api';
import { chartUrl } from '@/lib/counselorWeb';
import { PROGRAM_WEEK_THEMES } from '@/lib/appTime';

function WeekSummaryCard({
  week,
  clientId,
}: {
  week: GeneratedPlan['weeks'][number];
  clientId: string;
}) {
  const styles = useThemedStyles((c) => ({
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    weekLabel: { fontSize: 14, fontWeight: '700' as const, color: c.text },
    badge: {
      fontSize: 11,
      color: c.muted,
      backgroundColor: c.bg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      overflow: 'hidden' as const,
    },
    theme: { fontSize: 14, color: c.text, fontWeight: '600' as const, marginBottom: 4 },
    focus: { fontSize: 13, color: c.muted, lineHeight: 19 },
    practiceRow: { fontSize: 13, color: c.muted, marginTop: 4 },
    webLink: { fontSize: 13, color: '#f97316', marginTop: 10, fontWeight: '600' as const },
    note: { fontSize: 12, color: c.faint, marginTop: 6, fontStyle: 'italic' as const },
  }));

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.weekLabel}>Week {week.week}</Text>
        <Text style={styles.badge}>Read-only on mobile</Text>
      </View>
      <Text style={styles.theme}>{week.theme}</Text>
      <Text style={styles.focus}>{week.focus}</Text>
      {week.dailyPractices.slice(0, 2).map((p) => (
        <Text key={p.title} style={styles.practiceRow}>
          • {p.title} ({p.duration})
        </Text>
      ))}
      {week.dailyPractices.length > 2 ? (
        <Text style={styles.practiceRow}>+ {week.dailyPractices.length - 2} more practices</Text>
      ) : null}
      <Text
        style={styles.webLink}
        onPress={() => void Linking.openURL(chartUrl(clientId, { tab: 'plan', week: week.week }))}
      >
        Edit Week {week.week} on Chart →
      </Text>
      <Text style={styles.note}>
        Week {week.week} becomes available after you approve it from the web Chart.
      </Text>
    </Card>
  );
}

function LockedWeekCard({ weekNumber, clientId }: { weekNumber: number; clientId: string }) {
  const theme = PROGRAM_WEEK_THEMES[weekNumber - 1];
  const styles = useThemedStyles((c) => ({
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    weekLabel: { fontSize: 14, fontWeight: '700' as const, color: c.muted },
    badge: {
      fontSize: 11,
      color: c.faint,
      backgroundColor: c.bg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      overflow: 'hidden' as const,
    },
    theme: { fontSize: 14, color: c.muted, fontWeight: '600' as const, marginBottom: 4 },
    note: { fontSize: 12, color: c.faint, marginTop: 6, lineHeight: 18 },
    webLink: { fontSize: 13, color: '#f97316', marginTop: 10, fontWeight: '600' as const },
  }));

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.weekLabel}>🔒 Week {weekNumber}</Text>
        <Text style={styles.badge}>Not generated yet</Text>
      </View>
      {theme ? <Text style={styles.theme}>{theme.theme}</Text> : null}
      <Text style={styles.note}>
        Approve Week {weekNumber - 1} first, then generate Week {weekNumber} from the web Chart after
        saving your week comment.
      </Text>
      <Text
        style={styles.webLink}
        onPress={() => void Linking.openURL(chartUrl(clientId, { tab: 'plan', week: weekNumber }))}
      >
        Open Chart Plan →
      </Text>
    </Card>
  );
}

export default function PlanReviewScreen() {
  const router = useRouter();
  const { id, clientId } = useLocalSearchParams<{ id: string; clientId?: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [approvingWeek1, setApprovingWeek1] = useState(false);
  const [week1Approved, setWeek1Approved] = useState(false);
  const [hasCrisisNotes, setHasCrisisNotes] = useState(false);
  const [crisisAcknowledged, setCrisisAcknowledged] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState('');
  const [approveError, setApproveError] = useState('');
  const [allWeeks, setAllWeeks] = useState<GeneratedPlan['weeks']>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [story, setStory] = useState<ClientStorySnippet | null>(null);

  const styles = useThemedStyles((c) => ({
    body: { fontSize: 14, color: c.muted, lineHeight: 22 },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: c.faint,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
      marginBottom: 4,
    },
    progressRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 8,
    },
    progressLabel: { fontSize: 13, color: c.muted },
    progressBar: { height: 4, backgroundColor: c.border, borderRadius: 2, flex: 1, marginLeft: 12, overflow: 'hidden' as const },
    progressFill: { height: '100%' as any, backgroundColor: '#2e7d32', borderRadius: 2 },
    approveNote: { fontSize: 13, color: c.muted, lineHeight: 20 },
    errorText: { fontSize: 13, color: c.danger },
    separator: { height: 1, backgroundColor: c.border, marginVertical: 12 },
    webLinkText: { fontSize: 13, color: '#f97316', fontWeight: '600' as const, marginTop: 8 },
  }));

  const loadPlan = async () => {
    if (!token || !clientId) {
      setLoading(false);
      return;
    }
    try {
      const [{ plan }, queue] = await Promise.all([
        apiGetPlan(token, clientId),
        apiGetProviderQueue(token),
      ]);
      const fromQueue = queue.pendingPlans.find((p) => p.id === id || p.clientId === clientId);
      if (fromQueue?.intake) {
        setStory(fromQueue.intake);
        if (fromQueue.intake.hasRedFlags || fromQueue.intake.isSafe === false) {
          setHasCrisisNotes(true);
        }
      }
      if (!plan) {
        setLoading(false);
        return;
      }
      const parsed = parseGeneratedPlan(plan.generatedContent);
      if (parsed) {
        setAllWeeks(parsed.weeks);
        setAiSummary(parsed.clientSummary ?? '');
      }
      if ((plan.counselorNotes ?? '').includes('CRISIS')) {
        setHasCrisisNotes(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlan();
  }, [token, clientId, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRegenerate = async () => {
    if (!token || !id) return;
    setRegenerating(true);
    setRegenError('');
    try {
      const result = await apiRegeneratePlan(token, id);
      if (result.planId && result.planId !== id && clientId) {
        router.replace(`/(provider)/plan-review/${result.planId}?clientId=${clientId}`);
        return;
      }
      await loadPlan();
    } catch (e) {
      setRegenError(e instanceof Error ? e.message : 'Regeneration failed');
    } finally {
      setRegenerating(false);
    }
  };

  const onApproveWeek1 = async () => {
    if (!token || !id) return;
    setApprovingWeek1(true);
    setApproveError('');
    try {
      await apiApproveWeek(token, id, 1);
      setWeek1Approved(true);
    } catch (e) {
      setApproveError(e instanceof Error ? e.message : 'Approval failed');
    } finally {
      setApprovingWeek1(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (week1Approved) {
    return (
      <Screen title="Week 1 approved" subtitle="Client can now see Week 1 in their app">
        <Card>
          <Text style={styles.body}>
            Week 1 is live. Generate and approve later weeks from the web Chart after reviewing engagement.
          </Text>
          <Text
            style={styles.webLinkText}
            onPress={() => clientId && void Linking.openURL(chartUrl(clientId, { tab: 'plan' }))}
          >
            Open Chart Plan →
          </Text>
        </Card>
        <Button
          label="Message client"
          onPress={() => clientId && router.push(`/(provider)/messages/${clientId}`)}
        />
        <Button label="Back to queue" variant="secondary" onPress={() => router.replace('/(provider)/(tabs)')} />
      </Screen>
    );
  }

  const week1 = allWeeks[0] ?? null;
  const remainingWeeks = allWeeks.slice(1);
  const totalWeeks = allWeeks.length;

  return (
    <>
      <PlanGenerationOverlay visible={regenerating} />
      <Screen title="Review Week 1 draft" subtitle={`Plan ${id?.slice(0, 8) ?? ''} · Week 1 of 6`}>
        <ClientStoryCard story={story} aiSummary={aiSummary} />

        {totalWeeks > 0 ? (
          <Card>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>0 / {totalWeeks} weeks approved</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '0%' }]} />
            </View>
            <Text style={[styles.body, { marginTop: 8 }]}>
              Approve Week 1 here. Approve Weeks 2–{totalWeeks} from the web Chart after reviewing engagement.
            </Text>
          </Card>
        ) : null}

        {hasCrisisNotes ? (
          <Card alert>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#b71c1c', marginBottom: 6 }}>
              🚨 Crisis-level notes on this plan
            </Text>
            <Text style={{ fontSize: 14, color: '#c62828', lineHeight: 22, marginBottom: 12 }}>
              This client reported red flags or a safety concern. Read their Client story above carefully before
              approving.
            </Text>
            <HitTarget
              onPress={() => setCrisisAcknowledged((a) => !a)}
              style={{ flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 10 }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: crisisAcknowledged }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: crisisAcknowledged ? '#2e7d32' : '#b71c1c',
                  backgroundColor: crisisAcknowledged ? '#2e7d32' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                }}
              >
                {crisisAcknowledged ? (
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>✓</Text>
                ) : null}
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: '#b71c1c', fontWeight: '600', lineHeight: 20 }}>
                I have read the crisis notes and am proceeding with full awareness of this client&apos;s safety
                status.
              </Text>
            </HitTarget>
          </Card>
        ) : null}

        {week1 ? (
          <>
            <Text style={styles.sectionLabel}>Week 1 — approve here</Text>
            <Card title={`Week 1: ${week1.theme}`}>
              <Text style={styles.body}>{week1.focus}</Text>
            </Card>

            <HolisticWeekSection
              week={week1}
              completed={{ ayurveda: false, yoga: false, music: false }}
              onComplete={() => {}}
              readOnly
            />

            <Card title="Holistic blocks">
              <Text style={styles.body}>
                Holistic visibility is edited on the web Chart (Plan tab). Phone approve releases the draft as
                written.
              </Text>
              {clientId ? (
                <Text
                  style={styles.webLinkText}
                  onPress={() => void Linking.openURL(chartUrl(clientId, { tab: 'plan', week: 1 }))}
                >
                  Adjust holistic blocks on Chart →
                </Text>
              ) : null}
            </Card>

            <Text style={styles.approveNote}>
              Approving Week 1 assigns you as this client&apos;s counselor and seeds their daily read-out and
              calendar template.
            </Text>

            {approveError ? <Text style={styles.errorText}>{approveError}</Text> : null}
            {hasCrisisNotes && !crisisAcknowledged ? (
              <Text style={[styles.errorText, { marginBottom: 4 }]}>
                Acknowledge the crisis notes above before approving.
              </Text>
            ) : null}
            <Button
              label={approvingWeek1 ? 'Approving Week 1…' : 'Approve Week 1'}
              onPress={() => void onApproveWeek1()}
              loading={approvingWeek1}
              disabled={hasCrisisNotes && !crisisAcknowledged}
            />
          </>
        ) : null}

        <View style={styles.separator} />
        <Text style={styles.sectionLabel}>Weeks 2–{PROGRAM_WEEK_THEMES.length}</Text>
        <Text style={[styles.body, { marginBottom: 8 }]}>
          Generated and approved one at a time from the web Chart after reviewing each week&apos;s engagement.
        </Text>
        {Array.from({ length: PROGRAM_WEEK_THEMES.length - 1 }, (_, i) => i + 2).map((weekNumber) => {
          const generated = remainingWeeks.find((w) => w.week === weekNumber);
          return generated ? (
            <WeekSummaryCard key={weekNumber} week={generated} clientId={clientId ?? ''} />
          ) : (
            <LockedWeekCard key={weekNumber} weekNumber={weekNumber} clientId={clientId ?? ''} />
          );
        })}

        <View style={styles.separator} />
        {regenError ? <Text style={styles.errorText}>{regenError}</Text> : null}
        <Button
          label={regenerating ? 'Generating draft…' : 'Regenerate Week 1 draft'}
          variant="secondary"
          onPress={() => void onRegenerate()}
          disabled={regenerating}
        />
      </Screen>
    </>
  );
}
