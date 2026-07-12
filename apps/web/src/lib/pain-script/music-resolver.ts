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

type YoutubeSearchItem = {
  id?: { videoId?: string };
  snippet?: { title?: string; channelTitle?: string; thumbnails?: { default?: { url?: string } } };
};

async function searchYouTube(query: string, maxResults = 3): Promise<ResolvedMusicTrack[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
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
    if (!videoId) continue;
    tracks.push({
      id: randomUUID(),
      provider: 'youtube',
      externalId: videoId,
      title: item.snippet?.title ?? 'Track',
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
  if (moment.resolvedTracks?.length) return moment;

  const terms = moment.searchTerms?.length
    ? moment.searchTerms
    : moment.playlist?.spotifySearchQuery
      ? [moment.playlist.spotifySearchQuery]
      : [`${moment.purpose} calm instrumental pain support`];

  const query = [...terms, moment.mood, moment.language].filter(Boolean).join(' ');
  let tracks = await searchYouTube(query);

  if (!tracks.length) {
    tracks = await fallbackFromMusicSets(moment.purpose);
  }

  if (!tracks.length) {
    return {
      ...moment,
      playlist: undefined,
      searchTerms: terms,
    };
  }

  const resolvedTrackIds = await persistTracks(tracks, moment.purpose, moment.mood);

  return {
    ...moment,
    searchTerms: terms,
    resolvedTracks: tracks,
    resolvedTrackIds,
    playlist: undefined,
  };
}
