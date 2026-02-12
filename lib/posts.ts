/**
 * Parse media_url from DB into array of URLs.
 * Supports: null, single URL string, or JSON array string.
 */
export function parseMediaUrls(mediaUrl: string | null): string[] {
  if (!mediaUrl || !mediaUrl.trim()) return [];
  const s = mediaUrl.trim();
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s) as unknown;
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [s];
    } catch {
      return [s];
    }
  }
  return [s];
}

/**
 * Format client media_urls array for DB storage (single column).
 */
export function formatMediaUrlForDb(mediaUrls: string[] | null | undefined): string | null {
  if (!mediaUrls || mediaUrls.length === 0) return null;
  if (mediaUrls.length === 1) return mediaUrls[0];
  return JSON.stringify(mediaUrls);
}
