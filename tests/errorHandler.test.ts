/**
 * @fileoverview Unit tests for the global error handler middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { describe, it, afterEach, assert } from 'poku';
import sinon from 'sinon';
import { ZodError, type ZodIssue } from 'zod';
import {
  errorHandler,
  NotFoundError,
  ValidationError,
} from '@core/middleware/errorHandler';
import { logger } from '@core/utils/logger';

const createResponse = (): Response => {
  const res: Partial<Response> = {};
  res.status = sinon.stub().callsFake(() => res as Response);
  res.json = sinon.stub().returns(res as Response);
  res.send = sinon.stub().returns(res as Response);
  return res as Response;
};

const getStatusStub = (res: Response) => res.status as unknown as sinon.SinonStub;
const getJsonStub = (res: Response) => res.json as unknown as sinon.SinonStub;

const createMocks = () => {
  const req = {
    url: '/test',
    method: 'GET',
  } as unknown as Request;

  const res = createResponse();
  const logSpy = sinon.stub(logger, 'error').returns();

  return { req, res, logSpy };
};

describe('errorHandler middleware', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns detailed validation response for Zod errors', () => {
    const { req, res, logSpy } = createMocks();
    const issues: ZodIssue[] = [
      {
        code: 'custom',
        path: ['nombre'],
        message: 'Nombre es requerido',
      },
    ];
    const zodError = new ZodError(issues);

    const next = sinon.stub<[unknown?], void>();
    errorHandler(zodError, req, res, next as unknown as NextFunction);

    const status = getStatusStub(res);
    const json = getJsonStub(res);
    assert.strictEqual(status.calledWith(400), true);
    assert.deepStrictEqual(json.firstCall.args[0], {
      error: 'Validation error',
      details: [{ path: 'nombre', message: 'Nombre es requerido' }],
    });
    assert.strictEqual(logSpy.called, false);
  });

  it('handles known application errors', () => {
    const { req, res, logSpy } = createMocks();
    const notFound = new NotFoundError('Event');

    const next = sinon.stub<[unknown?], void>();
    errorHandler(notFound, req, res, next as unknown as NextFunction);

    const status = getStatusStub(res);
    const json = getJsonStub(res);
    assert.strictEqual(status.calledWith(404), true);
    assert.deepStrictEqual(json.firstCall.args[0], { error: 'Event not found' });
    assert.strictEqual(logSpy.called, false);
  });

  it('handles custom ValidationError instances', () => {
    const { req, res, logSpy } = createMocks();
    const validationError = new ValidationError('bad payload');

    const next = sinon.stub<[unknown?], void>();
    errorHandler(validationError, req, res, next as unknown as NextFunction);

    const status = getStatusStub(res);
    const json = getJsonStub(res);
    assert.strictEqual(status.calledWith(400), true);
    assert.deepStrictEqual(json.firstCall.args[0], { error: 'bad payload' });
    assert.strictEqual(logSpy.called, false);
  });

  it('falls back to generic error response', () => {
    const { req, res, logSpy } = createMocks();
    const genericError = new Error('boom');

    const next = sinon.stub<[unknown?], void>();
    errorHandler(genericError, req, res, next as unknown as NextFunction);

    const status = getStatusStub(res);
    const json = getJsonStub(res);
    assert.strictEqual(status.calledWith(500), true);
    assert.deepStrictEqual(json.firstCall.args[0], { error: 'Internal Server Error' });
    assert.strictEqual(logSpy.called, true);
  });
});
