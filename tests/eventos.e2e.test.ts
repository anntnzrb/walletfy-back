/**
 * @fileoverview End-to-end tests for the Eventos API hitting the live MongoDB instance
 */

import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectMongo, disconnectMongo } from '../src/core/database/mongoose';

const EVENT_ENDPOINT = '/api/v1/eventos';

/** Sample event payload reused across CRUD assertions */
const sampleEvent = {
  nombre: 'Test Event',
  cantidad: 123.45,
  fecha: '2025-01-01T00:00:00.000Z',
  tipo: 'ingreso',
  descripcion: 'integration test',
};

describe('Eventos API', () => {
  beforeAll(async () => {
    await connectMongo();
    const collection = mongoose.connection.db?.collection('events');
    if (collection) {
      await collection.deleteMany({});
    }
  });

  afterEach(async () => {
    const collection = mongoose.connection.db?.collection('events');
    if (collection) {
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await disconnectMongo();
  });

  it('reports healthy status', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.dbStatus).toBe('connected');
  });

  it('performs full CRUD lifecycle', async () => {
    const createResponse = await request(app)
      .post(EVENT_ENDPOINT)
      .send(sampleEvent)
      .expect(201);

    const created = createResponse.body;
    expect(created).toMatchObject({
      nombre: sampleEvent.nombre,
      cantidad: sampleEvent.cantidad,
      tipo: sampleEvent.tipo,
      descripcion: sampleEvent.descripcion,
    });
    expect(created.id).toBeDefined();

    const listResponse = await request(app).get(EVENT_ENDPOINT).expect(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.total).toBe(1);

    const eventId = created.id;

    const getResponse = await request(app)
      .get(`${EVENT_ENDPOINT}/${eventId}`)
      .expect(200);
    expect(getResponse.body).toMatchObject({ id: eventId, nombre: sampleEvent.nombre });

    const updateResponse = await request(app)
      .put(`${EVENT_ENDPOINT}/${eventId}`)
      .send({ cantidad: 999.99 })
      .expect(200);
    expect(updateResponse.body.cantidad).toBe(999.99);

    await request(app).delete(`${EVENT_ENDPOINT}/${eventId}`).expect(204);

    const finalList = await request(app).get(EVENT_ENDPOINT).expect(200);
    expect(finalList.body.data).toHaveLength(0);
  });

  it('rejects invalid payloads with 400', async () => {
    await request(app)
      .post(EVENT_ENDPOINT)
      .send({ ...sampleEvent, nombre: '' })
      .expect(400);
  });

  it('supports sorting via query params', async () => {
    const first = await request(app)
      .post(EVENT_ENDPOINT)
      .send(sampleEvent)
      .expect(201);

    const secondPayload = {
      ...sampleEvent,
      nombre: 'Higher Amount',
      cantidad: 999,
    };

    const second = await request(app)
      .post(EVENT_ENDPOINT)
      .send(secondPayload)
      .expect(201);

    const sorted = await request(app)
      .get(`${EVENT_ENDPOINT}?sortBy=cantidad&sortOrder=desc`)
      .expect(200);

    expect(sorted.body.data[0].cantidad).toBe(999);
    expect(sorted.body.total).toBe(2);

    await request(app).delete(`${EVENT_ENDPOINT}/${first.body.id}`).expect(204);
    await request(app).delete(`${EVENT_ENDPOINT}/${second.body.id}`).expect(204);
  });
});
