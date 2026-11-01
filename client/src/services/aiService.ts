import axios from 'axios';
import { api } from './api';
import type {
  ApiResponse,
  GenerateSummaryPreferences,
  SummaryResponseData,
  ImproveContentOptions,
  ImproveResponseData,
  ResumeAnalysisRecord,
  JobMatchInputPayload,
  JobMatchRecord,
  GenerateCoverLetterPayload,
  GeneratedCoverLetterDraft,
  SaveCoverLetterPayload,
  UpdateCoverLetterPayload,
  CoverLetterRecord,
  ListCoverLettersResponse,
} from '../types';

export const AI_CONSENT_KEY = 'ai_privacy_consent_accepted';

export function hasAiPrivacyConsent(): boolean {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      return localStorage.getItem(AI_CONSENT_KEY) === 'true';
    }
  } catch {}
  return false;
}

export function setAiPrivacyConsent(consent: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') {
      if (consent) {
        localStorage.setItem(AI_CONSENT_KEY, 'true');
      } else {
        localStorage.removeItem(AI_CONSENT_KEY);
      }
    }
  } catch {}
}

export function getAiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const backendMessage = error.response?.data?.message;

    switch (status) {
      case 400:
        return backendMessage || 'Invalid request parameters. Please verify your inputs.';
      case 401:
        return 'Your session has expired. Please sign in again to use AI features.';
      case 403:
        return backendMessage || 'You do not have permission to perform this AI operation.';
      case 404:
        return backendMessage || 'The requested resume could not be found or access is denied.';
      case 422:
        return backendMessage || 'Validation failed. Please check character limits and retry.';
      case 429:
        return (
          backendMessage ||
          'AI generation rate limit exceeded. Please wait a minute before making another request.'
        );
      case 502:
        return (
          backendMessage ||
          'The AI generated content that could not be verified against your source data. Please adjust your prompt and retry.'
        );
      case 503:
        return 'The AI service is temporarily unavailable. Please try again in a few moments.';
      case 504:
        return 'The AI generation request timed out. Please try again with shorter content or in a few moments.';
      default:
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          return 'Request timed out waiting for AI response. Please try again.';
        }
        if (!error.response && error.request) {
          return 'Unable to reach the AI server. Please check your internet connection.';
        }
        return backendMessage || error.message || 'An unexpected error occurred while communicating with the AI service.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

