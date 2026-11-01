import { z } from 'zod';

export const educationItemSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, 'Institution name is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  gpa: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().optional().default(0),
});

export const experienceItemSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position title is required'),
  location: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  current: z.boolean().optional().default(false),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().optional().default(0),
});

export const projectItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().nullable().optional(),
  technologies: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  sortOrder: z.number().int().optional().default(0),
});

export const skillItemSchema = z.object({
  id: z.string().optional(),
  category: z.string().optional().default('General'),
  name: z.string().min(1, 'Skill name is required'),
  level: z.string().nullable().optional(),
});

export const certificationItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  credentialId: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});

export const achievementItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Achievement title is required'),
  description: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  sortOrder: z.number().int().optional().default(0),
});

export const languageItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Language name is required'),
  proficiency: z.string().nullable().optional(),
});

export const createResumeSchema = z.object({
  title: z.string().min(1, 'Resume title is required').default('Untitled Resume'),
  templateId: z.enum(['classic', 'modern', 'creative']).default('classic'),
  fullName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
});

export const updateResumeSchema = z.object({
  title: z.string().min(1).optional(),
  templateId: z.enum(['classic', 'modern', 'creative']).optional(),
  fullName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  // Nested sub-entities for full resume save/sync
  education: z.array(educationItemSchema).optional(),
  experiences: z.array(experienceItemSchema).optional(),
  projects: z.array(projectItemSchema).optional(),
  skills: z.array(skillItemSchema).optional(),
  certifications: z.array(certificationItemSchema).optional(),
  achievements: z.array(achievementItemSchema).optional(),
  languages: z.array(languageItemSchema).optional(),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
