export interface TokenPayload {
  userId: string;
  email: string;
  purpose?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export {};
