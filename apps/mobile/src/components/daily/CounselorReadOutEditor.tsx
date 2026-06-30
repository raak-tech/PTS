import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type Props = {
  activeId: string | null;
  title: string;
  bodyText: string;
  hasAudio: boolean;
  saving: boolean;
  onChangeTitle: (v: string) => void;
  onChangeBody: (v: string) => void;
  onSave: (audioBase64?: string, clearAudio?: boolean) => Promise<void>;
  onRecord: () => Promise<void>;
  recording: boolean;
};

export function CounselorReadOutEditor({
  activeId,
  title,
  bodyText,
  hasAudio,
  saving,
  onChangeTitle,
  onChangeBody,
  onSave,
  onRecord,
  recording,
}: Props) {
  const styles = useThemedStyles((c) => ({
    meta: { fontSize: 13, color: c.muted, marginBottom: 10, lineHeight: 18 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: c.surface,
      marginBottom: 8,
    },
    ok: { fontSize: 13, color: c.success, marginTop: 8 },
  }));

  return (
    <View>
      <Text style={styles.meta}>
        Edit what the client reads each morning. Record yourself reading it so they can listen first.
      </Text>
      <TextField style={styles.input} value={title} onChangeText={onChangeTitle} placeholder="Title" />
      <TextField
        style={[styles.input, { minHeight: 88 }]}
        value={bodyText}
        onChangeText={onChangeBody}
        placeholder="Read-out text"
        multiline
      />
      <Button label={activeId ? 'Save changes' : 'Assign read-out'} onPress={() => void onSave()} loading={saving} />
      <Button
        label={recording ? 'Stop & save recording' : 'Record counselor message'}
        variant="secondary"
        onPress={() => void onRecord()}
        disabled={saving}
      />
      {hasAudio ? (
        <Button label="Remove recording" variant="secondary" onPress={() => void onSave(undefined, true)} />
      ) : null}
      {hasAudio ? <Text style={styles.ok}>✓ Recording attached for client</Text> : null}
    </View>
  );
}
