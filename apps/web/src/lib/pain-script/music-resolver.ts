import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { musicSets, musicTracks } from '@/db/schema';
import type { MusicMoment, MusicPurpose, ResolvedMusicTrack } from '@/lib/holistic-plan-types';
import { log } from '@/lib/logger';

const PURPOSE_TO_TAG: Record<MusicPurpose, string> = {
  grounding: 'reflection',
  activation: 'morning',
  flare: 'flare',
  reflection: 'reflection',
};

/** Evidence-aligned defaults — avoid “Hz / frequency healing” YouTube clusters. */
const PURPOSE_QUERIES: Record<MusicPurpose, string[]> = {
  grounding: [
    'calm ambient instrumental soft piano',
    'gentle acoustic guitar quiet instrumental',
    'slow tempo ambient music no vocals',
  ],
  activation: [
    'gentle uplifting instrumental acoustic',
    'light piano morning instrumental calm',
    'soft hopeful instrumental no vocals',
  ],
  flare: [
    'very soft ambient instrumental quiet',
    'slow breathing music instrumental gentle',
    'calm rain soft piano instrumental',
  ],
  reflection: [
    'reflective piano instrumental calm',
    'evening acoustic instrumental quiet',
    'slow cello piano ambient instrumental',
  ],
};

const BANNED_QUERY_RE =
  /\b(\d{3,4}\s*hz|solfeggio|frequency\s*healing|sound\s*healing|manifestation|chakra\s*healing|miracle\s*heal|dna\s*repair|ascensi[oó]n|binaural\s*beat|isochronic)\b/gi;

const BANNED_TITLE_RE =
  /\b(\d{3,4}\s*hz|solfeggio|frequency|sound\s*healing|healing\s*session|manifest|chakra|miracle|dna\s*repair|ascensi|binaural|isochronic|432\s*hz|528\s*hz|639\s*hz|741\s*hz|852\s*hz|963\s*hz)\b/i;

type YoutubeSearchItem = {
  id?: { videoId?: string };
  snippet?: { title?: string; channelTitle?: string; thumbnails?: { default?: { url?: string } } };
};

export function sanitizeMusicSearchTerms(terms: string[]): string[] {
  const cleaned: string[] = [];
  for (const raw of terms) {
    let stripped = raw.replace(BANNED_QUERY_RE, ' ').replace(/\s+/g, ' ').trim();
    // Drop leftover “healing” tokens after phrase removal (avoids “healing meditation”).
    stripped = stripped.replace(/\bhealing\b/gi, ' ').replace(/\s+/g, ' ').trim();
    if (stripped.length < 3) continue;
    if (BANNED_TITLE_RE.test(stripped)) continue;
    if (/\bheal\b/i.test(stripped)) continue;
    cleaned.push(stripped);
  }
  return cleaned;
}

export function isClinicallyAcceptableMusicTitle(title: string): boolean {
  return !BANNED_TITLE_RE.test(title);
}

function buildSearchQueries(moment: MusicMoment, terms: string[]): string[] {
  const sanitized = sanitizeMusicSearchTerms(terms);
  const purposeDefaults = PURPOSE_QUERIES[moment.purpose] ?? PURPOSE_QUERIES.grounding;
  const mood = moment.mood
    ? sanitizeMusicSearchTerms([moment.mood])[0]
    : undefined;
  const langHint =
    moment.language && moment.language !== 'en' ? moment.language : undefined;

  const primary = sanitized.length
    ? sanitized.map((t) => [t, mood, 'instrumental', 'no vocals', langHint].filter(Boolean).join(' '))
    : purposeDefaults.map((t) => [t, langHint].filter(Boolean).join(' '));

  // Always include one purpose default so we have a safe fallback query.
  return [...primary, purposeDefaults[0]!].slice(0, 4);
}

