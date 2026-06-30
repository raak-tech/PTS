import { Platform, TextInput, TextInputProps } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type Props = TextInputProps;

const NUMERIC_KEYBOARD_TYPES = new Set(['number-pad', 'numeric', 'phone-pad']);

export function TextField({ style, keyboardType, placeholderTextColor, ...props }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles((c) => ({
    base: { color: c.text },
    web: Platform.OS === 'web' ? ({ outlineStyle: 'solid', outlineWidth: 0 } as const) : {},
  }));

  const numeric = keyboardType ? NUMERIC_KEYBOARD_TYPES.has(keyboardType) : false;

  return (
    <TextInput
      {...props}
      keyboardType={Platform.OS === 'web' && numeric ? 'default' : keyboardType}
      {...(Platform.OS === 'web' && numeric ? { inputMode: 'numeric' as const } : {})}
      placeholderTextColor={placeholderTextColor ?? colors.faint}
      style={[styles.base, Platform.OS === 'web' ? styles.web : null, style]}
      editable={props.editable !== false}
    />
  );
}
