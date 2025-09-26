/**
 * @fileoverview Unit tests for the structured logger utility
 */

import { describe, it, afterEach, assert } from 'poku';
import sinon from 'sinon';
import { logger } from '@core/utils/logger';

describe('logger utility', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('logs errors with metadata', () => {
    const spy = sinon.stub(console, 'error');

    logger.error('failure', { code: 500 });

    assert.strictEqual(spy.calledOnce, true);
    const [message] = spy.firstCall.args as [string];
    assert.ok(message.includes('"level":"ERROR"'));
    assert.ok(message.includes('"code":500'));
  });

  it('logs warnings', () => {
    const spy = sinon.stub(console, 'warn');

    logger.warn('caution');

    assert.strictEqual(spy.calledOnce, true);
    const [message] = spy.firstCall.args as [string];
    assert.ok(message.includes('"level":"WARN"'));
  });

  it('logs info messages', () => {
    const spy = sinon.stub(console, 'info');

    logger.info('details');

    assert.strictEqual(spy.calledOnce, true);
    const [message] = spy.firstCall.args as [string];
    assert.ok(message.includes('"level":"INFO"'));
  });

  it('logs debug traces', () => {
    const spy = sinon.stub(console, 'debug');

    logger.debug('trace');

    assert.strictEqual(spy.calledOnce, true);
    const [message] = spy.firstCall.args as [string];
    assert.ok(message.includes('"level":"DEBUG"'));
  });
});
