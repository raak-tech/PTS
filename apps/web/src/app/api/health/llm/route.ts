import { NextResponse } from 'next/server';

import { logError } from '@/lib/logger';

/** Ops diagnostic — key presence + OpenRouter auth (no secret values returned). */
export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim() ?? '';
  if (!apiKey) {
    return NextResponse.json({
      status: 'error',
      detail: 'OPENROUTER_API_KEY missing or empty on this deployment',
      keyConfigured: false,
    });
  }

  try {
    const authRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!authRes.ok) {
      const body = await authRes.text();
      return NextResponse.json({
        status: 'error',
        detail: `OpenRouter auth failed (${authRes.status})`,
        keyConfigured: true,
        keyLength: apiKey.length,
        openRouterStatus: authRes.status,
        hint: authRes.status === 401 ? 'Key invalid or revoked — update OPENROUTER_API_KEY in Vercel' : undefined,
        bodyPreview: body.slice(0, 200),
      });
    }

    const probeRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pts-web-pied.vercel.app',
        'X-Title': 'PTS Health Check',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.6',
        messages: [{ role: 'user', content: 'ok' }],
        max_tokens: 2,
      }),
    });

    return NextResponse.json({
      status: probeRes.ok ? 'ok' : 'error',
      keyConfigured: true,
      keyLength: apiKey.length,
      openRouterAuth: 'ok',
      intakeModel: 'anthropic/claude-sonnet-4.6',
      intakeModelStatus: probeRes.status,
      detail: probeRes.ok
        ? 'LLM ready'
        : `Intake model probe failed (${probeRes.status})`,
    });
  } catch (err) {
    logError('health_llm_failed', err);
    return NextResponse.json(
      {
        status: 'error',
        detail: 'probe_request_failed',
        keyConfigured: true,
        keyLength: apiKey.length,
      },
      { status: 503 },
    );
  }
}
