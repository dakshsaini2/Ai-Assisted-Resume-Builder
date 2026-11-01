import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as authService from '../services/auth.service';
import { registerSchema, loginSchema } from '../validators/auth.validator';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);
  const result = await authService.registerUser(validatedData);
  return sendSuccess(res, result, 'User registered successfully.', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);
  const result = await authService.loginUser(validatedData);
  return sendSuccess(res, result, 'Logged in successfully.');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getUserById(req.user!.userId);
  return sendSuccess(res, { user });
});
