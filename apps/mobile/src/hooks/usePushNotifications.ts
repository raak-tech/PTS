import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { apiRegisterPushToken } from '@/lib/api';

// Request permissions and register Expo push token after login.
// Sends the token to the backend so the server can target this device.
export function usePushNotifications(token: string | null) {
  const registered = useRef(false);

  useEffect(() => {
    if (!token || registered.current || Platform.OS === 'web') return;

    const register = async () => {
      try {
        // Request permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('[push] Permission not granted');
          return;
        }

        // Get Expo push token — requires projectId from eas config
        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        if (!projectId) {
          console.log('[push] No EAS projectId found in app config');
          return;
        }

        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log('[push] Expo push token:', expoPushToken);

        // Register with backend
        await apiRegisterPushToken(token, expoPushToken);
        registered.current = true;
      } catch (err) {
        console.error('[push] Registration failed:', err);
      }
    };

    void register();
  }, [token]);
}

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
