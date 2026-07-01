import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, Pressable } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CounselorReadOutEditor } from '@/components/daily/CounselorReadOutEditor';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { API_URL } from '@/config';
import {
  apiApplyWeek,
  apiCreateReinforcement,
  apiDeleteReinforcement,
  apiGetClientReinforcements,
  apiGetPlan,
  apiGetProviderEngagement,
  apiGetProviderQueue,
  apiGetWeeklySummary,
  apiRegenerateWeek,
  apiUpdateReinforcement,
  parseGeneratedPlan,
} from '@/lib/api';

type ReadOutRow = {
  id: string;
  title: string;
  bodyText: string;
  hasCounselorAudio?: boolean;
  isActive?: boolean;
};

export default function ProviderClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [name, setName] = useState('Client');
  const [planStatus, setPlanStatus] = useState('none');
  const [summary, setSummary] = useState('');
  const [engagement, setEngagement] = useState<{
    reinforcementRecordedToday: boolean;
    calendarBlocksDone: number;
    calendarBlocksTotal: number;
    holisticDone: number;
    holisticTotal: number;
  } | null>(null);
  const [holisticPreview, setHolisticPreview] = useState<string[]>([]);
  const [weekly, setWeekly] = useState<string[]>([]);
  const [readOutRows, setReadOutRows] = useState<ReadOutRow[]>([]);
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [activeReadOutId, setActiveReadOutId] = useState<string | null>(null);
  const [hasCounselorAudio, setHasCounselorAudio] = useState(false);
  const [saving, setSaving] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [regenWeek, setRegenWeek] = useState(false);
  const [weekDraft, setWeekDraft] = useState<{ week: number; theme: string; focus: string } | null>(null);
  const [weekMessage, setWeekMessage] = useState('');
  const styles = useThemedStyles((c) => ({
    body: { fontSize: 14, color: c.muted, lineHeight: 22 },
    rowBtn: {
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 8,
      backgroundColor: c.surface,
    },
    rowBtnActive: {
      borderColor: c.primary,
      backgroundColor: c.bg,
    },
    rowTitle: { fontSize: 14, fontWeight: '600' as const, color: c.text },
    rowMeta: { fontSize: 12, color: c.muted, marginTop: 4 },
  }));

  const loadReadOuts = async () => {
    if (!token || !id) return [];
    const data = await apiGetClientReinforcements(token, id);
    const list = data.reinforcements;
    setReadOutRows(list);
    return list;
  };

  useEffect(() => {
    if (!token || !id) return;
    void apiGetProviderQueue(token).then((queue) => {
      const client = queue.clients.find((c) => c.id === id);
      if (client) {
        setName(client.name);
        setPlanStatus(client.planStatus);
      }
    });
    void apiGetPlan(token, id).then(({ plan }) => {
      if (!plan) return;
      const parsed = parseGeneratedPlan(plan.generatedContent);
      if (parsed?.clientSummary) setSummary(parsed.clientSummary);
      const w1 = parsed?.weeks[0];
      const template = w1?.reinforcementTemplate;
      if (template) {
        setTitle(template.title);
        setBodyText(template.bodyText);
      }
      if (w1) {
        const lines: string[] = [];
        if (w1.yogaTrial) lines.push(`Yoga: ${w1.yogaTrial.principle}`);
        if (w1.musicMoment?.playlist) lines.push(`Music: ${w1.musicMoment.playlist.title}`);
        if (w1.ayurvedaBlock) {
          lines.push(`Ayurveda: ${w1.ayurvedaBlock.practices[0] ?? w1.ayurvedaBlock.rhythmNote}`);
        }
        setHolisticPreview(lines);
      }
    });
    void apiGetProviderEngagement(token).then((data) => {
      const row = data.clients.find((c) => c.clientId === id);
      if (row) {
        setEngagement({
          reinforcementRecordedToday: row.reinforcementRecordedToday,
          calendarBlocksDone: row.calendarBlocksDone,
          calendarBlocksTotal: row.calendarBlocksTotal,
          holisticDone: row.holisticDone ?? 0,
          holisticTotal: row.holisticTotal ?? 3,
        });
      }
    });
    void apiGetWeeklySummary(token, id).then((data) => {
      setWeekly(data.summary.scheduleInsights.slice(0, 3));
    });
    void loadReadOuts().then((list) => {
      const active = list.find((r) => r.isActive) ?? list[0];
      if (!active) return;
      setActiveReadOutId(active.id);
      setTitle(active.title);
      setBodyText(active.bodyText);
      setHasCounselorAudio(Boolean(active.hasCounselorAudio));
    });
  }, [token, id]);

  const selectReadOut = (row: ReadOutRow) => {
    setActiveReadOutId(row.id);
    setTitle(row.title);
    setBodyText(row.bodyText);
    setHasCounselorAudio(Boolean(row.hasCounselorAudio));
  };

  const startNewReadOut = () => {
    setActiveReadOutId(null);
    setTitle('');
    setBodyText('');
    setHasCounselorAudio(false);
  };

  const removeReadOut = async () => {
    if (!token || !activeReadOutId) return;
    setSaving(true);
    try {
      await apiDeleteReinforcement(token, activeReadOutId);
      const list = await loadReadOuts();
      if (list.length > 0) {
        selectReadOut(list[0]);
      } else {
        startNewReadOut();
      }
    } finally {
      setSaving(false);
    }
  };

  const saveReadOut = async (audioBase64?: string, clearAudio?: boolean) => {
    if (!token || !id || !title.trim() || !bodyText.trim()) return;
    setSaving(true);
    try {
      if (activeReadOutId) {
        const res = await apiUpdateReinforcement(token, activeReadOutId, {
          title: title.trim(),
          bodyText: bodyText.trim(),
          counselorAudioBase64: audioBase64,
          counselorAudioMime: audioBase64 ? 'audio/mp4' : undefined,
          clearCounselorAudio: clearAudio,
        });
        setHasCounselorAudio(res.hasCounselorAudio);
        await loadReadOuts();
        return;
      }
      const res = await apiCreateReinforcement(token, {
        clientId: id,
        title: title.trim(),
        bodyText: bodyText.trim(),
        planWeek: 1,
        counselorAudioBase64: audioBase64,
        counselorAudioMime: audioBase64 ? 'audio/mp4' : undefined,
      });
      setActiveReadOutId(res.id);
      setHasCounselorAudio(Boolean(audioBase64));
      await loadReadOuts();
    } finally {
      setSaving(false);
    }
  };

  const onRecord = async () => {
    if (recorderState.isRecording) {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      await saveReadOut(base64);
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return;
    }
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const onGenerateWeek2 = async () => {
    if (!token || !id) return;
    setRegenWeek(true);
    setWeekMessage('');
    try {
      const data = await apiRegenerateWeek(token, id, 1);
      setWeekDraft(data.weekDraft);
      setWeekMessage(`Week ${data.weekNumber} draft ready.`);
    } catch {
      setWeekMessage('Week generation failed.');
    } finally {
      setRegenWeek(false);
    }
  };

  const onApplyWeek = async () => {
    if (!token || !id || !weekDraft) return;
    setRegenWeek(true);
    try {
      await apiApplyWeek(token, id, weekDraft as Parameters<typeof apiApplyWeek>[2]);
      setWeekMessage('Week applied to client plan.');
      setWeekDraft(null);
    } catch {
      setWeekMessage('Could not apply week.');
    } finally {
      setRegenWeek(false);
    }
  };

  return (
    <Screen title={name} subtitle={`Plan status: ${planStatus}`}>
      <Card title="Summary">
        <Text style={styles.body}>{summary || 'No plan content yet.'}</Text>
      </Card>

      <Button
        label="Record read-out & plan next week on web workspace"
        onPress={() => void Linking.openURL(`${API_URL}/provider/clients/${id}`)}
      />

      {engagement ? (
        <Card title="Today's engagement">
          <Text style={styles.body}>
            Read-out: {engagement.reinforcementRecordedToday ? '✓ recorded' : '○ pending'}
          </Text>
          <Text style={styles.body}>
            Calendar: {engagement.calendarBlocksDone}/{engagement.calendarBlocksTotal} blocks done
          </Text>
          <Text style={styles.body}>
            Holistic: {engagement.holisticDone}/{engagement.holisticTotal} (Ayurveda, yoga, music)
          </Text>
        </Card>
      ) : null}

      {holisticPreview.length > 0 ? (
        <Card title="Week 1 holistic program">
          {holisticPreview.map((line) => (
            <Text key={line} style={styles.body}>
              • {line}
            </Text>
          ))}
        </Card>
      ) : null}

      {weekly.length > 0 ? (
        <Card title="Scheduling insights">
          {weekly.map((line) => (
            <Text key={line} style={styles.body}>
              • {line}
            </Text>
          ))}
        </Card>
      ) : null}

      <Card title={`Daily read-outs (${readOutRows.length})`}>
        <Button label="+ Add read-out" variant="secondary" onPress={startNewReadOut} />
        {readOutRows.map((row) => (
          <Pressable
            key={row.id}
            style={[styles.rowBtn, row.id === activeReadOutId ? styles.rowBtnActive : null]}
            onPress={() => selectReadOut(row)}
          >
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.rowMeta}>
              {row.isActive ? 'Active this week' : 'Scheduled / past'}
              {row.hasCounselorAudio ? ' · audio' : ''}
            </Text>
          </Pressable>
        ))}
        {activeReadOutId ? (
          <Button label="Remove selected" variant="secondary" onPress={() => void removeReadOut()} disabled={saving} />
        ) : null}
        <CounselorReadOutEditor
          activeId={activeReadOutId}
          title={title}
          bodyText={bodyText}
          hasAudio={hasCounselorAudio}
          saving={saving}
          recording={recorderState.isRecording}
          onChangeTitle={setTitle}
          onChangeBody={setBodyText}
          onSave={saveReadOut}
          onRecord={onRecord}
        />
      </Card>

      <Card title="Week 2 planning (AI)">
        <Text style={styles.body}>Generate Week 2 from this week&apos;s engagement data (1–2 min).</Text>
        <Button label="Generate week 2 draft" variant="secondary" onPress={() => void onGenerateWeek2()} loading={regenWeek} />
        {weekDraft ? (
          <>
            <Text style={[styles.body, { marginTop: 12, fontWeight: '600' }]}>
              Week {weekDraft.week}: {weekDraft.theme}
            </Text>
            <Text style={styles.body}>{weekDraft.focus}</Text>
            <Button label="Apply to client plan" onPress={() => void onApplyWeek()} loading={regenWeek} />
          </>
        ) : null}
        {weekMessage ? <Text style={styles.body}>{weekMessage}</Text> : null}
      </Card>
    </Screen>
  );
}
