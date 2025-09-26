/**
 * @fileoverview Unit tests for MongoDB connection helpers
 */

import 'dotenv/config';
import { describe, it, afterEach, assert } from 'poku';
import sinon from 'sinon';
import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '@core/database/mongoose';
import { logger } from '@core/utils/logger';

type Restore = () => void;

const override = <K extends keyof typeof mongoose>(
  method: K,
  implementation: typeof mongoose[K],
): Restore => {
  const original = mongoose[method];
  Object.defineProperty(mongoose, method, {
    value: implementation,
    configurable: true,
    writable: true,
  });

  return () => {
    Object.defineProperty(mongoose, method, {
      value: original,
      configurable: true,
      writable: true,
    });
  };
};

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
  let restoreConnect: Restore | undefined;
  let restoreDisconnect: Restore | undefined;

  afterEach(() => {
    restoreConnect?.();
    restoreDisconnect?.();
    restoreConnect = undefined;
    restoreDisconnect = undefined;
    sinon.restore();
    setReadyState(0);
    process.env.MONGODB_URI = originalUri;
    process.env.DB_NAME = originalDb;
  });

  it('skips connection when already connected', async () => {
    setReadyState(1);
    let called = 0;
    restoreConnect = override('connect', async () => {
      called++;
      return mongoose;
    });

    await connectMongo();

    assert.strictEqual(called, 0);
  });

  it('logs and rethrows when connection fails after retries', async () => {
    setReadyState(0);
    process.env.MONGODB_URI = originalUri ?? 'mongodb://localhost:27017/test';

    let attempts = 0;
    restoreConnect = override('connect', async () => {
      attempts += 1;
      throw new Error('bad uri');
    });
    const logSpy = sinon.stub(logger, 'warn');

    await assert.rejects(connectMongo(), /bad uri/);
    assert.ok(attempts >= 1);
    assert.ok(logSpy.callCount >= 1);
  });

  it('throws when URI is missing', async () => {
    setReadyState(0);
    delete process.env.MONGODB_URI;

    let called = 0;
    restoreConnect = override('connect', async () => {
      called++;
      return mongoose;
    });

    await assert.rejects(connectMongo(), /Missing MONGODB_URI/);
    assert.strictEqual(called, 0);
  });

  it('skips disconnect when already closed', async () => {
    setReadyState(0);
    let called = 0;
    restoreDisconnect = override('disconnect', async () => {
      called++;
      return mongoose;
    });

    await disconnectMongo();

    assert.strictEqual(called, 0);
  });
});
