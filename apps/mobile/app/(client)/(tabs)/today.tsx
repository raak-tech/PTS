import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CalendarBuilder } from '@/components/daily/CalendarBuilder';
import { CounselorAudioPlayer } from '@/components/daily/CounselorAudioPlayer';
import { VoiceReadOut } from '@/components/daily/VoiceReadOut';
import { NRSFaceScale } from '@/components/daily/NRSFaceScale';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { HolisticWeekSection } from '@/components/holistic/HolisticCards';
import { useCounselorContact, useTodayPlan } from '@/hooks/useClientData';
import { apiGetEveningReflection, apiSubmitEveningReflection, apiSubmitDailyCheckIn, apiGetDailyCheckIn } from '@/lib/api';
import { useDailyCalendar, useTodayReinforcement } from '@/hooks/useDailyLayer';
import { useHolisticWeek } from '@/hooks/useHolisticWeek';
import { useProgramTime } from '@/hooks/useProgramTime';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { greetingForDayProgress } from '@/lib/appTime';
import type { CalendarBlock, HolisticActivityType } from '@/lib/api';

function BlockRow({
  block,
  onStatus,
}: {
  block: CalendarBlock;
  onStatus: (id: string, status: CalendarBlock['status']) => void;
}) {
  const styles = useThemedStyles((c) => ({
    row: { marginBottom: 10 },
    label: { fontSize: 15, fontWeight: '600' as const, color: c.text },
    meta: { fontSize: 13, color: c.muted, marginTop: 2 },
    actions: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, marginTop: 8 },
    chip: {
      fontSize: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      overflow: 'hidden' as const,
      backgroundColor: c.bg,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: { backgroundColor: c.primary, color: c.onPrimary, borderColor: c.primary },
  }));

  const statuses: CalendarBlock['status'][] = ['planned', 'done', 'partial', 'skipped'];

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{block.label}</Text>
      {block.plannedTime ? <Text style={styles.meta}>{block.plannedTime}</Text> : null}
      <View style={styles.actions}>
        {statuses.map((s) => (
          <Text
            key={s}
            onPress={() => onStatus(block.id, s)}
            style={[styles.chip, block.status === s ? styles.chipActive : null]}
          >
            {s}
          </Text>
        ))}
      </View>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  const styles = useThemedStyles((c) => ({
    label: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: c.faint,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
      marginTop: 4,
      marginBottom: -4,
    },
  }));
  return <Text style={styles.label}>{children}</Text>;
}

