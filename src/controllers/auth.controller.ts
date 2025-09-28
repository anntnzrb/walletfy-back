/**
 * @fileoverview Authentication controller handling user registration, login, and JWT operations
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userModel } from '@models/user.model';
import type { JWTPayload, SessionUser } from '@validators/auth.validator';
import { createUserSchema, loginUserSchema } from '@validators/auth.validator';

/**
 * Decode Basic Auth header
 */
function decodeBasicAuth(
  authHeader: string,
): { username: string; password: string } | null {
  const base64Credentials = authHeader.split(' ')[1];
  if (!base64Credentials) return null;

  const credentials = Buffer.from(base64Credentials, 'base64').toString(
    'ascii',
  );
  const [username, password] = credentials.split(':');

  if (!username || !password) return null;
  return { username, password };
}

/**
 * Generate JWT token
 */
function generateJWT(userId: string, username: string): string {
  const payload: JWTPayload = {
    userId,
    username,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign(payload, secret, { expiresIn: '24h' });
}

/**
 * Authentication controller class
 */
export class AuthController {
  /**
   * Register a new user
   */
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validatedData = createUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await userModel.existsByUsername(
        validatedData.username,
      );
      if (existingUser) {
        res.status(409).json({
          error: 'User already exists',
          message: 'Username is already taken',
        });
        return;
      }

      const newUser = await userModel.create(validatedData);
      const token = generateJWT(newUser.id, newUser.username);

      res.status(201).json({
        message: 'User registered successfully',
        user: newUser,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login with username/password (JSON body)
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = loginUserSchema.parse(req.body);

      const user = await userModel.validateCredentials(validatedData);
      if (!user) {
        res.status(401).json({
          error: 'Invalid credentials',
          message: 'Username or password is incorrect',
        });
        return;
      }

      const token = generateJWT(user.id, user.username);

      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Basic Auth → JWT token emission
   */
  async basicAuthLogin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Basic ')) {
        res.status(401).json({
          error: 'Missing Basic Auth header',
          message: 'Authorization header with Basic authentication required',
        });
        return;
      }

      const credentials = decodeBasicAuth(authHeader);
      if (!credentials) {
        res.status(401).json({
          error: 'Invalid Basic Auth format',
          message: 'Invalid Basic authentication credentials format',
        });
        return;
      }

      const user = await userModel.validateCredentials(credentials);
      if (!user) {
        res.status(401).json({
          error: 'Invalid credentials',
          message: 'Username or password is incorrect',
        });
        return;
      }

      const token = generateJWT(user.id, user.username);

      res.status(200).json({
        message: 'Basic Auth login successful',
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Session-based login with cookie
   */
  async sessionLogin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validatedData = loginUserSchema.parse(req.body);

      const user = await userModel.validateCredentials(validatedData);
      if (!user) {
        res.status(401).json({
          error: 'Invalid credentials',
          message: 'Username or password is incorrect',
        });
        return;
      }

      // Store user in session
      const sessionUser: SessionUser = {
        id: user.id,
        username: user.username,
      };

      req.session.user = sessionUser;

      res.status(200).json({
        message: 'Session login successful',
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout by clearing session
   */
  logout(req: Request, res: Response, next: NextFunction): void {
    try {
      req.session.destroy((err: Error | null) => {
        if (err) {
          res.status(500).json({
            error: 'Logout failed',
            message: 'Could not clear session',
          });
          return;
        }
        res.clearCookie('connect.sid');
        res.status(200).json({
          message: 'Logout successful',
        });
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  async profile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.userId ?? req.session.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Not authenticated',
          message: 'User not found in request context',
        });
        return;
      }

      const user = await userModel.findById(userId);
      if (!user) {
        res.status(404).json({
          error: 'User not found',
          message: 'User profile does not exist',
        });
        return;
      }

      res.status(200).json({
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Singleton AuthController instance
 */
export const authController = new AuthController();
