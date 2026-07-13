import type { ExpoConfig } from 'expo/config';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://pts-web-pied.vercel.app';
const isPainPilot = process.env.EXPO_PUBLIC_PILOT_COHORT === 'pain_script';

const config: ExpoConfig = {
  name: isPainPilot ? 'PTS Pain (Pilot)' : 'Pain to Strength',
  slug: isPainPilot ? 'pts-mobile-pain' : 'pts-mobile',
  owner: 'satananth',
  version: '1.0.0',
  scheme: isPainPilot ? 'pts-pain' : 'pts',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: isPainPilot ? 'com.pts.mobile.painscript' : 'com.pts.mobile',
  },
  android: {
    package: isPainPilot ? 'com.pts.mobile.painscript' : 'com.pts.mobile',
    versionCode: isPainPilot ? 20 : 15,
    softwareKeyboardLayoutMode: 'resize',
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
    pilotCohort: isPainPilot ? 'pain_script' : 'legacy',
    eas: {
      projectId: 'bfd7da5d-313c-4507-8c00-6fb6fede0d57',
    },
  },
  updates: {
    enabled: false,
  },
};

export default config;
