import {
  clearOneBoxDraftLocal,
  loadOneBoxDraftLocal,
  saveOneBoxDraftLocal,
} from '@/hooks/useIntakeDraft';
import {
  apiDeleteIntakeDraft,
  apiGetIntakeDraft,
  apiPutIntakeDraft,
} from '@/lib/api';
import {
  hasOneBoxDraftProgress,
  makeOneBoxDraft,
  pickNewerDraft,
  type OneBoxIntakeDraft,
} from '@/lib/intake-draft';

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingToken: string | null = null;
let pendingDraft: OneBoxIntakeDraft | null = null;

async function flushServerSync() {
  const token = pendingToken;
  const draft = pendingDraft;
  pendingToken = null;
  pendingDraft = null;
  if (!token || !draft || token.startsWith('mock-')) return;
  try {
    await apiPutIntakeDraft(token, draft);
  } catch {
    // Offline / transient — local draft still holds progress.
  }
}

function scheduleServerSync(token: string | null | undefined, draft: OneBoxIntakeDraft) {
  if (!token || token.startsWith('mock-')) return;
  pendingToken = token;
  pendingDraft = draft;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void flushServerSync();
  }, 500);
}

/** Persist locally immediately; debounced PUT to server when token present. */
export async function persistOneBoxDraft(
  partial: Omit<OneBoxIntakeDraft, 'version' | 'flow' | 'updatedAt'> & {
    updatedAt?: string;
  },
  token?: string | null,
): Promise<OneBoxIntakeDraft> {
  const draft = makeOneBoxDraft(partial);
  try {
    await saveOneBoxDraftLocal(draft);
  } catch {
    // Ignore local failures
  }
  scheduleServerSync(token, draft);
  return draft;
}

/** Local first; pull server if newer or local empty. Writes winner to local. */
export async function resolveOneBoxDraft(
  token?: string | null,
): Promise<OneBoxIntakeDraft | null> {
  let local: OneBoxIntakeDraft | null = null;
  try {
    local = await loadOneBoxDraftLocal();
  } catch {
    local = null;
  }

  let remote: OneBoxIntakeDraft | null = null;
  if (token && !token.startsWith('mock-')) {
    try {
      const res = await apiGetIntakeDraft(token);
      remote = res.draft;
    } catch {
      remote = null;
    }
  }

  const winner = pickNewerDraft(
    hasOneBoxDraftProgress(local) ? local : null,
    hasOneBoxDraftProgress(remote) ? remote : null,
  );

  if (winner) {
    try {
      await saveOneBoxDraftLocal(winner);
    } catch {
      // Ignore
    }
  }
  return winner;
}

/** Clear local + server (complete intake / Start over). */
export async function clearOneBoxDraftEverywhere(token?: string | null) {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  pendingToken = null;
  pendingDraft = null;
  try {
    await clearOneBoxDraftLocal();
  } catch {
    // Ignore
  }
  if (token && !token.startsWith('mock-')) {
    try {
      await apiDeleteIntakeDraft(token);
    } catch {
      // Ignore
    }
  }
}
