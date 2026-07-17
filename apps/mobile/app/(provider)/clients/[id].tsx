import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CounselorAudioPlayer } from '@/components/daily/CounselorAudioPlayer';
import { ClientStoryCard, type ClientStorySnippet } from '@/components/provider/ClientStoryCard';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  apiGetClientReinforcements,
  apiGetProviderClientMeta,
  apiGetPlan,
  apiGetProviderEngagement,
  apiGetProviderQueue,
  apiGetWeeklySummary,
  parseGeneratedPlan,
} from '@/lib/api';
import { chartUrl } from '@/lib/counselorWeb';

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
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [name, setName] = useState('Client');
  const [planStatus, setPlanStatus] = useState('none');
  const [aiSummary, setAiSummary] = useState('');
  const [story, setStory] = useState<ClientStorySnippet | null>(null);
  const [engagementStatus, setEngagementStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
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
  const [approvedCount, setApprovedCount] = useState(0);
  const [readOutRows, setReadOutRows] = useState<ReadOutRow[]>([]);
  const styles = useThemedStyles((c) => ({
    body: { fontSize: 14, color: c.muted, lineHeight: 22 },
    rowTitle: { fontSize: 14, fontWeight: '600' as const, color: c.text },
    rowMeta: { fontSize: 12, color: c.muted, marginTop: 4 },
    webLink: { fontSize: 13, color: '#f97316', fontWeight: '600' as const, marginTop: 8 },
  }));

  useEffect(() => {
    if (!token || !id) return;
    setEngagementStatus('loading');
    void apiGetProviderQueue(token).then((queue) => {
      const client = queue.clients.find((c) => c.id === id);
      if (client) {
        setName(client.name);
        setPlanStatus(client.planStatus);
      }
      const pending = queue.pendingPlans.find((p) => p.clientId === id);
      if (pending?.intake) setStory(pending.intake);
    });
    void apiGetPlan(token, id).then(({ plan }) => {
      if (!plan) return;
      const parsed = parseGeneratedPlan(plan.generatedContent);
      if (parsed?.clientSummary) setAiSummary(parsed.clientSummary);
      const w1 = parsed?.weeks[0];
      if (w1) {
        const lines: string[] = [];
        if (w1.yogaTrial) lines.push(`Yoga: ${w1.yogaTrial.principle}`);
        if (w1.musicMoment?.playlist) lines.push(`Music: ${w1.musicMoment.playlist.title}`);
        if (w1.ayurvedaBlock) {
          lines.push(`Ayurveda: ${w1.ayurvedaBlock.practices?.[0] ?? w1.ayurvedaBlock.rhythmNote}`);
        }
        setHolisticPreview(lines);
      }
    });
    void apiGetProviderEngagement(token)
      .then((data) => {
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
        setEngagementStatus('ready');
      })
      .catch(() => setEngagementStatus('unavailable'));
    void apiGetProviderClientMeta(token, id).then((meta) => {
      if (meta.intake) setStory(meta.intake);
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
    void apiGetClientReinforcements(token, id).then((data) => {
      setReadOutRows(data.reinforcements);
    });
  }, [token, id]);

  const nextWeekNumber = approvedCount + 1;

  return (
    <Screen title={name} subtitle={`Plan status: ${planStatus}`}>
      <ClientStoryCard story={story} aiSummary={aiSummary} />

      <Button
        label="Open Chart · Plan"
        onPress={() => id && void Linking.openURL(chartUrl(id, { tab: 'plan' }))}
      />
      <Button
        label="Open Chart · Activity"
        variant="secondary"
        onPress={() => id && void Linking.openURL(chartUrl(id, { tab: 'activity' }))}
      />
      <Button
        label="Message client"
        variant="secondary"
        onPress={() => id && router.push(`/(provider)/messages/${id}`)}
      />
      <Text
        style={styles.webLink}
        onPress={() => id && void Linking.openURL(chartUrl(id, { tab: 'notes' }))}
      >
        Open Notes on web →
      </Text>

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

      <Card title="Today's engagement">
        {engagementStatus === 'unavailable' ? (
          <Text style={styles.body}>Progress unavailable — open Activity on web.</Text>
        ) : engagement ? (
          <>
            <Text style={styles.body}>
              Read-out: {engagement.reinforcementRecordedToday ? '✓ recorded' : '○ pending'}
            </Text>
            <Text style={styles.body}>
              Calendar: {engagement.calendarBlocksDone}/{engagement.calendarBlocksTotal} blocks done
            </Text>
            <Text style={styles.body}>
              Holistic: {engagement.holisticDone}/{engagement.holisticTotal}
            </Text>
          </>
        ) : engagementStatus === 'loading' ? (
          <Text style={styles.body}>Loading today&apos;s progress…</Text>
        ) : (
          <Text style={styles.body}>No assigned daily tasks yet.</Text>
        )}
      </Card>

      <Card title="Plan">
        <Text style={styles.body}>
          {approvedCount > 0
            ? `${approvedCount} / 6 weeks approved · next: Week ${nextWeekNumber}`
            : planStatus === 'none'
              ? 'No plan yet — generate Week 1 from Queue or Chart.'
              : `Status: ${planStatus}`}
        </Text>
        {holisticPreview.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            {holisticPreview.map((line) => (
              <Text key={line} style={styles.body}>
                • {line}
              </Text>
            ))}
          </View>
        ) : null}
        <Button
          label={
            approvedCount > 0
              ? `Generate / edit Week ${nextWeekNumber} on Chart`
              : 'Review Week 1 on Chart'
          }
          variant="secondary"
          onPress={() =>
            id &&
            void Linking.openURL(
              chartUrl(id, { tab: 'plan', week: approvedCount > 0 ? nextWeekNumber : 1 }),
            )
          }
        />
        <Text style={[styles.body, { marginTop: 8 }]}>
          Week drafts are edited and approved on the web Chart — phone does not Apply thin drafts.
        </Text>
      </Card>

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
        <Text style={styles.body}>
          Playback of client responses below. Create or record counselor read-outs on the web Chart.
        </Text>
        <Text
          style={styles.webLink}
          onPress={() => id && void Linking.openURL(chartUrl(id, { tab: 'activity' }))}
        >
          Edit read-outs on Chart →
        </Text>
        {readOutRows.length === 0 ? (
          <Text style={[styles.body, { marginTop: 8 }]}>No read-outs yet.</Text>
        ) : (
          readOutRows.map((row) => (
            <View key={row.id} style={{ marginTop: 12 }}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowMeta}>
                {row.isActive ? 'Active this week' : 'Scheduled / past'}
                {row.hasCounselorAudio ? ' · counselor audio' : ''}
              </Text>
              {row.latestResponse ? (
                <View style={{ marginTop: 6 }}>
                  <Text style={[styles.body, { fontWeight: '600' }]}>Latest client response</Text>
                  {row.latestResponse.responseType === 'text' && row.latestResponse.bodyText ? (
                    <Text style={styles.body}>{row.latestResponse.bodyText}</Text>
                  ) : null}
                  {row.latestResponse.responseType === 'voice' && row.latestResponse.audioUrl ? (
                    <CounselorAudioPlayer
                      audioUrl={row.latestResponse.audioUrl}
                      label="Play client voice response:"
                    />
                  ) : null}
                </View>
              ) : (
                <Text style={styles.body}>No client response yet.</Text>
              )}
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
