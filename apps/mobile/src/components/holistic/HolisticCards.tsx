import * as Linking from 'expo-linking';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spotifyOpenUrl, spotifySearchUrl, type GeneratedPlan } from '@/lib/api';
import { useMusicCatalog } from '@/hooks/useClientData';

type Week = NonNullable<GeneratedPlan['weeks'][number]>;

export function AyurvedaCard({
  block,
  completed,
  onComplete,
  loading,
  readOnly,
  embedded,
}: {
  block: NonNullable<Week['ayurvedaBlock']>;
  completed: boolean;
  onComplete: () => void;
  loading?: boolean;
  readOnly?: boolean;
  embedded?: boolean;
}) {
  const styles = useThemedStyles((c) => ({
    title: { fontSize: 15, fontWeight: '700' as const, color: c.text, marginTop: 8 },
    body: { fontSize: 14, color: c.muted, lineHeight: 21 },
    done: { fontSize: 14, color: c.success, fontWeight: '600' as const, marginTop: 8 },
    disclaimer: { fontSize: 12, color: c.faint, marginTop: 8, fontStyle: 'italic' as const },
  }));

  return embedded ? (
    <View>
      <Text style={styles.body}>{block.rhythmNote}</Text>
      {block.practices.map((p) => (
        <Text key={p} style={styles.body}>
          • {p}
        </Text>
      ))}
      <Text style={styles.disclaimer}>
        {block.disclaimer ?? 'Supportive wellness only — not medical treatment. Stop if pain increases.'}
      </Text>
      {readOnly ? null : completed ? (
        <Text style={styles.done}>✓ Practiced today</Text>
      ) : (
        <Button label="Mark practiced today" variant="secondary" onPress={onComplete} loading={loading} />
      )}
    </View>
  ) : (
    <Card title="Ayurveda-informed wellness">
      <Text style={styles.body}>{block.rhythmNote}</Text>
      {block.practices.map((p) => (
        <Text key={p} style={styles.body}>
          • {p}
        </Text>
      ))}
      <Text style={styles.disclaimer}>
        {block.disclaimer ?? 'Supportive wellness only — not medical treatment. Stop if pain increases.'}
      </Text>
      {readOnly ? null : completed ? (
        <Text style={styles.done}>✓ Practiced today</Text>
      ) : (
        <Button label="Mark practiced today" variant="secondary" onPress={onComplete} loading={loading} />
      )}
    </Card>
  );
}

export function YogaTrialCard({
  trial,
  completed,
  onComplete,
  loading,
  readOnly,
  embedded,
}: {
  trial: NonNullable<Week['yogaTrial']>;
  completed: boolean;
  onComplete: () => void;
  loading?: boolean;
  readOnly?: boolean;
  embedded?: boolean;
}) {
  const styles = useThemedStyles((c) => ({
    principle: { fontSize: 16, fontWeight: '700' as const, color: c.text },
    body: { fontSize: 14, color: c.muted, lineHeight: 21, marginTop: 6 },
    movement: { fontSize: 15, fontWeight: '600' as const, color: c.text, marginTop: 12 },
    disclaimer: { fontSize: 12, color: c.faint, marginTop: 8, fontStyle: 'italic' as const },
    done: { fontSize: 14, color: c.success, fontWeight: '600' as const, marginTop: 8 },
  }));

  const body = (
    <>
      <Text style={styles.principle}>{trial.principle}</Text>
      <Text style={styles.body}>{trial.applicability}</Text>
      <Text style={styles.movement}>
        Small movement: {trial.microMovement.title} ({trial.microMovement.duration})
      </Text>
      <Text style={styles.body}>{trial.microMovement.description}</Text>
      <Text style={styles.disclaimer}>{trial.disclaimer}</Text>
      {readOnly ? null : completed ? (
        <Text style={styles.done}>✓ Trial done today</Text>
      ) : (
        <Button label="Mark trial done today" onPress={onComplete} loading={loading} />
      )}
    </>
  );

  return embedded ? <View>{body}</View> : <Card title="Yoga principle trial">{body}</Card>;
}

