import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import type { IntakeDraft } from '@/lib/intake';
import {
  isOneBoxIntakeDraft,
  ONEBOX_DRAFT_STORAGE_KEY,
  type OneBoxIntakeDraft,
} from '@/lib/intake-draft';

const LEGACY_DRAFT_KEY = 'intake_draft';

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return AsyncStorage.getItem(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function storageRemove(key: string): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

// —— Legacy multi-step draft (opt-in legacy intake) ——

async function persistLegacyDraft(draft: IntakeDraft) {
  await storageSet(LEGACY_DRAFT_KEY, JSON.stringify(draft));
}

async function readLegacyDraft(): Promise<IntakeDraft | null> {
  const json = await storageGet(LEGACY_DRAFT_KEY);
  if (!json) return null;
  return JSON.parse(json) as IntakeDraft;
}

async function removeLegacyDraft() {
  await storageRemove(LEGACY_DRAFT_KEY);
}

// —— One-box draft ——

export async function loadOneBoxDraftLocal(): Promise<OneBoxIntakeDraft | null> {
  try {
    const json = await storageGet(ONEBOX_DRAFT_STORAGE_KEY);
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    return isOneBoxIntakeDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveOneBoxDraftLocal(draft: OneBoxIntakeDraft): Promise<void> {
  await storageSet(ONEBOX_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export async function clearOneBoxDraftLocal(): Promise<void> {
  await storageRemove(ONEBOX_DRAFT_STORAGE_KEY);
}

/** Clear legacy + one-box local drafts (sign-out / account switch). Does not hit server. */
export async function clearIntakeDraft() {
  try {
    await removeLegacyDraft();
  } catch {
    // Ignore
  }
  try {
    await clearOneBoxDraftLocal();
  } catch {
    // Ignore
  }
}

export function useIntakeDraft() {
  const saveDraft = useCallback(async (draft: IntakeDraft) => {
    try {
      await persistLegacyDraft(draft);
    } catch {
      // Ignore storage failures — intake can still be completed online.
    }
  }, []);

  const loadDraft = useCallback(async () => {
    try {
      return await readLegacyDraft();
    } catch {
      return null;
    }
  }, []);

  const clearDraft = useCallback(async () => {
    try {
      await removeLegacyDraft();
    } catch {
      // Ignore
    }
  }, []);

  return { saveDraft, loadDraft, clearDraft };
}
