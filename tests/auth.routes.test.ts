/**
 * @fileoverview Integration tests for authentication routes
 */

import { describe, it, beforeEach, afterEach, assert } from 'poku';
import sinon from 'sinon';
import supertest from 'supertest';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import authRoutes from '@routes/auth.routes';
import { userModel } from '@models/user.model';

describe('Auth Routes Integration', () => {
  let app: express.Application;
  let request: supertest.SuperTest<supertest.Test>;
  let userModelStub: sinon.SinonStubbedInstance<typeof userModel>;

  beforeEach(() => {
    // Create express app for testing
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      }),
    );
    app.use('/auth', authRoutes);

    // Setup request helper
    request = supertest(app);

    // Stub userModel methods
    userModelStub = sinon.stub(userModel);

    // Set test environment
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.SESSION_SECRET = 'test-session-secret';
  });

  afterEach(() => {
    sinon.restore();
    delete process.env.JWT_SECRET;
    delete process.env.SESSION_SECRET;
  });

  describe('POST /auth/register', () => {
    it('registers new user and returns JWT token', async () => {
      const userData = { username: 'testuser', password: 'password123' };
      const createdUser = {
        id: 'uuid-123',
        username: 'testuser',
        createdAt: new Date(),
      };

      userModelStub.existsByUsername.resolves(false);
      userModelStub.create.resolves(createdUser);

      const response = await request
        .post('/auth/register')
        .send(userData)
        .expect(201);

      assert.strictEqual(response.body.message, 'User registered successfully');
      assert.deepStrictEqual(response.body.user, createdUser);
      assert.ok(response.body.token);
      assert.strictEqual(
        userModelStub.existsByUsername.calledWith('testuser'),
        true,
      );
      assert.strictEqual(userModelStub.create.calledWith(userData), true);
    });

    it('returns 409 when user already exists', async () => {
      const userData = { username: 'existinguser', password: 'password123' };

      userModelStub.existsByUsername.resolves(true);

      const response = await request
        .post('/auth/register')
        .send(userData)
        .expect(409);

      assert.strictEqual(response.body.error, 'User already exists');
      assert.strictEqual(userModelStub.create.called, false);
    });

    it('returns 400 for invalid registration data', async () => {
      const invalidData = { username: 'a', password: '123' }; // Too short

      await request.post('/auth/register').send(invalidData).expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('returns user and JWT token for valid credentials', async () => {
      const loginData = { username: 'testuser', password: 'password123' };
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      userModelStub.validateCredentials.resolves(user);

      const response = await request
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      assert.strictEqual(response.body.message, 'Login successful');
      assert.strictEqual(response.body.user.username, 'testuser');
      assert.ok(response.body.token);
      assert.strictEqual(
        userModelStub.validateCredentials.calledWith(loginData),
        true,
      );
    });

    it('returns 401 for invalid credentials', async () => {
      const loginData = { username: 'testuser', password: 'wrongpassword' };

      userModelStub.validateCredentials.resolves(null);

      const response = await request
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      assert.strictEqual(response.body.error, 'Invalid credentials');
    });

    it('returns 400 for invalid login data', async () => {
      const invalidData = { username: 'a' }; // Missing password

      await request.post('/auth/login').send(invalidData).expect(400);
    });
  });

  describe('POST /auth/basic', () => {
    it('accepts Basic Auth and returns JWT token', async () => {
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      userModelStub.validateCredentials.resolves(user);

      // testuser:password123 in base64
      const basicAuth =
        'Basic ' + Buffer.from('testuser:password123').toString('base64');

      const response = await request
        .post('/auth/basic')
        .set('Authorization', basicAuth)
        .expect(200);

      assert.strictEqual(response.body.message, 'Basic Auth login successful');
      assert.strictEqual(response.body.user.username, 'testuser');
      assert.ok(response.body.token);
      assert.strictEqual(
        userModelStub.validateCredentials.calledWith({
          username: 'testuser',
          password: 'password123',
        }),
        true,
      );
    });

    it('returns 401 for missing Basic Auth header', async () => {
      const response = await request.post('/auth/basic').expect(401);

      assert.strictEqual(response.body.error, 'Missing Basic Auth header');
    });

    it('returns 401 for invalid Basic Auth credentials', async () => {
      userModelStub.validateCredentials.resolves(null);

      const basicAuth =
        'Basic ' + Buffer.from('testuser:wrongpassword').toString('base64');

      const response = await request
        .post('/auth/basic')
        .set('Authorization', basicAuth)
        .expect(401);

      assert.strictEqual(response.body.error, 'Invalid credentials');
    });
  });

  describe('POST /auth/session/login', () => {
    it('creates session and sets cookie', async () => {
      const loginData = { username: 'testuser', password: 'password123' };
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      userModelStub.validateCredentials.resolves(user);

      const response = await request
        .post('/auth/session/login')
        .send(loginData)
        .expect(200);

      assert.strictEqual(response.body.message, 'Session login successful');
      assert.strictEqual(response.body.user.username, 'testuser');

      // Check that session cookie is set
      const cookies = response.headers['set-cookie'];
      assert.ok(cookies);
      assert.ok(
        cookies.some((cookie: string) => cookie.includes('connect.sid')),
      );
    });

    it('returns 401 for invalid session login credentials', async () => {
      const loginData = { username: 'testuser', password: 'wrongpassword' };

      userModelStub.validateCredentials.resolves(null);

      const response = await request
        .post('/auth/session/login')
        .send(loginData)
        .expect(401);

      assert.strictEqual(response.body.error, 'Invalid credentials');
    });
  });

  describe('POST /auth/logout', () => {
    it('clears session and cookie', async () => {
      // First login to establish session
      const loginData = { username: 'testuser', password: 'password123' };
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      userModelStub.validateCredentials.resolves(user);

      const loginResponse = await request
        .post('/auth/session/login')
        .send(loginData)
        .expect(200);

      // Extract session cookie
      const sessionCookie = loginResponse.headers['set-cookie']
        .find((cookie: string) => cookie.includes('connect.sid'))
        .split(';')[0];

      // Logout with session cookie
      const response = await request
        .post('/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      assert.strictEqual(response.body.message, 'Logout successful');
    });

    it('succeeds even without active session', async () => {
      const response = await request.post('/auth/logout').expect(200);

      // Should not error even if no session exists
      assert.ok(response.body.message);
    });
  });

  describe('GET /auth/profile', () => {
    it('returns user profile with valid JWT token', async () => {
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        createdAt: new Date(),
      };

      userModelStub.findById.resolves(user);

      // First register to get a token
      const userData = { username: 'testuser', password: 'password123' };
      const createdUser = {
        id: 'uuid-123',
        username: 'testuser',
        createdAt: new Date(),
      };

      userModelStub.existsByUsername.resolves(false);
      userModelStub.create.resolves(createdUser);

      const registerResponse = await request
        .post('/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.token;

      // Use token to access profile
      const response = await request
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      assert.deepStrictEqual(response.body.user, user);
      assert.strictEqual(userModelStub.findById.calledWith('uuid-123'), true);
    });

    it('returns 401 for missing JWT token', async () => {
      const response = await request.get('/auth/profile').expect(401);

      assert.strictEqual(response.body.error, 'Missing JWT token');
    });

    it('returns 401 for invalid JWT token', async () => {
      const response = await request
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      assert.strictEqual(response.body.error, 'Invalid token');
    });
  });

  describe('GET /auth/session/profile', () => {
    it('returns user profile with valid session', async () => {
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        createdAt: new Date(),
      };

      userModelStub.validateCredentials.resolves({
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      });
      userModelStub.findById.resolves(user);

      // First login to establish session
      const loginData = { username: 'testuser', password: 'password123' };

      const loginResponse = await request
        .post('/auth/session/login')
        .send(loginData)
        .expect(200);

      // Extract session cookie
      const sessionCookie = loginResponse.headers['set-cookie']
        .find((cookie: string) => cookie.includes('connect.sid'))
        .split(';')[0];

      // Access profile with session
      const response = await request
        .get('/auth/session/profile')
        .set('Cookie', sessionCookie)
        .expect(200);

      assert.deepStrictEqual(response.body.user, user);
      assert.strictEqual(userModelStub.findById.calledWith('uuid-123'), true);
    });

    it('returns 401 for missing session', async () => {
      const response = await request.get('/auth/session/profile').expect(401);

      assert.strictEqual(response.body.error, 'No active session');
    });
  });

  describe('GET /auth/me', () => {
    it('works with JWT token', async () => {
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        createdAt: new Date(),
      };

      userModelStub.existsByUsername.resolves(false);
      userModelStub.create.resolves(user);
      userModelStub.findById.resolves(user);

      // Register and get token
      const registerResponse = await request
        .post('/auth/register')
        .send({ username: 'testuser', password: 'password123' })
        .expect(201);

      const token = registerResponse.body.token;

      // Access /me endpoint with JWT
      const response = await request
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      assert.deepStrictEqual(response.body.user, user);
    });

    it('works with session', async () => {
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        createdAt: new Date(),
      };

      userModelStub.validateCredentials.resolves({
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      });
      userModelStub.findById.resolves(user);

      // Login with session
      const loginResponse = await request
        .post('/auth/session/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(200);

      const sessionCookie = loginResponse.headers['set-cookie']
        .find((cookie: string) => cookie.includes('connect.sid'))
        .split(';')[0];

      // Access /me endpoint with session
      const response = await request
        .get('/auth/me')
        .set('Cookie', sessionCookie)
        .expect(200);

      assert.deepStrictEqual(response.body.user, user);
    });

    it('returns 401 when no authentication provided', async () => {
      const response = await request.get('/auth/me').expect(401);

      assert.strictEqual(response.body.error, 'Authentication required');
    });
  });
});
