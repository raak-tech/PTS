/** @deprecated Use useTheme() for colors. spacing remains here. */
import { getTheme, DEFAULT_THEME_ID } from '@/themes';

export const colors = getTheme(DEFAULT_THEME_ID).colors;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export type { ThemeColors, ThemeId } from '@/themes';
