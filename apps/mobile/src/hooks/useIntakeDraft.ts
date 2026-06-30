import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();
const DRAFT_KEY = 'intake_draft';

export function useIntakeDraft() {
  return {
    saveDraft: async (data: any) => {
      try {
        const json = JSON.stringify(data);
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          localStorage.setItem(DRAFT_KEY, json);
        } else {
          memoryStore.set(DRAFT_KEY, json);
        }
      } catch {
        // Ignore
      }
    },
    loadDraft: async () => {
      try {
        let json: string | null = null;
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          json = localStorage.getItem(DRAFT_KEY);
        } else {
          json = memoryStore.get(DRAFT_KEY) ?? null;
        }
        return json ? JSON.parse(json) : null;
      } catch {
        return null;
      }
    },
    clearDraft: async () => {
      try {
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          localStorage.removeItem(DRAFT_KEY);
        } else {
          memoryStore.delete(DRAFT_KEY);
        }
      } catch {
        // Ignore
      }
    },
  };
}