async function searchYouTube(query: string, maxResults = 8): Promise<ResolvedMusicTrack[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('videoCategoryId', '10'); // Music
  url.searchParams.set('q', query);
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('safeSearch', 'strict');
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    log('music_youtube_search_failed', { status: res.status, query });
    return [];
  }

  const data = (await res.json()) as { items?: YoutubeSearchItem[] };
  const tracks: ResolvedMusicTrack[] = [];

  for (const item of data.items ?? []) {
    const videoId = item.id?.videoId;
    const title = item.snippet?.title ?? 'Track';
    if (!videoId) continue;
    if (!isClinicallyAcceptableMusicTitle(title)) {
      log('music_youtube_filtered_title', { videoId, title });
      continue;
    }
    tracks.push({
      id: randomUUID(),
      provider: 'youtube',
      externalId: videoId,
      title,
      artist: item.snippet?.channelTitle,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: item.snippet?.thumbnails?.default?.url,
    });
  }
  return tracks;
}

async function fallbackFromMusicSets(purpose: MusicPurpose): Promise<ResolvedMusicTrack[]> {
  const db = getDb();
  const tag = PURPOSE_TO_TAG[purpose] ?? 'reflection';
  const rows = await db
    .select()
    .from(musicSets)
    .where(eq(musicSets.purposeTag, tag))
    .limit(1);

  const row = rows[0];
  if (!row?.spotifyUri) return [];

  return [
    {
      id: row.id,
      provider: 'spotify',
      title: row.title,
      url: row.spotifyUri.startsWith('http')
        ? row.spotifyUri
        : `https://open.spotify.com/playlist/${row.spotifyUri.replace('spotify:playlist:', '')}`,
    },
  ];
}

async function persistTracks(tracks: ResolvedMusicTrack[], purpose: MusicPurpose, mood?: string): Promise<string[]> {
  const db = getDb();
  const ids: string[] = [];

  for (const track of tracks) {
    const id = track.id || randomUUID();
    try {
      await db
        .insert(musicTracks)
        .values({
          id,
          provider: track.provider,
          externalId: track.externalId ?? null,
          assetUrl: track.url,
          title: track.title,
          artist: track.artist ?? null,
          purpose,
          mood: mood ?? null,
          language: null,
          durationSec: track.durationSec ?? null,
          approvedBy: null,
          createdAt: new Date(),
        })
        .onConflictDoNothing();
    } catch {
      /* table may not exist in dev — still return ids */
    }
    ids.push(id);
  }
  return ids;
}

/** §7A M1 — resolve searchTerms to real playable tracks. */
export async function resolveMusicMoment(moment: MusicMoment): Promise<MusicMoment> {
  if (moment.resolvedTracks?.length) {
    const filtered = moment.resolvedTracks.filter((t) => isClinicallyAcceptableMusicTitle(t.title));
    if (filtered.length) return { ...moment, resolvedTracks: filtered };
  }

  const terms = moment.searchTerms?.length
    ? moment.searchTerms
    : moment.playlist?.spotifySearchQuery
      ? [moment.playlist.spotifySearchQuery]
      : [];

  const sanitizedTerms = sanitizeMusicSearchTerms(terms);
  const queries = buildSearchQueries(moment, sanitizedTerms.length ? sanitizedTerms : terms);

  let tracks: ResolvedMusicTrack[] = [];
  for (const query of queries) {
    tracks = await searchYouTube(query);
    if (tracks.length) break;
  }

  // Cap client-facing list to top 3 acceptable tracks.
  tracks = tracks.slice(0, 3);

  if (!tracks.length) {
    tracks = await fallbackFromMusicSets(moment.purpose);
  }

  if (!tracks.length) {
    return {
      ...moment,
      playlist: undefined,
      searchTerms: sanitizedTerms.length ? sanitizedTerms : queries.slice(0, 1),
    };
  }

  const resolvedTrackIds = await persistTracks(tracks, moment.purpose, moment.mood);

  return {
    ...moment,
    searchTerms: sanitizedTerms.length ? sanitizedTerms : queries.slice(0, 1),
    resolvedTracks: tracks,
    resolvedTrackIds,
    playlist: undefined,
  };
}
