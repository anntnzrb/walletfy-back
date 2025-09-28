/**
 * @fileoverview Authentication middleware for JWT and session-based authentication
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@validators/auth.validator';

/**
 * Verify JWT token from Authorization header
 */
export function verifyJWT(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Missing JWT token',
        message: 'Authorization header with Bearer token required',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        error: 'Invalid token format',
        message: 'Bearer token is missing',
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({
        error: 'Configuration error',
        message: 'JWT secret not configured',
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'JWT token is invalid or expired',
      });
      return;
    }

    res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to verify token',
    });
  }
}

/**
 * Verify session-based authentication
 */
export function verifySession(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const sessionUser = req.session?.user;

    if (!sessionUser) {
      res.status(401).json({
        error: 'No active session',
        message: 'Please login with session authentication',
      });
      return;
    }

    // Add user to request for consistency with JWT middleware
    req.user = {
      userId: sessionUser.id,
      username: sessionUser.username,
    };

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Session error',
      message: 'Failed to verify session',
    });
  }
}

/**
 * Combined authentication middleware - accepts both JWT and session
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const hasSession = req.session?.user;

  // Try JWT first if present
  if (authHeader?.startsWith('Bearer ')) {
    return verifyJWT(req, res, next);
  }

  // Fall back to session
  if (hasSession) {
    return verifySession(req, res, next);
  }

  // No authentication method found
  res.status(401).json({
    error: 'Authentication required',
    message: 'Please provide JWT token or login with session',
  });
}

/**
 * Optional authentication middleware - doesn't fail if no auth provided
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const hasSession = req.session?.user;

  // Try JWT first if present
  if (authHeader?.startsWith('Bearer ')) {
    return verifyJWT(req, res, next);
  }

  // Try session if present
  if (hasSession) {
    return verifySession(req, res, next);
  }

  // No auth provided, continue without user
  next();
}
