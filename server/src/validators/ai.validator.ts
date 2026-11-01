import { z } from 'zod';

export const generateSummarySchema = z.object({
  resumeId: z.string().trim().min(1, 'Resume ID is required'),
  targetRole: z
    .string()
    .trim()
    .max(100, 'Target role must be 100 characters or fewer')
    .optional(),
  tone: z
    .enum(['professional', 'executive', 'technical', 'creative'])
    .optional()
    .default('professional'),
  customInstructions: z
    .string()
    .trim()
    .max(300, 'Custom instructions must be 300 characters or fewer')
    .optional(),
});

export type GenerateSummaryInput = z.infer<typeof generateSummarySchema>;

export const improveTextSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(5, 'Text to improve must be at least 5 characters long')
      .max(1000, 'Text to improve must not exceed 1000 characters'),
    instructions: z
      .string()
      .trim()
      .max(300, 'Instructions must be 300 characters or fewer')
      .optional(),
    tone: z
      .enum(['professional', 'executive', 'technical', 'impactful'])
      .optional()
      .default('professional'),
    resumeId: z
      .never({ message: 'resumeId is not permitted on this stateless endpoint' })
      .optional(),
  })
  .strict();

export type ImproveTextInput = z.infer<typeof improveTextSchema>;

export const summaryResponseSchema = z
  .object({
    summary: z
      .string()
      .trim()
      .min(20, 'Generated summary must be at least 20 characters long')
      .max(1500, 'Generated summary exceeds acceptable length'),
  })
  .strict();

export type SummaryResponse = z.infer<typeof summaryResponseSchema>;

export const improveResponseSchema = z
  .object({
    improvedText: z
      .string()
      .trim()
      .min(5, 'Improved text must be at least 5 characters long')
      .max(1500, 'Improved text exceeds acceptable length'),
    explanation: z
      .string()
      .trim()
      .max(500, 'Improvement explanation must be 500 characters or fewer')
      .optional(),
  })
  .strict();

export type ImproveResponse = z.infer<typeof improveResponseSchema>;

export const analyzeResumeSchema = z
  .object({
    resumeId: z.string().trim().min(1, 'Resume ID is required'),
  })
  .strict();

export type AnalyzeResumeInput = z.infer<typeof analyzeResumeSchema>;

export const resumeAnalysisResponseSchema = z
  .object({
    overallScore: z
      .number()
      .int('Overall score must be an integer')
      .min(0, 'Overall score cannot be negative')
      .max(100, 'Overall score cannot exceed 100'),
    sectionScores: z
      .object({
        summary: z.number().int().min(0).max(100),
        experience: z.number().int().min(0).max(100),
        skills: z.number().int().min(0).max(100),
        education: z.number().int().min(0).max(100),
      })
      .strict(),
    strengths: z
      .array(z.string().trim().min(1, 'Strength description cannot be empty').max(500, 'Strength description cannot exceed 500 characters'))
      .min(1, 'At least one strength is required')
      .max(10, 'Strengths cannot exceed 10 items'),
    weaknesses: z
      .array(z.string().trim().min(1, 'Weakness description cannot be empty').max(500, 'Weakness description cannot exceed 500 characters'))
      .min(1, 'At least one area of improvement is required')
      .max(10, 'Weaknesses cannot exceed 10 items'),
    suggestions: z
      .array(z.string().trim().min(1, 'Suggestion cannot be empty').max(500, 'Suggestion cannot exceed 500 characters'))
      .min(1, 'At least one actionable suggestion is required')
      .max(10, 'Suggestions cannot exceed 10 items'),
    atsFeedback: z
      .object({
        score: z.number().int().min(0).max(100),
        readability: z.string().trim().min(1, 'Readability assessment is required').max(1000, 'Readability assessment cannot exceed 1000 characters'),
        formattingSuggestions: z
          .array(z.string().trim().min(1).max(500, 'Formatting suggestion cannot exceed 500 characters'))
          .max(10, 'Formatting suggestions cannot exceed 10 items'),
        disclaimer: z
          .string()
          .trim()
          .min(10, 'ATS disclaimer is required and must be at least 10 characters long')
          .max(500, 'ATS disclaimer cannot exceed 500 characters'),
      })
      .strict(),
  })
  .strict();

export type ResumeAnalysisResponse = z.infer<typeof resumeAnalysisResponseSchema>;

export const jobMatchSchema = z
  .object({
    resumeId: z.string().trim().min(1, 'Resume ID is required'),
    jobTitle: z
      .string()
      .trim()
      .max(150, 'Job title must be 150 characters or fewer')
      .optional(),
    jobDescription: z
      .string()
      .trim()
      .min(20, 'Job description must be at least 20 characters long')
      .max(8000, 'Job description must not exceed 8000 characters'),
  })
  .strict();

