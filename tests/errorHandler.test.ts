/**
 * @fileoverview Unit tests for the global error handler middleware
 */

import type { Request, Response } from 'express';
import { ZodError, type ZodIssue } from 'zod';
import { errorHandler, NotFoundError } from '../src/core/middleware/errorHandler';
import { logger } from '../src/core/utils/logger';

describe('errorHandler middleware', () => {
  const createMocks = () => {
    const req = {
      url: '/test',
      method: 'GET',
    } as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    const logSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    return { req, res, logSpy };
  };

  afterEach(() => {
    jest.restoreAllMocks();
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

    errorHandler(zodError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation error',
      details: [{ path: 'nombre', message: 'Nombre es requerido' }],
    });
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('handles known application errors', () => {
    const { req, res, logSpy } = createMocks();
    const notFound = new NotFoundError('Event');

    errorHandler(notFound, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Event not found' });
    expect(logSpy).toHaveBeenCalled();
  });

  it('falls back to generic error response', () => {
    const { req, res, logSpy } = createMocks();
    const genericError = new Error('boom');

    errorHandler(genericError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    expect(logSpy).toHaveBeenCalled();
  });
});
