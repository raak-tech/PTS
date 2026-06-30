import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type Props = {
  disabled?: boolean;
  onSubmitVoice: (audioBase64: string) => Promise<void>;
};

export function VoiceReadOut({ disabled, onSubmitVoice }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const styles = useThemedStyles((c) => ({
    meta: { fontSize: 13, color: c.muted, marginBottom: 8, lineHeight: 18 },
    status: { fontSize: 13, color: c.success, marginTop: 8 },
    error: { fontSize: 13, color: '#c62828', marginTop: 8 },
  }));

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void Audio.requestPermissionsAsync().then(({ granted }) => setPermission(granted));
  }, []);

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      setMessage('Voice recording is available in the Android app.');
      return;
    }
    if (!permission) {
      const { granted } = await Audio.requestPermissionsAsync();
      setPermission(granted);
      if (!granted) {
        setMessage('Microphone permission is required to record.');
        return;
      }
    }
    setMessage('');
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const next = new Audio.Recording();
    await next.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await next.startAsync();
    setRecording(next);
  };

  const stopAndSubmit = async () => {
    if (!recording) return;
    setUploading(true);
    setMessage('');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('No recording');

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      await onSubmitVoice(base64);
      setMessage('✓ Voice response saved');
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      setMessage('Could not save voice response. Try text instead.');
    } finally {
      setUploading(false);
    }
  };

  if (Platform.OS === 'web') {
    return <Text style={styles.meta}>Use text response on web preview — voice works in the Android app.</Text>;
  }

  return (
    <View>
      <Text style={styles.meta}>Or record yourself reading the read-out aloud (up to ~60 seconds).</Text>
      {recording ? (
        <Button label="Stop & submit recording" onPress={() => void stopAndSubmit()} loading={uploading} />
      ) : (
        <Button
          label="Record voice response"
          variant="secondary"
          onPress={() => void startRecording()}
          disabled={disabled || uploading}
        />
      )}
      {message ? (
        <Text style={message.startsWith('✓') ? styles.status : styles.error}>{message}</Text>
      ) : null}
    </View>
  );
}
