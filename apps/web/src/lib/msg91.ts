import { randomInt } from 'node:crypto';

const MSG91_SMS_API = 'https://control.msg91.com/api/v5/flow';

function toMsg91Phone(phone: string) {
  return String(phone).replace(/^\+/, '');
}

export function generateOtpCode() {
  return String(randomInt(100000, 1000000));
}

export async function sendOtpViaMSG91(phone: string, code: string) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    console.warn(`[MSG91] Keys not set — OTP for ${phone} is ${code} (dev only)`);
    return { ok: true as const, skipped: true as const };
  }

  let res: Response;
  try {
    res = await fetch(MSG91_SMS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify({
        template_id: templateId,
        short_url: '1',
        recipients: [{ mobiles: toMsg91Phone(phone), VAR: code }],
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'network error';
    return { ok: false as const, error: `MSG91 network error: ${message}` };
  }

  let data: { type?: string; message?: string } = {};
  try {
    data = (await res.json()) as { type?: string; message?: string };
  } catch {
    // ignore parse failure
  }

  if (!res.ok || data.type === 'error') {
    return { ok: false as const, error: data.message ?? `MSG91 responded with HTTP ${res.status}` };
  }

  return { ok: true as const };
}
