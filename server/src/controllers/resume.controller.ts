import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { verifyExportToken } from '../utils/jwt';
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
  return sendSuccess(res, { resume });
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
