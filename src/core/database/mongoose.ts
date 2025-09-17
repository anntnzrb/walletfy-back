import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const { MONGODB_URI, DB_NAME } = process.env;

const READY_STATE_CONNECTED = mongoose.STATES.connected;
const READY_STATE_DISCONNECTED = mongoose.STATES.disconnected;

const resolveMongoUri = (): string => {
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  return MONGODB_URI;
};

export const connectMongo = async (): Promise<void> => {
  if (mongoose.connection.readyState === READY_STATE_CONNECTED) {
    return;
  }

  const uri = resolveMongoUri();

  try {
    await mongoose.connect(uri, {
      dbName: DB_NAME ?? 'walletfy-back',
    });

    logger.info('Connected to MongoDB', {
      dbName: DB_NAME ?? 'walletfy-back',
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

export const disconnectMongo = async (): Promise<void> => {
  if (mongoose.connection.readyState === READY_STATE_DISCONNECTED) {
    return;
  }

  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
};
