import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StrugglingFab } from '@/components/StrugglingFab';
import { TestTimeBanner } from '@/components/TestTimeBanner';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useTheme } from '@/context/ThemeContext';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';

export default function ClientTabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { total: unreadTotal } = useUnreadCounts();

  // Badge lifecycle:
  // - Messages: shows unread count, clears after opening a thread, re-badges on new messages

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TestTimeBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.faint,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 56 + insets.bottom,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        }}
      >
        <Tabs.Screen
          name="today"
          options={{
            title: 'Today',
            tabBarIcon: ({ focused }) => <TabBarIcon name="today" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="program"
          options={{
            title: 'Program',
            tabBarIcon: ({ focused }) => <TabBarIcon name="program" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="messages/index"
          options={{
            title: 'Messages',
            tabBarIcon: ({ focused }) => <TabBarIcon name="messages" focused={focused} />,
            tabBarBadge: unreadTotal > 0 ? unreadTotal : undefined,
            tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: 10 },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => <TabBarIcon name="profile" focused={focused} />,
          }}
        />
      </Tabs>
      <StrugglingFab />
    </View>
  );
}
