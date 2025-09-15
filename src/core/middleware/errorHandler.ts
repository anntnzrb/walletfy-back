/**
 * @fileoverview Express middleware for centralized error handling and custom error classes
 *
 * This module provides a comprehensive error handling system including:
 * - Custom error interfaces and classes for different error scenarios
 * - Express error middleware that handles various error types (Zod validation, custom errors, generic errors)
 * - Proper HTTP status code mapping and JSON error responses
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Extended Error interface that includes additional properties for application-specific errors
 *
 * @interface AppError
 * @extends {Error}
 * @property {number} [statusCode] - Optional HTTP status code for the error (e.g., 400, 404, 500)
 * @property {boolean} [isOperational] - Optional flag indicating if this is an operational error that can be handled gracefully
 */
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Custom error class for handling "Not Found" scenarios (HTTP 404)
 *
 * This error should be thrown when a requested resource cannot be found.
 * It automatically sets the appropriate HTTP status code and marks itself as operational.
 *
 * @class NotFoundError
 * @extends {Error}
 * @implements {AppError}
 * @property {number} statusCode - HTTP status code set to 404
 * @property {boolean} isOperational - Set to true indicating this is a handled operational error
 *
 * @example
 * ```typescript
 * // When a user is not found
 * throw new NotFoundError('User');
 * // Results in error message: "User not found"
 * ```
 */
export class NotFoundError extends Error implements AppError {
  /** @type {number} HTTP status code for Not Found errors */
  statusCode = 404;

  /** @type {boolean} Flag indicating this is an operational error */
  isOperational = true;

  /**
   * Creates a new NotFoundError instance
   *
   * @param {string} resource - The name of the resource that was not found
   * @example
   * ```typescript
   * throw new NotFoundError('Event');
   * // Creates error with message: "Event not found"
   * ```
   */
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Custom error class for handling validation failures (HTTP 400)
 *
 * This error should be thrown when input validation fails.
 * It automatically sets the appropriate HTTP status code and marks itself as operational.
 *
 * @class ValidationError
 * @extends {Error}
 * @implements {AppError}
 * @property {number} statusCode - HTTP status code set to 400
 * @property {boolean} isOperational - Set to true indicating this is a handled operational error
 *
 * @example
 * ```typescript
 * // When validation fails
 * throw new ValidationError('Email format is invalid');
 * ```
 */
export class ValidationError extends Error implements AppError {
  /** @type {number} HTTP status code for validation errors */
  statusCode = 400;

  /** @type {boolean} Flag indicating this is an operational error */
  isOperational = true;

  /**
   * Creates a new ValidationError instance
   *
   * @param {string} message - The validation error message describing what went wrong
   * @example
   * ```typescript
   * throw new ValidationError('Password must be at least 8 characters long');
   * ```
   */
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Express error handling middleware that processes different types of errors and sends appropriate responses
 *
 * This middleware handles three main types of errors:
 * 1. ZodError - Schema validation errors from Zod library
 * 2. AppError - Custom application errors with statusCode property
 * 3. Generic Error - Any other error (defaults to 500 Internal Server Error)
 *
 * The middleware automatically:
 * - Maps errors to appropriate HTTP status codes
 * - Formats error responses as JSON
 * - Logs error details to console
 * - Provides detailed validation error information for ZodError
 *
 * @param {Error | AppError | ZodError} error - The error object to handle
 * @param {Request} req - Express request object (not used but required for error middleware signature)
 * @param {Response} res - Express response object used to send error response
 * @param {NextFunction} next - Express next function (not used but required for error middleware signature)
 * @returns {void} This function does not return a value, it sends a response
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { errorHandler } from './middleware/errorHandler';
 *
 * const app = express();
 * // ... other middleware and routes
 * app.use(errorHandler); // Must be last middleware
 * ```
 */
export const errorHandler = (
  error: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  /** @type {number} Default HTTP status code for unhandled errors */
  let statusCode = 500;

  /** @type {string} Default error message for unhandled errors */
  let message = 'Internal Server Error';

  // Handle Zod validation errors with detailed field-level error information
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';

    /** @type {Array<{path: string, message: string}>} Formatted validation errors */
    const errors = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));

    res.status(statusCode).json({
      error: message,
      details: errors,
    });
    return;
  }

  // Handle custom AppError instances with their own status codes
  if ('statusCode' in error && error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Log error details for debugging and monitoring
  console.error(`[ERROR] ${new Date().toISOString()} - ${error.name}: ${error.message}`);
  console.error(error.stack);

  // Send standardized error response
  res.status(statusCode).json({
    error: message,
  });
};