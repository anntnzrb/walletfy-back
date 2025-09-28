/**
 * @fileoverview Zod validation schemas for authentication operations
 */

import { z } from 'zod';

/**
 * Schema for user registration data
 */
export const createUserSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  password: z.string().min(6).max(100),
});

/**
 * Schema for user login data
 */
export const loginUserSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  password: z.string().min(6).max(100),
});

/**
 * Schema for Basic Auth header
 */
export const basicAuthSchema = z.object({
  username: z.string(),
  password: z.string(),
});

/**
 * Type definitions derived from schemas
 */
export type CreateUser = z.infer<typeof createUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type BasicAuth = z.infer<typeof basicAuthSchema>;

/**
 * User entity type
 */
export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: Date;
}

/**
 * JWT payload type
 */
export interface JWTPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Session user type
 */
export interface SessionUser {
  id: string;
  username: string;
}
