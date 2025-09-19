/**
 * @fileoverview Unit tests for MongoDB connection helpers
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '@core/database/mongoose';
import { logger } from '@core/utils/logger';

const setReadyState = (state: number) => {
  Object.defineProperty(mongoose.connection, 'readyState', {
    value: state,
    configurable: true,
    writable: true,
  });
};

describe('mongo helpers', () => {
  const originalUri = process.env.MONGODB_URI;
  const originalDb = process.env.DB_NAME;

  afterEach(() => {
    jest.restoreAllMocks();
    setReadyState(0);
    process.env.MONGODB_URI = originalUri;
    process.env.DB_NAME = originalDb;
  });

  it('skips connection when already connected', async () => {
    setReadyState(1);
    const connectSpy = jest.spyOn(mongoose, 'connect');

    await connectMongo();

    expect(connectSpy).not.toHaveBeenCalled();
  });

  it('logs and rethrows when connection fails', async () => {
    setReadyState(0);
    process.env.MONGODB_URI = originalUri ?? 'mongodb://localhost:27017/test';

    const connectSpy = jest
      .spyOn(mongoose, 'connect')
      .mockRejectedValueOnce(new Error('bad uri'));
    const logSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    await expect(connectMongo()).rejects.toThrow('bad uri');
    expect(connectSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });

  it('throws when URI is missing', async () => {
    setReadyState(0);
    delete process.env.MONGODB_URI;

    await expect(connectMongo()).rejects.toThrow('Missing MONGODB_URI');
  });

  it('skips disconnect when already closed', async () => {
    setReadyState(0);
    const disconnectSpy = jest.spyOn(mongoose, 'disconnect');

    await disconnectMongo();

    expect(disconnectSpy).not.toHaveBeenCalled();
  });
});
