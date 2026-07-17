import { NextResponse } from 'next/server';

import { logError } from '@/lib/logger';

/** Ops diagnostic — YouTube Data API key presence + validity (no secret values returned). */
export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim() ?? '';
  if (!apiKey) {
    return NextResponse.json({
      status: 'error',
      detail: 'YOUTUBE_API_KEY missing or empty on this deployment',
      keyConfigured: false,
      hint: 'Add YOUTUBE_API_KEY in Vercel and redeploy',
    });
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('q', 'calm instrumental grounding pain support');
    url.searchParams.set('maxResults', '3');
    url.searchParams.set('safeSearch', 'strict');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    const body = (await res.json()) as {
      items?: { id?: { videoId?: string }; snippet?: { title?: string } }[];
      error?: { message?: string; errors?: { reason?: string }[] };
    };

    if (!res.ok) {
      return NextResponse.json({
        status: 'error',
        keyConfigured: true,
        keyLength: apiKey.length,
        youtubeStatus: res.status,
        reason: body.error?.errors?.[0]?.reason,
        detail: body.error?.message ?? `YouTube API failed (${res.status})`,
        hint:
          res.status === 400
            ? 'Key invalid — ensure it is an API key (not OAuth) with YouTube Data API v3 enabled and no blocking restrictions'
            : res.status === 403
              ? 'Quota exceeded or API not enabled on the Google Cloud project'
              : undefined,
      });
    }

    const sample = (body.items ?? []).map(item => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
    }));

    return NextResponse.json({
      status: sample.length ? 'ok' : 'error',
      keyConfigured: true,
      keyLength: apiKey.length,
      youtubeStatus: 200,
      resultCount: sample.length,
      detail: sample.length ? 'YouTube resolver ready' : 'Key valid but no results returned',
      sample,
    });
  } catch (err) {
    logError('health_youtube_failed', err);
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
