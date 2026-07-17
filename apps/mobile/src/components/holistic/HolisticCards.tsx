import * as Linking from 'expo-linking';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spotifyOpenUrl, spotifySearchUrl, type GeneratedPlan } from '@/lib/api';
import {
  ayurvedaDisplayLines,
  weekHolisticYoga,
  type AyurvedaBlock,
  type MusicMoment,
  type YogicPractice,
} from '@/lib/holisticDisplay';
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
  block: AyurvedaBlock;
  completed: boolean;
  onComplete: () => void;
  loading?: boolean;
  readOnly?: boolean;
  embedded?: boolean;
}) {
  const styles = useThemedStyles((c) => ({
    body: { fontSize: 14, color: c.muted, lineHeight: 21 },
    done: { fontSize: 14, color: c.success, fontWeight: '600' as const, marginTop: 8 },
    disclaimer: { fontSize: 12, color: c.faint, marginTop: 8, fontStyle: 'italic' as const },
  }));

  const lines = ayurvedaDisplayLines(block);

  const inner = (
    <>
      {lines.map((line) => (
        <Text key={line} style={styles.body}>
          {line.startsWith('Favour:') || line.startsWith('Limit:') ? line : `• ${line}`}
        </Text>
      ))}
      <Text style={styles.disclaimer}>
        {block.disclaimer ??
          'General wellbeing only — not medical or Ayurvedic treatment. Check with your doctor or dietitian.'}
      </Text>
      {readOnly ? null : completed ? (
        <Text style={styles.done}>✓ Practiced today</Text>
      ) : (
        <Button label="Mark practiced today" variant="secondary" onPress={onComplete} loading={loading} />
      )}
    </>
  );

  return embedded ? <View>{inner}</View> : <Card title="Ayurveda-informed wellness">{inner}</Card>;
}

export function YogicPracticeCard({
  practice,
  completed,
  onComplete,
  loading,
  readOnly,
  embedded,
}: {
  practice: YogicPractice;
  completed: boolean;
  onComplete: () => void;
  loading?: boolean;
  readOnly?: boolean;
  embedded?: boolean;
}) {
  const styles = useThemedStyles((c) => ({
    section: { fontSize: 15, fontWeight: '700' as const, color: c.text, marginTop: 10 },
    body: { fontSize: 14, color: c.muted, lineHeight: 21, marginTop: 4 },
    disclaimer: { fontSize: 12, color: c.faint, marginTop: 8, fontStyle: 'italic' as const },
    done: { fontSize: 14, color: c.success, fontWeight: '600' as const, marginTop: 8 },
  }));

  const body = (
    <>
      <Text style={styles.section}>{practice.breathingTechnique.title}</Text>
      <Text style={styles.body}>{practice.breathingTechnique.description}</Text>
      <Text style={[styles.body, { fontStyle: 'italic' }]}>{practice.breathingTechnique.duration}</Text>
      <Text style={styles.section}>{practice.meditation.title}</Text>
      <Text style={styles.body}>{practice.meditation.description}</Text>
      <Text style={[styles.body, { fontStyle: 'italic' }]}>{practice.meditation.duration}</Text>
      <Text style={styles.section}>Reflection</Text>
      <Text style={styles.body}>{practice.philosophicalFraming}</Text>
      <Text style={styles.disclaimer}>{practice.disclaimer}</Text>
      {readOnly ? null : completed ? (
        <Text style={styles.done}>✓ Practiced today</Text>
      ) : (
        <Button label="Mark practiced today" onPress={onComplete} loading={loading} />
      )}
    </>
  );

  return embedded ? <View>{body}</View> : <Card title="Breath, meditation & reflection">{body}</Card>;
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
  moment: MusicMoment;
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
  const resolved = moment.resolvedTracks ?? [];
  const searchQuery =
    moment.searchTerms?.join(' ') ??
    playlist?.spotifySearchQuery ??
    playlist?.title ??
    moment.purpose;
  const openUrl = curatedSpotifyUrl
    ? spotifyOpenUrl(curatedSpotifyUrl)
    : resolved[0]?.url
      ? resolved[0].url
      : spotifySearchUrl(searchQuery);

  const openLabel = resolved[0]?.url
    ? 'Open music'
    : curatedSpotifyUrl
      ? 'Open curated playlist'
      : 'Open similar music on Spotify';

  const inner = (
    <>
      <Text style={styles.purpose}>{moment.purpose}</Text>
      <Text style={styles.body}>{moment.suggestion}</Text>
      {resolved.length > 0 ? (
        <View style={{ marginTop: 10 }}>
          {resolved.map((t) => (
            <View key={t.url}>
              <Text style={styles.track}>{t.title}</Text>
              {t.artist ? <Text style={styles.note}>{t.artist}</Text> : null}
            </View>
          ))}
        </View>
      ) : playlist?.tracks?.length ? (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.track, { fontWeight: '700' }]}>{playlist.title}</Text>
          {playlist.tracks.map((t) => (
            <View key={`${t.title}-${t.artist}`}>
              <Text style={styles.track}>
                {t.title} — {t.artist}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ marginTop: 12, gap: 8 }}>
        <Button label={openLabel} variant="secondary" onPress={() => void Linking.openURL(openUrl)} />
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
  const yogic = week ? weekHolisticYoga(week) : null;

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
      {yogic ? (
        <YogicPracticeCard
          practice={yogic}
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
          curatedSpotifyUrl={
            week.musicMoment.resolvedTracks?.[0]?.url
              ? null
              : musicCatalog[purposeToTag(week.musicMoment.purpose)]?.spotifyUri
          }
        />
      ) : null}
    </>
  );
}
