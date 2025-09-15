/**
 * @fileoverview Express middleware for HTTP request logging
 *
 * This module provides a logging middleware that captures and logs incoming HTTP requests
 * with detailed information including timestamp, HTTP method, URL, and query parameters.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware function that logs incoming HTTP requests with detailed information
 *
 * Captures and logs the following information for each request:
 * - ISO timestamp of when the request was received
 * - HTTP method (GET, POST, PUT, DELETE, etc.)
 * - Request URL path
 * - Query parameters as JSON string
 *
 * @param {Request} req - Express request object containing request information
 * @param {Response} res - Express response object (not used in this middleware)
 * @param {NextFunction} next - Express next function to continue to the next middleware
 * @returns {void} This function does not return a value
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { logger } from './middleware/logger';
 *
 * const app = express();
 * app.use(logger);
 * ```
 */
export const logger = (req: Request, res: Response, next: NextFunction): void => {
  /** @type {string} ISO timestamp string representing when the request was received */
  const timestamp = new Date().toISOString();

  /** @type {string} HTTP method from the request */
  const method = req.method;

  /** @type {string} Request URL path */
  const url = req.url;

  /** @type {any} Query parameters object from the request */
  const query = req.query;

  console.log(`[${timestamp}] ${method} ${url} - Query:`, JSON.stringify(query));

  next();
};