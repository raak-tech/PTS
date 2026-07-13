import { API_URL } from '@/config';
import { intakeToApiPayload, type IntakeFormData } from '@/lib/intake';
import type { SessionUser } from '@/types';

const REQUEST_TIMEOUT_MS = 12_000;

type ApiError = { error: string };

export type PlanRow = {
  id: string;
  userId: string;
  status: string;
  generatedContent: string;
  counselorNotes: string | null;
  createdAt: string;
};

export type MessageRow = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type GeneratedPlan = {
  overview: string;
  clientSummary: string;
  formulationSummary?: string;
  weeks: {
    week: number;
    theme: string;
    focus: string;
    personalizationBasis?: string;
    dailyPractices: { title: string; description: string; duration: string }[];
    weeklyReflection: string;
    counselorNote: string;
    ayurvedaBlock?: {
      dietaryGuidance?: string;
      foodsToFavour?: string[];
      foodsToAvoid?: string[];
      rhythmNote: string;
      disclaimer?: string;
      practices?: string[];
    };
    yogicPractice?: {
      breathingTechnique: { title: string; description: string; duration: string };
      meditation: { title: string; description: string; duration: string };
      philosophicalFraming: string;
      disclaimer: string;
    };
    yogaTrial?: {
      principle: string;
      applicability: string;
      microMovement?: { title: string; description: string; duration: string };
      disclaimer: string;
    };
    reinforcementTemplate?: { title: string; bodyText: string };
    reinforcementTemplates?: { title: string; bodyText: string }[];
    musicMoment?: {
      purpose: string;
      suggestion: string;
      mood?: string;
      searchTerms?: string[];
      resolvedTracks?: { title: string; artist?: string; url: string }[];
      playlist?: {
        title: string;
        description: string;
        tracks: { title: string; artist: string; note: string }[];
        spotifySearchQuery: string;
      };
    };
  }[];
  keyThemes: string[];
  watchPoints: string[];
};

export type CalendarBlock = {
  id: string;
  type: 'practice' | 'reinforcement' | 'rest' | 'work_break' | 'music' | 'custom';
  label: string;
  plannedTime?: string;
  status: 'planned' | 'done' | 'partial' | 'skipped';
};

export type TodayReinforcement = {
  id: string;
  title: string;
  bodyText: string;
  counselorAudioUrl: string | null;
  planWeek: number | null;
  respondedToday: boolean;
  todayResponse?: {
    responseType: 'text' | 'voice';
    bodyText: string | null;
    audioUrl: string | null;
  } | null;
};

export type CounselorShareCategory = 'update' | 'question' | 'win';

async function fetchWithTimeout(input: string, init?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const data: unknown = await res.json();
  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as ApiError).error === 'string'
        ? (data as ApiError).error
        : `http-${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function apiCheckPhone(phone: string) {
  return parseJson<{ exists: boolean; role: string | null }>(
    await fetchWithTimeout(`${API_URL}/api/auth/check-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }),
  );
}

export async function apiSendOtp(phone: string, dataStorageConsent: boolean) {
  return parseJson<{ sent: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, dataStorageConsent }),
    }),
  );
}

export async function apiVerifyOtp(phone: string, code: string, dataStorageConsent?: boolean) {
  return parseJson<{ token: string; user: SessionUser }>(
    await fetchWithTimeout(`${API_URL}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, dataStorageConsent }),
    }),
  );
}

export async function apiGetClientSchedule(token: string) {
  return parseJson<{ scheduleRequired: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/client/schedule`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiSaveArtifact(
  token: string,
  payload: { title: string; bodyText: string; kind?: 'intake' | 'plan' | 'daily' | 'check-in' | 'counselor-share'; date?: string },
) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/support/artifacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: payload.kind ?? 'daily',
        title: payload.title,
        bodyText: payload.bodyText,
        date: payload.date,
      }),
    }),
  );
}

