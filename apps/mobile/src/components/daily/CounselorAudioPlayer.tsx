import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export function CounselorAudioPlayer({ audioUrl }: { audioUrl: string }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const styles = useThemedStyles((c) => ({
    meta: { fontSize: 13, color: c.muted, marginBottom: 8 },
    err: { fontSize: 13, color: '#c62828' },
  }));

  useEffect(() => {
    return () => {
      void sound?.unloadAsync();
    };
  }, [sound]);

  const togglePlay = async () => {
    setError('');
    try {
      if (sound) {
        if (playing) {
          await sound.pauseAsync();
          setPlaying(false);
        } else {
          await sound.playAsync();
          setPlaying(true);
        }
        return;
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: next } = await Audio.Sound.createAsync({ uri: audioUrl });
      next.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setPlaying(status.isPlaying);
        if (status.didJustFinish) setPlaying(false);
      });
      setSound(next);
      await next.playAsync();
      setPlaying(true);
    } catch {
      setError('Could not play counselor recording.');
    }
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.meta}>Listen to your counselor first:</Text>
      <Button
        label={playing ? 'Pause counselor message' : 'Play counselor message'}
        variant="secondary"
        onPress={() => void togglePlay()}
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}
