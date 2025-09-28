/**
 * @fileoverview Integration tests for protected event CRUD operations
 */

import { describe, it, beforeEach, afterEach, assert } from 'poku';
import sinon from 'sinon';
import supertest from 'supertest';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import eventRoutes from '@routes/event.routes';
import authRoutes from '@routes/auth.routes';
import { eventModel } from '@models/event.model';
import { userModel } from '@models/user.model';

describe('Protected Event CRUD Operations', () => {
  let app: express.Application;
  let request: supertest.SuperTest<supertest.Test>;
  let eventModelStub: sinon.SinonStubbedInstance<typeof eventModel>;
  let userModelStub: sinon.SinonStubbedInstance<typeof userModel>;
  let validJwtToken: string;

  beforeEach(() => {
    // Create express app with auth setup
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

    // Mount routes
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1', eventRoutes);

    request = supertest(app);

    // Stub models
    eventModelStub = sinon.stub(eventModel);
    userModelStub = sinon.stub(userModel);

    // Set test environment
    process.env.JWT_SECRET = 'test-jwt-secret';

    // Create a valid JWT token for testing
    validJwtToken = jwt.sign(
      { userId: 'test-user-123', username: 'testuser' },
      'test-jwt-secret',
      { expiresIn: '1h' },
    );
  });

  afterEach(() => {
    sinon.restore();
    delete process.env.JWT_SECRET;
  });

  describe('POST /api/v1/eventos - Create Event (Protected)', () => {
    it('creates event with valid JWT token', async () => {
      const eventData = {
        nombre: 'Test Event',
        cantidad: 100,
        fecha: '2025-01-01T00:00:00.000Z',
        tipo: 'ingreso',
        descripcion: 'Test description',
      };

      const createdEvent = {
        id: 'event-uuid-123',
        ...eventData,
        fecha: new Date(eventData.fecha),
      };

      eventModelStub.create.resolves(createdEvent);

      const response = await request
        .post('/api/v1/eventos')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .send(eventData)
        .expect(201);

      assert.strictEqual(eventModelStub.create.calledOnce, true);
      assert.strictEqual(response.body.id, 'event-uuid-123');
      assert.strictEqual(response.body.nombre, 'Test Event');
    });

    it('returns 401 without authentication', async () => {
      const eventData = {
        nombre: 'Test Event',
        cantidad: 100,
        fecha: '2025-01-01T00:00:00.000Z',
        tipo: 'ingreso',
      };

      const response = await request
        .post('/api/v1/eventos')
        .send(eventData)
        .expect(401);

      assert.strictEqual(response.body.error, 'Authentication required');
      assert.strictEqual(eventModelStub.create.called, false);
    });

    it('returns 401 with invalid JWT token', async () => {
      const eventData = {
        nombre: 'Test Event',
        cantidad: 100,
        fecha: '2025-01-01T00:00:00.000Z',
        tipo: 'ingreso',
      };

      const response = await request
        .post('/api/v1/eventos')
        .set('Authorization', 'Bearer invalid-token')
        .send(eventData)
        .expect(401);

      assert.strictEqual(response.body.error, 'Invalid token');
      assert.strictEqual(eventModelStub.create.called, false);
    });

    it('creates event with session authentication', async () => {
      const eventData = {
        nombre: 'Test Event',
        cantidad: 100,
        fecha: '2025-01-01T00:00:00.000Z',
        tipo: 'ingreso',
      };

      const createdEvent = {
        id: 'event-uuid-123',
        ...eventData,
        fecha: new Date(eventData.fecha),
      };

      const user = {
        id: 'test-user-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      eventModelStub.create.resolves(createdEvent);
      userModelStub.validateCredentials.resolves(user);

      // First login to establish session
      const loginResponse = await request
        .post('/api/v1/auth/session/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(200);

      const sessionCookie = loginResponse.headers['set-cookie']
        ?.find((cookie: string) => cookie.includes('connect.sid'))
        ?.split(';')[0];

      // Create event with session
      const response = await request
        .post('/api/v1/eventos')
        .set('Cookie', sessionCookie!)
        .send(eventData)
        .expect(201);

      assert.strictEqual(eventModelStub.create.calledOnce, true);
      assert.strictEqual(response.body.id, 'event-uuid-123');
    });
  });

  describe('GET /api/v1/eventos - List Events (Protected)', () => {
    it('returns events with valid JWT token', async () => {
      const events = {
        data: [
          {
            id: 'event-1',
            nombre: 'Event 1',
            cantidad: 100,
            fecha: new Date(),
            tipo: 'ingreso',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      eventModelStub.findAll.resolves(events);

      const response = await request
        .get('/api/v1/eventos')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(200);

      assert.strictEqual(eventModelStub.findAll.calledOnce, true);
      assert.strictEqual(response.body.data.length, 1);
      assert.strictEqual(response.body.data[0].id, 'event-1');
    });

    it('returns 401 without authentication', async () => {
      const response = await request.get('/api/v1/eventos').expect(401);

      assert.strictEqual(response.body.error, 'Authentication required');
      assert.strictEqual(eventModelStub.findAll.called, false);
    });

    it('supports query parameters with authentication', async () => {
      const events = {
        data: [],
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 0,
      };

      eventModelStub.findAll.resolves(events);

      const response = await request
        .get('/api/v1/eventos?page=1&limit=5&tipo=ingreso')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(200);

      assert.strictEqual(eventModelStub.findAll.calledOnce, true);
      const [queryArgs] = eventModelStub.findAll.firstCall.args;
      assert.strictEqual(queryArgs.page, 1);
      assert.strictEqual(queryArgs.limit, 5);
      assert.strictEqual(queryArgs.tipo, 'ingreso');
    });
  });

  describe('GET /api/v1/eventos/:id - Get Event (Protected)', () => {
    it('returns specific event with valid JWT token', async () => {
      const event = {
        id: 'event-123',
        nombre: 'Test Event',
        cantidad: 100,
        fecha: new Date(),
        tipo: 'ingreso',
      };

      eventModelStub.findById.resolves(event);

      const response = await request
        .get('/api/v1/eventos/event-123')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(200);

      assert.strictEqual(eventModelStub.findById.calledWith('event-123'), true);
      assert.strictEqual(response.body.id, 'event-123');
      assert.strictEqual(response.body.nombre, 'Test Event');
    });

    it('returns 401 without authentication', async () => {
      const response = await request
        .get('/api/v1/eventos/event-123')
        .expect(401);

      assert.strictEqual(response.body.error, 'Authentication required');
      assert.strictEqual(eventModelStub.findById.called, false);
    });

    it('returns 404 when event not found', async () => {
      eventModelStub.findById.resolves(null);

      const response = await request
        .get('/api/v1/eventos/nonexistent')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(404);

      assert.strictEqual(
        eventModelStub.findById.calledWith('nonexistent'),
        true,
      );
    });
  });

  describe('PUT /api/v1/eventos/:id - Update Event (Protected)', () => {
    it('updates event with valid JWT token', async () => {
      const updateData = {
        nombre: 'Updated Event',
        cantidad: 200,
      };

      const updatedEvent = {
        id: 'event-123',
        nombre: 'Updated Event',
        cantidad: 200,
        fecha: new Date(),
        tipo: 'ingreso',
      };

      eventModelStub.update.resolves(updatedEvent);

      const response = await request
        .put('/api/v1/eventos/event-123')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .send(updateData)
        .expect(200);

      assert.strictEqual(
        eventModelStub.update.calledWith('event-123', updateData),
        true,
      );
      assert.strictEqual(response.body.nombre, 'Updated Event');
      assert.strictEqual(response.body.cantidad, 200);
    });

    it('returns 401 without authentication', async () => {
      const updateData = { nombre: 'Updated Event' };

      const response = await request
        .put('/api/v1/eventos/event-123')
        .send(updateData)
        .expect(401);

      assert.strictEqual(response.body.error, 'Authentication required');
      assert.strictEqual(eventModelStub.update.called, false);
    });

    it('returns 404 when event not found', async () => {
      const updateData = { nombre: 'Updated Event' };
      eventModelStub.update.resolves(null);

      const response = await request
        .put('/api/v1/eventos/nonexistent')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .send(updateData)
        .expect(404);

      assert.strictEqual(
        eventModelStub.update.calledWith('nonexistent', updateData),
        true,
      );
    });
  });

  describe('DELETE /api/v1/eventos/:id - Delete Event (Protected)', () => {
    it('deletes event with valid JWT token', async () => {
      eventModelStub.delete.resolves(true);

      const response = await request
        .delete('/api/v1/eventos/event-123')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(204);

      assert.strictEqual(eventModelStub.delete.calledWith('event-123'), true);
      assert.strictEqual(response.body, {});
    });

    it('returns 401 without authentication', async () => {
      const response = await request
        .delete('/api/v1/eventos/event-123')
        .expect(401);

      assert.strictEqual(response.body.error, 'Authentication required');
      assert.strictEqual(eventModelStub.delete.called, false);
    });

    it('returns 404 when event not found', async () => {
      eventModelStub.delete.resolves(false);

      const response = await request
        .delete('/api/v1/eventos/nonexistent')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(404);

      assert.strictEqual(eventModelStub.delete.calledWith('nonexistent'), true);
    });
  });

  describe('Authentication Method Compatibility', () => {
    it('supports both JWT and session authentication on same endpoint', async () => {
      const event = {
        id: 'event-123',
        nombre: 'Test Event',
        cantidad: 100,
        fecha: new Date(),
        tipo: 'ingreso',
      };

      eventModelStub.findById.resolves(event);

      // Test JWT
      const jwtResponse = await request
        .get('/api/v1/eventos/event-123')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(200);

      assert.strictEqual(jwtResponse.body.id, 'event-123');

      // Reset stub call count
      eventModelStub.findById.resetHistory();

      // Test Session
      const user = {
        id: 'test-user-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      userModelStub.validateCredentials.resolves(user);

      const loginResponse = await request
        .post('/api/v1/auth/session/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(200);

      const sessionCookie = loginResponse.headers['set-cookie']
        ?.find((cookie: string) => cookie.includes('connect.sid'))
        ?.split(';')[0];

      eventModelStub.findById.resolves(event);

      const sessionResponse = await request
        .get('/api/v1/eventos/event-123')
        .set('Cookie', sessionCookie!)
        .expect(200);

      assert.strictEqual(sessionResponse.body.id, 'event-123');
      assert.strictEqual(eventModelStub.findById.calledWith('event-123'), true);
    });
  });
});