export async function apiGetDailyNote(token: string, date?: string) {
  const q = date ? `?date=${encodeURIComponent(date)}&kind=daily` : '?kind=daily';
  return parseJson<{ ok: boolean; artifact: { id: string; title: string; bodyText: string } | null }>(
    await fetchWithTimeout(`${API_URL}/api/support/artifacts${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiShareWithCounselor(
  token: string,
  payload: { category: CounselorShareCategory; bodyText: string },
) {
  return parseJson<{ ok: boolean; id: string }>(
    await fetchWithTimeout(`${API_URL}/api/support/artifacts`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        kind: 'counselor-share',
        title: payload.category,
        bodyText: payload.bodyText,
      }),
    }),
  );
}

export async function apiGetScheduleFeedback(token: string, date?: string) {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  return parseJson<{
    ok: boolean;
    feedback: { workedText: string | null; didntWorkText: string | null } | null;
  }>(
    await fetchWithTimeout(`${API_URL}/api/daily/feedback${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiGetSession(token: string) {
  return parseJson<{ user: SessionUser }>(
    await fetchWithTimeout(`${API_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

/** APK B: assign pain_script cohort on first login when build flag is set. */
export async function apiAssignPilotCohort(token: string) {
  return parseJson<{ ok: boolean; pilotCohort: 'legacy' | 'pain_script' }>(
    await fetchWithTimeout(`${API_URL}/api/me/cohort`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiLogout(token: string) {
  await fetchWithTimeout(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiSubmitIntake(token: string, data: IntakeFormData) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/intake`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(intakeToApiPayload(data)),
    }),
  );
}

export async function apiGetPlan(token: string, userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return parseJson<{ ok: boolean; plan: PlanRow | null }>(
    await fetchWithTimeout(`${API_URL}/api/plans${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiApprovePlan(
  token: string,
  planId: string,
  counselorNotes?: string,
  holisticVisibility?: { ayurveda: boolean; yoga: boolean; music: boolean },
) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/plans`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        planId,
        action: 'approve',
        counselorNotes,
        holisticVisibility,
      }),
    }),
  );
}

export async function apiRegeneratePlan(token: string, planId: string) {
  return parseJson<{ ok: boolean; status: string; planId?: string }>(
    await fetchWithTimeout(
      `${API_URL}/api/plans`,
      {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ planId, action: 'regenerate' }),
      },
      320_000,
    ),
  );
}

// Approve a single week — releases it to the client immediately.
export async function apiApproveWeek(token: string, planId: string, weekNumber: number) {
  return parseJson<{ ok: boolean; approvedWeeks: number }>(
    await fetchWithTimeout(`${API_URL}/api/provider/plans/${planId}/week/${weekNumber}`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({}),
    }),
  );
}

export async function apiGetProviderQueue(token: string) {
  return parseJson<{
    ok: boolean;
    pendingPlans: {
      id: string;
      clientId: string;
      clientName: string;
      createdAt: string;
      counselorNotes: string | null;
      intake: {
        painSource: string;
        painDescription: string;
        recoveryGoal: string;
        hasRedFlags: boolean;
        isSafe: boolean;
      } | null;
      generatedContent: string;
    }[];
    unreadMessages: { clientId: string; clientName: string; count: number }[];
    clients: { id: string; name: string; planStatus: string; hasRedFlag: boolean; unreadCount: number }[];
    redFlags: number;
  }>(await fetchWithTimeout(`${API_URL}/api/provider/queue`, { headers: { Authorization: `Bearer ${token}` } }));
}

export async function apiGetContacts(token: string) {
  return parseJson<{
    ok: boolean;
    counselor?: { id: string; name: string; unreadCount: number; calendlyUrl?: string | null } | null;
    clients?: { id: string; name: string; planStatus: string; unreadCount: number }[];
  }>(await fetchWithTimeout(`${API_URL}/api/me/contacts`, { headers: { Authorization: `Bearer ${token}` } }));
}

export async function apiGetMessages(token: string, withUserId: string) {
  return parseJson<{ ok: boolean; messages: MessageRow[] }>(
    await fetchWithTimeout(`${API_URL}/api/messages?with=${encodeURIComponent(withUserId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiSendMessage(token: string, toUserId: string, body: string) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ toUserId, body }),
    }),
  );
}

export async function apiGetUnreadCount(token: string) {
  return parseJson<{ ok: boolean; total: number; counts: Record<string, number> }>(
    await fetchWithTimeout(`${API_URL}/api/messages/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export function parseGeneratedPlan(raw: string): GeneratedPlan | null {
  try {
    return JSON.parse(raw) as GeneratedPlan;
  } catch {
    return null;
  }
}

function localDateIso(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function apiGetTodayReinforcement(token: string) {
  return parseJson<{
    ok: boolean;
    today: TodayReinforcement | null;
    todayReadouts?: TodayReinforcement[];
  }>(
    await fetchWithTimeout(`${API_URL}/api/reinforcements?date=${localDateIso()}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiSubmitReinforcementResponse(
  token: string,
  reinforcementId: string,
  bodyText: string,
) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/reinforcements/${reinforcementId}/responses`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ responseType: 'text', bodyText }),
    }),
  );
}

export async function apiSubmitVoiceReinforcementResponse(
  token: string,
  reinforcementId: string,
  audioBase64: string,
) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(
      `${API_URL}/api/reinforcements/${reinforcementId}/responses`,
      {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ responseType: 'voice', audioBase64 }),
      },
      60_000,
    ),
  );
}

