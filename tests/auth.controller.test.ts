/**
 * @fileoverview Unit tests for the authentication controller
 */

import type { Request, Response, NextFunction } from 'express';
import { describe, it, beforeEach, afterEach, assert } from 'poku';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import { AuthController } from '@controllers/auth.controller';

type UserModelStub = {
  create: sinon.SinonStub;
  existsByUsername: sinon.SinonStub;
  validateCredentials: sinon.SinonStub;
  findById: sinon.SinonStub;
};

const createResponse = (): Response => {
  const response: Partial<Response> = {};
  response.status = sinon.stub().callsFake(() => response as Response);
  response.json = sinon.stub().returns(response as Response);
  response.clearCookie = sinon.stub().returns(response as Response);
  return response as Response;
};

const createRequest = (overrides: Partial<Request> = {}): Request => {
  const request: Partial<Request> = {
    body: {},
    params: {},
    query: {},
    headers: {},
    session: {
      destroy: sinon.stub(),
    } as any,
    ...overrides,
  };
  return request as Request;
};

const getStatusStub = (res: Response) =>
  res.status as unknown as sinon.SinonStub;
const getJsonStub = (res: Response) => res.json as unknown as sinon.SinonStub;

describe('AuthController', () => {
  let userModelStub: UserModelStub;
  let controller: AuthController;
  let noopNext: sinon.SinonStub<[unknown?], void>;
  let jwtSignStub: sinon.SinonStub;
  let jwtVerifyStub: sinon.SinonStub;

  beforeEach(() => {
    userModelStub = {
      create: sinon.stub(),
      existsByUsername: sinon.stub(),
      validateCredentials: sinon.stub(),
      findById: sinon.stub(),
    };

    // Mock JWT methods
    jwtSignStub = sinon.stub(jwt, 'sign').returns('fake-jwt-token');
    jwtVerifyStub = sinon.stub(jwt, 'verify');

    // Set up environment
    process.env.JWT_SECRET = 'test-secret';

    controller = new AuthController();
    // Inject mock user model
    (controller as any).userModel = userModelStub;
    noopNext = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
    delete process.env.JWT_SECRET;
  });

  describe('register', () => {
    it('creates new user and returns JWT token', async () => {
      const userData = { username: 'testuser', password: 'password123' };
      const createdUser = {
        id: 'uuid-123',
        username: 'testuser',
        createdAt: new Date(),
      };

      userModelStub.existsByUsername.resolves(false);
      userModelStub.create.resolves(createdUser);

      const req = createRequest({ body: userData });
      const res = createResponse();

      await controller.register(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 201);
      assert.strictEqual(
        userModelStub.existsByUsername.calledWith('testuser'),
        true,
      );
      assert.strictEqual(userModelStub.create.calledWith(userData), true);
      assert.strictEqual(jwtSignStub.calledOnce, true);

      const response = json.firstCall?.args[0];
      assert.strictEqual(response.message, 'User registered successfully');
      assert.deepStrictEqual(response.user, createdUser);
      assert.strictEqual(response.token, 'fake-jwt-token');
    });

    it('returns 409 when user already exists', async () => {
      const userData = { username: 'existinguser', password: 'password123' };

      userModelStub.existsByUsername.resolves(true);

      const req = createRequest({ body: userData });
      const res = createResponse();

      await controller.register(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 409);
      assert.strictEqual(json.firstCall?.args[0].error, 'User already exists');
      assert.strictEqual(userModelStub.create.called, false);
    });

    it('forwards validation errors to next middleware', async () => {
      const req = createRequest({ body: { username: 'a' } }); // Invalid data
      const res = createResponse();
      const next = sinon.stub();

      await controller.register(req, res, next as NextFunction);

      assert.strictEqual(next.calledOnce, true);
      assert.ok(next.firstCall.args[0]); // Error passed to next
    });
  });

  describe('login', () => {
    it('returns user and JWT token for valid credentials', async () => {
      const loginData = { username: 'testuser', password: 'password123' };
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      userModelStub.validateCredentials.resolves(user);

      const req = createRequest({ body: loginData });
      const res = createResponse();

      await controller.login(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 200);
      assert.strictEqual(
        userModelStub.validateCredentials.calledWith(loginData),
        true,
      );
      assert.strictEqual(jwtSignStub.calledOnce, true);

      const response = json.firstCall?.args[0];
      assert.strictEqual(response.message, 'Login successful');
      assert.strictEqual(response.user.username, 'testuser');
      assert.strictEqual(response.token, 'fake-jwt-token');
    });

    it('returns 401 for invalid credentials', async () => {
      const loginData = { username: 'testuser', password: 'wrongpassword' };

      userModelStub.validateCredentials.resolves(null);

      const req = createRequest({ body: loginData });
      const res = createResponse();

      await controller.login(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 401);
      assert.strictEqual(json.firstCall?.args[0].error, 'Invalid credentials');
    });
  });

  describe('basicAuthLogin', () => {
    it('decodes Basic Auth and returns JWT token', async () => {
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      userModelStub.validateCredentials.resolves(user);

      // testuser:password123 in base64
      const req = createRequest({
        headers: {
          authorization: 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=',
        },
      });
      const res = createResponse();

      await controller.basicAuthLogin(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 200);
      assert.strictEqual(
        userModelStub.validateCredentials.calledWith({
          username: 'testuser',
          password: 'password123',
        }),
        true,
      );

      const response = json.firstCall?.args[0];
      assert.strictEqual(response.message, 'Basic Auth login successful');
      assert.strictEqual(response.token, 'fake-jwt-token');
    });

    it('returns 401 when Basic Auth header is missing', async () => {
      const req = createRequest({ headers: {} });
      const res = createResponse();

      await controller.basicAuthLogin(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 401);
      assert.strictEqual(
        json.firstCall?.args[0].error,
        'Missing Basic Auth header',
      );
    });

    it('returns 401 for invalid Basic Auth format', async () => {
      const req = createRequest({
        headers: {
          authorization: 'Basic invalid-base64',
        },
      });
      const res = createResponse();

      await controller.basicAuthLogin(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 401);
      assert.strictEqual(
        json.firstCall?.args[0].error,
        'Invalid Basic Auth format',
      );
    });
  });

  describe('sessionLogin', () => {
    it('creates session for valid credentials', async () => {
      const loginData = { username: 'testuser', password: 'password123' };
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      userModelStub.validateCredentials.resolves(user);

      const session = { user: undefined };
      const req = createRequest({ body: loginData, session: session as any });
      const res = createResponse();

      await controller.sessionLogin(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 200);
      assert.deepStrictEqual(session.user, {
        id: 'uuid-123',
        username: 'testuser',
      });

      const response = json.firstCall?.args[0];
      assert.strictEqual(response.message, 'Session login successful');
    });
  });

  describe('logout', () => {
    it('destroys session and clears cookie', () => {
      const destroyCallback = sinon.stub();
      const session = {
        destroy: sinon.stub().callsArgWith(0, null),
      };

      const req = createRequest({ session: session as any });
      const res = createResponse();

      controller.logout(req, res, noopNext as NextFunction);

      assert.strictEqual(session.destroy.calledOnce, true);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 200);
      assert.strictEqual(json.firstCall?.args[0].message, 'Logout successful');
      assert.strictEqual(
        (res.clearCookie as sinon.SinonStub).calledWith('connect.sid'),
        true,
      );
    });

    it('handles session destroy error', () => {
      const session = {
        destroy: sinon.stub().callsArgWith(0, new Error('Session error')),
      };

      const req = createRequest({ session: session as any });
      const res = createResponse();

      controller.logout(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 500);
      assert.strictEqual(json.firstCall?.args[0].error, 'Logout failed');
    });
  });

  describe('profile', () => {
    it('returns user profile from JWT context', async () => {
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        createdAt: new Date(),
      };

      userModelStub.findById.resolves(user);

      const req = createRequest({
        user: { userId: 'uuid-123', username: 'testuser' },
      });
      const res = createResponse();

      await controller.profile(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 200);
      assert.strictEqual(userModelStub.findById.calledWith('uuid-123'), true);
      assert.deepStrictEqual(json.firstCall?.args[0].user, user);
    });

    it('returns user profile from session context', async () => {
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        createdAt: new Date(),
      };

      userModelStub.findById.resolves(user);

      const req = createRequest({
        session: {
          user: { id: 'uuid-123', username: 'testuser' },
        } as any,
      });
      const res = createResponse();

      await controller.profile(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 200);
      assert.strictEqual(userModelStub.findById.calledWith('uuid-123'), true);
      assert.deepStrictEqual(json.firstCall?.args[0].user, user);
    });

    it('returns 401 when no user context found', async () => {
      const req = createRequest({});
      const res = createResponse();

      await controller.profile(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 401);
      assert.strictEqual(json.firstCall?.args[0].error, 'Not authenticated');
    });

    it('returns 404 when user not found in database', async () => {
      userModelStub.findById.resolves(null);

      const req = createRequest({
        user: { userId: 'nonexistent', username: 'testuser' },
      });
      const res = createResponse();

      await controller.profile(req, res, noopNext as NextFunction);

      const status = getStatusStub(res);
      const json = getJsonStub(res);

      assert.strictEqual(status.firstCall?.args[0], 404);
      assert.strictEqual(json.firstCall?.args[0].error, 'User not found');
    });
  });
});
