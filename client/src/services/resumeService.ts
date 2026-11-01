import { api, unauthenticatedApi, getApiBaseUrl } from './api';
import type { ApiResponse, Resume, ResumeListItem } from '../types';

export function extractFilenameFromContentDisposition(header?: string | null): string {
  if (!header) return 'Resume.pdf';

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
    }
  }

  const quotedMatch = header.match(/filename="([^"]+)"/i);
  if (quotedMatch && quotedMatch[1]) {
    return quotedMatch[1].trim();
  }

  const unquotedMatch = header.match(/filename=([^; ]+)/i);
  if (unquotedMatch && unquotedMatch[1]) {
    return unquotedMatch[1].trim();
  }

  return 'Resume.pdf';
}

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

    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 200);

    return filename;
  } catch (error: any) {
    if (typeof Blob !== 'undefined' && error.response?.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const parsed = JSON.parse(errorText);
        if (parsed.message) {
          error.message = parsed.message;
        }
      } catch {
      }
    } else if (typeof error.response?.data === 'string') {
      try {
        const parsed = JSON.parse(error.response.data);
        if (parsed.message) {
          error.message = parsed.message;
        }
      } catch {
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
      }
    } else if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    throw error;
  }
}

export const resumeService = {
  getAll: async (): Promise<ResumeListItem[]> => {
    const res = await api.get<ApiResponse<{ resumes: ResumeListItem[] }>>('/resumes');
    return res.data.data?.resumes || [];
  },

  create: async (data: {
    title: string;
    templateId?: 'classic' | 'modern' | 'creative';
    fullName?: string;
    email?: string;
  }): Promise<Resume> => {
    const res = await api.post<ApiResponse<{ resume: Resume }>>('/resumes', data);
    return res.data.data!.resume;
  },

  getById: async (id: string): Promise<Resume> => {
    const res = await api.get<ApiResponse<{ resume: Resume }>>(`/resumes/${id}`);
    return res.data.data!.resume;
  },

  update: async (id: string, data: Partial<Resume>): Promise<Resume> => {
    const res = await api.put<ApiResponse<{ resume: Resume }>>(`/resumes/${id}`, data);
    return res.data.data!.resume;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/resumes/${id}`);
  },

  downloadPdf: downloadResumePdf,
  downloadResumePdf: downloadResumePdf,
  getRenderData: getResumeRenderData,
};

export async function getResumeRenderData(
  resumeId: string,
  exportToken: string,
  customBaseUrl?: string
): Promise<Resume> {
  if (!resumeId || typeof resumeId !== 'string' || resumeId.trim() === '') {
    throw new Error('Missing or invalid resume ID.');
  }
  if (!exportToken || typeof exportToken !== 'string' || exportToken.trim() === '') {
    throw new Error('Missing or invalid export token.');
  }

  const baseUrl = getApiBaseUrl(customBaseUrl);

  const response = await unauthenticatedApi.get<ApiResponse<{ resume: Resume }>>(
    `/resumes/${encodeURIComponent(resumeId.trim())}/render-data`,
    {
      baseURL: baseUrl,
      params: { token: exportToken.trim() },
    }
  );

  const resume = response.data?.data?.resume;
  if (!resume) {
    throw new Error('Resume data not found in response.');
  }

  return resume;
}