export async function apiGetDailyCalendar(token: string, date?: string) {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  return parseJson<{ ok: boolean; date: string; blocks: CalendarBlock[] }>(
    await fetchWithTimeout(`${API_URL}/api/daily/calendar${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiSaveDailyCalendar(token: string, blocks: CalendarBlock[], date?: string) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/daily/calendar`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ date: date ?? localDateIso(), blocks }),
    }),
  );
}

export async function apiSubmitScheduleFeedback(
  token: string,
  workedText: string,
  didntWorkText: string,
) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/daily/feedback`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ workedText, didntWorkText, date: localDateIso() }),
    }),
  );
}

export async function apiRegenerateWeek(token: string, clientId: string, weekNumber: number) {
  const res = await fetchWithTimeout(
    `${API_URL}/api/provider/clients/${clientId}/regenerate-week`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ weekNumber }),
    },
    320_000,
  );
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    detail?: string;
    weekNumber?: number;
    weekDraft?: GeneratedPlan['weeks'][number];
    suggestions?: string[];
  };
  if (!res.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : data.error ?? `http-${res.status}`,
    );
  }
  return data as {
    ok: boolean;
    weekNumber: number;
    weekDraft: GeneratedPlan['weeks'][number];
    suggestions: string[];
  };
}

export async function apiGetProviderClientMeta(token: string, clientId: string) {
  return parseJson<{
    ok: boolean;
    planId: string | null;
    weekStatuses: Record<number, 'draft' | 'edited' | 'approved'>;
    clientUpdates: { id: string; title: string; bodyText: string; createdAt: string }[];
  }>(
    await fetchWithTimeout(`${API_URL}/api/provider/clients/${clientId}/plan-meta`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiSaveWeekComment(
  token: string,
  planId: string,
  weekNumber: number,
  counselorWeekComment: string,
) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/provider/plans/${planId}/week/${weekNumber}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ counselorWeekComment }),
    }),
  );
}

export async function apiApplyWeek(
  token: string,
  clientId: string,
  week: GeneratedPlan['weeks'][number],
) {
  return parseJson<{ ok: boolean; weekNumber: number }>(
    await fetchWithTimeout(`${API_URL}/api/provider/clients/${clientId}/apply-week`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ week }),
    }),
  );
}

export async function apiCreateReinforcement(
  token: string,
  payload: {
    clientId: string;
    title: string;
    bodyText: string;
    planWeek?: number;
    counselorAudioBase64?: string;
    counselorAudioMime?: string;
  },
) {
  return parseJson<{ ok: boolean; id: string; updated?: boolean }>(
    await fetchWithTimeout(
      `${API_URL}/api/reinforcements`,
      {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      },
      60_000,
    ),
  );
}

export async function apiUpdateReinforcement(
  token: string,
  reinforcementId: string,
  payload: {
    title?: string;
    bodyText?: string;
    counselorAudioBase64?: string;
    counselorAudioMime?: string;
    clearCounselorAudio?: boolean;
  },
) {
  return parseJson<{ ok: boolean; hasCounselorAudio: boolean }>(
    await fetchWithTimeout(
      `${API_URL}/api/reinforcements/${reinforcementId}`,
      {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      },
      60_000,
    ),
  );
}

export async function apiDeleteReinforcement(token: string, reinforcementId: string) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/reinforcements/${reinforcementId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),
  );
}

export async function apiGetClientReinforcements(token: string, clientId: string) {
  return parseJson<{
    ok: boolean;
    reinforcements: {
      id: string;
      title: string;
      bodyText: string;
      isActive?: boolean;
      hasCounselorAudio?: boolean;
      latestResponse?: {
        responseType: 'text' | 'voice' | string;
        bodyText: string | null;
        audioUrl: string | null;
        submittedAt: string;
      } | null;
    }[];
  }>(
    await fetchWithTimeout(`${API_URL}/api/reinforcements?clientId=${encodeURIComponent(clientId)}`, {
      headers: authHeaders(token),
    }),
  );
}

export async function apiGetPendingIntakes(token: string) {
  return parseJson<{
    ok: boolean;
    pendingIntakes: {
      userId: string;
      anonEmail: string;
      painSource: string;
      submittedAt: string;
      hasRedFlags: boolean;
      isSafe: boolean;
    }[];
  }>(await fetchWithTimeout(`${API_URL}/api/provider/pending-intakes`, { headers: { Authorization: `Bearer ${token}` } }));
}

export async function apiGeneratePlan(token: string, userId: string) {
  return parseJson<{
    ok: boolean;
    reason?: string;
    planId?: string;
  }>(
    await fetchWithTimeout(`${API_URL}/api/provider/generate-plan`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    }),
  );
}

export async function apiGetProviderEngagement(token: string) {
  return parseJson<{
    ok: boolean;
    date: string;
    clients: {
      clientId: string;
      name: string;
      reinforcementTitle: string | null;
      reinforcementRecordedToday: boolean;
      calendarBlocksTotal: number;
      calendarBlocksDone: number;
      holisticDone?: number;
      holisticTotal?: number;
      needsAttention: boolean;
    }[];
  }>(await fetchWithTimeout(`${API_URL}/api/provider/engagement`, { headers: { Authorization: `Bearer ${token}` } }));
}

export async function apiGetWeeklySummary(token: string, clientId: string) {
  return parseJson<{
    ok: boolean;
    summary: {
      weekStart: string;
      weekEnd: string;
      reinforcementResponses: number;
      calendarDaysPlanned: number;
      blocksCompleted: number;
      blocksSkipped: number;
      scheduleInsights: string[];
      painTrend: string | null;
      morningCheckIns: { dateIso: string; painLevel: number; sleepQuality: string; intention: string | null }[];
      readOutSummaries: string[];
      eveningReflectionSamples: string[];
      clientShares: string[];
      latestWeeklyCheckIn: string | null;
      holisticCompletions?: { activityType: string; count: number }[];
      practiceFeelingSamples?: string[];
    };
  }>(
    await fetchWithTimeout(`${API_URL}/api/provider/clients/${clientId}/weekly-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export type HolisticActivityType = 'ayurveda' | 'yoga' | 'music' | 'practice';

