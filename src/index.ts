/**
 * @fileoverview Application entry point for Walletfy backend server
 * Starts the Express server and configures the listening port
 */

import 'dotenv/config';
import type { Server } from 'http';
import app from './app';
import { logger } from './core/utils/logger';
import { connectMongo, disconnectMongo } from './core/database/mongoose';

const PORT = Number(process.env.PORT) || 3030;

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

    const shutdown = async (): Promise<void> => {
      logger.info('Shutting down server');

      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });

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
