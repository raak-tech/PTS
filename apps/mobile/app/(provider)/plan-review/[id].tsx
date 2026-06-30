import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HitTarget } from '@/components/HitTarget';
import { PlanGenerationOverlay } from '@/components/PlanGenerationOverlay';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  apiApprovePlan,
  apiApproveWeek,
  apiGetPlan,
  apiRegeneratePlan,
  parseGeneratedPlan,
  type GeneratedPlan,
} from '@/lib/api';
import { API_URL } from '@/config';
import { HolisticWeekSection } from '@/components/holistic/HolisticCards';

type HolisticVisibility = { ayurveda: boolean; yoga: boolean; music: boolean };

function applyHolisticVisibility(
  week: GeneratedPlan['weeks'][number] | null,
  visibility: HolisticVisibility,
) {
  if (!week) return null;
  return {
    ...week,
    ayurvedaBlock: visibility.ayurveda ? week.ayurvedaBlock : undefined,
    yogaTrial: visibility.yoga ? week.yogaTrial : undefined,
    musicMoment: visibility.music ? week.musicMoment : undefined,
  };
}

// Read-only summary card for weeks 2–6 with a link to edit on web
function WeekSummaryCard({
  week,
  clientId,
  planId,
}: {
  week: GeneratedPlan['weeks'][number];
  clientId: string;
  planId: string;
}) {
  const styles = useThemedStyles((c) => ({
    header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 8 },
    weekLabel: { fontSize: 14, fontWeight: '700' as const, color: c.text },
    badge: { fontSize: 11, color: c.muted, backgroundColor: c.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' as const },
    theme: { fontSize: 14, color: c.text, fontWeight: '600' as const, marginBottom: 4 },
    focus: { fontSize: 13, color: c.muted, lineHeight: 19 },
    practiceRow: { fontSize: 13, color: c.muted, marginTop: 4 },
    webLink: { fontSize: 13, color: '#f97316', marginTop: 10, fontWeight: '600' as const },
    note: { fontSize: 12, color: c.faint, marginTop: 6, fontStyle: 'italic' as const },
  }));

  const webUrl = `${API_URL}/provider/clients/${clientId}`;

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.weekLabel}>Week {week.week}</Text>
        <Text style={styles.badge}>Read-only on mobile</Text>
      </View>
      <Text style={styles.theme}>{week.theme}</Text>
      <Text style={styles.focus}>{week.focus}</Text>
      {week.dailyPractices.slice(0, 2).map((p) => (
        <Text key={p.title} style={styles.practiceRow}>• {p.title} ({p.duration})</Text>
      ))}
      {week.dailyPractices.length > 2 && (
        <Text style={styles.practiceRow}>+ {week.dailyPractices.length - 2} more practices</Text>
      )}
      <Text
        style={styles.webLink}
        onPress={() => void Linking.openURL(webUrl)}
      >
        Edit Week {week.week} on web workspace →
      </Text>
      <Text style={styles.note}>
        Week {week.week} will become available to the client after you approve it from the web workspace.
      </Text>
    </Card>
  );
}

