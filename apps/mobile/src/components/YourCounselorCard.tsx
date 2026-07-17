import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useCounselorContact } from '@/hooks/useClientData';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { CounselorPublicProfile } from '@/lib/api';
import { spacing } from '@/theme';

type Props = {
  /** Compact card for Profile / waiting-plan; full detail lives on counselor screen. */
  compact?: boolean;
  /** Hide when no counselor assigned (default true). */
  hideIfUnassigned?: boolean;
};

function ChipRow({ items }: { items: string[] }) {
  const styles = useThemedStyles((c) => ({
    row: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: c.successBg,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipText: { fontSize: 12, color: c.text, fontWeight: '600' as const },
  }));
  if (items.length === 0) return null;
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item} style={styles.chip}>
          <Text style={styles.chipText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function CounselorBody({
  counselor,
  compact,
}: {
  counselor: CounselorPublicProfile;
  compact: boolean;
}) {
  const styles = useThemedStyles((c) => ({
    name: { fontSize: 18, fontWeight: '700' as const, color: c.text },
    title: { fontSize: 14, color: c.muted, marginTop: 2 },
    credentials: { fontSize: 13, color: c.faint, marginTop: 2 },
    bio: { fontSize: 14, color: c.text, lineHeight: 21, marginTop: spacing.sm },
    meta: { fontSize: 13, color: c.muted, marginTop: spacing.xs },
  }));

  const bioPreview =
    compact && counselor.bio && counselor.bio.length > 160
      ? `${counselor.bio.slice(0, 157).trim()}…`
      : counselor.bio;

  return (
    <View style={{ gap: spacing.sm }}>
      <View>
        <Text style={styles.name}>{counselor.name}</Text>
        {counselor.title ? <Text style={styles.title}>{counselor.title}</Text> : null}
        {counselor.credentials ? <Text style={styles.credentials}>{counselor.credentials}</Text> : null}
        {counselor.yearsExperience ? (
          <Text style={styles.meta}>{counselor.yearsExperience} experience</Text>
        ) : null}
      </View>
      {bioPreview ? <Text style={styles.bio}>{bioPreview}</Text> : null}
      {!compact ? <ChipRow items={counselor.specialisations ?? []} /> : null}
      {!compact && (counselor.languages?.length ?? 0) > 0 ? (
        <Text style={styles.meta}>Languages: {(counselor.languages ?? []).join(', ')}</Text>
      ) : null}
      {compact && (counselor.specialisations?.length ?? 0) > 0 ? (
        <ChipRow items={(counselor.specialisations ?? []).slice(0, 4)} />
      ) : null}
    </View>
  );
}

/**
 * Assigned counselor only — not a marketplace / directory.
 * Contact stays in-app messages + Calendly; no personal email/phone.
 */
export function YourCounselorCard({ compact = true, hideIfUnassigned = true }: Props) {
  const router = useRouter();
  const { counselor, loading } = useCounselorContact();
  const styles = useThemedStyles((c) => ({
    muted: { fontSize: 14, color: c.muted, lineHeight: 20 },
    actions: { gap: spacing.sm, marginTop: spacing.sm },
  }));

  if (loading) return null;
  if (!counselor) {
    if (hideIfUnassigned) return null;
    return (
      <Card title="Your counselor">
        <Text style={styles.muted}>
          You&apos;ll meet your counselor once they start preparing your plan. Messaging opens after
          they&apos;re assigned.
        </Text>
      </Card>
    );
  }

  return (
    <Card title="Your counselor">
      <CounselorBody counselor={counselor} compact={compact} />
      <View style={styles.actions}>
        {compact ? (
          <Button
            label="View full profile"
            variant="secondary"
            onPress={() => router.push('/(client)/profile/counselor')}
          />
        ) : null}
        <Button
          label={counselor.unreadCount > 0 ? `Message (${counselor.unreadCount})` : 'Message'}
          variant={compact ? 'ghost' : 'secondary'}
          onPress={() => router.push(`/(client)/messages/${counselor.id}`)}
        />
        {counselor.sessionJoinUrl ? (
          <Button
            label="Join session"
            onPress={() => void Linking.openURL(counselor.sessionJoinUrl!)}
          />
        ) : null}
        {counselor.calendlyUrl ? (
          <Button
            label="Book a session"
            variant={counselor.sessionJoinUrl ? 'secondary' : undefined}
            onPress={() => void Linking.openURL(counselor.calendlyUrl!)}
          />
        ) : (
          <Text style={styles.muted}>
            Session booking opens when your counselor adds their calendar link.
          </Text>
        )}
      </View>
    </Card>
  );
}
