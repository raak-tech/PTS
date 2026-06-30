import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useCounselorContact } from '@/hooks/useClientData';
import { useProgramTime } from '@/hooks/useProgramTime';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { PROGRAM_WEEK_THEMES } from '@/lib/appTime';

export default function ProgramScreen() {
  const router = useRouter();
  const programTime = useProgramTime();
  const { calendlyUrl, counselorName } = useCounselorContact();
  const styles = useThemedStyles((c) => ({
    status: { fontSize: 13, color: c.muted },
  }));

  const weeks = programTime?.weeks ?? PROGRAM_WEEK_THEMES.map((entry, index) => ({
    id: String(index + 1),
    theme: entry.theme,
    focus: entry.focus,
    status: index === 0 ? ('current' as const) : ('locked' as const),
  }));

  return (
    <Screen
      layout="tab"
      title="Your 6-week program"
      subtitle={
        programTime?.programComplete
          ? 'Program complete — review your weeks anytime'
          : 'Personalised recovery plan'
      }
    >
      {weeks.map((week) => (
        <Card
          key={week.id}
          title={`Week ${week.id}: ${week.theme}`}
          onPress={week.status !== 'locked' ? () => router.push(`/(client)/program/week/${week.id}`) : undefined}
        >
          <Text style={styles.status}>
            {week.status === 'current' ? 'Current week' : week.status === 'locked' ? 'Locked' : 'Complete'}
          </Text>
        </Card>
      ))}
      <Button label="Weekly check-in" variant="secondary" onPress={() => router.push('/(client)/program/check-in')} />
      {calendlyUrl ? (
        <Button
          label={counselorName ? `Book session with ${counselorName.split(' ')[0]}` : 'Book a session'}
          variant="ghost"
          onPress={() => void Linking.openURL(calendlyUrl)}
        />
      ) : (
        <Button
          label="Book a session"
          variant="ghost"
          onPress={() => router.push('/(client)/(tabs)/messages')}
        />
      )}
    </Screen>
  );
}
