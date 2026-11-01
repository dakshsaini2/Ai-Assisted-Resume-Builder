import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { aiService } from '../services/ai.service';
import {
  GenerateSummaryInput,
  ImproveTextInput,
  AnalyzeResumeInput,
  JobMatchInput,
  GenerateCoverLetterInput,
  CreateCoverLetterInput,
  UpdateCoverLetterInput,
  listCoverLettersQuerySchema,
} from '../validators/ai.validator';

export const generateSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as GenerateSummaryInput;

  const result = await aiService.generateProfessionalSummary(userId, input);

  return sendSuccess(res, result, 'Professional summary generated successfully.');
});

export const improveContent = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as ImproveTextInput;

  const result = await aiService.improveResumeContent(input);

  return sendSuccess(res, result, 'Resume content improved successfully.');
});

export const analyzeResume = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as AnalyzeResumeInput;

  const result = await aiService.analyzeResume(userId, input);

  return sendSuccess(res, result, 'Resume analysis generated successfully.');
});

export const matchJobDescription = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as JobMatchInput;

  const result = await aiService.matchJobDescription(userId, input);

  return sendSuccess(res, result, 'Job description match generated successfully.');
});

export const getAnalysisById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };

  const result = await aiService.getResumeAnalysisById(userId, id);

  return sendSuccess(res, result, 'Resume analysis retrieved successfully.');
});

export const getJobMatchById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };

  const result = await aiService.getJobMatchById(userId, id);

  return sendSuccess(res, result, 'Job match retrieved successfully.');
});

export const generateCoverLetter = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as GenerateCoverLetterInput;

  const result = await aiService.generateCoverLetter(userId, input);

  return sendSuccess(res, result, 'Cover letter draft generated successfully.');
});

export const saveCoverLetter = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = req.body as CreateCoverLetterInput;

  const result = await aiService.saveCoverLetter(userId, input);

  return sendSuccess(res, result, 'Cover letter saved successfully.', 201);
});

export const listCoverLetters = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const query = listCoverLettersQuerySchema.parse(req.query);

  const result = await aiService.listCoverLetters(userId, query);

  return sendSuccess(res, result, 'Cover letters retrieved successfully.');
});

export const getCoverLetterById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };

  const result = await aiService.getCoverLetterById(userId, id);

  return sendSuccess(res, result, 'Cover letter retrieved successfully.');
});

export const updateCoverLetter = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };
  const input = req.body as UpdateCoverLetterInput;

  const result = await aiService.updateCoverLetter(userId, id, input);

  return sendSuccess(res, result, 'Cover letter updated successfully.');
});

export const deleteCoverLetter = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };

  const result = await aiService.deleteCoverLetter(userId, id);

  return sendSuccess(res, result, 'Cover letter deleted successfully.');
});
