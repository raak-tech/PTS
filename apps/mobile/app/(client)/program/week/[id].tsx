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
import type { HolisticActivityType } from '@/lib/api';
import { apiGetPlan, parseGeneratedPlan } from '@/lib/api';
import { PROGRAM_WEEK_THEMES } from '@/lib/appTime';

export default function WeekDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const weekIndex = Math.max(1, Math.min(Number(id) || 1, PROGRAM_WEEK_THEMES.length)) - 1;
  const fallback = PROGRAM_WEEK_THEMES[weekIndex];
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<string>(fallback.theme);
  const [focus, setFocus] = useState<string>(fallback.focus);
  const [practices, setPractices] = useState<{ title: string; description: string; duration: string }[]>([]);
  const [reflection, setReflection] = useState('');
  const { week: holisticWeek, completed, markComplete } = useHolisticWeek();
  const [saving, setSaving] = useState<HolisticActivityType | null>(null);
  const styles = useThemedStyles((c) => ({
    item: { fontSize: 14, color: c.muted, lineHeight: 22 },
    body: { fontSize: 14, color: c.muted, lineHeight: 22 },
  }));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    void apiGetPlan(token).then(({ plan }) => {
      const parsed = plan ? parseGeneratedPlan(plan.generatedContent) : null;
      const week = parsed?.weeks.find((w) => w.week === weekIndex + 1) ?? parsed?.weeks[weekIndex];
      if (week) {
        setTheme(week.theme);
        setFocus(week.focus);
        setPractices(week.dailyPractices);
        setReflection(week.weeklyReflection);
      }
      setLoading(false);
    });
  }, [token, weekIndex]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Screen title={`Week ${id}: ${theme}`} subtitle={`Focus: ${focus}`}>
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
      <HolisticWeekSection
        week={holisticWeek}
        completed={completed}
        onComplete={(type) => {
          setSaving(type);
          void markComplete(type).finally(() => setSaving(null));
        }}
        saving={saving}
      />
    </Screen>
  );
}
