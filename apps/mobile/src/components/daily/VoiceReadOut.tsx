import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type Props = {
  disabled?: boolean;
  onSubmitVoice: (audioBase64: string) => Promise<void>;
};

export function VoiceReadOut({ disabled, onSubmitVoice }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
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
    void requestRecordingPermissionsAsync().then(({ granted }) => setPermission(granted));
  }, []);

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      setMessage('Voice recording is available in the Android app.');
      return;
    }
    if (!permission) {
      const { granted } = await requestRecordingPermissionsAsync();
      setPermission(granted);
      if (!granted) {
        setMessage('Microphone permission is required to record.');
        return;
      }
    }
    setMessage('');
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopAndSubmit = async () => {
    if (!recorderState.isRecording) return;
    setUploading(true);
    setMessage('');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('No recording');

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await onSubmitVoice(base64);
      setMessage('✓ Recorded today');
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
      {recorderState.isRecording ? (
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