export const aiService = {
  async generateProfessionalSummary(
    resumeId: string,
    preferences?: GenerateSummaryPreferences
  ): Promise<SummaryResponseData> {
    if (!resumeId || !resumeId.trim()) {
      throw new Error('Resume ID is required to generate a summary.');
    }

    if (preferences?.targetRole && preferences.targetRole.trim().length > 100) {
      throw new Error('Target role must be 100 characters or fewer.');
    }

    if (
      preferences?.customInstructions &&
      preferences.customInstructions.trim().length > 300
    ) {
      throw new Error('Custom instructions must be 300 characters or fewer.');
    }

    const payload = {
      resumeId: resumeId.trim(),
      ...(preferences?.tone ? { tone: preferences.tone } : {}),
      ...(preferences?.targetRole?.trim()
        ? { targetRole: preferences.targetRole.trim() }
        : {}),
      ...(preferences?.customInstructions?.trim()
        ? { customInstructions: preferences.customInstructions.trim() }
        : {}),
    };

    const response = await api.post<ApiResponse<SummaryResponseData>>('/ai/summary', payload);

    if (!response.data?.data) {
      throw new Error('No summary data returned by the server.');
    }

    return response.data.data;
  },

  async improveResumeContent(
    text: string,
    options?: ImproveContentOptions
  ): Promise<ImproveResponseData> {
    if (!text || text.trim().length < 5) {
      throw new Error('Text to improve must be at least 5 characters long.');
    }

    if (text.trim().length > 1000) {
      throw new Error('Text to improve must not exceed 1000 characters.');
    }

    if (options?.instructions && options.instructions.trim().length > 300) {
      throw new Error('Instructions must be 300 characters or fewer.');
    }

    const payload = {
      text: text.trim(),
      tone: options?.tone || 'professional',
      ...(options?.instructions ? { instructions: options.instructions.trim() } : {}),
    };

    const response = await api.post<ApiResponse<ImproveResponseData>>('/ai/improve', payload);

    if (!response.data?.data) {
      throw new Error('No improved content returned by the server.');
    }

    return response.data.data;
  },

  async analyzeResume(resumeId: string): Promise<ResumeAnalysisRecord> {
    if (!resumeId || !resumeId.trim()) {
      throw new Error('Resume ID is required to analyze a resume.');
    }

    const response = await api.post<ApiResponse<ResumeAnalysisRecord>>('/ai/analyze', {
      resumeId: resumeId.trim(),
    });

    if (!response.data?.data) {
      throw new Error('No analysis data returned by the server.');
    }

    return response.data.data;
  },

  async getResumeAnalysis(analysisId: string): Promise<ResumeAnalysisRecord> {
    if (!analysisId || !analysisId.trim()) {
      throw new Error('Analysis ID is required to retrieve analysis results.');
    }

    const response = await api.get<ApiResponse<ResumeAnalysisRecord>>(
      `/ai/analyses/${analysisId.trim()}`
    );

    if (!response.data?.data) {
      throw new Error('Analysis record not found.');
    }

    return response.data.data;
  },

  async matchJobDescription(payload: JobMatchInputPayload): Promise<JobMatchRecord> {
    if (!payload.resumeId || !payload.resumeId.trim()) {
      throw new Error('Resume ID is required to evaluate job match.');
    }

    if (!payload.jobDescription || payload.jobDescription.trim().length < 20) {
      throw new Error('Job description must be at least 20 characters long.');
    }

    if (payload.jobDescription.trim().length > 8000) {
      throw new Error('Job description must not exceed 8000 characters.');
    }

    if (payload.jobTitle && payload.jobTitle.trim().length > 150) {
      throw new Error('Job title must be 150 characters or fewer.');
    }

    const body = {
      resumeId: payload.resumeId.trim(),
      ...(payload.jobTitle?.trim() ? { jobTitle: payload.jobTitle.trim() } : {}),
      jobDescription: payload.jobDescription.trim(),
    };

    const response = await api.post<ApiResponse<JobMatchRecord>>('/ai/job-match', body);

    if (!response.data?.data) {
      throw new Error('No job match data returned by the server.');
    }

    return response.data.data;
  },

  async getJobMatch(matchId: string): Promise<JobMatchRecord> {
    if (!matchId || !matchId.trim()) {
      throw new Error('Match ID is required to retrieve job match results.');
    }

    const response = await api.get<ApiResponse<JobMatchRecord>>(
      `/ai/job-matches/${matchId.trim()}`
    );

    if (!response.data?.data) {
      throw new Error('Job match record not found.');
    }

    return response.data.data;
  },

  async generateCoverLetter(
    payload: GenerateCoverLetterPayload
  ): Promise<GeneratedCoverLetterDraft> {
    if (!payload.resumeId || !payload.resumeId.trim()) {
      throw new Error('Resume ID is required to generate a cover letter.');
    }
    if (!payload.companyName || !payload.companyName.trim()) {
      throw new Error('Company name is required.');
    }
    if (payload.companyName.trim().length > 100) {
      throw new Error('Company name must be 100 characters or fewer.');
    }
    if (!payload.jobRole || !payload.jobRole.trim()) {
      throw new Error('Job role is required.');
    }
    if (payload.jobRole.trim().length > 100) {
      throw new Error('Job role must be 100 characters or fewer.');
    }
    if (!payload.jobDescription || payload.jobDescription.trim().length < 20) {
      throw new Error('Job description must be at least 20 characters long.');
    }
    if (payload.jobDescription.trim().length > 8000) {
      throw new Error('Job description must not exceed 8000 characters.');
    }
    if (payload.customInstructions && payload.customInstructions.trim().length > 300) {
      throw new Error('Custom instructions must be 300 characters or fewer.');
    }

    const body = {
      resumeId: payload.resumeId.trim(),
      companyName: payload.companyName.trim(),
      jobRole: payload.jobRole.trim(),
      jobDescription: payload.jobDescription.trim(),
      tone: payload.tone || 'professional',
      ...(payload.customInstructions?.trim()
        ? { customInstructions: payload.customInstructions.trim() }
        : {}),
    };

    const response = await api.post<ApiResponse<GeneratedCoverLetterDraft>>(
      '/ai/cover-letters/generate',
      body
    );

    if (!response.data?.data) {
      throw new Error('No cover letter draft returned by the server.');
    }

    return response.data.data;
  },

  async saveCoverLetter(payload: SaveCoverLetterPayload): Promise<CoverLetterRecord> {
    if (!payload.companyName || !payload.companyName.trim()) {
      throw new Error('Company name is required.');
    }
    if (payload.companyName.trim().length > 100) {
      throw new Error('Company name must be 100 characters or fewer.');
    }
    if (!payload.jobRole || !payload.jobRole.trim()) {
      throw new Error('Job role is required.');
    }
    if (payload.jobRole.trim().length > 100) {
      throw new Error('Job role must be 100 characters or fewer.');
    }
    if (!payload.content || payload.content.trim().length < 10) {
      throw new Error('Cover letter content must be at least 10 characters long.');
    }
    if (payload.content.trim().length > 10000) {
      throw new Error('Cover letter content must not exceed 10000 characters.');
    }
    if (payload.jobDescription && payload.jobDescription.trim().length > 8000) {
      throw new Error('Job description must not exceed 8000 characters.');
    }

    const body = {
      companyName: payload.companyName.trim(),
      jobRole: payload.jobRole.trim(),
      jobDescription: payload.jobDescription ? payload.jobDescription.trim() : null,
      content: payload.content.trim(),
      resumeId: payload.resumeId ? payload.resumeId.trim() : null,
    };

    const response = await api.post<ApiResponse<CoverLetterRecord>>(
      '/ai/cover-letters',
      body
    );

    if (!response.data?.data) {
      throw new Error('Failed to save cover letter.');
    }

    return response.data.data;
  },

  async listCoverLetters(params?: {
    resumeId?: string;
    page?: number;
    limit?: number;
  }): Promise<ListCoverLettersResponse> {
    const queryParams: Record<string, any> = {};
    if (params?.resumeId?.trim()) queryParams.resumeId = params.resumeId.trim();
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    const response = await api.get<ApiResponse<ListCoverLettersResponse>>(
      '/ai/cover-letters',
      { params: queryParams }
    );

    if (!response.data?.data) {
      throw new Error('Failed to retrieve cover letters.');
    }

    return response.data.data;
  },

  async getCoverLetter(id: string): Promise<CoverLetterRecord> {
    if (!id || !id.trim()) {
      throw new Error('Cover letter ID is required.');
    }

    const response = await api.get<ApiResponse<CoverLetterRecord>>(
      `/ai/cover-letters/${id.trim()}`
    );

    if (!response.data?.data) {
      throw new Error('Cover letter not found.');
    }

    return response.data.data;
  },

  async updateCoverLetter(
    id: string,
    payload: UpdateCoverLetterPayload
  ): Promise<CoverLetterRecord> {
    if (!id || !id.trim()) {
      throw new Error('Cover letter ID is required.');
    }

    const body: Record<string, any> = {};
    if (payload.companyName !== undefined) {
      const trimmed = payload.companyName.trim();
      if (!trimmed) throw new Error('Company name cannot be empty.');
      if (trimmed.length > 100) throw new Error('Company name must be 100 characters or fewer.');
      body.companyName = trimmed;
    }
    if (payload.jobRole !== undefined) {
      const trimmed = payload.jobRole.trim();
      if (!trimmed) throw new Error('Job role cannot be empty.');
      if (trimmed.length > 100) throw new Error('Job role must be 100 characters or fewer.');
      body.jobRole = trimmed;
    }
    if (payload.jobDescription !== undefined) {
      if (payload.jobDescription && payload.jobDescription.trim().length > 8000) {
        throw new Error('Job description must not exceed 8000 characters.');
      }
      body.jobDescription = payload.jobDescription ? payload.jobDescription.trim() : null;
    }
    if (payload.content !== undefined) {
      const trimmed = payload.content.trim();
      if (trimmed.length < 10) throw new Error('Cover letter content must be at least 10 characters long.');
      if (trimmed.length > 10000) throw new Error('Cover letter content must not exceed 10000 characters.');
      body.content = trimmed;
    }
    if (payload.resumeId !== undefined)
      body.resumeId = payload.resumeId ? payload.resumeId.trim() : null;

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided for update.');
    }

    const response = await api.put<ApiResponse<CoverLetterRecord>>(
      `/ai/cover-letters/${id.trim()}`,
      body
    );

    if (!response.data?.data) {
      throw new Error('Failed to update cover letter.');
    }

    return response.data.data;
  },

  async deleteCoverLetter(id: string): Promise<{ id: string }> {
    if (!id || !id.trim()) {
      throw new Error('Cover letter ID is required.');
    }

    const response = await api.delete<ApiResponse<{ id: string }>>(
      `/ai/cover-letters/${id.trim()}`
    );

    if (!response.data?.data) {
      throw new Error('Failed to delete cover letter.');
    }

    return response.data.data;
  },
};
