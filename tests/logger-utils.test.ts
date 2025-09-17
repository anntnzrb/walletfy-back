/**
 * @fileoverview Unit tests for the structured logger utility
 */

import { logger } from '../src/core/utils/logger';

describe('logger utility', () => {
  const original = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };

  afterEach(() => {
    console.error = original.error;
    console.warn = original.warn;
    console.info = original.info;
    console.debug = original.debug;
  });

  it('logs errors with metadata', () => {
    const spy = jest.fn();
    console.error = spy;

    logger.error('failure', { code: 500 });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"level":"ERROR"'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"code":500'));
  });

  it('logs warnings', () => {
    const spy = jest.fn();
    console.warn = spy;

    logger.warn('caution');

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"level":"WARN"'));
  });

  it('logs info messages', () => {
    const spy = jest.fn();
    console.info = spy;

    logger.info('details');

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"level":"INFO"'));
  });

  it('logs debug traces', () => {
    const spy = jest.fn();
    console.debug = spy;

    logger.debug('trace');

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"level":"DEBUG"'));
  });
});
