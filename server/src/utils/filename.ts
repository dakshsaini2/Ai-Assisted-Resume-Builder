export function generateResumeFilename(fullName?: string | null, title?: string | null): string {
  const raw = (fullName?.trim() || title?.trim() || 'Resume');

  const normalized = raw.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  let sanitized = normalized
    .replace(/[\x00-\x1f\x7f"';\\/:*?<>|%]/g, '')
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[-_]+|[-_]+$/g, '');

  if (sanitized.length > 80) {
    sanitized = sanitized.slice(0, 80).replace(/[-_]+$/, '');
  }

  if (!sanitized) {
    sanitized = 'Resume';
  }

  if (sanitized.toLowerCase() === 'resume') {
    return 'Resume.pdf';
  }

  if (sanitized.toLowerCase().endsWith('_resume') || sanitized.toLowerCase().endsWith('-resume')) {
    return `${sanitized}.pdf`;
  }

  return `${sanitized}_Resume.pdf`;
}
