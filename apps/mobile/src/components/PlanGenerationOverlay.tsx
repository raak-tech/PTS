import { ActivityIndicator, Modal, Text, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { usePlanGenerationProgress } from '@/hooks/usePlanGenerationProgress';

export function PlanGenerationOverlay({ visible }: { visible: boolean }) {
  const { colors } = useTheme();
  const { step, progress, hint, elapsed } = usePlanGenerationProgress(visible);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const elapsedLabel = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: colors.surface,
            borderRadius: 18,
            padding: 22,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
            Generating plan draft
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 16 }}>{hint}</Text>

          <View
            style={{
              height: 8,
              borderRadius: 999,
              backgroundColor: colors.border,
              overflow: 'hidden',
              marginBottom: 14,
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: colors.accent,
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={colors.accent} />
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text }}>{step}</Text>
          </View>
          <Text style={{ marginTop: 10, fontSize: 13, color: colors.muted }}>Elapsed: {elapsedLabel}</Text>
        </View>
      </View>
    </Modal>
  );
}
