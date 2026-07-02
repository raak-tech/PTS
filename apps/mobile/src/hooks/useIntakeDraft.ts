import { useCallback } from 'react';
import { Platform } from 'react-native';

import type { IntakeDraft } from '@/lib/intake';

const memoryStore = new Map<string, string>();
const DRAFT_KEY = 'intake_draft';

async function persistDraft(draft: IntakeDraft) {
  const json = JSON.stringify(draft);
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(DRAFT_KEY, json);
  } else {
    memoryStore.set(DRAFT_KEY, json);
  }
}

async function readDraft(): Promise<IntakeDraft | null> {
  let json: string | null = null;
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    json = localStorage.getItem(DRAFT_KEY);
  } else {
    json = memoryStore.get(DRAFT_KEY) ?? null;
  }
  if (!json) return null;
  return JSON.parse(json) as IntakeDraft;
}

async function removeDraft() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(DRAFT_KEY);
  } else {
    memoryStore.delete(DRAFT_KEY);
  }
}

/** Clear saved intake progress (e.g. on sign-out or account switch). */
export async function clearIntakeDraft() {
  try {
    await removeDraft();
  } catch {
    // Ignore
  }
}

export function useIntakeDraft() {
  const saveDraft = useCallback(async (draft: IntakeDraft) => {
    try {
      await persistDraft(draft);
    } catch {
      // Ignore storage failures — intake can still be completed online.
    }
  }, []);

  const loadDraft = useCallback(async () => {
    try {
      return await readDraft();
    } catch {
      return null;
    }
  }, []);

  const clearDraft = useCallback(async () => {
    try {
      await removeDraft();
    } catch {
      // Ignore
    }
  }, []);

  return { saveDraft, loadDraft, clearDraft };
}
