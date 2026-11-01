/**
 * Sanitize and format a safe download filename for a resume PDF.
 *
 * Expected format: Candidate_Name_Resume.pdf
 * Safe fallback:   Resume.pdf
 *
 * Security & Sanitization Requirements:
 * - Normalize Unicode accents (NFKD decomposition: 'é' -> 'e', 'ü' -> 'u').
 * - Strip all ASCII control characters (0x00-0x1F, 0x7F), quotes, semicolons, path separators, and percent signs.
 * - Replace non-alphanumeric characters with single underscores.
 * - Guard against empty results after length truncation.
 * - Avoid duplicating '_Resume' or '-Resume' suffixes.
 */
export function generateResumeFilename(fullName?: string | null, title?: string | null): string {
  const raw = (fullName?.trim() || title?.trim() || 'Resume');

  // 1. Normalize Unicode accents (NFKD decomposes e.g. 'é' into 'e' + combining mark)
  const normalized = raw.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  // 2. Strip all control characters (including CR, LF, null byte), quotes, semicolons, path chars, and percent
  let sanitized = normalized
    .replace(/[\x00-\x1f\x7f"';\\/:*?<>|%]/g, '')
    // Replace non-alphanumeric (except dashes and underscores) with underscores
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    // Collapse multiple consecutive underscores
    .replace(/_+/g, '_')
    // Trim leading/trailing dashes and underscores
    .replace(/^[-_]+|[-_]+$/g, '');

  // 3. Length cap to prevent HTTP header buffer overflow (max 80 chars)
  if (sanitized.length > 80) {
    sanitized = sanitized.slice(0, 80).replace(/[-_]+$/, '');
  }

  // 4. Guard against empty result after sanitization and truncation
  if (!sanitized) {
    sanitized = 'Resume';
  }

  // 5. If sanitized is just "Resume", return "Resume.pdf"
  if (sanitized.toLowerCase() === 'resume') {
    return 'Resume.pdf';
  }

  // 6. Avoid appending duplicate '_Resume' or '-Resume' suffix (case-insensitive)
  if (sanitized.toLowerCase().endsWith('_resume') || sanitized.toLowerCase().endsWith('-resume')) {
    return `${sanitized}.pdf`;
  }

  return `${sanitized}_Resume.pdf`;
}


