export function spotifyOpenUrl(uriOrUrl: string): string {
  const trimmed = uriOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('spotify:')) {
    const path = trimmed.replace('spotify:', '').replace(/\//g, ':');
    const [type, id] = path.split(':');
    if (type && id) {
      return `https://open.spotify.com/${type}/${id}`;
    }
  }
  return `https://open.spotify.com/search/${encodeURIComponent(trimmed)}`;
}

export function spotifySearchUrl(query: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}
