/**
 * @fileoverview Unit tests for authentication middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { describe, it, beforeEach, afterEach, assert } from 'poku';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import {
  verifyJWT,
  verifySession,
  authenticate,
  optionalAuth,
} from '@core/middleware/auth';

const createResponse = (): Response => {
  const response: Partial<Response> = {};
  response.status = sinon.stub().callsFake(() => response as Response);
  response.json = sinon.stub().returns(response as Response);
  return response as Response;
};

const createRequest = (overrides: Partial<Request> = {}): Request => {
  const request: Partial<Request> = {
    headers: {},
    session: {},
    user: undefined,
    ...overrides,
  };
  return request as Request;
};

const getStatusStub = (res: Response) =>
  res.status as unknown as sinon.SinonStub;
const getJsonStub = (res: Response) => res.json as unknown as sinon.SinonStub;

describe('Auth Middleware', () => {
  let jwtVerifyStub: sinon.SinonStub;
  let next: sinon.SinonStub;

  beforeEach(() => {
    jwtVerifyStub = sinon.stub(jwt, 'verify');
    next = sinon.stub();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    sinon.restore();
    delete process.env.JWT_SECRET;
  });

  describe('verifyJWT', () => {
    it('validates JWT token and sets user context', () => {
      const payload = {
        userId: 'uuid-123',
        username: 'testuser',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      jwtVerifyStub.returns(payload);

      const req = createRequest({
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      });
      const res = createResponse();

      verifyJWT(req, res, next as NextFunction);

      assert.strictEqual(
        jwtVerifyStub.calledWith('valid-jwt-token', 'test-secret'),
        true,
      );
      assert.strictEqual(next.calledOnce, true);
      assert.deepStrictEqual(req.user, {
        userId: 'uuid-123',
        username: 'testuser',
      });
    });

    it('returns 401 when Authorization header is missing', () => {
      const req = createRequest({ headers: {} });
      const res = createResponse();

      verifyJWT(req, res, next as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 401);
      assert.strictEqual(json.firstCall?.args[0].error, 'Missing JWT token');
      assert.strictEqual(next.called, false);
    });

    it('returns 401 when Authorization header does not start with Bearer', () => {
      const req = createRequest({
        headers: {
          authorization: 'Basic dGVzdDp0ZXN0',
        },
      });
      const res = createResponse();

      verifyJWT(req, res, next as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 401);
      assert.strictEqual(json.firstCall?.args[0].error, 'Missing JWT token');
      assert.strictEqual(next.called, false);
    });

    it('returns 401 when token is missing from Bearer header', () => {
      const req = createRequest({
        headers: {
          authorization: 'Bearer ',
        },
      });
      const res = createResponse();

      verifyJWT(req, res, next as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 401);
      assert.strictEqual(json.firstCall?.args[0].error, 'Invalid token format');
      assert.strictEqual(next.called, false);
    });

    it('returns 401 when JWT token is invalid', () => {
      jwtVerifyStub.throws(new jwt.JsonWebTokenError('Invalid token'));

      const req = createRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });
      const res = createResponse();

      verifyJWT(req, res, next as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 401);
      assert.strictEqual(json.firstCall?.args[0].error, 'Invalid token');
      assert.strictEqual(next.called, false);
    });

    it('returns 500 when JWT_SECRET is not configured', () => {
      delete process.env.JWT_SECRET;

      const req = createRequest({
        headers: {
          authorization: 'Bearer some-token',
        },
      });
      const res = createResponse();

      verifyJWT(req, res, next as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 500);
      assert.strictEqual(json.firstCall?.args[0].error, 'Configuration error');
      assert.strictEqual(next.called, false);
    });

    it('returns 500 when verification throws unexpected error', () => {
      jwtVerifyStub.throws(new Error('Unexpected error'));

      const req = createRequest({
        headers: {
          authorization: 'Bearer some-token',
        },
      });
      const res = createResponse();

      verifyJWT(req, res, next as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 500);
      assert.strictEqual(json.firstCall?.args[0].error, 'Authentication error');
      assert.strictEqual(next.called, false);
    });
  });

  describe('verifySession', () => {
    it('validates session and sets user context', () => {
      const req = createRequest({
        session: {
          user: {
            id: 'uuid-123',
            username: 'testuser',
          },
        },
      });
      const res = createResponse();

      verifySession(req, res, next as NextFunction);

      assert.strictEqual(next.calledOnce, true);
      assert.deepStrictEqual(req.user, {
        userId: 'uuid-123',
        username: 'testuser',
      });
    });

    it('returns 401 when no session user found', () => {
      const req = createRequest({
        session: {},
      });
      const res = createResponse();

      verifySession(req, res, next as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 401);
      assert.strictEqual(json.firstCall?.args[0].error, 'No active session');
      assert.strictEqual(next.called, false);
    });

    it('returns 500 when session verification throws error', () => {
      const req = createRequest({
        get session() {
          throw new Error('Session error');
        },
      });
      const res = createResponse();

      verifySession(req, res, next as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 500);
      assert.strictEqual(json.firstCall?.args[0].error, 'Session error');
      assert.strictEqual(next.called, false);
    });
  });

  describe('authenticate', () => {
    it('uses JWT when Bearer token is present', () => {
      const payload = {
        userId: 'uuid-123',
        username: 'testuser',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      jwtVerifyStub.returns(payload);

      const req = createRequest({
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
        session: {
          user: { id: 'session-user', username: 'sessionuser' },
        },
      });
      const res = createResponse();

      authenticate(req, res, next as NextFunction);

      assert.strictEqual(
        jwtVerifyStub.calledWith('valid-jwt-token', 'test-secret'),
        true,
      );
      assert.strictEqual(next.calledOnce, true);
      assert.deepStrictEqual(req.user, {
        userId: 'uuid-123',
        username: 'testuser',
      });
    });

    it('falls back to session when no JWT token', () => {
      const req = createRequest({
        headers: {},
        session: {
          user: { id: 'uuid-123', username: 'testuser' },
        },
      });
      const res = createResponse();

      authenticate(req, res, next as NextFunction);

      assert.strictEqual(next.calledOnce, true);
      assert.deepStrictEqual(req.user, {
        userId: 'uuid-123',
        username: 'testuser',
      });
    });

    it('returns 401 when neither JWT nor session is present', () => {
      const req = createRequest({
        headers: {},
        session: {},
      });
      const res = createResponse();

      authenticate(req, res, next as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 401);
      assert.strictEqual(
        json.firstCall?.args[0].error,
        'Authentication required',
      );
      assert.strictEqual(next.called, false);
    });
  });

  describe('optionalAuth', () => {
    it('uses JWT when Bearer token is present', () => {
      const payload = {
        userId: 'uuid-123',
        username: 'testuser',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      jwtVerifyStub.returns(payload);

      const req = createRequest({
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      });
      const res = createResponse();

      optionalAuth(req, res, next as NextFunction);

      assert.strictEqual(
        jwtVerifyStub.calledWith('valid-jwt-token', 'test-secret'),
        true,
      );
      assert.strictEqual(next.calledOnce, true);
      assert.deepStrictEqual(req.user, {
        userId: 'uuid-123',
        username: 'testuser',
      });
    });

    it('uses session when available', () => {
      const req = createRequest({
        headers: {},
        session: {
          user: { id: 'uuid-123', username: 'testuser' },
        },
      });
      const res = createResponse();

      optionalAuth(req, res, next as NextFunction);

      assert.strictEqual(next.calledOnce, true);
      assert.deepStrictEqual(req.user, {
        userId: 'uuid-123',
        username: 'testuser',
      });
    });

    it('continues without auth when no authentication present', () => {
      const req = createRequest({
        headers: {},
        session: {},
      });
      const res = createResponse();

      optionalAuth(req, res, next as NextFunction);

      assert.strictEqual(next.calledOnce, true);
      assert.strictEqual(req.user, undefined);
    });
  });
});
