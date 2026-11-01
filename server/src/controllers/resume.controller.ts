import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/apiError';
import { signExportToken, verifyExportToken } from '../utils/jwt';
import { generateResumeFilename } from '../utils/filename';
import { pdfService } from '../services/pdf.service';
import * as resumeService from '../services/resume.service';
import { createResumeSchema, updateResumeSchema } from '../validators/resume.validator';

// GET /api/resumes/:id/render-data?token=<exportToken>
export const getResumeRenderData = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const token = (req.query.token as string) || '';

  if (!token) {
    throw ApiError.unauthorized('Export token is required.');
  }

  const payload = verifyExportToken(token);

  if (payload.resumeId !== id) {
    throw ApiError.forbidden('Export token does not match requested resume.');
  }

  // Retrieve resume strictly belonging to authorized user
  const resume = await resumeService.getResumeById(payload.userId, id);

  // Set strict non-caching headers to protect private resume data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  return sendSuccess(res, { resume });
});

// GET /api/resumes/:id/pdf
export const downloadResumePdf = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user!.userId;

  // 1. Enforce ownership and retrieve resume
  // If resume is missing or not owned by authenticated user, throws ApiError.notFound('Resume not found.')
  const resume = await resumeService.getResumeById(userId, id);

  // 2. Generate single-purpose short-lived export token (60s)
  const exportToken = signExportToken({ userId, resumeId: id });

  // 3. Generate sanitized safe attachment filename
  const filename = generateResumeFilename(resume.fullName, resume.title);

  // 4. Render PDF via Puppeteer service
  const pdfBuffer = await pdfService.generateResumePdf(id, exportToken);

  // 5. Send binary HTTP Response with standard PDF headers
  if (res.headersSent) {
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length.toString());
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.end(pdfBuffer);
});

// GET /api/resumes
export const getResumes = asyncHandler(async (req: Request, res: Response) => {
  const resumes = await resumeService.listResumes(req.user!.userId);
  return sendSuccess(res, { resumes });
});

// POST /api/resumes
export const createResume = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createResumeSchema.parse(req.body);
  const resume = await resumeService.createResume(req.user!.userId, validatedData);
  return sendSuccess(res, { resume }, 'Resume created successfully.', 201);
});

// GET /api/resumes/:id
export const getResumeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const resume = await resumeService.getResumeById(req.user!.userId, id);
  return sendSuccess(res, { resume });
});

// PUT /api/resumes/:id
export const updateResume = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const validatedData = updateResumeSchema.parse(req.body);
  const resume = await resumeService.updateResume(req.user!.userId, id, validatedData);
  return sendSuccess(res, { resume }, 'Resume updated successfully.');
});

// DELETE /api/resumes/:id
export const deleteResume = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await resumeService.deleteResume(req.user!.userId, id);
  return sendSuccess(res, null, 'Resume deleted successfully.');
});
