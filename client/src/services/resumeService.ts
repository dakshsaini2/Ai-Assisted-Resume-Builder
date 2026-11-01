import { api } from './api';
import type { ApiResponse, Resume, ResumeListItem } from '../types';

/**
 * Extract filename from Content-Disposition header.
 * Supports:
 * - RFC 5987 / UTF-8: filename*=UTF-8''Candidate_Name_Resume.pdf
 * - Quoted standard: filename="Candidate_Name_Resume.pdf"
 * - Unquoted: filename=Candidate_Name_Resume.pdf
 * - Fallback: Resume.pdf
 */
export function extractFilenameFromContentDisposition(header?: string | null): string {
  if (!header) return 'Resume.pdf';

  // 1. Check RFC 5987 / UTF-8 format
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      // Fall through to quoted match if decode fails
    }
  }

  // 2. Standard quoted format
  const quotedMatch = header.match(/filename="([^"]+)"/i);
  if (quotedMatch && quotedMatch[1]) {
    return quotedMatch[1].trim();
  }

  // 3. Unquoted format
  const unquotedMatch = header.match(/filename=([^; ]+)/i);
  if (unquotedMatch && unquotedMatch[1]) {
    return unquotedMatch[1].trim();
  }

  return 'Resume.pdf';
}

/**
 * Download a resume as an A4 PDF document.
 * Triggers native browser download and safely releases the Blob URL.
 * Handles Blob-encoded JSON errors from Axios gracefully.
 */
export async function downloadResumePdf(resumeId: string): Promise<string> {
  try {
    const response = await api.get(`/resumes/${resumeId}/pdf`, {
      responseType: 'blob',
    });

    const disposition =
      response.headers?.['content-disposition'] ||
      (typeof response.headers?.get === 'function' ? response.headers.get('content-disposition') : null);
    const filename = extractFilenameFromContentDisposition(disposition);

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Release temporary blob URL after download triggers
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 200);

    return filename;
  } catch (error: any) {
    // If the server responded with an error, Axios receives a Blob or raw string/buffer when responseType is 'blob'
    if (typeof Blob !== 'undefined' && error.response?.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const parsed = JSON.parse(errorText);
        if (parsed.message) {
          error.message = parsed.message;
        }
      } catch {
        // Fallback to status text or existing message
      }
    } else if (typeof error.response?.data === 'string') {
      try {
        const parsed = JSON.parse(error.response.data);
        if (parsed.message) {
          error.message = parsed.message;
        }
      } catch {
        // Fallback
      }
    } else if (
      typeof ArrayBuffer !== 'undefined' &&
      error.response?.data instanceof ArrayBuffer
    ) {
      try {
        const text = new TextDecoder().decode(error.response.data);
        const parsed = JSON.parse(text);
        if (parsed.message) {
          error.message = parsed.message;
        }
      } catch {
        // Fallback
      }
    } else if (
      typeof (globalThis as any).Buffer !== 'undefined' &&
      typeof (globalThis as any).Buffer.isBuffer === 'function' &&
      (globalThis as any).Buffer.isBuffer(error.response?.data)
    ) {
      try {
        const parsed = JSON.parse(error.response.data.toString('utf-8'));
        if (parsed.message) {
          error.message = parsed.message;
        }
      } catch {
        // Fallback
      }
    } else if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    throw error;
  }
}

export const resumeService = {
  // Get all resumes for current user
  getAll: async (): Promise<ResumeListItem[]> => {
    const res = await api.get<ApiResponse<{ resumes: ResumeListItem[] }>>('/resumes');
    return res.data.data?.resumes || [];
  },

  // Create new resume
  create: async (data: {
    title: string;
    templateId?: 'classic' | 'modern' | 'creative';
    fullName?: string;
    email?: string;
  }): Promise<Resume> => {
    const res = await api.post<ApiResponse<{ resume: Resume }>>('/resumes', data);
    return res.data.data!.resume;
  },

  // Get full resume with all relations
  getById: async (id: string): Promise<Resume> => {
    const res = await api.get<ApiResponse<{ resume: Resume }>>(`/resumes/${id}`);
    return res.data.data!.resume;
  },

  // Update resume and its sections
  update: async (id: string, data: Partial<Resume>): Promise<Resume> => {
    const res = await api.put<ApiResponse<{ resume: Resume }>>(`/resumes/${id}`, data);
    return res.data.data!.resume;
  },

  // Delete resume
  delete: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/resumes/${id}`);
  },

  // Download PDF document
  downloadPdf: downloadResumePdf,
  downloadResumePdf: downloadResumePdf,
};


