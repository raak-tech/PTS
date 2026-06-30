import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';

export default function DataScreen() {
  return (
    <Screen title="Your data & consent" subtitle="Control what PTS stores">
      <Text style={styles.body}>Consent-gated storage for support artifacts. Full controls wired to API in Phase B.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, color: '#666', lineHeight: 22 },
});
