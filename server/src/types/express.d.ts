/**
 * Extend the Express Request interface to include our authenticated user payload.
 */
export interface TokenPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Ensure this file is treated as a module
export {};

