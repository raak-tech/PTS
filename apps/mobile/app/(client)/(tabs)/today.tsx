import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

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
import { apiGetEveningReflection, apiSubmitEveningReflection, apiSubmitDailyCheckIn, apiGetDailyCheckIn, apiGetClientSchedule } from '@/lib/api';
import { useDailyCalendar, useTodayReinforcement } from '@/hooks/useDailyLayer';
import { useHolisticWeek } from '@/hooks/useHolisticWeek';
import { useProgramTime } from '@/hooks/useProgramTime';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { TodayTaskQueue, type TodayTask } from '@/components/daily/TodayTaskQueue';
import { greetingForDayProgress } from '@/lib/appTime';
import type { CalendarBlock, HolisticActivityType, TodayReinforcement } from '@/lib/api';

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

function ReadOutCards({
  items,
  readOutTexts,
  onChangeText,
  onSubmit,
  onSubmitVoice,
  savingId,
}: {
  items: TodayReinforcement[];
  readOutTexts: Record<string, string>;
  onChangeText: (id: string, value: string) => void;
  onSubmit: (id: string) => void;
  onSubmitVoice: (id: string, audioBase64: string) => void;
  savingId: string | null;
}) {
  const styles = useThemedStyles((c) => ({
    practice: { fontSize: 17, fontWeight: '700' as const, color: c.text, marginBottom: 6 },
    meta: { fontSize: 14, color: c.muted, lineHeight: 22, marginBottom: 10 },
    done: { fontSize: 14, color: c.success, fontWeight: '600' as const, marginTop: 8 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: c.surface,
      marginTop: 8,
      marginBottom: 8,
      minHeight: 72,
    },
  }));

  if (items.length === 0) return null;

  return (
    <>
      {items.map((item) => (
        <Card key={item.id} title={items.length > 1 ? `Read-out · ${item.title}` : 'Daily read-out'}>
          <Text style={styles.practice}>{item.title}</Text>
          {item.counselorAudioUrl ? <CounselorAudioPlayer audioUrl={item.counselorAudioUrl} /> : null}
          <Text style={styles.meta}>{item.bodyText}</Text>
          {item.respondedToday ? (
            <Text style={styles.done}>✓ Recorded today</Text>
          ) : (
            <>
              <TextField
                style={styles.input}
                multiline
                placeholder="Your response — read back or reflect in your own words"
                value={readOutTexts[item.id] ?? ''}
                onChangeText={(value) => onChangeText(item.id, value)}
              />
              <Button
                label="Submit response"
                onPress={() => onSubmit(item.id)}
                loading={savingId === item.id}
              />
              <VoiceReadOut
                disabled={item.respondedToday}
                onSubmitVoice={async (audioBase64) => {
                  await onSubmitVoice(item.id, audioBase64);
                }}
              />
            </>
          )}
        </Card>
      ))}
    </>
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
  const { reinforcements, submitResponse, submitVoice } = useTodayReinforcement();
  const { blocks, updateBlockStatus, saveBlocks, submitFeedback } = useDailyCalendar();
  const { week: holisticWeek, completed: holisticCompleted, markComplete } = useHolisticWeek();
  const [holisticSaving, setHolisticSaving] = useState<HolisticActivityType | null>(null);
  const router = useRouter();
  const [practiceDone, setPracticeDone] = useState(false);
  const [practiceFeelingShown, setPracticeFeelingShown] = useState(false);
  const [practiceFeeling, setPracticeFeeling] = useState('');
  const [readOutTexts, setReadOutTexts] = useState<Record<string, string>>({});
  const [savingReadOutId, setSavingReadOutId] = useState<string | null>(null);
  const [workedText, setWorkedText] = useState('');
  const [didntWorkText, setDidntWorkText] = useState('');
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
  const [scheduleRequired, setScheduleRequired] = useState(false);
  const [eveningSheetOpen, setEveningSheetOpen] = useState(false);
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

  const onSubmitReadOut = async (reinforcementId: string) => {
    const text = readOutTexts[reinforcementId]?.trim();
    if (!text) return;
    setSavingReadOutId(reinforcementId);
    try {
      await submitResponse(reinforcementId, text);
      setReadOutTexts((prev) => {
        const next = { ...prev };
        delete next[reinforcementId];
        return next;
      });
    } finally {
      setSavingReadOutId(null);
    }
  };

  const onSubmitReadOutVoice = async (reinforcementId: string, audioBase64: string) => {
    setSavingReadOutId(reinforcementId);
    try {
      await submitVoice(reinforcementId, audioBase64);
    } finally {
      setSavingReadOutId(null);
    }
  };

  const pendingReadOuts = reinforcements.filter((r) => !r.respondedToday);

  useEffect(() => {
    if (!token) return;
    void apiGetClientSchedule(token).then((data) => {
      setScheduleRequired(data.scheduleRequired);
    });
  }, [token]);

  useEffect(() => {
    if (isEvening) setEveningSheetOpen(true);
  }, [isEvening]);

  const holisticDone = useMemo(() => {
    if (!holisticWeek) return true;
    const checks: boolean[] = [];
    if (holisticWeek.ayurvedaBlock) checks.push(holisticCompleted.ayurveda);
    if (holisticWeek.yogaTrial) checks.push(holisticCompleted.yoga);
    if (holisticWeek.musicMoment) checks.push(holisticCompleted.music);
    return checks.length === 0 || checks.every(Boolean);
  }, [holisticWeek, holisticCompleted]);

  const readoutDone = reinforcements.length === 0 || reinforcements.every((r) => r.respondedToday);
  const scheduleDone = blocks.length > 0;
  const eveningFeedbackDone = Boolean(workedText.trim() || didntWorkText.trim());
  const eveningDone = reflectionSaved && eveningFeedbackDone;

  const morningTasks = useMemo((): TodayTask[] => {
    const tasks: TodayTask[] = [
      { id: 'checkin', label: 'Morning check-in', done: checkInSaved },
      { id: 'holistic', label: 'Holistic focus', done: holisticDone },
      { id: 'readout', label: 'Daily read-out', done: readoutDone },
    ];
    if (scheduleRequired) {
      tasks.push({ id: 'schedule', label: 'Plan my day', done: scheduleDone });
    }
    tasks.push({ id: 'practice', label: "Today's practice", done: practiceDone });
    return tasks;
  }, [checkInSaved, holisticDone, readoutDone, scheduleRequired, scheduleDone, practiceDone]);

  const eveningTasks = useMemo((): TodayTask[] => {
    return [
      { id: 'feedback', label: 'Scheduling feedback', done: eveningFeedbackDone },
      { id: 'reflection', label: 'Evening reflection', done: reflectionSaved },
      ...(pendingReadOuts.length > 0
        ? [{ id: 'readout', label: 'Pending read-outs', done: false }]
        : []),
    ];
  }, [eveningFeedbackDone, reflectionSaved, pendingReadOuts.length]);

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

  const renderMorningTask = (id: string) => {
    switch (id) {
      case 'checkin':
        return checkInSaved ? (
          <Text style={styles.done}>✓ Morning check-in saved</Text>
        ) : (
          <>
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
                  {sq[0]?.toUpperCase()}
                  {sq.slice(1)}
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
          </>
        );
      case 'holistic':
        return (
          <HolisticWeekSection
            week={holisticWeek}
            completed={holisticCompleted}
            onComplete={(type) => void onHolisticComplete(type)}
            saving={holisticSaving}
          />
        );
      case 'readout':
        return (
          <ReadOutCards
            items={reinforcements}
            readOutTexts={readOutTexts}
            onChangeText={(rid, value) => setReadOutTexts((prev) => ({ ...prev, [rid]: value }))}
            onSubmit={(rid) => void onSubmitReadOut(rid)}
            onSubmitVoice={(rid, audio) => void onSubmitReadOutVoice(rid, audio)}
            savingId={savingReadOutId}
          />
        );
      case 'schedule':
        return (
          <>
            <CalendarBuilder blocks={blocks} onChange={saveBlocks} />
            {blocks.length > 0 ? (
              <>
                <Text style={[styles.meta, { marginTop: 16, marginBottom: 8 }]}>Mark what you did:</Text>
                {blocks.map((block) => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    onStatus={(bid, status) => void updateBlockStatus(bid, status)}
                  />
                ))}
              </>
            ) : null}
          </>
        );
      case 'practice':
        return (
          <>
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
                <Text style={styles.meta}>
                  Notice your breath without changing it. When your mind wanders, gently return.
                </Text>
              </>
            )}
            {practiceDone ? (
              <Text style={styles.done}>✓ Marked done for today</Text>
            ) : (
              <Button
                label="Mark practice done"
                onPress={() => {
                  setPracticeDone(true);
                  setPracticeFeelingShown(true);
                }}
              />
            )}
            {practiceFeelingShown && practiceDone ? (
              <>
                <Text style={[styles.meta, { marginTop: 12 }]}>How did this feel? (optional)</Text>
                <TextField
                  style={styles.input}
                  multiline
                  placeholder="Easy, challenging, refreshing…"
                  value={practiceFeeling}
                  onChangeText={setPracticeFeeling}
                />
              </>
            ) : null}
          </>
        );
      default:
        return null;
    }
  };

  const renderEveningTask = (id: string) => {
    switch (id) {
      case 'feedback':
        return (
          <>
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
          </>
        );
      case 'reflection':
        return (
          <>
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
          </>
        );
      case 'readout':
        return (
          <ReadOutCards
            items={pendingReadOuts}
            readOutTexts={readOutTexts}
            onChangeText={(rid, value) => setReadOutTexts((prev) => ({ ...prev, [rid]: value }))}
            onSubmit={(rid) => void onSubmitReadOut(rid)}
            onSubmitVoice={(rid, audio) => void onSubmitReadOutVoice(rid, audio)}
            savingId={savingReadOutId}
          />
        );
      default:
        return null;
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
        <TodayTaskQueue
          tasks={morningTasks}
          subtitle="Tap each item to open and complete"
          renderExpanded={renderMorningTask}
        />
      ) : (
        <>
          <Card title="Evening check-in">
            <Text style={styles.meta}>
              {eveningDone
                ? '✓ Evening check-in complete'
                : 'Wrap up your day — feedback and reflection.'}
            </Text>
            <Button
              label={eveningSheetOpen ? 'Close evening sheet' : 'Open evening sheet'}
              variant="secondary"
              onPress={() => setEveningSheetOpen((v) => !v)}
            />
          </Card>
          <Modal visible={eveningSheetOpen} animationType="slide" transparent>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
              <View
                style={{
                  maxHeight: '88%',
                  backgroundColor: 'var(--surface)',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  padding: 16,
                }}
              >
                <Pressable onPress={() => setEveningSheetOpen(false)} style={{ alignSelf: 'flex-end', padding: 8 }}>
                  <Text style={{ fontSize: 16, color: 'var(--muted)' }}>Close</Text>
                </Pressable>
                <TodayTaskQueue tasks={eveningTasks} renderExpanded={renderEveningTask} />
              </View>
            </View>
          </Modal>
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
