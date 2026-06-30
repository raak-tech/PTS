export function resolveCounselorAudioUrl(opts: {
  counselorAudioUrl?: string;
  counselorAudioBase64?: string;
  counselorAudioMime?: string;
  clearCounselorAudio?: boolean;
  existing?: string | null;
}): string | null {
  if (opts.clearCounselorAudio) return null;
  if (opts.counselorAudioUrl) return opts.counselorAudioUrl;
  if (opts.counselorAudioBase64) {
    const mime = opts.counselorAudioMime ?? 'audio/mp4';
    return `data:${mime};base64,${opts.counselorAudioBase64}`;
  }
  return opts.existing ?? null;
}

export function counselorAudioAttached(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}
