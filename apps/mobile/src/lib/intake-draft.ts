/**
 * One-box intake mid-flow draft — survives app kill (local) and reinstall (server).
 */

export type OneBoxIntakeStep = 'segment' | 'onebox' | 'confirm' | 'follow-up';

export type OneBoxIntakeDraft = {
  version: 1;
  flow: 'onebox';
  step: OneBoxIntakeStep;
  segmentType?: string;
  freeText?: string;
  round?: number;
  resultJson?: string;
  edits?: Record<string, string>;
  followUpAnswers?: string[];
  followUpStep?: number;
  updatedAt: string;
};

export const ONEBOX_DRAFT_STORAGE_KEY = 'pts.intake.onebox.draft.v1';

export function makeOneBoxDraft(
  partial: Omit<OneBoxIntakeDraft, 'version' | 'flow' | 'updatedAt'> & {
    updatedAt?: string;
  },
): OneBoxIntakeDraft {
  return {
    version: 1,
    flow: 'onebox',
    updatedAt: partial.updatedAt ?? new Date().toISOString(),
    ...partial,
  };
}

/** True when a saved draft is worth offering resume. */
export function hasOneBoxDraftProgress(draft: OneBoxIntakeDraft | null | undefined): boolean {
  if (!draft || draft.flow !== 'onebox') return false;
  if (draft.step === 'segment') return Boolean(draft.segmentType?.trim());
  if (draft.step === 'onebox') {
    return Boolean(draft.freeText?.trim()) || Boolean(draft.segmentType?.trim());
  }
  if (draft.step === 'confirm' || draft.step === 'follow-up') {
    return Boolean(draft.resultJson?.trim() || draft.freeText?.trim());
  }
  return false;
}

export function isOneBoxIntakeDraft(value: unknown): value is OneBoxIntakeDraft {
  if (!value || typeof value !== 'object') return false;
  const d = value as Record<string, unknown>;
  return (
    d.version === 1 &&
    d.flow === 'onebox' &&
    typeof d.step === 'string' &&
    typeof d.updatedAt === 'string'
  );
}

export function pickNewerDraft(
  a: OneBoxIntakeDraft | null,
  b: OneBoxIntakeDraft | null,
): OneBoxIntakeDraft | null {
  if (!a) return b;
  if (!b) return a;
  const ta = Date.parse(a.updatedAt);
  const tb = Date.parse(b.updatedAt);
  if (Number.isNaN(ta)) return b;
  if (Number.isNaN(tb)) return a;
  return tb >= ta ? b : a;
}

/** Expo Router replace target for Continue. */
export function draftToResumeTarget(draft: OneBoxIntakeDraft): {
  pathname:
    | '/(client)/intake/segment'
    | '/(client)/intake/onebox'
    | '/(client)/intake/confirm'
    | '/(client)/intake/follow-up';
  params?: Record<string, string>;
} {
  const segmentType = draft.segmentType ?? 'other';
  const round = String(draft.round ?? 1);
  const freeText = draft.freeText ?? '';

  switch (draft.step) {
    case 'segment':
      return {
        pathname: '/(client)/intake/segment',
        params: draft.segmentType ? { segmentType: draft.segmentType } : undefined,
      };
    case 'onebox':
      return {
        pathname: '/(client)/intake/onebox',
        params: {
          segmentType,
          round,
          ...(draft.freeText ? { draftText: draft.freeText } : {}),
        },
      };
    case 'confirm':
      return {
        pathname: '/(client)/intake/confirm',
        params: {
          result: draft.resultJson ?? '{}',
          freeText,
          segmentType,
          round,
          ...(draft.edits ? { draftEdits: JSON.stringify(draft.edits) } : {}),
        },
      };
    case 'follow-up':
      return {
        pathname: '/(client)/intake/follow-up',
        params: {
          result: draft.resultJson ?? '{}',
          freeText,
          segmentType,
          round,
          ...(draft.followUpAnswers
            ? { draftAnswers: JSON.stringify(draft.followUpAnswers) }
            : {}),
          ...(typeof draft.followUpStep === 'number'
            ? { draftStep: String(draft.followUpStep) }
            : {}),
        },
      };
    default:
      return { pathname: '/(client)/intake/segment' };
  }
}

export function stepLabel(step: OneBoxIntakeStep): string {
  switch (step) {
    case 'segment':
      return 'choosing a topic';
    case 'onebox':
      return 'writing your story';
    case 'confirm':
      return 'reviewing details';
    case 'follow-up':
      return 'answering a few questions';
    default:
      return 'intake';
  }
}
