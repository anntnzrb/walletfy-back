/**
 * @fileoverview Unit tests for the event controller helpers
 */

import type { Request, Response, NextFunction } from 'express';
import { EventController } from '../src/controllers/event.controller';
import { eventModel } from '../src/models/event.model';
import { renderEvent, renderEventCollection } from '../src/views/event.view';

jest.mock('../src/models/event.model', () => ({
  eventModel: {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  EventModel: class {},
}));

jest.mock('../src/views/event.view', () => ({
  renderEvent: jest.fn((event) => event),
  renderEventCollection: jest.fn((collection) => collection),
}));

describe('EventController helpers', () => {
  const controller = new EventController();
  const mockedModel = eventModel as jest.Mocked<typeof eventModel>;
  const mockedRenderEvent = renderEvent as jest.MockedFunction<typeof renderEvent>;
  const mockedRenderEventCollection =
    renderEventCollection as jest.MockedFunction<typeof renderEventCollection>;

  const createResponse = () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    return res;
  };

  const noopNext: NextFunction = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('responds with 400 when id is missing', async () => {
    const req = {
      params: {},
    } as unknown as Request;
    const res = createResponse();

    await controller.getEventById(req, res, noopNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Event ID is required' });
    expect(mockedModel.findById).not.toHaveBeenCalled();
  });

  it('delegates to model and view when id is present', async () => {
    mockedModel.findById.mockResolvedValueOnce({ id: 'abc' } as never);
    mockedRenderEvent.mockReturnValueOnce({ id: 'abc' } as never);

    const req = {
      params: { id: 'abc' },
    } as unknown as Request;
    const res = createResponse();

    await controller.getEventById(req, res, noopNext);

    expect(mockedModel.findById).toHaveBeenCalledWith('abc');
    expect(mockedRenderEvent).toHaveBeenCalledWith({ id: 'abc' });
  });

  it('passes NotFoundError to next when entity is missing', async () => {
    mockedModel.findById.mockResolvedValueOnce(null as never);

    const req = {
      params: { id: 'missing' },
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn();

    await controller.getEventById(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const [error] = next.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('Event not found');
  });

  it('forwards errors to next via execute helper', async () => {
    const error = new Error('boom');
    mockedModel.create.mockRejectedValueOnce(error);

    const req = {
      body: {
        nombre: 'Sample',
        cantidad: 10,
        fecha: new Date('2025-01-01T00:00:00.000Z'),
        tipo: 'ingreso',
      },
    } as Request;
    const res = createResponse();
    const next = jest.fn();

    await controller.createEvent(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('renders collection when fetching events', async () => {
    mockedModel.findAll.mockResolvedValueOnce({ data: [] } as never);
    mockedRenderEventCollection.mockReturnValueOnce({ data: [] } as never);

    const req = {
      query: {},
    } as unknown as Request;
    const res = createResponse();

    await controller.getAllEvents(req, res, noopNext);

    expect(mockedModel.findAll).toHaveBeenCalledWith({});
    expect(mockedRenderEventCollection).toHaveBeenCalledWith({ data: [] });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: [] });
  });
});