export type HolisticCompletionEntry = {
  activityType: HolisticActivityType;
  weekNumber: number;
  notes: string | null;
  completedAt: string;
};

export async function apiGetHolisticCompletions(token: string, date?: string, clientId?: string) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (clientId) params.set('clientId', clientId);
  const q = params.toString() ? `?${params.toString()}` : '';
  return parseJson<{
    ok: boolean;
    date: string;
    completed: Record<HolisticActivityType, boolean>;
    entries: HolisticCompletionEntry[];
  }>(await fetchWithTimeout(`${API_URL}/api/holistic/completions${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  }));
}

export async function apiMarkHolisticComplete(
  token: string,
  activityType: HolisticActivityType,
  weekNumber: number,
  notes?: string,
) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/holistic/completions`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ activityType, weekNumber, ...(notes !== undefined ? { notes } : {}) }),
    }),
  );
}

export function spotifySearchUrl(query: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

export function spotifyOpenUrl(uriOrUrl: string): string {
  const trimmed = uriOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('spotify:')) {
    const path = trimmed.replace('spotify:', '').replace(/\//g, ':');
    const [type, id] = path.split(':');
    if (type && id) return `https://open.spotify.com/${type}/${id}`;
  }
  return spotifySearchUrl(trimmed);
}

export async function apiGetMusicSets() {
  return parseJson<{
    ok: boolean;
    sets: Array<{
      id: string;
      title: string;
      purposeTag: string;
      spotifyUri: string | null;
      description: string | null;
    }>;
  }>(await fetchWithTimeout(`${API_URL}/api/music/sets`));
}

export async function apiGetWeeklyCheckIn(token: string, weekNumber: number) {
  return parseJson<{
    ok: boolean;
    prompts: Array<{ id: string; question: string }>;
    checkIn: {
      weekNumber: number;
      weekStartIso: string;
      answers: { q1: string; q2: string; q3: string };
      submittedAt: string;
    } | null;
  }>(
    await fetchWithTimeout(`${API_URL}/api/check-ins/weekly?weekNumber=${weekNumber}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiSubmitWeeklyCheckIn(
  token: string,
  weekNumber: number,
  weekStartIso: string,
  answers: { q1: string; q2: string; q3: string },
) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/check-ins/weekly`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ weekNumber, weekStartIso, answers }),
    }),
  );
}