export type JobMatchInput = z.infer<typeof jobMatchSchema>;

export const jobMatchResponseSchema = z
  .object({
    matchScore: z
      .number()
      .int('Match score must be an integer')
      .min(0, 'Match score cannot be negative')
      .max(100, 'Match score cannot exceed 100'),
    matchingSkills: z
      .array(z.string().trim().min(1).max(100, 'Skill name cannot exceed 100 characters'))
      .max(30, 'Matching skills cannot exceed 30 items'),
    skillsNotFoundInResume: z
      .array(z.string().trim().min(1).max(100, 'Skill name cannot exceed 100 characters'))
      .max(30, 'Skills not found cannot exceed 30 items'),
    matchingKeywords: z
      .array(z.string().trim().min(1).max(100, 'Keyword cannot exceed 100 characters'))
      .max(50, 'Matching keywords cannot exceed 50 items'),
    missingKeywords: z
      .array(z.string().trim().min(1).max(100, 'Keyword cannot exceed 100 characters'))
      .max(50, 'Missing keywords cannot exceed 50 items'),
    strengths: z
      .array(z.string().trim().min(1).max(500, 'Strength cannot exceed 500 characters'))
      .max(15, 'Strengths cannot exceed 15 items'),
    improvementSuggestions: z
      .array(z.string().trim().min(1).max(500, 'Suggestion cannot exceed 500 characters'))
      .max(15, 'Improvement suggestions cannot exceed 15 items'),
  })
  .strict();

export type JobMatchResponse = z.infer<typeof jobMatchResponseSchema>;

export const generateCoverLetterSchema = z
  .object({
    resumeId: z.string().trim().min(1, 'Resume ID is required'),
    companyName: z
      .string()
      .trim()
      .min(1, 'Company name is required')
      .max(100, 'Company name cannot exceed 100 characters'),
    jobRole: z
      .string()
      .trim()
      .min(1, 'Job role is required')
      .max(100, 'Job role cannot exceed 100 characters'),
    jobDescription: z
      .string()
      .trim()
      .min(20, 'Job description must be at least 20 characters long')
      .max(8000, 'Job description cannot exceed 8000 characters'),
    tone: z
      .enum(['professional', 'enthusiastic', 'confident', 'formal'])
      .optional()
      .default('professional'),
    customInstructions: z
      .string()
      .trim()
      .max(300, 'Custom instructions cannot exceed 300 characters')
      .optional(),
  })
  .strict();

export type GenerateCoverLetterInput = z.infer<typeof generateCoverLetterSchema>;

export const coverLetterResponseSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(100, 'Cover letter content must be at least 100 characters long')
      .max(4000, 'Cover letter content exceeds maximum length'),
  })
  .strict();

export type CoverLetterResponse = z.infer<typeof coverLetterResponseSchema>;

export const createCoverLetterSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(1, 'Company name is required')
      .max(100, 'Company name cannot exceed 100 characters'),
    jobRole: z
      .string()
      .trim()
      .min(1, 'Job role is required')
      .max(100, 'Job role cannot exceed 100 characters'),
    jobDescription: z
      .string()
      .trim()
      .max(8000, 'Job description cannot exceed 8000 characters')
      .optional()
      .nullable(),
    content: z
      .string()
      .trim()
      .min(10, 'Cover letter content must be at least 10 characters long')
      .max(10000, 'Cover letter content cannot exceed 10000 characters'),
    resumeId: z
      .string()
      .trim()
      .min(1, 'Resume ID cannot be empty')
      .optional()
      .nullable(),
  })
  .strict();

export type CreateCoverLetterInput = z.infer<typeof createCoverLetterSchema>;

export const updateCoverLetterSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(1, 'Company name cannot be empty')
      .max(100, 'Company name cannot exceed 100 characters')
      .optional(),
    jobRole: z
      .string()
      .trim()
      .min(1, 'Job role cannot be empty')
      .max(100, 'Job role cannot exceed 100 characters')
      .optional(),
    jobDescription: z
      .string()
      .trim()
      .max(8000, 'Job description cannot exceed 8000 characters')
      .optional()
      .nullable(),
    content: z
      .string()
      .trim()
      .min(10, 'Cover letter content must be at least 10 characters long')
      .max(10000, 'Cover letter content cannot exceed 10000 characters')
      .optional(),
    resumeId: z
      .string()
      .trim()
      .min(1, 'Resume ID cannot be empty')
      .optional()
      .nullable(),
    userId: z
      .never({ message: 'Modifying userId is not permitted' })
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update.' }
  );

export type UpdateCoverLetterInput = z.infer<typeof updateCoverLetterSchema>;

export const listCoverLettersQuerySchema = z
  .object({
    resumeId: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type ListCoverLettersQuery = z.infer<typeof listCoverLettersQuerySchema>;
