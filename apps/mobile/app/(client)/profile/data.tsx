import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiSaveArtifact } from '@/lib/api';

export default function DataScreen() {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const styles = useThemedStyles((c) => ({
    body: { fontSize: 15, color: c.muted, lineHeight: 22, marginBottom: 12 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      minHeight: 72,
      backgroundColor: c.surface,
      marginBottom: 10,
    },
    status: { fontSize: 14, color: c.success, marginTop: 8 },
    error: { fontSize: 14, color: c.danger, marginTop: 8 },
  }));

  const onSave = async () => {
    if (!token || !title.trim() || !bodyText.trim()) {
      setMessage('Title and note are required.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await apiSaveArtifact(token, {
        title: title.trim(),
        bodyText: bodyText.trim(),
        kind: 'client_note',
      });
      setTitle('');
      setBodyText('');
      setMessage('Saved to your support artifacts.');
    } catch {
      setMessage('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Your data & consent" subtitle="Save notes your counselor can reference">
      <Text style={styles.body}>
        You agreed to data retention at sign-in. Save reflections or notes here — they are stored securely for your
        program.
      </Text>

      <Card title="Save a note">
        <TextField style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
        <TextField
          style={[styles.input, { minHeight: 120 }]}
          multiline
          placeholder="Your note or reflection"
          value={bodyText}
          onChangeText={setBodyText}
        />
        <Button label="Save artifact" onPress={() => void onSave()} loading={saving} />
        {message ? (
          <Text style={message.startsWith('Saved') ? styles.status : styles.error}>{message}</Text>
        ) : null}
      </Card>
    </Screen>
  );
}
