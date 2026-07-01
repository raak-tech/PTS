import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export function CounselorAudioPlayer({ audioUrl }: { audioUrl: string }) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState('');
  const styles = useThemedStyles((c) => ({
    meta: { fontSize: 13, color: c.muted, marginBottom: 8 },
    err: { fontSize: 13, color: '#c62828' },
  }));

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  const togglePlay = () => {
    setError('');
    try {
      if (status.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch {
      setError('Could not play counselor recording.');
    }
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.meta}>Listen to your counselor first:</Text>
      <Button
        label={status.playing ? 'Pause counselor message' : 'Play counselor message'}
        variant="secondary"
        onPress={togglePlay}
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}
