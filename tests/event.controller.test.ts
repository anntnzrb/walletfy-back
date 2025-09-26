/**
 * @fileoverview Unit tests for the event controller helpers
 */

import type { Request, Response, NextFunction } from 'express';
import { describe, it, beforeEach, afterEach, assert } from 'poku';
import sinon from 'sinon';
import { EventController } from '@/controllers/event.controller';
import { NotFoundError } from '@core/middleware/errorHandler';

type EventModelStub = {
  create: sinon.SinonStub;
  findAll: sinon.SinonStub;
  findById: sinon.SinonStub;
  update: sinon.SinonStub;
  delete: sinon.SinonStub;
};

const createResponse = (): Response => {
  const response: Partial<Response> = {};
  response.status = sinon.stub().callsFake(() => response as Response);
  response.json = sinon.stub().returns(response as Response);
  response.send = sinon.stub().returns(response as Response);
  return response as Response;
};

const getStatusStub = (res: Response) => res.status as unknown as sinon.SinonStub;
const getJsonStub = (res: Response) => res.json as unknown as sinon.SinonStub;

describe('EventController helpers', () => {
  let model: EventModelStub;
  let renderEventStub: sinon.SinonStub;
  let renderCollectionStub: sinon.SinonStub;
  let controller: EventController;
  let noopNext: sinon.SinonStub<[unknown?], void>;

  beforeEach(() => {
    model = {
      create: sinon.stub(),
      findAll: sinon.stub(),
      findById: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
    };

    renderEventStub = sinon.stub().callsFake((event) => event);
    renderCollectionStub = sinon.stub().callsFake((collection) => collection);
    controller = new EventController(model, renderEventStub, renderCollectionStub);
    noopNext = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('responds with 400 when id is missing', async () => {
    const req = { params: {} } as unknown as Request;
    const res = createResponse();

    await controller.getEventById(req, res, noopNext as unknown as NextFunction);

    const status = getStatusStub(res);
    const json = getJsonStub(res);

    assert.strictEqual(status.firstCall?.args[0], 400);
    assert.deepStrictEqual(json.firstCall?.args[0], { error: 'Event ID is required' });
    assert.strictEqual(model.findById.called, false);
  });

  it('delegates to model and view when id is present', async () => {
    model.findById.resolves({ id: 'abc' });
    renderEventStub.returns({ id: 'abc' });

    const req = { params: { id: 'abc' } } as unknown as Request;
    const res = createResponse();

    await controller.getEventById(req, res, noopNext as unknown as NextFunction);

    const status = getStatusStub(res);
    const json = getJsonStub(res);
    assert.strictEqual(status.firstCall?.args[0], 200);
    assert.deepStrictEqual(json.firstCall?.args[0], { id: 'abc' });
  });

  it('passes NotFoundError to next when entity is missing', async () => {
    model.findById.resolves(null);

    const req = { params: { id: 'missing' } } as unknown as Request;
    const res = createResponse();
    const next = sinon.stub<[unknown?], void>();

    await controller.getEventById(req, res, next as unknown as NextFunction);

    assert.strictEqual(next.calledOnce, true);
    const [error] = next.firstCall.args;
    assert.ok(error instanceof NotFoundError);
    assert.strictEqual((error as Error).message, 'Event not found');
  });

  it('forwards errors to next via execute helper', async () => {
    const error = new Error('boom');
    model.create.rejects(error);

    const req = {
      body: {
        nombre: 'Sample',
        cantidad: 10,
        fecha: new Date('2025-01-01T00:00:00.000Z'),
        tipo: 'ingreso',
      },
    } as unknown as Request;
    const res = createResponse();
    const next = sinon.stub<[unknown?], void>();

    await controller.createEvent(req, res, next as unknown as NextFunction);

    assert.strictEqual(next.called, true);
    assert.strictEqual(next.firstCall?.args[0], error);
  });

  it('renders collection when fetching events', async () => {
    const parsedQuery = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    model.findAll.resolves(parsedQuery);
    renderCollectionStub.returns({ data: [] });

    const req = { query: {} } as unknown as Request;
    const res = createResponse();

    await controller.getAllEvents(req, res, noopNext as unknown as NextFunction);

    assert.strictEqual(model.findAll.called, true);
    const [arg] = model.findAll.firstCall.args;
    assert.deepStrictEqual(arg, {});
    assert.strictEqual(renderCollectionStub.calledWithMatch(parsedQuery), true);
    const status = getStatusStub(res);
    const json = getJsonStub(res);
    assert.strictEqual(status.firstCall?.args[0], 200);
    assert.deepStrictEqual(json.firstCall?.args[0], { data: [] });
  });
});
