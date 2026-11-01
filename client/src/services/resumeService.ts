import { api } from './api';
import type { ApiResponse, Resume, ResumeListItem } from '../types';

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
};

