import Constants from 'expo-constants';
import { Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/useThemedStyles';

function readBuildNumber(): string {
  if (Constants.nativeBuildVersion) return Constants.nativeBuildVersion;
  const code = Constants.expoConfig?.android?.versionCode;
  if (code != null) return String(code);
  return '—';
}

export function AppBuildInfo() {
  const version = Constants.expoConfig?.version ?? '—';
  const build = readBuildNumber();
  const styles = useThemedStyles((c) => ({
    wrap: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.border },
    line: { fontSize: 12, color: c.faint, lineHeight: 18 },
  }));

  return (
    <View style={styles.wrap} accessibilityLabel={`App version ${version}, build ${build}`}>
      <Text style={styles.line}>Version {version}</Text>
      <Text style={styles.line}>Build {build}</Text>
    </View>
  );
}
