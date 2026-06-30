export type ThemeId = 'warmEmber' | 'sanctuary' | 'dawnCalm' | 'twilightListen' | 'riverStone';

export type ThemeColors = {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  faint: string;
  border: string;
  accent: string;
  accentDark: string;
  accentWarm: string;
  primary: string;
  onPrimary: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  crisisBar: string;
  crisisBarText: string;
  tabBar: string;
  statusBar: 'light' | 'dark';
};

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  description: string;
  colors: ThemeColors;
};

export const THEMES: ThemeDefinition[] = [
  {
    id: 'warmEmber',
    label: 'Warm Ember',
    description: 'Current — direct, modern, energetic',
    colors: {
      bg: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#111111',
      muted: '#666666',
      faint: '#999999',
      border: '#EEEEEE',
      accent: '#FBBF24',
      accentDark: '#F97316',
      accentWarm: '#F97316',
      primary: '#111111',
      onPrimary: '#FFFFFF',
      danger: '#B71C1C',
      dangerBg: '#FFEBEE',
      success: '#2E7D32',
      successBg: '#F1F8E9',
      crisisBar: '#1A1A2E',
      crisisBarText: 'rgba(255,255,255,0.9)',
      tabBar: '#FFFFFF',
      statusBar: 'dark',
    },
  },
  {
    id: 'sanctuary',
    label: 'Sanctuary',
    description: 'Ayurveda-aligned — earth, sage, grounding',
    colors: {
      bg: '#F5F0E8',
      surface: '#FFFCF7',
      text: '#2C2416',
      muted: '#6B5E4F',
      faint: '#9A8B7A',
      border: '#E5DDD0',
      accent: '#5C7A6B',
      accentDark: '#4A6356',
      accentWarm: '#C4725A',
      primary: '#3D4F44',
      onPrimary: '#FFFCF7',
      danger: '#8B3A3A',
      dangerBg: '#F5E8E8',
      success: '#4A6B52',
      successBg: '#E8F0EA',
      crisisBar: '#3D4F44',
      crisisBarText: 'rgba(255,252,247,0.92)',
      tabBar: '#FFFCF7',
      statusBar: 'dark',
    },
  },
  {
    id: 'dawnCalm',
    label: 'Dawn Calm',
    description: 'Clinical trust — soft blue-grey',
    colors: {
      bg: '#EEF2F5',
      surface: '#FFFFFF',
      text: '#1E3A4F',
      muted: '#5A6B7A',
      faint: '#8A9BAA',
      border: '#D8E2EA',
      accent: '#4A90A4',
      accentDark: '#3A7284',
      accentWarm: '#7BA7BC',
      primary: '#1E3A4F',
      onPrimary: '#FFFFFF',
      danger: '#B71C1C',
      dangerBg: '#FFEBEE',
      success: '#2E7D32',
      successBg: '#F1F8E9',
      crisisBar: '#1E3A4F',
      crisisBarText: 'rgba(255,255,255,0.92)',
      tabBar: '#FFFFFF',
      statusBar: 'dark',
    },
  },
  {
    id: 'twilightListen',
    label: 'Twilight Listen',
    description: 'Evening & music — restful dark mode',
    colors: {
      bg: '#1A1F2E',
      surface: '#252B3D',
      text: '#E8E4DC',
      muted: '#9BA3B5',
      faint: '#6B7385',
      border: '#353D52',
      accent: '#9B8BB4',
      accentDark: '#7E6F9A',
      accentWarm: '#D4A574',
      primary: '#9B8BB4',
      onPrimary: '#1A1F2E',
      danger: '#E57373',
      dangerBg: '#3D2A2A',
      success: '#81C784',
      successBg: '#2A3D2C',
      crisisBar: '#0F1219',
      crisisBarText: 'rgba(232,228,220,0.92)',
      tabBar: '#252B3D',
      statusBar: 'light',
    },
  },
  {
    id: 'riverStone',
    label: 'River Stone',
    description: 'Minimal neutral — low cognitive load',
    colors: {
      bg: '#F7F5F2',
      surface: '#FFFFFF',
      text: '#4A4543',
      muted: '#7A7570',
      faint: '#A8A39E',
      border: '#E5E0DA',
      accent: '#8B9E8F',
      accentDark: '#6F8274',
      accentWarm: '#A89888',
      primary: '#4A4543',
      onPrimary: '#FFFFFF',
      danger: '#9E4A4A',
      dangerBg: '#F3EBEB',
      success: '#5C7A62',
      successBg: '#EDF2EE',
      crisisBar: '#4A4543',
      crisisBarText: 'rgba(255,255,255,0.92)',
      tabBar: '#FFFFFF',
      statusBar: 'dark',
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'sanctuary';

export function getTheme(id: ThemeId): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