export default function PlanReviewScreen() {
  const router = useRouter();
  const { id, clientId } = useLocalSearchParams<{ id: string; clientId?: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approvingWeek1, setApprovingWeek1] = useState(false);
  const [week1Approved, setWeek1Approved] = useState(false);
  const [hasCrisisNotes, setHasCrisisNotes] = useState(false);
  const [crisisAcknowledged, setCrisisAcknowledged] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState('');
  const [approveError, setApproveError] = useState('');
  const [legacyApproved, setLegacyApproved] = useState(false);
  const [allWeeks, setAllWeeks] = useState<GeneratedPlan['weeks']>([]);
  const [context, setContext] = useState('');
  const [holisticVisibility, setHolisticVisibility] = useState<HolisticVisibility>({
    ayurveda: true,
    yoga: true,
    music: true,
  });

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
    progressRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 8 },
    progressLabel: { fontSize: 13, color: c.muted },
    progressBar: { height: 4, backgroundColor: c.border, borderRadius: 2, flex: 1, marginLeft: 12, overflow: 'hidden' as const },
    progressFill: { height: '100%' as any, backgroundColor: '#2e7d32', borderRadius: 2 },
    approveNote: { fontSize: 13, color: c.muted, lineHeight: 20 },
    errorText: { fontSize: 13, color: c.danger },
    week1Label: { fontSize: 16, fontWeight: '700' as const, color: c.text, marginBottom: 4 },
    week1Theme: { fontSize: 14, color: c.muted },
    separator: { height: 1, backgroundColor: c.border, marginVertical: 12 },
    webLinkText: { fontSize: 13, color: '#f97316', fontWeight: '600' as const, marginTop: 8 },
  }));

  const loadPlan = async () => {
    if (!token || !clientId) { setLoading(false); return; }
    try {
      const { plan } = await apiGetPlan(token, clientId);
      if (!plan) { setLoading(false); return; }
      const parsed = parseGeneratedPlan(plan.generatedContent);
      if (parsed) {
        setAllWeeks(parsed.weeks);
        setContext(parsed.clientSummary ?? '');
      }
      // Crisis gate: counselorNotes contains 'CRISIS' when hasRedFlags or !isSafe
      if ((plan.counselorNotes ?? '').includes('CRISIS')) {
        setHasCrisisNotes(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadPlan(); }, [token, clientId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Per-week approval — Week 1 only on mobile
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

  // Legacy full-plan approval (kept for backward compat)
  const onApproveLegacy = async () => {
    if (!token || !id) return;
    setApproving(true);
    try {
      await apiApprovePlan(token, id, notes.trim() || undefined, holisticVisibility);
      setLegacyApproved(true);
    } finally {
      setApproving(false);
    }
  };

  const toggleHolistic = (key: keyof HolisticVisibility) => {
    setHolisticVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // Post-approval success screen
  if (week1Approved || legacyApproved) {
    return (
      <Screen title="Week 1 approved" subtitle="Client can now see Week 1 in their app">
        <Card>
          <Text style={styles.body}>
            Week 1 is live for this client. To approve Weeks 2–6 and edit the full plan, open the web workspace.
          </Text>
          <Text
            style={styles.webLinkText}
            onPress={() => clientId && void Linking.openURL(`${API_URL}/provider/clients/${clientId}`)}
          >
            Open web workspace →
          </Text>
        </Card>
        <Button
          label="Message client"
          onPress={() => clientId && router.push(`/(provider)/messages/${clientId}`)}
        />
        <Button
          label="Back to queue"
          variant="secondary"
          onPress={() => router.replace('/(provider)/(tabs)')}
        />
      </Screen>
    );
  }

  const week1 = allWeeks[0] ?? null;
  const week1Preview = week1 ? applyHolisticVisibility(week1, holisticVisibility) : null;
  const remainingWeeks = allWeeks.slice(1);
  const totalWeeks = allWeeks.length;

  return (
    <>
      <PlanGenerationOverlay visible={regenerating} />
      <Screen title="Review plan" subtitle={`Plan ${id?.slice(0, 8) ?? ''} · ${totalWeeks} weeks`}>

        {/* Client context */}
        <Card title="Client context">
          <Text style={styles.body}>
            {context || 'Intake summary will appear here when plan content is available.'}
          </Text>
        </Card>

        {/* Progress indicator */}
        {totalWeeks > 0 && (
          <Card>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>0 / {totalWeeks} weeks approved</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '0%' }]} />
            </View>
            <Text style={[styles.body, { marginTop: 8 }]}>
              Approve Week 1 here. Approve Weeks 2–{totalWeeks} from the web workspace after reviewing engagement data.
            </Text>
          </Card>
        )}

        {/* Crisis acknowledgment gate */}
        {hasCrisisNotes && (
          <Card alert>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#b71c1c', marginBottom: 6 }}>
              🚨 Crisis-level notes on this plan
            </Text>
            <Text style={{ fontSize: 14, color: '#c62828', lineHeight: 22, marginBottom: 12 }}>
              This client reported red flags or a safety concern in their intake. Read their intake carefully before approving any week.
            </Text>
            <HitTarget
              onPress={() => setCrisisAcknowledged(a => !a)}
              style={{ flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 10 }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: crisisAcknowledged }}
            >
              <View style={{
                width: 22, height: 22, borderRadius: 4,
                borderWidth: 2, borderColor: crisisAcknowledged ? '#2e7d32' : '#b71c1c',
                backgroundColor: crisisAcknowledged ? '#2e7d32' : 'transparent',
                alignItems: 'center', justifyContent: 'center', marginTop: 1,
              }}>
                {crisisAcknowledged && <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>✓</Text>}
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: '#b71c1c', fontWeight: '600', lineHeight: 20 }}>
                I have read the crisis notes and am proceeding with full awareness of this client's safety status.
              </Text>
            </HitTarget>
          </Card>
        )}

        {/* ── WEEK 1 — full review + approve ── */}
        {week1 && (
          <>
            <Text style={styles.sectionLabel}>Week 1 — approve here</Text>

            <Card title={`Week 1: ${week1.theme}`}>
              <Text style={styles.body}>{week1.focus}</Text>
            </Card>

            <HolisticWeekSection
              week={week1Preview}
              completed={{ ayurveda: false, yoga: false, music: false }}
              onComplete={() => {}}
              readOnly
            />

            {/* Holistic visibility toggles for Week 1 */}
            <Card title="Holistic blocks for client">
              <Text style={styles.body}>
                Turn off any block you do not want the client to see after approval.
              </Text>
              {(['ayurveda', 'yoga', 'music'] as const).map((key) => (
                <View
                  key={key}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}
                >
                  <Text style={{ fontSize: 14, color: colors.text }}>
                    {key === 'ayurveda' ? 'Ayurveda wellness' : key === 'yoga' ? 'Yoga trial' : 'Music playlists'}
                  </Text>
                  <Switch value={holisticVisibility[key]} onValueChange={() => toggleHolistic(key)} />
                </View>
              ))}
            </Card>

            {/* Optional counselor note */}
            <TextField
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, minHeight: 80, backgroundColor: colors.bg }}
              placeholder="Optional counselor note for this client"
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <Text style={styles.approveNote}>
              Approving Week 1 assigns you as this client's counselor and seeds their daily read-out and calendar template.
            </Text>

            {approveError ? <Text style={styles.errorText}>{approveError}</Text> : null}
            {hasCrisisNotes && !crisisAcknowledged && (
              <Text style={[styles.errorText, { marginBottom: 4 }]}>
                Acknowledge the crisis notes above before approving.
              </Text>
            )}
            <Button
              label={approvingWeek1 ? 'Approving Week 1…' : 'Approve Week 1'}
              onPress={() => void onApproveWeek1()}
              loading={approvingWeek1}
              disabled={hasCrisisNotes && !crisisAcknowledged}
            />
          </>
        )}

        {/* ── WEEKS 2–N — read-only summaries ── */}
        {remainingWeeks.length > 0 && (
          <>
            <View style={styles.separator} />
            <Text style={styles.sectionLabel}>Weeks 2–{totalWeeks} — review on web</Text>
            <Text style={[styles.body, { marginBottom: 8 }]}>
              These weeks are visible here for context. Edit and approve them from the web workspace after reviewing Week 1 engagement data.
            </Text>
            {remainingWeeks.map((week) => (
              <WeekSummaryCard
                key={week.week}
                week={week}
                clientId={clientId ?? ''}
                planId={id ?? ''}
              />
            ))}
          </>
        )}

        {/* Regenerate + legacy full approve */}
        <View style={styles.separator} />
        {regenError ? <Text style={styles.errorText}>{regenError}</Text> : null}
        <Button
          label={regenerating ? 'Generating draft…' : 'Regenerate full plan draft'}
          variant="secondary"
          onPress={() => void onRegenerate()}
          disabled={regenerating}
        />
        <Button
          label={approving ? 'Approving all…' : 'Approve all weeks at once'}
          variant="ghost"
          onPress={() => void onApproveLegacy()}
          loading={approving}
          disabled={hasCrisisNotes && !crisisAcknowledged}
        />
        <Text style={[styles.body, { marginTop: 4 }]}>
          "Approve all" releases all weeks simultaneously — use only if you have reviewed the full plan.
        </Text>
      </Screen>
    </>
  );
}
