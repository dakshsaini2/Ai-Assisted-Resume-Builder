/**
 * Utilities for formatting resume text, dates, and bullet points
 */

/**
 * Format a start and end date range cleanly without dangling hyphens.
 */
export function formatDateRange(
  startDate?: string | null,
  endDate?: string | null,
  current?: boolean
): string {
  const start = startDate?.trim();
  const end = current ? 'Present' : endDate?.trim();

  if (start && end) {
    return `${start} – ${end}`;
  }
  if (start) {
    return start;
  }
  if (end) {
    return end;
  }
  return '';
}

/**
 * Parse multiline descriptions into an array of clean bullet points.
 * Handles existing bullet symbols (•, -, *, •) and splits by line.
 */
export function parseBulletPoints(text?: string | null): string[] {
  if (!text || !text.trim()) return [];

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^([•\-\*–—\u2022\u25E6\u25AA]\s*)+/, '').trim())
    .filter((line) => line.length > 0);
}

/**
 * Clean up web URLs for display by removing protocols and trailing slashes.
 */
export function formatUrlForDisplay(url?: string | null): string {
  if (!url) return '';
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}
