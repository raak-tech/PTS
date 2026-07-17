import { ScrollView, Text, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const FACES = ['😊', '😊', '🙂', '😐', '😐', '😕', '😟', '😢', '😭', '😭', '😭'];

export function NRSFaceScale({
  value,
  onChange,
  yestrdayValue,
}: {
  value: number | null;
  onChange: (n: number) => void;
  yestrdayValue?: number;
}) {
  const styles = useThemedStyles((c) => ({
    container: { marginVertical: 12 },
    scaleLabel: { fontSize: 13, color: c.muted, marginBottom: 8 },
    scaleRow: { flexDirection: 'row' as const, gap: 4, justifyContent: 'space-between' as const },
    faceButton: {
      width: 40,
      height: 40,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    faceSelected: { borderColor: c.primary, backgroundColor: c.bg },
    faceFaint: { opacity: 0.4 },
    faceText: { fontSize: 24 },
    labels: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginTop: 8 },
    label: { fontSize: 11, color: c.faint },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.scaleLabel}>
        Pain level today
        {yestrdayValue !== undefined && yestrdayValue !== value && (
          <Text style={{ color: 'var(--muted)', fontSize: 12 }}>
            {' '}(yesterday: {yestrdayValue})
          </Text>
        )}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
        {FACES.map((face, i) => (
          <View
            key={i}
            onTouchEnd={() => onChange(i)}
            style={[
              styles.faceButton,
              value === i && styles.faceSelected,
              value !== i && yestrdayValue === i && styles.faceFaint,
            ]}
          >
            <Text style={styles.faceText}>{face}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.labels}>
        <Text style={styles.label}>No pain</Text>
        <Text style={styles.label}>Worst</Text>
      </View>
    </View>
  );
}
