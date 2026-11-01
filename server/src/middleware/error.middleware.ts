import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/apiError';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (res.headersSent) {
    return _next(err);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    console.error('API Error:', err);
  } else {
    console.error('API Error:', err.message);
  }

  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(res, 'Validation failed', 400, formattedErrors);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      return sendError(res, `A record with this ${target} already exists.`, 409);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Requested resource was not found.', 404);
    }
    return sendError(res, 'A database error occurred.', 500);
  }

  const message = isProduction
    ? 'An unexpected internal server error occurred.'
    : err.message || 'An unexpected internal server error occurred.';
  const statusCode = err.statusCode || 500;
  return sendError(res, message, statusCode);
};
