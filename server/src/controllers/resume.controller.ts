import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/apiError';
import { signExportToken, verifyExportToken } from '../utils/jwt';
import { generateResumeFilename } from '../utils/filename';
import { pdfService } from '../services/pdf.service';
import * as resumeService from '../services/resume.service';
import { createResumeSchema, updateResumeSchema } from '../validators/resume.validator';

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

  const resume = await resumeService.getResumeById(payload.userId, id);

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  return sendSuccess(res, { resume });
});

export const downloadResumePdf = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user!.userId;

  const resume = await resumeService.getResumeById(userId, id);
  const exportToken = signExportToken({ userId, resumeId: id });
  const filename = generateResumeFilename(resume.fullName, resume.title);
  const pdfBuffer = await pdfService.generateResumePdf(id, exportToken);

  if (res.headersSent) {
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.setHeader('Content-Length', pdfBuffer.length.toString());
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.end(pdfBuffer);
});

export const getResumes = asyncHandler(async (req: Request, res: Response) => {
  const resumes = await resumeService.listResumes(req.user!.userId);
  return sendSuccess(res, { resumes });
});

export const createResume = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createResumeSchema.parse(req.body);
  const resume = await resumeService.createResume(req.user!.userId, validatedData);
  return sendSuccess(res, { resume }, 'Resume created successfully.', 201);
});

export const getResumeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const resume = await resumeService.getResumeById(req.user!.userId, id);
  return sendSuccess(res, { resume });
});

export const updateResume = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const validatedData = updateResumeSchema.parse(req.body);
  const resume = await resumeService.updateResume(req.user!.userId, id, validatedData);
  return sendSuccess(res, { resume }, 'Resume updated successfully.');
});

export const deleteResume = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await resumeService.deleteResume(req.user!.userId, id);
  return sendSuccess(res, null, 'Resume deleted successfully.');
});
