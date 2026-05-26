declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        sid: string;
      };
    }
  }
}

export {};
