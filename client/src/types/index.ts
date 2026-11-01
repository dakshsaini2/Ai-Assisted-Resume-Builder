// User & Auth Types
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

// Resume Relational Types
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

// API Response generic wrapper matching backend
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}