export async function apiGetEveningReflection(token: string, date?: string) {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  return parseJson<{
    ok: boolean;
    reflection: { bodyText: string; submittedAt: string } | null;
  }>(
    await fetchWithTimeout(`${API_URL}/api/daily/reflection${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiSubmitEveningReflection(token: string, bodyText: string, date?: string) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/daily/reflection`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ bodyText, date }),
    }),
  );
}

export async function apiGetDailyCheckIn(token: string, date?: string) {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  return parseJson<{
    ok: boolean;
    checkIn: {
      painLevel: number;
      sleepQuality: string;
      intention: string;
      submittedAt: string;
    } | null;
  }>(
    await fetchWithTimeout(`${API_URL}/api/check-ins/daily${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiSubmitDailyCheckIn(
  token: string,
  painLevel: number,
  sleepQuality: 'poor' | 'ok' | 'good',
  intention: string,
  date?: string,
) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/check-ins/daily`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ painLevel, sleepQuality, intention, date: date ?? localDateIso() }),
    }),
  );
}

export async function apiRegisterPushToken(token: string, expoPushToken: string) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/notifications/register-token`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ expoPushToken }),
    }),
  );
}

export async function apiGetMonthlyCheckIn(token: string) {
  return parseJson<{
    ok: boolean;
    checkIn: {
      yearMonth: string;
      painLevel: number;
      sleepQuality: string;
      intention: string;
      submittedAt: string;
    } | null;
  }>(
    await fetchWithTimeout(`${API_URL}/api/check-ins/monthly`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiSubmitMonthlyCheckIn(
  token: string,
  painLevel: number,
  sleepQuality: 'poor' | 'ok' | 'good',
  intention: string,
) {
  return parseJson<{ ok: boolean }>(
    await fetchWithTimeout(`${API_URL}/api/check-ins/monthly`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ painLevel, sleepQuality, intention }),
    }),
  );
}

export type FlareSupportMessage = {
  opening: string;
  intervention: string;
  readOut?: string;
  safety: string;
};

export async function apiSubmitFlare(
  token: string,
  opts: { painLevel?: number; triggerText?: string },
) {
  return parseJson<{
    ok: boolean;
    flareId: string;
    safetyConcern: boolean;
    severity: string;
    message: FlareSupportMessage;
  }>(
    await fetchWithTimeout(`${API_URL}/api/flares`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(opts),
    }),
  );
}

export type ClientProfileField = {
  key: string;
  label: string;
  value: string | null;
  sensitive: boolean;
  consentScope: 'medical' | null;
  editable: boolean;
  lockedReason?: string;
};

export type ClientProfileView = {
  fields: ClientProfileField[];
  completeness: number;
  completenessLabel: string;
  pendingFieldRequests: {
    id: string;
    fieldKey: string;
    fieldLabel: string;
    prompt: string;
    status: string;
    createdAt: string;
  }[];
  consentGrants: { scope: 'medical'; granted: boolean; grantedAt: string | null }[];
  microPrompt: { fieldKey: string; label: string; prompt: string } | null;
};

export async function apiGetClientProfile(token: string) {
  return parseJson<{ ok: boolean; profile: ClientProfileView }>(
    await fetchWithTimeout(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function apiUpdateClientProfile(token: string, patch: Record<string, string | null>) {
  return parseJson<{ ok: boolean; profile: ClientProfileView }>(
    await fetchWithTimeout(`${API_URL}/api/profile`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(patch),
    }),
  );
}

export async function apiSetProfileConsent(token: string, scope: 'medical', granted: boolean) {
  return parseJson<{ ok: boolean; consentGrants: ClientProfileView['consentGrants'] }>(
    await fetchWithTimeout(`${API_URL}/api/profile/consent`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ scope, granted }),
    }),
  );
}

export async function apiAnswerProfileFieldRequest(token: string, requestId: string, value: string) {
  return parseJson<{ ok: boolean; profile: ClientProfileView }>(
    await fetchWithTimeout(`${API_URL}/api/profile/field-requests`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ requestId, value }),
    }),
  );
}
