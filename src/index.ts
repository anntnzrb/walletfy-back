/**
 * @fileoverview Application entry point for Walletfy backend server
 * Starts the Express server and configures the listening port
 */

import 'dotenv/config';
import type { Server } from 'http';
import { promisify } from 'util';
import app from '@/app';
import { logger } from '@core/utils/logger';
import { connectMongo, disconnectMongo } from '@core/database/mongoose';

/**
 * Resolved HTTP port for the Express server (defaults to 3030 when unset)
 */
const PORT = Number(process.env.PORT) || 3030;

/**
 * Boots the HTTP server after establishing the MongoDB connection and
 * registers lifecycle handlers for graceful shutdown and fatal errors.
 */
const startServer = async (): Promise<void> => {
  try {
    await connectMongo();

    const server: Server = app.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        serverUrl: `http://localhost:${PORT.toString()}`,
        healthEndpoint: `http://localhost:${PORT.toString()}/health`,
        apiEndpoint: `http://localhost:${PORT.toString()}/api/v1/eventos`,
      });
    });

    /**
     * Handles unrecoverable server errors by logging details, closing
     * database resources, and exiting the process.
     */
    const handleServerError = async (
      error: NodeJS.ErrnoException,
    ): Promise<void> => {
      logger.error('Server encountered an error', {
        code: error.code,
        message: error.message,
      });

      await disconnectMongo().catch((disconnectError: unknown) => {
        logger.error('Failed to disconnect from MongoDB after server error', {
          error:
            disconnectError instanceof Error
              ? disconnectError.message
              : 'Unknown error',
        });
      });

      process.exit(1);
    };

    server.on('error', (error) => {
      void handleServerError(error as NodeJS.ErrnoException);
    });

    /**
     * Performs graceful shutdown when receiving termination signals.
     */
    const shutdown = async (): Promise<void> => {
      logger.info('Shutting down server');

      const closeServer = promisify(server.close.bind(server));
      await closeServer();

      await disconnectMongo();
      process.exit(0);
    };

    process.on('SIGINT', () => {
      void shutdown();
    });
    process.on('SIGTERM', () => {
      void shutdown();
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    await disconnectMongo().catch((disconnectError: unknown) => {
      logger.error('Failed to disconnect from MongoDB after startup failure', {
        error:
          disconnectError instanceof Error
            ? disconnectError.message
            : 'Unknown error',
      });
    });

    process.exit(1);
  }
};

void startServer();
