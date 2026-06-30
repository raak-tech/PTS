import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';

export default function IntakeCompleteScreen() {
  const router = useRouter();

  return (
    <Screen title="You're in. Your journey starts here." subtitle="Your counselor will review what you've shared and prepare your personalised program.">
      <Text style={styles.body}>This usually takes less than 24 hours. You'll get a message when your plan is ready.</Text>
      <Button label="Go to messages" onPress={() => router.push('/(client)/(tabs)/messages')} />
      <Button label="What happens next?" variant="secondary" onPress={() => router.push('/(client)/waiting-plan')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, color: '#666', lineHeight: 22 },
});
