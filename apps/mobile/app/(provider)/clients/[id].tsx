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
import { Text, Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CounselorAudioPlayer } from '@/components/daily/CounselorAudioPlayer';
import { CounselorReadOutEditor } from '@/components/daily/CounselorReadOutEditor';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { API_URL } from '@/config';
import {
  apiApplyWeek,
  apiCreateReinforcement,
  apiDeleteReinforcement,
  apiGetClientReinforcements,
  apiGetProviderClientMeta,
  apiGetPlan,
  apiGetProviderEngagement,
  apiGetProviderQueue,
  apiGetWeeklySummary,
  apiRegenerateWeek,
  apiSaveWeekComment,
  apiUpdateReinforcement,
  parseGeneratedPlan,
  type GeneratedPlan,
} from '@/lib/api';

type ReadOutRow = {
  id: string;
  title: string;
  bodyText: string;
  hasCounselorAudio?: boolean;
  isActive?: boolean;
  latestResponse?: {
    responseType: 'text' | 'voice' | string;
    bodyText: string | null;
    audioUrl: string | null;
    submittedAt: string;
  } | null;
};

type ClientUpdate = { id: string; title: string; bodyText: string; createdAt: string };

type WeeklyData = {
  painTrend: string | null;
  readOutSummaries: string[];
  latestWeeklyCheckIn: string | null;
  morningCheckIns: { dateIso: string; painLevel: number; sleepQuality: string }[];
  scheduleInsights: string[];
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
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [clientUpdates, setClientUpdates] = useState<ClientUpdate[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [approvedCount, setApprovedCount] = useState(0);
  const [weekComment, setWeekComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
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
          holisticTotal: row.holisticTotal ?? 4,
        });
      }
    });
    void apiGetProviderClientMeta(token, id).then((meta) => {
      if (meta.planId) setPlanId(meta.planId);
      const approved = Object.values(meta.weekStatuses).filter((s) => s === 'approved').length;
      setApprovedCount(approved);
      setClientUpdates(meta.clientUpdates);
    });
    void apiGetWeeklySummary(token, id).then((data) => {
      const s = data.summary;
      setWeekly({
        painTrend: s.painTrend,
        readOutSummaries: s.readOutSummaries ?? [],
        latestWeeklyCheckIn: s.latestWeeklyCheckIn,
        morningCheckIns: (s.morningCheckIns ?? []).map((c) => ({
          dateIso: c.dateIso,
          painLevel: c.painLevel,
          sleepQuality: c.sleepQuality,
        })),
        scheduleInsights: s.scheduleInsights.slice(0, 3),
      });
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

  const onSaveWeekComment = async () => {
    if (!token || !planId || approvedCount === 0 || weekComment.trim().length < 3) return;
    setSavingComment(true);
    setWeekMessage('');
    try {
      await apiSaveWeekComment(token, planId, approvedCount, weekComment.trim());
      setWeekMessage(`Comment saved for Week ${approvedCount}.`);
    } catch (e) {
      setWeekMessage(e instanceof Error ? e.message : 'Could not save comment.');
    } finally {
      setSavingComment(false);
    }
  };

  const onGenerateNextWeek = async () => {
    if (!token || !id || approvedCount === 0) return;
    setRegenWeek(true);
    setWeekMessage('');
    try {
      const data = await apiRegenerateWeek(token, id, approvedCount);
      setWeekDraft(data.weekDraft);
      setWeekMessage(`Week ${data.weekNumber} draft ready.`);
    } catch (e) {
      setWeekMessage(e instanceof Error ? e.message : 'Week generation failed.');
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

  const activeReadOut = readOutRows.find((r) => r.id === activeReadOutId) ?? null;
  const nextWeekNumber = approvedCount + 1;

  return (
    <Screen title={name} subtitle={`Plan status: ${planStatus}`}>
      <Card title="Summary">
        <Text style={styles.body}>{summary || 'No plan content yet.'}</Text>
      </Card>

      <Button
        label="Open full web workspace"
        variant="secondary"
        onPress={() => void Linking.openURL(`${API_URL}/provider/clients/${id}`)}
      />

      {clientUpdates.length > 0 ? (
        <Card title="Client updates">
          {clientUpdates.map((u) => (
            <View key={u.id} style={{ marginBottom: 12 }}>
              <Text style={styles.rowTitle}>{u.title}</Text>
              <Text style={styles.body}>{u.bodyText}</Text>
              <Text style={styles.rowMeta}>{new Date(u.createdAt).toLocaleString()}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {engagement ? (
        <Card title="Today's engagement">
          <Text style={styles.body}>
            Read-out: {engagement.reinforcementRecordedToday ? '✓ recorded' : '○ pending'}
          </Text>
          <Text style={styles.body}>
            Calendar: {engagement.calendarBlocksDone}/{engagement.calendarBlocksTotal} blocks done
          </Text>
          <Text style={styles.body}>
            Holistic: {engagement.holisticDone}/{engagement.holisticTotal} (Ayurveda, yoga, music, practice)
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

      {weekly ? (
        <Card title="This week's data">
          {weekly.painTrend ? <Text style={styles.body}>Pain trend: {weekly.painTrend}</Text> : null}
          {weekly.latestWeeklyCheckIn ? (
            <Text style={styles.body}>Weekly check-in: {weekly.latestWeeklyCheckIn}</Text>
          ) : null}
          {weekly.morningCheckIns.slice(0, 3).map((c) => (
            <Text key={c.dateIso} style={styles.body}>
              {c.dateIso}: pain {c.painLevel}/10 · sleep {c.sleepQuality}
            </Text>
          ))}
          {weekly.readOutSummaries.slice(0, 3).map((line) => (
            <Text key={line} style={styles.body}>
              • {line}
            </Text>
          ))}
          {weekly.scheduleInsights.map((line) => (
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
              {row.latestResponse ? ' · client responded' : ''}
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
        {activeReadOut?.latestResponse ? (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.body, { fontWeight: '600' }]}>Latest client response</Text>
            {activeReadOut.latestResponse.responseType === 'text' &&
            activeReadOut.latestResponse.bodyText ? (
              <Text style={styles.body}>{activeReadOut.latestResponse.bodyText}</Text>
            ) : null}
            {activeReadOut.latestResponse.responseType === 'voice' &&
            activeReadOut.latestResponse.audioUrl ? (
              <CounselorAudioPlayer
                audioUrl={activeReadOut.latestResponse.audioUrl}
                label="Play client voice response:"
              />
            ) : null}
          </View>
        ) : (
          <Text style={[styles.body, { marginTop: 8 }]}>No client response yet for this read-out.</Text>
        )}
      </Card>

      <Card title={`Week ${nextWeekNumber} planning (AI)`}>
        <Text style={styles.body}>
          {approvedCount > 0
            ? `Save a comment on Week ${approvedCount}, then generate Week ${nextWeekNumber} from engagement data.`
            : 'Approve Week 1 on the plan review screen before generating Week 2.'}
        </Text>
        {approvedCount > 0 ? (
          <>
            <TextField
              style={{
                borderWidth: 1,
                borderColor: styles.rowBtn.borderColor,
                borderRadius: 12,
                padding: 12,
                minHeight: 80,
                marginTop: 8,
              }}
              placeholder={`Comment on Week ${approvedCount} (required before Week ${nextWeekNumber})`}
              multiline
              value={weekComment}
              onChangeText={setWeekComment}
            />
            <Button
              label={savingComment ? 'Saving comment…' : `Save Week ${approvedCount} comment`}
              variant="secondary"
              onPress={() => void onSaveWeekComment()}
              loading={savingComment}
              disabled={weekComment.trim().length < 3}
            />
          </>
        ) : null}
        <Button
          label={
            regenWeek
              ? `Generating Week ${nextWeekNumber}…`
              : approvedCount > 0
                ? `Generate Week ${nextWeekNumber} draft`
                : 'Generate Week 2 draft'
          }
          variant="secondary"
          onPress={() => void onGenerateNextWeek()}
          loading={regenWeek}
          disabled={approvedCount === 0}
        />
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