export default function TodayScreen() {
  const { user, token } = useAuth();
  const programTime = useProgramTime();
  const { practices, weekTheme, reflection } = useTodayPlan();
  const { counselorId } = useCounselorContact();
  const { reinforcement, submitResponse, submitVoice } = useTodayReinforcement();
  const { blocks, updateBlockStatus, saveBlocks, submitFeedback } = useDailyCalendar();
  const { week: holisticWeek, completed: holisticCompleted, markComplete } = useHolisticWeek();
  const [holisticSaving, setHolisticSaving] = useState<HolisticActivityType | null>(null);
  const router = useRouter();
  const [practiceDone, setPracticeDone] = useState(false);
  const [practiceFeelingShown, setPracticeFeelingShown] = useState(false);
  const [practiceFeeling, setPracticeFeeling] = useState('');
  const [readOutText, setReadOutText] = useState('');
  const [workedText, setWorkedText] = useState('');
  const [didntWorkText, setDidntWorkText] = useState('');
  const [savingReadOut, setSavingReadOut] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [savingReflection, setSavingReflection] = useState(false);
  const [checkInPainLevel, setCheckInPainLevel] = useState(5);
  const [checkInSleepQuality, setCheckInSleepQuality] = useState<'poor' | 'ok' | 'good'>('ok');
  const [checkInIntention, setCheckInIntention] = useState('');
  const [checkInSaved, setCheckInSaved] = useState(false);
  const [savingCheckIn, setSavingCheckIn] = useState(false);
  const [yesterdayPainLevel, setYesterdayPainLevel] = useState<number | undefined>();
  const styles = useThemedStyles((c) => ({
    practice: { fontSize: 16, fontWeight: '700' as const, color: c.text },
    meta: { fontSize: 14, color: c.muted, lineHeight: 20 },
    done: { fontSize: 14, color: c.success, fontWeight: '600' as const },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      minHeight: 80,
      backgroundColor: c.bg,
      marginTop: 8,
    },
  }));

  const greeting = programTime ? greetingForDayProgress(programTime.dayProgress) : 'Good morning';
  const subtitle = programTime?.subtitle ?? 'Week 1 · Day 1';
  const primaryPractice = practices[0];
  const isEvening = (programTime?.dayProgress ?? 0) >= 0.55;
  const firstName = user?.displayName?.split(' ')[0];

  useEffect(() => {
    if (!token || !isEvening) return;
    void apiGetEveningReflection(token).then((data) => {
      if (data.reflection?.bodyText) {
        setReflectionText(data.reflection.bodyText);
        setReflectionSaved(true);
      }
    });
  }, [token, isEvening]);

  // Load today's check-in on mount (morning only)
  useEffect(() => {
    if (!token || isEvening) return;
    void apiGetDailyCheckIn(token).then((data) => {
      if (data.checkIn) {
        setCheckInPainLevel(data.checkIn.painLevel);
        setCheckInSleepQuality(data.checkIn.sleepQuality as 'poor' | 'ok' | 'good');
        setCheckInIntention(data.checkIn.intention);
        setCheckInSaved(true);
      } else {
        // Load yesterday's pain for reference
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const y = yesterday.getFullYear();
        const m = String(yesterday.getMonth() + 1).padStart(2, '0');
        const d = String(yesterday.getDate()).padStart(2, '0');
        void apiGetDailyCheckIn(token, `${y}-${m}-${d}`).then((data) => {
          if (data.checkIn) {
            setYesterdayPainLevel(data.checkIn.painLevel);
          }
        });
      }
    });
  }, [token, isEvening]);

  const onSubmitCheckIn = async () => {
    if (!token) return;
    setSavingCheckIn(true);
    try {
      await apiSubmitDailyCheckIn(token, checkInPainLevel, checkInSleepQuality, checkInIntention.trim());
      setCheckInSaved(true);
    } finally {
      setSavingCheckIn(false);
    }
  };

  const onSubmitReflection = async () => {
    if (!token || !reflectionText.trim()) return;
    setSavingReflection(true);
    try {
      await apiSubmitEveningReflection(token, reflectionText.trim());
      setReflectionSaved(true);
    } finally {
      setSavingReflection(false);
    }
  };

  const onSubmitReadOut = async () => {
    if (!readOutText.trim()) return;
    setSavingReadOut(true);
    try {
      await submitResponse(readOutText.trim());
      setReadOutText('');
    } finally {
      setSavingReadOut(false);
    }
  };

  const onSubmitFeedback = async () => {
    if (!workedText.trim() && !didntWorkText.trim()) return;
    setSavingFeedback(true);
    try {
      await submitFeedback(workedText.trim(), didntWorkText.trim());
    } finally {
      setSavingFeedback(false);
    }
  };

  const onHolisticComplete = async (type: HolisticActivityType) => {
    setHolisticSaving(type);
    try {
      await markComplete(type);
    } finally {
      setHolisticSaving(null);
    }
  };

  return (
    <Screen
      layout="tab"
      title={`${greeting}${firstName ? `, ${firstName}` : ''}`}
      subtitle={subtitle}
    >
      {weekTheme ? (
        <Card title="This week">
          <Text style={styles.meta}>{weekTheme}</Text>
        </Card>
      ) : null}

      {!isEvening ? (
        <>
          {!checkInSaved && (
            <Card title="Morning check-in">
              <NRSFaceScale
                value={checkInPainLevel}
                onChange={setCheckInPainLevel}
                yestrdayValue={yesterdayPainLevel}
              />
              <Text style={[styles.meta, { marginTop: 12, marginBottom: 8 }]}>Sleep quality</Text>
              <View style={{ flexDirection: 'row' as const, gap: 8 }}>
                {(['poor', 'ok', 'good'] as const).map((sq) => (
                  <Text
                    key={sq}
                    onPress={() => setCheckInSleepQuality(sq)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: checkInSleepQuality === sq ? styles.input.borderColor : 'var(--border)',
                      backgroundColor: checkInSleepQuality === sq ? 'var(--bg)' : 'transparent',
                      color: 'var(--text)',
                      fontSize: 13,
                      fontWeight: checkInSleepQuality === sq ? '600' as const : '400' as const,
                    }}
                  >
                    {sq[0]?.toUpperCase()}{sq.slice(1)}
                  </Text>
                ))}
              </View>
              <TextField
                style={styles.input}
                placeholder="Your intention for today"
                value={checkInIntention}
                onChangeText={setCheckInIntention}
              />
              <Button
                label={savingCheckIn ? 'Saving…' : 'Save morning check-in'}
                onPress={() => void onSubmitCheckIn()}
                loading={savingCheckIn}
              />
            </Card>
          )}

          <SectionLabel>Morning focus</SectionLabel>

          <HolisticWeekSection
            week={holisticWeek}
            completed={holisticCompleted}
            onComplete={(type) => void onHolisticComplete(type)}
            saving={holisticSaving}
          />

          {reinforcement ? (
            <Card title="Daily read-out">
              <Text style={styles.practice}>{reinforcement.title}</Text>
              {reinforcement.counselorAudioUrl ? (
                <CounselorAudioPlayer audioUrl={reinforcement.counselorAudioUrl} />
              ) : null}
              <Text style={styles.meta}>{reinforcement.bodyText}</Text>
              {reinforcement.respondedToday ? (
                <Text style={styles.done}>✓ Recorded today</Text>
              ) : (
                <>
                  <TextField
                    style={styles.input}
                    multiline
                    placeholder="Your response — read back or reflect in your own words"
                    value={readOutText}
                    onChangeText={setReadOutText}
                  />
                  <Button label="Submit response" onPress={() => void onSubmitReadOut()} loading={savingReadOut} />
                  <VoiceReadOut
                    disabled={reinforcement.respondedToday}
                    onSubmitVoice={async (audioBase64) => {
                      setSavingReadOut(true);
                      try {
                        await submitVoice(audioBase64);
                      } finally {
                        setSavingReadOut(false);
                      }
                    }}
                  />
                </>
              )}
            </Card>
          ) : null}

          <Card title="Plan my day">
            <CalendarBuilder blocks={blocks} onChange={saveBlocks} />
            {blocks.length > 0 ? (
              <>
                <Text style={[styles.meta, { marginTop: 16, marginBottom: 8 }]}>Mark what you did:</Text>
                {blocks.map((block) => (
                  <BlockRow key={block.id} block={block} onStatus={(id, status) => void updateBlockStatus(id, status)} />
                ))}
              </>
            ) : null}
          </Card>

          <Card title="Today's practice">
            {primaryPractice ? (
              <>
                <Text style={styles.practice}>{primaryPractice.title}</Text>
                <Text style={styles.meta}>
                  {primaryPractice.duration} — {primaryPractice.description}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.practice}>5-minute grounding breath</Text>
                <Text style={styles.meta}>Notice your breath without changing it. When your mind wanders, gently return.</Text>
              </>
            )}
            {practiceDone ? (
              <Text style={styles.done}>✓ Marked done for today</Text>
            ) : (
              <Button label="Mark practice done" onPress={() => {
                setPracticeDone(true);
                setPracticeFeelingShown(true);
              }} />
            )}
          </Card>

          {practiceFeelingShown && practiceDone && (
            <Card title="How did this feel?">
              <Text style={styles.meta}>Share a quick thought (optional — helps your counselor)</Text>
              <TextField
                style={styles.input}
                multiline
                placeholder="Easy, challenging, refreshing, powerful…"
                value={practiceFeeling}
                onChangeText={setPracticeFeeling}
              />
              <Button
                label="Done"
                variant="secondary"
                onPress={() => setPracticeFeelingShown(false)}
              />
            </Card>
          )}
        </>
      ) : (
        <>
          <SectionLabel>Evening check-in</SectionLabel>

          <Card title="How did today go?">
            <Text style={styles.meta}>What part of today&apos;s schedule worked? What didn&apos;t?</Text>
            <TextField
              style={styles.input}
              multiline
              placeholder="What worked today?"
              value={workedText}
              onChangeText={setWorkedText}
            />
            <TextField
              style={styles.input}
              multiline
              placeholder="What didn't work?"
              value={didntWorkText}
              onChangeText={setDidntWorkText}
            />
            <Button
              label="Save scheduling feedback"
              variant="secondary"
              onPress={() => void onSubmitFeedback()}
              loading={savingFeedback}
            />
          </Card>

          <Card title="Evening reflection">
            <Text style={styles.meta}>
              {reflection ?? programTime?.eveningReflectionAvailable
                ? 'What worked today? Take a few minutes to reflect.'
                : 'Available later tonight.'}
            </Text>
            {programTime?.eveningReflectionAvailable ? (
              <>
                <TextField
                  style={styles.input}
                  multiline
                  placeholder="Your reflection for today"
                  value={reflectionText}
                  onChangeText={setReflectionText}
                />
                {reflectionSaved ? <Text style={styles.done}>✓ Saved for today</Text> : null}
                <Button
                  label="Save reflection"
                  variant="secondary"
                  onPress={() => void onSubmitReflection()}
                  loading={savingReflection}
                />
              </>
            ) : null}
          </Card>

          {!reinforcement?.respondedToday && reinforcement ? (
            <Card title="Daily read-out">
              <Text style={styles.practice}>{reinforcement.title}</Text>
              {reinforcement.counselorAudioUrl ? (
                <CounselorAudioPlayer audioUrl={reinforcement.counselorAudioUrl} />
              ) : null}
              <Text style={styles.meta}>{reinforcement.bodyText}</Text>
              <TextField
                style={styles.input}
                multiline
                placeholder="Your response"
                value={readOutText}
                onChangeText={setReadOutText}
              />
              <Button label="Submit response" onPress={() => void onSubmitReadOut()} loading={savingReadOut} />
            </Card>
          ) : null}
        </>
      )}

      {programTime?.weeklyCheckInDue ? (
        <Card title="Weekly check-in due">
          <Text style={styles.meta}>Day 7 — help your counselor adapt next week&apos;s plan.</Text>
          <Button label="Complete weekly check-in" onPress={() => router.push('/(client)/program/check-in')} />
        </Card>
      ) : null}

      <Button
        label="Message counselor"
        variant="secondary"
        onPress={() =>
          counselorId
            ? router.push(`/(client)/messages/${counselorId}`)
            : router.push('/(client)/(tabs)/messages')
        }
      />
    </Screen>
  );
}
