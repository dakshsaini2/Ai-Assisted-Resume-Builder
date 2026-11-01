import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response';

/**
 * Express middleware factory that validates request body against a Zod schema.
 * On success, replaces req.body with the validated (and coerced) data.
 * On failure, returns a 400 response with detailed field errors.
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return sendError(res, 'Validation failed', 400, errors);
    }

    req.body = result.data;
    next();
  };
};