export function MusicMomentCard({
  moment,
  completed,
  onComplete,
  loading,
  readOnly,
  curatedSpotifyUrl,
  embedded,
}: {
  moment: NonNullable<Week['musicMoment']>;
  completed: boolean;
  onComplete: () => void;
  loading?: boolean;
  readOnly?: boolean;
  curatedSpotifyUrl?: string | null;
  embedded?: boolean;
}) {
  const styles = useThemedStyles((c) => ({
    purpose: {
      alignSelf: 'flex-start' as const,
      fontSize: 12,
      fontWeight: '700' as const,
      color: c.text,
      backgroundColor: c.surface,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      overflow: 'hidden' as const,
      marginBottom: 8,
    },
    body: { fontSize: 14, color: c.muted, lineHeight: 21 },
    track: { fontSize: 14, color: c.text, marginTop: 6 },
    note: { fontSize: 12, color: c.faint },
    done: { fontSize: 14, color: c.success, fontWeight: '600' as const, marginTop: 8 },
  }));

  const playlist = moment.playlist;
  const searchQuery = playlist?.spotifySearchQuery ?? playlist?.title ?? moment.purpose;
  const openUrl = curatedSpotifyUrl ? spotifyOpenUrl(curatedSpotifyUrl) : spotifySearchUrl(searchQuery);

  const inner = (
    <>
      <Text style={styles.purpose}>{moment.purpose}</Text>
      <Text style={styles.body}>{moment.suggestion}</Text>
      {playlist ? (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.track, { fontWeight: '700' }]}>{playlist.title}</Text>
          <Text style={styles.body}>{playlist.description}</Text>
          {playlist.tracks.map((t) => (
            <View key={`${t.title}-${t.artist}`}>
              <Text style={styles.track}>
                {t.title} — {t.artist}
              </Text>
              <Text style={styles.note}>{t.note}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ marginTop: 12, gap: 8 }}>
        {!readOnly ? (
          <Button
            label={curatedSpotifyUrl ? 'Open curated playlist' : 'Open similar music on Spotify'}
            variant="secondary"
            onPress={() => void Linking.openURL(openUrl)}
          />
        ) : null}
        {readOnly ? (
          <Button
            label={curatedSpotifyUrl ? 'Open curated playlist' : 'Preview playlist search on Spotify'}
            variant="secondary"
            onPress={() => void Linking.openURL(openUrl)}
          />
        ) : null}
        {readOnly ? null : completed ? (
          <Text style={styles.done}>✓ Listened today</Text>
        ) : (
          <Button label="Mark listened today" onPress={onComplete} loading={loading} />
        )}
      </View>
    </>
  );

  return embedded ? <View>{inner}</View> : <Card title="Music moment">{inner}</Card>;
}

export function HolisticWeekSection({
  week,
  completed,
  onComplete,
  saving,
  readOnly,
}: {
  week: Week | null;
  completed: Record<'ayurveda' | 'yoga' | 'music', boolean>;
  onComplete: (type: 'ayurveda' | 'yoga' | 'music') => void;
  saving?: string | null;
  readOnly?: boolean;
}) {
  const musicCatalog = useMusicCatalog();

  const purposeToTag = (purpose: string): string => {
    const p = purpose.toLowerCase();
    if (p.includes('flare')) return 'flare';
    if (p.includes('evening') || p.includes('wind')) return 'evening';
    if (p.includes('reflect')) return 'reflection';
    if (p.includes('activ') || p.includes('morning')) return 'morning';
    return 'reflection';
  };

  if (!week) return null;

  return (
    <>
      {week.ayurvedaBlock ? (
        <AyurvedaCard
          block={week.ayurvedaBlock}
          completed={readOnly ? false : completed.ayurveda}
          onComplete={() => onComplete('ayurveda')}
          loading={saving === 'ayurveda'}
          readOnly={readOnly}
        />
      ) : null}
      {week.yogaTrial ? (
        <YogaTrialCard
          trial={week.yogaTrial}
          completed={readOnly ? false : completed.yoga}
          onComplete={() => onComplete('yoga')}
          loading={saving === 'yoga'}
          readOnly={readOnly}
        />
      ) : null}
      {week.musicMoment ? (
        <MusicMomentCard
          moment={week.musicMoment}
          completed={readOnly ? false : completed.music}
          onComplete={() => onComplete('music')}
          loading={saving === 'music'}
          readOnly={readOnly}
          curatedSpotifyUrl={musicCatalog[purposeToTag(week.musicMoment.purpose)]?.spotifyUri}
        />
      ) : null}
    </>
  );
}
