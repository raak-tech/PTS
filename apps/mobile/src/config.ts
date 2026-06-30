/** API base URL for PTS backend (Next.js on Vercel). */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://pts-web-pied.vercel.app';

/** Use mock auth when true (prototype without backend). */
export const USE_MOCK_AUTH = process.env.EXPO_PUBLIC_USE_MOCK_AUTH === 'true';
