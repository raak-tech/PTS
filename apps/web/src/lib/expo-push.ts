// Expo Push Notification service wrapper.
// Uses the Expo Push API (https://exp.host/--/api/v2/push/send) — no server key required.
// Tokens look like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxxxx]

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export type PushMessage = {
  to: string;           // ExponentPushToken[...]
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
};

export type PushTicket = {
  status: 'ok' | 'error';
  id?: string;          // ticket ID when status=ok
  message?: string;
  details?: { error?: string };
};

export async function sendExpoPush(messages: PushMessage[]): Promise<PushTicket[]> {
  if (messages.length === 0) return [];

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify(messages),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[expo-push] HTTP error', res.status, text);
    return messages.map(() => ({ status: 'error' as const, message: `http-${res.status}` }));
  }

  const json = await res.json() as { data: PushTicket[] };
  return json.data;
}

export async function sendPushToUser(
  expoPushToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<{ ok: boolean; ticketId?: string }> {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
    console.log('[expo-push] No valid token for push, skipping');
    return { ok: false };
  }

  try {
    const [ticket] = await sendExpoPush([{
      to: expoPushToken,
      title,
      body,
      data,
      sound: 'default',
    }]);

    if (ticket?.status === 'ok') {
      console.log('[expo-push] Sent successfully, ticketId:', ticket.id);
      return { ok: true, ticketId: ticket.id };
    }

    console.error('[expo-push] Send failed:', ticket?.message);
    return { ok: false };
  } catch (err) {
    console.error('[expo-push] Exception:', err);
    return { ok: false };
  }
}
