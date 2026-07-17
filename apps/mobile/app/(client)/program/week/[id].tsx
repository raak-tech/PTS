import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { HolisticWeekSection } from '@/components/holistic/HolisticCards';
import { useHolisticWeek } from '@/hooks/useHolisticWeek';
import { useProgramTime } from '@/hooks/useProgramTime';
import { apiGetPlan, parseGeneratedPlan } from '@/lib/api';
import { PROGRAM_WEEK_THEMES } from '@/lib/appTime';

export default function WeekDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const programTime = useProgramTime();
  const weekIndex = Math.max(1, Math.min(Number(id) || 1, PROGRAM_WEEK_THEMES.length)) - 1;
  const fallback = PROGRAM_WEEK_THEMES[weekIndex];
  const weekStatus = programTime?.weeks.find((w) => w.id === String(weekIndex + 1))?.status;
  const isLocked = weekStatus === 'locked';
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<string>(fallback.theme);
  const [focus, setFocus] = useState<string>(fallback.focus);
  const [personalizationBasis, setPersonalizationBasis] = useState<string | null>(null);
  const [practices, setPractices] = useState<{ title: string; description: string; duration: string }[]>([]);
  const [reflection, setReflection] = useState('');
  const { week: holisticWeek } = useHolisticWeek();
  const styles = useThemedStyles((c) => ({
    item: { fontSize: 14, color: c.muted, lineHeight: 22 },
    body: { fontSize: 14, color: c.muted, lineHeight: 22 },
  }));

  useEffect(() => {
    if (!token || isLocked) {
      setLoading(false);
      return;
    }
    void apiGetPlan(token).then(({ plan }) => {
      const parsed = plan ? parseGeneratedPlan(plan.generatedContent) : null;
      const week = parsed?.weeks.find((w) => w.week === weekIndex + 1) ?? parsed?.weeks[weekIndex];
      if (week) {
        setTheme(week.theme);
        setFocus(week.focus);
        setPersonalizationBasis(week.personalizationBasis ?? null);
        setPractices(week.dailyPractices);
        setReflection(week.weeklyReflection);
      }
      setLoading(false);
    });
  }, [token, weekIndex, isLocked]);

  if (isLocked) {
    return (
      <Screen title={`Week ${id}: ${fallback.theme}`} subtitle="Coming soon">
        <Card title="Not available yet">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 20 }}>🔒</Text>
            <Text style={[styles.body, { flex: 1 }]}>
              Your counselor will release this week after reviewing your progress. You&apos;ll get a
              notification when it&apos;s ready.
            </Text>
          </View>
        </Card>
      </Screen>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Screen title={`Week ${id}: ${theme}`} subtitle={`Focus: ${focus}`}>
      {personalizationBasis ? (
        <Card title="Because you shared…">
          <Text style={styles.body}>{personalizationBasis}</Text>
        </Card>
      ) : null}
      <Card title="Daily practices">
        {practices.length > 0 ? (
          practices.map((p) => (
            <Text key={p.title} style={styles.item}>
              • {p.title} ({p.duration}) — {p.description}
            </Text>
          ))
        ) : (
          <>
            <Text style={styles.item}>• Morning: pain & intention check-in</Text>
            <Text style={styles.item}>• Midday: 5-min grounding breath</Text>
            <Text style={styles.item}>• Evening: reflection — what worked?</Text>
          </>
        )}
      </Card>
      <Card title="Weekly reflection">
        <Text style={styles.body}>
          {reflection || 'What felt different about how you relate to your pain this week?'}
        </Text>
      </Card>
      <Card title="Music, yoga & wellness">
        <Text style={styles.body}>
          Preview what&apos;s planned this week. When you&apos;re ready, open the Today tab and complete each
          activity there — that&apos;s how your counselor sees daily progress.
        </Text>
      </Card>
      <HolisticWeekSection
        week={holisticWeek}
        completed={{ ayurveda: false, yoga: false, music: false }}
        onComplete={() => {}}
        readOnly
      />
    </Screen>
  );
}
