/**
 * @fileoverview Authentication API routes configuration using Express Router
 */

import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { authController } from '@controllers/auth.controller';
import { authenticate, verifyJWT, verifySession } from '@core/middleware/auth';

/**
 * Wraps async route handlers to handle promise rejections
 */
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    void fn(req, res, next).catch(next);
  };
};

/**
 * Express router instance for authentication-related API endpoints
 */
const router = Router();

/**
 * POST /auth/register - Register a new user
 * @route POST /auth/register
 * @description Creates a new user account with username and password
 * @param {Object} req.body - Registration data (username, password)
 * @returns {Object} 201 - Created user object with JWT token
 * @returns {Object} 409 - User already exists
 * @returns {Object} 400 - Validation error
 */
router.post(
  '/register',
  asyncHandler(async (req, res, next) => {
    await authController.register(req, res, next);
  }),
);

/**
 * POST /auth/login - Login with username/password (JSON body)
 * @route POST /auth/login
 * @description Authenticates user with username/password and returns JWT token
 * @param {Object} req.body - Login data (username, password)
 * @returns {Object} 200 - User object with JWT token
 * @returns {Object} 401 - Invalid credentials
 * @returns {Object} 400 - Validation error
 */
router.post(
  '/login',
  asyncHandler(async (req, res, next) => {
    await authController.login(req, res, next);
  }),
);

/**
 * POST /auth/basic - Basic Auth → JWT token emission
 * @route POST /auth/basic
 * @description Authenticates user with Basic Auth header and returns JWT token
 * @param {string} req.headers.authorization - Basic Auth header (Base64 encoded username:password)
 * @returns {Object} 200 - User object with JWT token
 * @returns {Object} 401 - Invalid credentials or missing Basic Auth header
 */
router.post(
  '/basic',
  asyncHandler(async (req, res, next) => {
    await authController.basicAuthLogin(req, res, next);
  }),
);

/**
 * POST /auth/session/login - Session-based login with cookie
 * @route POST /auth/session/login
 * @description Authenticates user and creates session stored in cookie
 * @param {Object} req.body - Login data (username, password)
 * @returns {Object} 200 - User object (session stored in cookie)
 * @returns {Object} 401 - Invalid credentials
 * @returns {Object} 400 - Validation error
 */
router.post(
  '/session/login',
  asyncHandler(async (req, res, next) => {
    await authController.sessionLogin(req, res, next);
  }),
);

/**
 * POST /auth/logout - Logout by clearing session
 * @route POST /auth/logout
 * @description Destroys user session and clears session cookie
 * @returns {Object} 200 - Logout successful message
 * @returns {Object} 500 - Session destruction error
 */
router.post('/logout', (req, res, next) => {
  authController.logout(req, res, next);
});

/**
 * GET /auth/profile - Get current user profile (JWT protected)
 * @route GET /auth/profile
 * @description Retrieves current authenticated user's profile information
 * @param {string} req.headers.authorization - Bearer JWT token
 * @returns {Object} 200 - User profile object
 * @returns {Object} 401 - Invalid or missing JWT token
 * @returns {Object} 404 - User not found
 */
router.get(
  '/profile',
  verifyJWT,
  asyncHandler(async (req, res, next) => {
    await authController.profile(req, res, next);
  }),
);

/**
 * GET /auth/session/profile - Get current user profile (Session protected)
 * @route GET /auth/session/profile
 * @description Retrieves current authenticated user's profile using session
 * @returns {Object} 200 - User profile object
 * @returns {Object} 401 - No active session
 * @returns {Object} 404 - User not found
 */
router.get(
  '/session/profile',
  verifySession,
  asyncHandler(async (req, res, next) => {
    await authController.profile(req, res, next);
  }),
);

/**
 * GET /auth/me - Get current user profile (JWT or Session)
 * @route GET /auth/me
 * @description Retrieves current authenticated user's profile using either JWT or session
 * @param {string} [req.headers.authorization] - Optional Bearer JWT token
 * @returns {Object} 200 - User profile object
 * @returns {Object} 401 - No authentication provided
 * @returns {Object} 404 - User not found
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res, next) => {
    await authController.profile(req, res, next);
  }),
);

/**
 * Export the configured router for use in the main application
 */
export default router;
