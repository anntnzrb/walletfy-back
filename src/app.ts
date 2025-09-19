/**
 * @fileoverview Main Express application configuration for Walletfy backend
 * Configures middleware, routes, and error handling for the RESTful API server
 */

import express, { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { logger } from './core/middleware/logger';
import { errorHandler } from './core/middleware/errorHandler';
import eventRoutes from './routes/event.routes';

/**
 * Express application instance
 * @type {express.Application}
 */
const app = express();

/**
 * Application start timestamp in milliseconds
 * Used to calculate uptime in health endpoint
 * @type {number}
 */
const startTime = Date.now();

/**
 * Configure JSON body parser middleware
 * Parses incoming requests with JSON payloads
 */
app.use(express.json());

/**
 * Configure request logging middleware
 * Logs all incoming HTTP requests for monitoring and debugging
 */
app.use(logger);

/**
 * Health check endpoint
 * Provides server status and uptime information
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {void} Sends JSON response with health status
 * @example
 * GET /health
 * Response: { "status": "ok", "uptime": "120s" }
 */
app.get('/health', (req: Request, res: Response): void => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const statusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbStatus = statusMap[mongoose.connection.readyState] ?? 'unknown';

  res.status(200).json({
    status: 'ok',
    uptime: `${uptime.toString()}s`,
    dbStatus,
  });
});

/**
 * Configure API routes
 * Mount event management routes under versioned /api/v1 prefix
 */
app.use('/api/v1', eventRoutes);

/**
 * Configure global error handling middleware
 * Must be the last middleware to catch all unhandled errors
 */
app.use(errorHandler);

/**
 * Configured Express application instance
 * Ready for server startup with all middleware and routes configured
 * @type {express.Application}
 */
export default app;
