import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiShareWithCounselor, type CounselorShareCategory } from '@/lib/api';

const CATEGORIES: { id: CounselorShareCategory; label: string; placeholder: string }[] = [
  { id: 'update', label: "What's changed", placeholder: 'Pain, sleep, life events, stressors…' },
  { id: 'question', label: 'Questions', placeholder: 'What you want your counselor to consider…' },
  { id: 'win', label: 'Wins', placeholder: 'Small wins or progress to celebrate…' },
];

export function ShareWithCounselorCard() {
  const { token } = useAuth();
  const [category, setCategory] = useState<CounselorShareCategory>('update');
  const [bodyText, setBodyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const styles = useThemedStyles((c) => ({
    intro: { fontSize: 14, color: c.muted, lineHeight: 21, marginBottom: 12 },
    chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: 12 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: { borderColor: c.primary, backgroundColor: c.surface },
    chipText: { fontSize: 13, color: c.text },
    chipTextActive: { fontWeight: '600' as const },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      minHeight: 100,
      backgroundColor: c.bg,
      marginBottom: 8,
    },
    success: { fontSize: 13, color: c.success, marginTop: 8 },
    error: { fontSize: 13, color: '#c62828', marginTop: 8 },
  }));

  const active = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];

  const onSubmit = async () => {
    if (!token) return;
    const text = bodyText.trim();
    if (text.length < 3) {
      setMessage('Please add a few words for your counselor.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await apiShareWithCounselor(token, { category, bodyText: text });
      setBodyText('');
      setMessage('Shared with your counselor — they will see this in your workspace.');
    } catch {
      setMessage('Could not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Share with counselor">
      <Text style={styles.intro}>
        Add updates for your counselor to review — separate from your message thread.
      </Text>
      <View style={styles.chips}>
        {CATEGORIES.map((item) => {
          const selected = item.id === category;
          return (
            <Pressable
              key={item.id}
              onPress={() => setCategory(item.id)}
              style={[styles.chip, selected ? styles.chipActive : null]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextActive : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextField
        style={styles.input}
        multiline
        placeholder={active.placeholder}
        value={bodyText}
        onChangeText={setBodyText}
      />
      <Button label="Share with counselor" onPress={() => void onSubmit()} loading={saving} />
      {message ? (
        <Text style={message.startsWith('Shared') ? styles.success : styles.error}>{message}</Text>
      ) : null}
    </Card>
  );
}
