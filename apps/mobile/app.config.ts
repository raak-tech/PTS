import type { ExpoConfig } from 'expo/config';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://pts-web-pied.vercel.app';

const config: ExpoConfig = {
  name: 'Pain to Strength',
  slug: 'pts-mobile',
  owner: 'satananth',
  version: '1.0.0',
  scheme: 'pts',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.pts.mobile',
  },
  android: {
    package: 'com.pts.mobile',
    versionCode: 14,
    adaptiveIcon: {
      backgroundColor: '#3D4F44',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: ['INTERNET', 'RECORD_AUDIO', 'POST_NOTIFICATIONS'],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-audio',
    'expo-notifications',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        resizeMode: 'contain',
        backgroundColor: '#3D4F44',
      },
    ],
  ],
  extra: {
    apiUrl,
    eas: {
      projectId: 'bfd7da5d-313c-4507-8c00-6fb6fede0d57',
    },
  },
  updates: {
    enabled: false,
  },
};

export default config;
