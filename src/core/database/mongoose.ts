/**
 * @fileoverview MongoDB connection helpers using mongoose
 * Provides reusable connect/disconnect utilities with structured logging
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/** mongoose ready state representing an established connection */
const READY_STATE_CONNECTED = mongoose.STATES.connected;
/** mongoose ready state representing a closed connection */
const READY_STATE_DISCONNECTED = mongoose.STATES.disconnected;

/**
 * Resolves the MongoDB connection string from environment variables
 * @throws {Error} When the URI is not configured
 */
const resolveMongoUri = (): string => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  return uri;
};

/**
 * Establishes a MongoDB connection if one is not already open.
 * Logs connection status and rethrows errors for upstream handling.
 * @returns {Promise<void>} Resolves when the connection is ready
 */
export const connectMongo = async (): Promise<void> => {
  if (mongoose.connection.readyState === READY_STATE_CONNECTED) {
    return;
  }

  const uri = resolveMongoUri();
  const dbName = process.env.DB_NAME ?? 'walletfy-back';

  try {
    await mongoose.connect(uri, {
      dbName,
    });

    logger.info('Connected to MongoDB', {
      dbName,
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Closes the active MongoDB connection when necessary and logs the outcome.
 * @returns {Promise<void>} Resolves once the connection is closed
 */
export const disconnectMongo = async (): Promise<void> => {
  if (mongoose.connection.readyState === READY_STATE_DISCONNECTED) {
    return;
  }

  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
};
