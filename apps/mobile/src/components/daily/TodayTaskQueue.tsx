import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/useThemedStyles';

export type TodayTask = {
  id: string;
  label: string;
  done: boolean;
  optional?: boolean;
};

type Props = {
  tasks: TodayTask[];
  subtitle?: string;
  expandedId?: string | null;
  onToggleExpand?: (id: string) => void;
  renderExpanded?: (id: string) => React.ReactNode;
};

export function TodayTaskQueue({ tasks, subtitle, expandedId, onToggleExpand, renderExpanded }: Props) {
  const styles = useThemedStyles((c) => ({
    wrap: { marginBottom: 12 },
    header: { marginBottom: 10 },
    title: { fontSize: 13, fontWeight: '700' as const, color: c.faint, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
    sub: { fontSize: 13, color: c.muted, marginTop: 4 },
    barBg: { height: 8, borderRadius: 4, backgroundColor: c.surface, overflow: 'hidden' as const, marginTop: 8 },
    barFill: { height: '100%' as const, backgroundColor: c.primary, borderRadius: 4 },
    row: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      backgroundColor: c.surface,
    },
    rowDone: { opacity: 0.72 },
    rowHead: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    label: { fontSize: 15, fontWeight: '600' as const, color: c.text, flex: 1 },
    status: { fontSize: 12, color: c.muted, marginLeft: 8 },
  }));

  const active = tasks.filter((t) => !t.optional);
  const doneCount = active.filter((t) => t.done).length;
  const pct = active.length > 0 ? Math.round((doneCount / active.length) * 100) : 0;

  const nextId = useMemo(() => active.find((t) => !t.done)?.id ?? null, [active]);
  const [internalExpanded, setInternalExpanded] = useState<string | null>(nextId);

  useEffect(() => {
    if (expandedId === undefined && nextId) setInternalExpanded(nextId);
  }, [nextId, expandedId]);

  const openId = expandedId ?? internalExpanded;

  const onPress = (id: string) => {
    if (onToggleExpand) onToggleExpand(id);
    else setInternalExpanded((cur) => (cur === id ? null : id));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Today&apos;s checklist</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        <Text style={styles.sub}>
          {doneCount} of {active.length} done · {pct}%
        </Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
      </View>

      {tasks.map((task) => {
        const expanded = openId === task.id;
        return (
          <View key={task.id} style={[styles.row, task.done ? styles.rowDone : null]}>
            <Pressable onPress={() => onPress(task.id)} style={styles.rowHead}>
              <Text style={styles.label}>
                {task.done ? '✓ ' : '○ '}
                {task.label}
              </Text>
              <Text style={styles.status}>{expanded ? 'Hide' : 'Open'}</Text>
            </Pressable>
            {expanded && renderExpanded ? renderExpanded(task.id) : null}
          </View>
        );
      })}
    </View>
  );
}
