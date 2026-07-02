import * as Linking from 'expo-linking';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { API_URL } from '@/config';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const PRIVACY_URL = `${API_URL}/privacy`;

export default function DataScreen() {
  const styles = useThemedStyles((c) => ({
    body: { fontSize: 15, color: c.muted, lineHeight: 22, marginBottom: 12 },
  }));

  return (
    <Screen title="Privacy & data" subtitle="How PTS handles your information">
      <Text style={styles.body}>
        You agreed to data retention at sign-in. PTS stores program responses, messages, and daily notes so your
        counselor can support your recovery.
      </Text>
      <Button
        label="Read full privacy policy"
        variant="secondary"
        onPress={() => void Linking.openURL(PRIVACY_URL)}
      />
      <Button
        label="Terms of use"
        variant="ghost"
        onPress={() => void Linking.openURL(`${API_URL}/terms`)}
      />
    </Screen>
  );
}
