import 'express-session';
import type { SessionUser } from '@validators/auth.validator';

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
      };
    }
  }
}
