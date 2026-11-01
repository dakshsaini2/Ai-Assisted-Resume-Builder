export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  field?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  gpa?: string | null;
  description?: string | null;
  sortOrder?: number;
}

export interface Experience {
  id?: string;
  company: string;
  position: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  current?: boolean;
  description?: string | null;
  sortOrder?: number;
}

export interface Project {
  id?: string;
  name: string;
  description?: string | null;
  technologies?: string | null;
  link?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  sortOrder?: number;
}

export interface Skill {
  id?: string;
  category?: string;
  name: string;
  level?: string | null;
}

export interface Certification {
  id?: string;
  name: string;
  issuer?: string | null;
  date?: string | null;
  expiryDate?: string | null;
  credentialId?: string | null;
  url?: string | null;
}

export interface Achievement {
  id?: string;
  title: string;
  description?: string | null;
  date?: string | null;
  sortOrder?: number;
}

export interface Language {
  id?: string;
  name: string;
  proficiency?: string | null;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  templateId: 'classic' | 'modern' | 'creative';
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin?: string | null;
  github?: string | null;
  website?: string | null;
  summary?: string | null;
  education?: Education[];
  experiences?: Experience[];
  projects?: Project[];
  skills?: Skill[];
  certifications?: Certification[];
  achievements?: Achievement[];
  languages?: Language[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    education: number;
    experiences: number;
    projects: number;
    skills: number;
  };
}

export interface ResumeListItem {
  id: string;
  title: string;
  templateId: 'classic' | 'modern' | 'creative';
  fullName?: string | null;
  updatedAt: string;
  createdAt: string;
  _count: {
    education: number;
    experiences: number;
    projects: number;
    skills: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

export type SummaryTone = 'professional' | 'executive' | 'technical' | 'creative';
export type ImproveTone = 'professional' | 'executive' | 'technical' | 'impactful';

export interface GenerateSummaryPreferences {
  targetRole?: string;
  tone?: SummaryTone;
  customInstructions?: string;
}

export interface SummaryResponseData {
  summary: string;
}

export interface ImproveContentOptions {
  instructions?: string;
  tone?: ImproveTone;
}

export interface ImproveResponseData {
  improvedText: string;
  explanation?: string;
}

export interface SectionScores {
  summary: number;
  experience: number;
  skills: number;
  education: number;
}

export interface AtsFeedback {
  score: number;
  readability: string;
  formattingSuggestions: string[];
  disclaimer: string;
}

export interface ResumeAnalysisResults {
  overallScore: number;
  sectionScores: SectionScores;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  atsFeedback: AtsFeedback;
}

export interface ResumeAnalysisRecord {
  id: string;
  resumeId: string;
  score: number;
  results: ResumeAnalysisResults;
  createdAt: string;
}

export interface JobMatchResults {
  matchScore: number;
  matchingSkills: string[];
  skillsNotFoundInResume: string[];
  matchingKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  improvementSuggestions: string[];
}

export interface JobMatchInputPayload {
  resumeId: string;
  jobTitle?: string;
  jobDescription: string;
}

export interface JobMatchRecord {
  id: string;
  resumeId: string;
  jobTitle: string;
  jobDescription: string;
  matchScore: number;
  results: JobMatchResults;
  createdAt: string;
}

export type CoverLetterTone = 'professional' | 'enthusiastic' | 'confident' | 'formal';

export interface GenerateCoverLetterPayload {
  resumeId: string;
  companyName: string;
  jobRole: string;
  jobDescription: string;
  tone?: CoverLetterTone;
  customInstructions?: string;
}

export interface GeneratedCoverLetterDraft {
  content: string;
  companyName: string;
  jobRole: string;
  jobDescription: string;
  resumeId: string;
}

export interface SaveCoverLetterPayload {
  companyName: string;
  jobRole: string;
  jobDescription?: string | null;
  content: string;
  resumeId?: string | null;
}

export interface UpdateCoverLetterPayload {
  companyName?: string;
  jobRole?: string;
  jobDescription?: string | null;
  content?: string;
  resumeId?: string | null;
}

export interface CoverLetterRecord {
  id: string;
  userId: string;
  resumeId: string | null;
  companyName: string;
  jobRole: string;
  jobDescription: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListCoverLettersResponse {
  coverLetters: CoverLetterRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
