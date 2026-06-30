import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/context/ThemeContext';

export type TabIconName =
  | 'today'
  | 'program'
  | 'messages'
  | 'profile'
  | 'home'
  | 'clients'
  | 'engagement';

const ICONS: Record<TabIconName, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  today: { active: 'sunny', inactive: 'sunny-outline' },
  program: { active: 'leaf', inactive: 'leaf-outline' },
  messages: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
  home: { active: 'grid', inactive: 'grid-outline' },
  clients: { active: 'people', inactive: 'people-outline' },
  engagement: { active: 'pulse', inactive: 'pulse-outline' },
};

type Props = {
  name: TabIconName;
  focused: boolean;
  size?: number;
};

export function TabBarIcon({ name, focused, size = 22 }: Props) {
  const { colors } = useTheme();
  const glyph = focused ? ICONS[name].active : ICONS[name].inactive;
  return <Ionicons name={glyph} size={size} color={focused ? colors.primary : colors.faint} />;
}
