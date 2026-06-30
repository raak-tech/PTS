import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { CalendarBlock } from '@/lib/api';

const BLOCK_TYPES: CalendarBlock['type'][] = [
  'practice',
  'reinforcement',
  'rest',
  'work_break',
  'music',
  'custom',
];

const TIME_SUGGESTIONS = ['07:30', '08:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

type Props = {
  blocks: CalendarBlock[];
  onChange: (blocks: CalendarBlock[]) => void | Promise<void>;
};

export function CalendarBuilder({ blocks, onChange }: Props) {
  const [editing, setEditing] = useState(blocks.length === 0);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftTime, setDraftTime] = useState('09:00');
  const [draftType, setDraftType] = useState<CalendarBlock['type']>('custom');
  const [saving, setSaving] = useState(false);
  const styles = useThemedStyles((c) => ({
    meta: { fontSize: 14, color: c.muted, lineHeight: 20, marginBottom: 12 },
    row: { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: c.border },
    label: { fontSize: 15, fontWeight: '600' as const, color: c.text },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 10,
      backgroundColor: c.surface,
      marginTop: 8,
    },
    chipRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, marginTop: 8 },
    chip: {
      fontSize: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: c.surface,
      color: c.text,
      overflow: 'hidden' as const,
    },
    chipActive: { backgroundColor: c.primary, color: '#111' },
    form: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: c.surface },
  }));

  const persist = async (next: CalendarBlock[]) => {
    setSaving(true);
    try {
      await onChange(next);
    } finally {
      setSaving(false);
    }
  };

  const addBlock = async () => {
    if (!draftLabel.trim()) return;
    const next: CalendarBlock = {
      id: `custom-${Date.now()}`,
      type: draftType,
      label: draftLabel.trim(),
      plannedTime: draftTime,
      status: 'planned',
    };
    await persist([...blocks, next]);
    setDraftLabel('');
    setEditing(false);
  };

  const removeBlock = async (id: string) => {
    await persist(blocks.filter((b) => b.id !== id));
  };

  const updateTime = async (id: string, plannedTime: string) => {
    await persist(blocks.map((b) => (b.id === id ? { ...b, plannedTime } : b)));
  };

  return (
    <View>
      <Text style={styles.meta}>
        Plan when you&apos;ll do practices, read-outs, and rest today. Tap a time chip to adjust.
      </Text>

      {blocks.map((block) => (
        <View key={block.id} style={styles.row}>
          <Text style={styles.label}>{block.label}</Text>
          <Text style={styles.meta}>{block.type.replace('_', ' ')}</Text>
          <View style={styles.chipRow}>
            {TIME_SUGGESTIONS.map((time) => (
              <Text
                key={`${block.id}-${time}`}
                onPress={() => void updateTime(block.id, time)}
                style={[styles.chip, block.plannedTime === time ? styles.chipActive : null]}
              >
                {time}
              </Text>
            ))}
          </View>
          {editing ? (
            <Text onPress={() => void removeBlock(block.id)} style={{ color: '#c62828', marginTop: 8, fontSize: 13 }}>
              Remove block
            </Text>
          ) : null}
        </View>
      ))}

      {editing ? (
        <View style={styles.form}>
          <TextField
            style={styles.input}
            placeholder="Block label (e.g. Morning breath practice)"
            value={draftLabel}
            onChangeText={setDraftLabel}
          />
          <TextField
            style={styles.input}
            placeholder="Time (HH:MM)"
            value={draftTime}
            onChangeText={setDraftTime}
          />
          <View style={styles.chipRow}>
            {BLOCK_TYPES.map((type) => (
              <Text
                key={type}
                onPress={() => setDraftType(type)}
                style={[styles.chip, draftType === type ? styles.chipActive : null]}
              >
                {type}
              </Text>
            ))}
          </View>
          <Button label="Add block" onPress={() => void addBlock()} loading={saving} />
        </View>
      ) : (
        <Button label={blocks.length ? 'Add another block' : 'Build my day'} variant="secondary" onPress={() => setEditing(true)} />
      )}

      {blocks.length > 0 ? (
        <Button
          label={editing ? 'Done editing' : 'Edit day plan'}
          variant="secondary"
          onPress={() => setEditing((v) => !v)}
        />
      ) : null}

      {Platform.OS === 'web' ? (
        <Text style={[styles.meta, { marginTop: 8 }]}>Voice and drag-and-drop scheduling ship in a later build.</Text>
      ) : null}
    </View>
  );
}
